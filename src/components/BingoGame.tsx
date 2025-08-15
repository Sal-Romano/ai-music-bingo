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
        <div className="card max-w-lg mx-auto">
          <div className="text-6xl mb-6">😵</div>
          <div className="alert alert-error mb-8">
            <div className="font-bold text-lg">Oops! Something went wrong</div>
            <div className="mt-2">{error}</div>
          </div>
          <button
            onClick={generateNewGame}
            className="btn btn-primary w-full"
          >
            🔄 Try Again
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="card max-w-lg mx-auto">
          <div className="text-6xl mb-6">🤖</div>
          <div className="alert alert-info mb-6">
            <div className="font-bold text-lg">🎵 Creating Your Bingo Card</div>
            <div className="mt-2">AI is generating personalized music challenges...</div>
          </div>
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full"></div>
            <span className="text-lg">This may take a moment</span>
          </div>
        </div>
      </div>
    )
  }

  if (!gameSession) {
    return (
      <div className="text-center">
        <div className="card max-w-lg mx-auto">
          <div className="text-6xl mb-6">🎯</div>
          <h2 className="text-3xl font-bold mb-6">Ready to Play!</h2>
          <div className="alert alert-success mb-8">
            <div className="font-bold text-lg">🎵 AI Music Bingo</div>
            <div className="mt-2">
              Generate a personalized bingo card with AI-curated music challenges
            </div>
          </div>
          <button
            onClick={generateNewGame}
            className="btn btn-primary w-full text-lg"
          >
            🎲 Generate Bingo Card
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bingo Card */}
        <div className="order-2 lg:order-1">
          <BingoCard
            bingoCard={gameSession.bingo_card}
            stampedCells={gameSession.stamped_cells}
            onCellStamp={handleCellStamp}
            gameCompleted={gameSession.is_completed}
          />
          
          {gameSession.is_completed && (
            <div className="mt-8 text-center">
              <button
                onClick={generateNewGame}
                className="btn btn-primary text-lg"
              >
                🎵 Play Again
              </button>
            </div>
          )}
        </div>

        {/* Spotify Player */}
        <div className="order-1 lg:order-2">
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