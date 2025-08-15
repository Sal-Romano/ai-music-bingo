'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

interface SpotifyTokens {
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string
}

export default function SpotifyConnect({ user }: { user: User }) {
  const [spotifyTokens, setSpotifyTokens] = useState<SpotifyTokens | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSpotifyConnection()
  }, [user])

  const checkSpotifyConnection = async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('user_spotify_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!error && data) {
      setSpotifyTokens(data)
    }
    setLoading(false)
  }

  const connectSpotify = () => {
    // Store user ID in localStorage before OAuth
    if (user) {
      localStorage.setItem('spotify_oauth_user_id', user.id)
    }
    window.location.href = '/api/spotify/auth'
  }

  const disconnectSpotify = async () => {
    if (!user) return

    const { error } = await supabase
      .from('user_spotify_tokens')
      .delete()
      .eq('user_id', user.id)

    if (!error) {
      setSpotifyTokens(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="card max-w-lg mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="animate-spin w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full"></div>
            <span className="text-xl">Checking Spotify connection...</span>
          </div>
        </div>
      </div>
    )
  }

  if (spotifyTokens) {
    const isExpired = new Date(spotifyTokens.expires_at) < new Date()
    
    return (
      <div className="text-center">
        <div className="card max-w-lg mx-auto">
          <div className="text-6xl mb-6">🎧</div>
          <div className={`alert ${isExpired ? 'alert-warning' : 'alert-success'} mb-8`}>
            {isExpired ? (
              <>
                <div className="font-bold text-lg">⚠️ Connection Expired</div>
                <div className="mt-2">Your Spotify token has expired. Please reconnect to continue playing.</div>
              </>
            ) : (
              <>
                <div className="font-bold text-lg">✅ Spotify Premium Connected!</div>
                <div className="mt-2">Ready to play AI Music Bingo</div>
              </>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {isExpired && (
              <button
                onClick={connectSpotify}
                className="btn btn-primary flex-1"
              >
                🔄 Reconnect Spotify
              </button>
            )}
            <button
              onClick={disconnectSpotify}
              className="btn btn-danger"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="card max-w-lg mx-auto">
        <div className="text-6xl mb-6">🎵</div>
        <h2 className="text-3xl font-bold mb-6">Connect Spotify Premium</h2>
        
        <div className="alert alert-info mb-8">
          <div className="font-bold text-lg">🎧 Spotify Premium Required</div>
          <div className="mt-2">
            You need a Spotify Premium account to control playback and enjoy the full AI Music Bingo experience.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🎵</div>
            <div className="font-semibold">High Quality</div>
            <div className="text-sm text-gray-400">Stream premium audio</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🎮</div>
            <div className="font-semibold">Full Control</div>
            <div className="text-sm text-gray-400">Play on any device</div>
          </div>
          <div className="text-center p-4">
            <div className="text-2xl mb-2">🤖</div>
            <div className="font-semibold">AI Cards</div>
            <div className="text-sm text-gray-400">Smart challenges</div>
          </div>
        </div>

        <button
          onClick={connectSpotify}
          className="btn btn-primary w-full text-lg"
        >
          🎵 Connect Spotify Premium
        </button>
      </div>
    </div>
  )
}