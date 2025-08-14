'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { SpotifyTrack } from '@/lib/spotify'
import { supabase } from '@/lib/supabase'

interface SpotifyDevice {
  id: string
  is_active: boolean
  is_private_session: boolean
  is_restricted: boolean
  name: string
  type: string
  volume_percent: number
}

interface SpotifyWebPlayerProps {
  user: User
  tracks: SpotifyTrack[]
  currentSongIndex: number
  onSongChange: (index: number) => void
  gameCompleted: boolean
}

export default function SpotifyWebPlayer({ 
  user, 
  tracks, 
  currentSongIndex, 
  onSongChange, 
  gameCompleted 
}: SpotifyWebPlayerProps) {
  const [devices, setDevices] = useState<SpotifyDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [accessToken, setAccessToken] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [devicesLoaded, setDevicesLoaded] = useState(false)
  const [originalVolume, setOriginalVolume] = useState<number>(50)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (tracks.length > 0 && currentSongIndex < tracks.length) {
      setCurrentTrack(tracks[currentSongIndex])
    }
  }, [tracks, currentSongIndex])

  // Get access token and load devices
  useEffect(() => {
    const initializeSpotify = async () => {
      const { data, error } = await supabase
        .from('user_spotify_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setAccessToken(data.access_token)
        // Load available devices
        await loadDevices(data.access_token)
      }
    }

    initializeSpotify()
  }, [user.id])

  // Volume control functions for fade effects
  const setDeviceVolume = async (volume: number) => {
    if (!accessToken || !selectedDevice) return
    
    try {
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}&device_id=${selectedDevice}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
    } catch (error) {
      console.error('Error setting volume:', error)
    }
  }

  const fadeIn = async (duration: number = 2000) => {
    setIsFading(true)
    const steps = 20
    const stepDuration = duration / steps
    const volumeStep = originalVolume / steps

    for (let i = 0; i <= steps; i++) {
      const volume = Math.round(i * volumeStep)
      await setDeviceVolume(volume)
      await new Promise(resolve => setTimeout(resolve, stepDuration))
    }
    setIsFading(false)
  }

  const fadeOut = async (duration: number = 1500) => {
    setIsFading(true)
    const steps = 15
    const stepDuration = duration / steps
    const currentVolume = originalVolume
    const volumeStep = currentVolume / steps

    for (let i = steps; i >= 0; i--) {
      const volume = Math.round(i * volumeStep)
      await setDeviceVolume(volume)
      await new Promise(resolve => setTimeout(resolve, stepDuration))
    }
    setIsFading(false)
  }

  // Load available Spotify devices
  const loadDevices = async (token: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices)
        setDevicesLoaded(true)
        
        // Auto-select active device or first available device
        const activeDevice = data.devices.find((d: SpotifyDevice) => d.is_active)
        if (activeDevice) {
          setSelectedDevice(activeDevice.id)
          setOriginalVolume(activeDevice.volume_percent || 50)
        } else if (data.devices.length > 0) {
          setSelectedDevice(data.devices[0].id)
          setOriginalVolume(data.devices[0].volume_percent || 50)
        }
      }
    } catch (error) {
      console.error('Error loading devices:', error)
      setDevicesLoaded(true)
    }
  }

  // Auto-progression timer (30 seconds per song)
  useEffect(() => {
    if (!gameStarted || gameCompleted) return

    setTimeLeft(30)
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 2 && prev > 1) {
          // Start fade out 2 seconds before song ends
          fadeOut(1500)
        }
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

  const startGame = useCallback(async () => {
    if (!selectedDevice || !currentTrack) return

    setGameStarted(true)
    await playCurrentTrack()
  }, [selectedDevice, currentTrack])

  const stopGame = useCallback(async () => {
    setGameStarted(false)
    setIsPlaying(false)
    setTimeLeft(0)

    // Fade out and pause playback on selected device
    try {
      await fadeOut(1000)
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      // Restore original volume
      await setDeviceVolume(originalVolume)
    } catch (error) {
      console.error('Error pausing playback:', error)
    }
  }, [accessToken, originalVolume])

  const playCurrentTrack = useCallback(async () => {
    if (!selectedDevice || !currentTrack || !accessToken) return

    try {
      // First, transfer playback to the selected device if needed
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_ids: [selectedDevice],
          play: false,
        }),
      })

      // Small delay to ensure device transfer
      await new Promise(resolve => setTimeout(resolve, 500))

      // Then start playing the track
      const trackUri = `spotify:track:${currentTrack.id}`
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${selectedDevice}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri],
          position_ms: Math.floor((currentTrack.duration_ms || 180000) * 0.3), // Start at 30% through the song
        }),
      })

      if (response.ok) {
        setIsPlaying(true)
        // Start with low volume and fade in
        await setDeviceVolume(5)
        await new Promise(resolve => setTimeout(resolve, 300)) // Small delay for playback to start
        fadeIn(2000) // 2 second fade in
      } else {
        const errorData = await response.text()
        console.error('Failed to start playback:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error playing track:', error)
    }
  }, [selectedDevice, currentTrack, accessToken])

  const pauseTrack = useCallback(async () => {
    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      setIsPlaying(false)
    } catch (error) {
      console.error('Error pausing track:', error)
    }
  }, [accessToken])

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

  // Auto-play when song changes during game
  useEffect(() => {
    if (gameStarted && currentTrack && selectedDevice) {
      playCurrentTrack()
    }
  }, [currentTrack, gameStarted, selectedDevice, playCurrentTrack])

  if (!currentTrack) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg">
        <p className="text-center text-gray-600">No track selected</p>
      </div>
    )
  }

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4 text-center">🎵 Spotify Player</h3>
      
      {/* Device Selection */}
      {devicesLoaded && devices.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Choose Playback Device:
          </label>
          <select
            value={selectedDevice}
            onChange={(e) => {
              setSelectedDevice(e.target.value)
              const device = devices.find(d => d.id === e.target.value)
              if (device) {
                setOriginalVolume(device.volume_percent || 50)
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} {device.is_active ? '(Active)' : ''} ({device.type})
              </option>
            ))}
          </select>
          <button
            onClick={() => loadDevices(accessToken)}
            className="mt-2 text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
          >
            🔄 Refresh Devices
          </button>
        </div>
      )}

      {/* No Devices Found */}
      {devicesLoaded && devices.length === 0 && (
        <div className="mb-4 p-3 bg-orange-100 border border-orange-400 text-orange-700 rounded text-center">
          <div className="text-sm">
            No Spotify devices found. Please open Spotify on your phone or computer first, then click refresh.
          </div>
          <button
            onClick={() => loadDevices(accessToken)}
            className="mt-2 bg-orange-200 hover:bg-orange-300 px-3 py-1 rounded text-sm"
          >
            🔄 Refresh Devices
          </button>
        </div>
      )}

      {/* Loading Devices */}
      {!devicesLoaded && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-center">
          <div className="text-sm">Loading Spotify devices...</div>
        </div>
      )}
      
      {/* Game Status */}
      {gameStarted && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-center">
          <div className="text-lg font-bold">⏱️ {timeLeft}s remaining</div>
          <div className="text-sm">Listen and mark your bingo card!</div>
          {isFading && (
            <div className="text-xs mt-1 text-blue-600">
              🎵 Fading {timeLeft <= 2 ? 'out' : 'in'}...
            </div>
          )}
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
      {selectedDevice && !gameStarted ? (
        <div className="mb-4">
          <button
            onClick={startGame}
            disabled={gameCompleted}
            className="w-full bg-green-500 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg text-lg"
          >
            🎵 Start Auto-Play Game (30s per song)
          </button>
        </div>
      ) : selectedDevice && gameStarted ? (
        <div className="mb-4">
          <button
            onClick={stopGame}
            className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg"
          >
            ⏹️ Stop Game
          </button>
        </div>
      ) : null}

      {/* Manual Playback Controls */}
      {selectedDevice && (
        <div className="mb-4">
          <button
            onClick={isPlaying ? pauseTrack : playCurrentTrack}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isPlaying ? '⏸️ Pause' : '▶️ Play'} Current Song
          </button>
        </div>
      )}

      {/* Navigation Controls */}
      <div className="flex justify-center items-center space-x-4 mb-4">
        <button
          onClick={previousSong}
          disabled={currentSongIndex === 0}
          className="bg-gray-500 hover:bg-gray-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded"
        >
          ⏮️ Previous
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
      <div className="p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-sm">
        <p className="text-center">
          🎧 This will play music directly through your Spotify account! Make sure you have Spotify Premium and this device is authorized.
        </p>
      </div>
    </div>
  )
}