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
        <div className="bg-gray-300 text-gray-600 font-bold py-2 px-4 rounded cursor-not-allowed">
          Checking Spotify connection...
        </div>
      </div>
    )
  }

  if (spotifyTokens) {
    const isExpired = new Date(spotifyTokens.expires_at) < new Date()
    
    return (
      <div className="text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          ✅ Spotify Premium connected!
          {isExpired && <span className="text-orange-600"> (Token expired - please reconnect)</span>}
        </div>
        <div className="space-x-4">
          {isExpired && (
            <button
              onClick={connectSpotify}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Reconnect Spotify
            </button>
          )}
          <button
            onClick={disconnectSpotify}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Disconnect Spotify
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        🎵 Connect your Spotify Premium account to start playing!
      </div>
      <button
        onClick={connectSpotify}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
      >
        Connect Spotify Premium
      </button>
    </div>
  )
}