'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { SpotifyTrack } from '@/lib/spotify'

interface SpotifyPlayerProps {
  user: User
  tracks: SpotifyTrack[]
  currentSongIndex: number
  onSongChange: (index: number) => void
  gameCompleted: boolean
}

export default function SpotifyPlayer({ 
  user, 
  tracks, 
  currentSongIndex, 
  onSongChange, 
  gameCompleted 
}: SpotifyPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    if (tracks.length > 0 && currentSongIndex < tracks.length) {
      setCurrentTrack(tracks[currentSongIndex])
    }
  }, [tracks, currentSongIndex])

  // Auto-progression timer (30 seconds per song)
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    setTimeLeft(30)
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Move to next song
          if (currentSongIndex < tracks.length - 1) {
            onSongChange(currentSongIndex + 1)
          } else {
            setGameStarted(false) // End of playlist
          }
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameStarted, currentSongIndex, tracks.length, onSongChange, gameCompleted])

  const startGame = useCallback(() => {
    setGameStarted(true)
    setIsPlaying(true)
  }, [])

  const stopGame = useCallback(() => {
    setGameStarted(false)
    setIsPlaying(false)
    setTimeLeft(0)
  }, [])

  const nextSong = useCallback(() => {
    if (currentSongIndex < tracks.length - 1) {
      onSongChange(currentSongIndex + 1)
      if (gameStarted) {
        setTimeLeft(30) // Reset timer for manual skip
      }
    }
  }, [currentSongIndex, tracks.length, onSongChange, gameStarted])

  const previousSong = useCallback(() => {
    if (currentSongIndex > 0) {
      onSongChange(currentSongIndex - 1)
      if (gameStarted) {
        setTimeLeft(30) // Reset timer for manual skip
      }
    }
  }, [currentSongIndex, onSongChange, gameStarted])

  const handleManualPlay = useCallback(() => {
    if (currentTrack?.external_urls?.spotify) {
      // Open in Spotify app/web
      window.open(currentTrack.external_urls.spotify, '_blank')
    }
  }, [currentTrack])

  if (!currentTrack) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <p className="text-center text-gray-600">No track selected</p>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4 text-center">🎵 Music Player</h3>
      
      {/* Game Status */}
      {gameStarted && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-center">
          <div className="text-lg font-bold">⏱️ {timeLeft}s remaining</div>
          <div className="text-sm">Listen and mark your bingo card!</div>
        </div>
      )}
      
      {/* Current Track Info */}
      <div className="mb-6 text-center">
        {currentTrack.album.images.length > 0 && (
          <img 
            src={currentTrack.album.images[0].url} 
            alt={currentTrack.album.name}
            className="w-32 h-32 mx-auto mb-4 rounded"
          />
        )}
        <h4 className="font-bold text-lg">{currentTrack.name}</h4>
        <p className="text-gray-600">{currentTrack.artists.map(a => a.name).join(', ')}</p>
        <p className="text-sm text-gray-500">{currentTrack.album.name}</p>
      </div>

      {/* Game Controls */}
      {!gameStarted ? (
        <div className="mb-4">
          <button
            onClick={startGame}
            disabled={gameCompleted}
            className="w-full bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg text-lg"
          >
            🎵 Start Game (30s per song)
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <button
            onClick={stopGame}
            className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
          >
            ⏹️ Stop Game
          </button>
        </div>
      )}

      {/* Manual Controls */}
      <div className="flex justify-center items-center space-x-4 mb-4">
        <button
          onClick={previousSong}
          disabled={currentSongIndex === 0}
          className="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded"
        >
          ⏮️ Previous
        </button>
        
        <button
          onClick={handleManualPlay}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          🎵 Play in Spotify
        </button>
        
        <button
          onClick={nextSong}
          disabled={currentSongIndex === tracks.length - 1}
          className="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded"
        >
          Next ⏭️
        </button>
      </div>

      {/* Track Progress */}
      <div className="text-center text-sm text-gray-600 mb-4">
        Track {currentSongIndex + 1} of {tracks.length}
      </div>

      {/* Instructions */}
      <div className="p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
        <p className="text-center">
          💡 Click "Start Game" for automatic 30-second progression, or use manual controls to navigate songs yourself!
        </p>
      </div>
    </div>
  )
}