'use client'

import { useState, useCallback } from 'react'
import { BingoCard as BingoCardType, BingoCell, BingoGenerator } from '@/lib/bingoGenerator'

interface BingoCardProps {
  bingoCard: BingoCardType
  stampedCells: number[]
  onCellStamp: (cellIndex: number) => void
  gameCompleted: boolean
}

export default function BingoCard({ bingoCard, stampedCells, onCellStamp, gameCompleted }: BingoCardProps) {
  const handleCellClick = useCallback((cellIndex: number) => {
    if (!gameCompleted) {
      onCellStamp(cellIndex)
      // Add haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }
  }, [onCellStamp, gameCompleted])

  const isStamped = useCallback((cellIndex: number) => {
    return cellIndex === 12 || stampedCells.includes(cellIndex) // Center is always stamped
  }, [stampedCells])

  const getWinningPattern = useCallback(() => {
    return BingoGenerator.checkWinningPattern(stampedCells)
  }, [stampedCells])

  const winningPattern = getWinningPattern()

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-6">
          🎵 Music Bingo Card
        </h2>
        
        {winningPattern && (
          <div className="alert alert-success mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">🎉 BINGO! 🎉</div>
              <div className="text-xl font-semibold">{winningPattern}</div>
              <div className="mt-2">Congratulations! You won!</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center mb-8">
        <div className="bingo-card">
          {bingoCard.cells.map((cell: BingoCell, index: number) => (
            <div
              key={cell.id}
              className={`bingo-cell ${
                isStamped(index) ? 'stamped' : ''
              } ${
                cell.isFree ? 'free' : ''
              }`}
              onClick={() => handleCellClick(index)}
            >
              {cell.text}
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <div className="bg-white text-black inline-block px-6 py-3 rounded-full font-medium mb-4">
          <div className="flex items-center space-x-4 text-sm">
            <span>✅ Stamped: {stampedCells.length}</span>
            <span>•</span>
            <span>⏳ Remaining: {24 - stampedCells.length}</span>
          </div>
        </div>
        
        <p className="text-gray-400 max-w-sm mx-auto">
          Tap cells when you hear matching songs! 
          {!gameCompleted && " Get 5 in a row to win!"}
        </p>
      </div>
    </div>
  )
}