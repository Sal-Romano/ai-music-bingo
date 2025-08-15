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
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card text-center">
          <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg">Loading your music bingo experience...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              🎵 AI Music Bingo
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Play bingo with AI-generated music cards powered by Spotify Premium
          </p>
          <AuthButton />
        </div>

        {/* Main Content */}
        {user && !isSpotifyConnected && (
          <SpotifyConnect user={user} />
        )}

        {user && isSpotifyConnected && (
          <BingoGame user={user} />
        )}

        {!user && (
          <div className="text-center">
            <div className="card max-w-lg mx-auto">
              <div className="text-6xl mb-6">🎵</div>
              <h2 className="text-3xl font-bold mb-4">Welcome to AI Music Bingo!</h2>
              <p className="text-gray-300 mb-8 text-lg">
                Sign in to start playing with AI-generated music cards that sync with your Spotify Premium account.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="font-semibold">AI-Generated</div>
                  <div className="text-sm text-gray-400">Smart music challenges</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">🎧</div>
                  <div className="font-semibold">Spotify Premium</div>
                  <div className="text-sm text-gray-400">Full music control</div>
                </div>
                <div className="p-4">
                  <div className="text-3xl mb-2">📱</div>
                  <div className="font-semibold">Mobile Ready</div>
                  <div className="text-sm text-gray-400">Play anywhere</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}