'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import AuthButton from '@/components/AuthButton'
import SpotifyConnect from '@/components/SpotifyConnect'
import BingoGame from '@/components/BingoGame'

interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [spotifyTokens, setSpotifyTokens] = useState<SpotifyTokens | null>(null)
  const [checkingSpotify, setCheckingSpotify] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          checkSpotifyConnection(session.user)
        } else {
          setSpotifyTokens(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      checkSpotifyConnection(user)
    }
  }, [user])

  const checkSpotifyConnection = async (currentUser: User) => {
    if (!currentUser) return

    setCheckingSpotify(true)
    const { data, error } = await supabase
      .from('user_spotify_tokens')
      .select('*')
      .eq('user_id', currentUser.id)
      .single()

    if (!error && data) {
      setSpotifyTokens(data)
    }
    setCheckingSpotify(false)
  }

  const isSpotifyConnected = spotifyTokens && new Date(spotifyTokens.expires_at) > new Date()

  if (loading || checkingSpotify) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div>Loading...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-6xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8">
          🎵 AI Music Bingo 🎵
        </h1>
        <p className="text-center text-lg mb-8">
          Play bingo with AI-generated music cards powered by Spotify!
        </p>
        
        <div className="flex justify-center mb-8">
          <AuthButton />
        </div>

        {user && !isSpotifyConnected && (
          <div className="mt-8">
            <SpotifyConnect user={user} />
          </div>
        )}

        {user && isSpotifyConnected && (
          <div className="mt-8">
            <BingoGame user={user} />
          </div>
        )}
      </div>
    </main>
  )
}