'use client'

import { useRef, useEffect, useState } from 'react'
import { GameState } from '@/lib/game/arkanoid/types'
import {
  initializeGame,
  updateGame,
  togglePause,
} from '@/lib/game/arkanoid/engine/gameEngine'
import { drawGame } from '@/lib/game/arkanoid/renderer/draw'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/game/arkanoid/constants'
import { useAuth } from '@/hooks/useAuth'
import { saveScore } from '@/lib/supabase/scores'

interface ArkanoidGameProps {
  onGameEnd?: (score: number) => void
}

export function ArkanoidGame({ onGameEnd }: ArkanoidGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState | null>(null)
  const gameLoopRef = useRef<number | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const lastGameStateRef = useRef<'playing' | 'gameover' | 'win' | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize game
    gameStateRef.current = initializeGame()
    lastGameStateRef.current = null

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      keysRef.current[key] = true

      // Pause toggle
      if (key === 'p' || key === 'P' || key === 'Escape') {
        e.preventDefault()
        if (gameStateRef.current) {
          togglePause(gameStateRef.current)
        }
      }

      // Restart
      if (key === 'r' || key === 'R') {
        if (gameStateRef.current?.gameState !== 'playing') {
          gameStateRef.current = initializeGame()
          lastGameStateRef.current = null
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Game loop
    let lastTime = Date.now()
    const gameLoop = () => {
      const currentTime = Date.now()
      const dt = Math.min((currentTime - lastTime) / 1000, 0.016) // Cap at 60fps
      lastTime = currentTime

      if (gameStateRef.current) {
        updateGame(gameStateRef.current, dt, keysRef.current)
        drawGame(ctx, gameStateRef.current)

        // Handle game end
        if (
          gameStateRef.current.gameState !== 'playing' &&
          lastGameStateRef.current !== gameStateRef.current.gameState
        ) {
          lastGameStateRef.current = gameStateRef.current.gameState
          handleSaveScore(gameStateRef.current.score)
          onGameEnd?.(gameStateRef.current.score)
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [onGameEnd])

  const handleSaveScore = async (score: number) => {
    if (!user) return

    try {
      await saveScore('arkanoid', score)
    } catch (error) {
      console.error('Error saving score:', error)
    }
  }

  return (
    <div className="flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-white bg-black"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
