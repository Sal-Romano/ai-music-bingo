'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { BingoCard as BingoCardType, BingoGenerator } from '@/lib/bingoGenerator'
import BingoCard from './BingoCard'
import SpotifyWebPlayer from './SpotifyWebPlayer'

interface BingoGameProps {
  user: User
}

interface GameSession {
  id: string
  bingo_card: BingoCardType
  stamped_cells: number[]
  is_completed: boolean
  winning_pattern?: string
  current_song_index: number
}

export default function BingoGame({ user }: BingoGameProps) {
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateNewGame = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/bingo/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate bingo card')
      }

      const data = await response.json()
      
      // Create initial game session state
      const newGameSession: GameSession = {
        id: data.gameSessionId,
        bingo_card: data.bingoCard,
        stamped_cells: [],
        is_completed: false,
        current_song_index: 0
      }
      
      setGameSession(newGameSession)
    } catch (err) {
      console.error('Error generating game:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCellStamp = useCallback(async (cellIndex: number) => {
    if (!gameSession || gameSession.is_completed) return

    const newStampedCells = gameSession.stamped_cells.includes(cellIndex)
      ? gameSession.stamped_cells.filter(i => i !== cellIndex) // Remove stamp
      : [...gameSession.stamped_cells, cellIndex] // Add stamp

    // Check for winning pattern
    const winningPattern = BingoGenerator.checkWinningPattern(newStampedCells)
    const isCompleted = !!winningPattern

    const updatedSession: GameSession = {
      ...gameSession,
      stamped_cells: newStampedCells,
      is_completed: isCompleted,
      winning_pattern: winningPattern || undefined
    }

    setGameSession(updatedSession)

    // Update database
    try {
      const updateData: any = {
        stamped_cells: newStampedCells,
        is_completed: isCompleted
      }

      if (isCompleted) {
        updateData.winning_pattern = winningPattern
        updateData.completed_at = new Date().toISOString()
      }

      await supabase
        .from('game_sessions')
        .update(updateData)
        .eq('id', gameSession.id)

    } catch (error) {
      console.error('Error updating game session:', error)
    }
  }, [gameSession])

  const handleSongChange = useCallback(async (newSongIndex: number) => {
    if (!gameSession) return

    const updatedSession: GameSession = {
      ...gameSession,
      current_song_index: newSongIndex
    }

    setGameSession(updatedSession)

    // Update database
    try {
      await supabase
        .from('game_sessions')
        .update({ current_song_index: newSongIndex })
        .eq('id', gameSession.id)
    } catch (error) {
      console.error('Error updating current song:', error)
    }
  }, [gameSession])

  if (error) {
    return (
      <div className="text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={generateNewGame}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          🎵 Generating your AI Music Bingo card... 🎵
        </div>
      </div>
    )
  }

  if (!gameSession) {
    return (
      <div className="text-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          🎵 Ready to play AI Music Bingo! 🎵
        </div>
        <button
          onClick={generateNewGame}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-lg"
        >
          Generate Bingo Card
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bingo Card */}
        <div>
          <BingoCard
            bingoCard={gameSession.bingo_card}
            stampedCells={gameSession.stamped_cells}
            onCellStamp={handleCellStamp}
            gameCompleted={gameSession.is_completed}
          />
          
          {gameSession.is_completed && (
            <div className="mt-4 text-center">
              <button
                onClick={generateNewGame}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Spotify Player */}
        <div>
          <SpotifyWebPlayer
            user={user}
            tracks={gameSession.bingo_card.tracks}
            currentSongIndex={gameSession.current_song_index}
            onSongChange={handleSongChange}
            gameCompleted={gameSession.is_completed}
          />
        </div>
      </div>
    </div>
  )
}