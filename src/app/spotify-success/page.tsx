'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function SpotifySuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState('Processing Spotify connection...')

  useEffect(() => {
    const storeTokens = async () => {
      try {
        // Check if searchParams is available
        if (!searchParams) {
          setStatus('Error: No search parameters available')
          setTimeout(() => router.push('/?error=no_params'), 2000)
          return
        }

        // Get tokens from URL params
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        const expiresIn = searchParams.get('expires_in')
        const scope = searchParams.get('scope')

        if (!accessToken || !refreshToken || !expiresIn || !scope) {
          setStatus('Error: Missing token data')
          setTimeout(() => router.push('/?error=missing_tokens'), 2000)
          return
        }

        // Try to get current user, fallback to stored user ID
        let userId: string | null = null
        
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (user) {
          userId = user.id
        } else {
          // Session lost, try to get user ID from localStorage
          const storedUserId = localStorage.getItem('spotify_oauth_user_id')
          if (storedUserId) {
            userId = storedUserId
            localStorage.removeItem('spotify_oauth_user_id') // Clean up
          }
        }
        
        if (!userId) {
          console.error('No user ID available:', userError)
          setStatus('Error: User session lost during OAuth. Please sign in again.')
          setTimeout(() => router.push('/'), 3000)
          return
        }

        // Calculate expires_at
        const expiresAt = new Date(Date.now() + parseInt(expiresIn) * 1000).toISOString()

        // Store tokens in database via API route (to bypass RLS)
        const response = await fetch('/api/spotify/store-tokens', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            access_token: accessToken,
            refresh_token: refreshToken,
            expires_at: expiresAt,
            scope: scope,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error('Error storing tokens:', errorData)
          setStatus('Error: Failed to store tokens')
          setTimeout(() => router.push('/?error=failed_to_store_tokens'), 2000)
          return
        }


        setStatus('Spotify connected successfully! Redirecting...')
        setTimeout(() => router.push('/?spotify_connected=true'), 1500)

      } catch (error) {
        console.error('Error storing Spotify tokens:', error)
        setStatus('Error: Connection failed')
        setTimeout(() => router.push('/?error=connection_failed'), 2000)
      }
    }

    storeTokens()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">🎵 AI Music Bingo</h1>
        <p className="mb-4">{status}</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
      </div>
    </div>
  )
}

export default function SpotifySuccess() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">🎵 AI Music Bingo</h1>
          <p className="mb-4">Loading...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        </div>
      </div>
    }>
      <SpotifySuccessContent />
    </Suspense>
  )
}