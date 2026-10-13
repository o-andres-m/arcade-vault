'use client'

import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'
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

export interface ArkanoidGameHandle {
  setPaused: (paused: boolean) => void
}

interface ArkanoidGameProps {
  onGameEnd?: (score: number) => void
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
  onPausedChange?: (paused: boolean) => void
}

export const ArkanoidGame = forwardRef<ArkanoidGameHandle, ArkanoidGameProps>(function ArkanoidGameComponent({
  onGameEnd,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onPausedChange
}, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState | null>(null)
  const gameLoopRef = useRef<number | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})
  const lastGameStateRef = useRef<'playing' | 'gameover' | 'win' | null>(null)
  const { user } = useAuth()
  const lastScoreRef = useRef(0)
  const lastLivesRef = useRef(3)
  const lastLevelRef = useRef(1)
  const lastPausedRef = useRef(false)
  const scoreChangeCallbackRef = useRef(onScoreChange)
  const livesChangeCallbackRef = useRef(onLivesChange)
  const levelChangeCallbackRef = useRef(onLevelChange)
  const pausedChangeCallbackRef = useRef(onPausedChange)
  const onGameEndCallbackRef = useRef(onGameEnd)

  useEffect(() => {
    scoreChangeCallbackRef.current = onScoreChange
    livesChangeCallbackRef.current = onLivesChange
    levelChangeCallbackRef.current = onLevelChange
    pausedChangeCallbackRef.current = onPausedChange
    onGameEndCallbackRef.current = onGameEnd
  }, [onScoreChange, onLivesChange, onLevelChange, onPausedChange, onGameEnd])

  useImperativeHandle(ref, () => ({
    setPaused: (paused: boolean) => {
      if (gameStateRef.current && gameStateRef.current.gameState === 'playing') {
        if (paused !== gameStateRef.current.isPaused) {
          togglePause(gameStateRef.current)
          lastPausedRef.current = gameStateRef.current.isPaused
          pausedChangeCallbackRef.current?.(gameStateRef.current.isPaused)
        }
      }
    }
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Initialize game
    gameStateRef.current = initializeGame()
    lastGameStateRef.current = null
    lastScoreRef.current = 0
    lastLivesRef.current = 3
    lastLevelRef.current = 1
    lastPausedRef.current = false

    // Input handling
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      keysRef.current[key] = true

      // Pause toggle
      if (key === 'p' || key === 'P' || key === 'Escape') {
        e.preventDefault()
        if (gameStateRef.current) {
          togglePause(gameStateRef.current)
          lastPausedRef.current = gameStateRef.current.isPaused
          pausedChangeCallbackRef.current?.(gameStateRef.current.isPaused)
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

        // Sync state updates with parent
        if (gameStateRef.current.score !== lastScoreRef.current) {
          lastScoreRef.current = gameStateRef.current.score
          scoreChangeCallbackRef.current?.(gameStateRef.current.score)
        }

        if (gameStateRef.current.lives !== lastLivesRef.current) {
          lastLivesRef.current = gameStateRef.current.lives
          livesChangeCallbackRef.current?.(gameStateRef.current.lives)
        }

        if (gameStateRef.current.currentLevel !== lastLevelRef.current) {
          lastLevelRef.current = gameStateRef.current.currentLevel
          levelChangeCallbackRef.current?.(gameStateRef.current.currentLevel)
        }

        if (gameStateRef.current.isPaused !== lastPausedRef.current) {
          lastPausedRef.current = gameStateRef.current.isPaused
          pausedChangeCallbackRef.current?.(gameStateRef.current.isPaused)
        }

        // Handle game end
        if (
          gameStateRef.current.gameState !== 'playing' &&
          lastGameStateRef.current !== gameStateRef.current.gameState
        ) {
          lastGameStateRef.current = gameStateRef.current.gameState
          handleSaveScore(gameStateRef.current.score)
          onGameEndCallbackRef.current?.(gameStateRef.current.score)
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
  }, [])

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
})
