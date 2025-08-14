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
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold mb-2">🎵 Music Bingo 🎵</h2>
        {winningPattern && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded animate-pulse">
            <div className="text-center">
              <div className="text-2xl font-bold">🎉 BINGO! 🎉</div>
              <div className="text-lg">{winningPattern}</div>
              <div className="text-sm mt-1">Congratulations! You won!</div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bingo-card bg-white border-2 border-gray-300 rounded-lg p-2">
        {bingoCard.cells.map((cell: BingoCell, index: number) => (
          <div
            key={cell.id}
            className={`bingo-cell ${
              isStamped(index) ? 'stamped' : ''
            } ${
              cell.isFree ? 'free' : ''
            }`}
            onClick={() => handleCellClick(index)}
            style={{
              backgroundColor: isStamped(index) 
                ? cell.isFree 
                  ? '#FFD700' 
                  : '#4CAF50'
                : '#ffffff',
              color: isStamped(index) 
                ? cell.isFree 
                  ? '#333' 
                  : 'white'
                : '#333',
              cursor: gameCompleted ? 'default' : 'pointer'
            }}
          >
            <div className="text-xs leading-tight">
              {cell.text}
            </div>
            {isStamped(index) && !cell.isFree && (
              <div className="text-lg">✓</div>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Click cells when you hear matching songs!</p>
        <p>Stamped: {stampedCells.length} / 24</p>
      </div>
    </div>
  )
}