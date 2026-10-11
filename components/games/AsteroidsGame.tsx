'use client'

import { useEffect, useRef } from 'react'
import { GameState, InputState } from '@/lib/game/types'
import { initializeGame, updateGameState } from '@/lib/game/engine/gameEngine'
import { drawGame } from '@/lib/game/renderer/draw'
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAX_DELTA_TIME } from '@/lib/game/constants'

interface AsteroidsGameProps {
  onGameOver?: (score: number) => void
  onScoreChange?: (score: number) => void
  onLivesChange?: (lives: number) => void
  onLevelChange?: (level: number) => void
}

export const AsteroidsGame = ({ onGameOver, onScoreChange, onLivesChange, onLevelChange }: AsteroidsGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameStateRef = useRef<GameState>(initializeGame())
  const keysRef = useRef<Record<string, boolean>>({})
  const justPressedRef = useRef<Record<string, boolean>>({})
  const lastTimeRef = useRef<number | null>(null)
  const frameIdRef = useRef<number | null>(null)
  const gameOverCallbackRef = useRef(onGameOver)
  const scoreChangeCallbackRef = useRef(onScoreChange)
  const livesChangeCallbackRef = useRef(onLivesChange)
  const levelChangeCallbackRef = useRef(onLevelChange)
  const lastGameOverStateRef = useRef(false)
  const lastScoreRef = useRef(0)
  const lastLivesRef = useRef(3)
  const lastLevelRef = useRef(1)

  useEffect(() => {
    gameOverCallbackRef.current = onGameOver
    scoreChangeCallbackRef.current = onScoreChange
    livesChangeCallbackRef.current = onLivesChange
    levelChangeCallbackRef.current = onLevelChange
  }, [onGameOver, onScoreChange, onLivesChange, onLevelChange])

  // Handle key events
  useEffect(() => {
    const gameKeys = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'])

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameKeys.has(e.code)) {
        e.preventDefault()
      }
      const code = e.code
      if (!keysRef.current[code]) {
        justPressedRef.current[code] = true
      }
      keysRef.current[code] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameKeys.has(e.code)) {
        e.preventDefault()
      }
      keysRef.current[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop + render
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    lastTimeRef.current = null

    const loop = (ts: number) => {
      const dt =
        lastTimeRef.current === null
          ? 0
          : Math.min((ts - lastTimeRef.current) / 1000, MAX_DELTA_TIME)
      lastTimeRef.current = ts

      // Update game state in ref
      const inputState: InputState = {
        left: false,
        right: false,
        up: false,
        shoot: false,
      }
      updateGameState(gameStateRef.current, dt, inputState, keysRef.current, justPressedRef.current)

      // Render immediately
      drawGame(ctx, gameStateRef.current)

      // Sync state updates with parent
      if (gameStateRef.current.score !== lastScoreRef.current) {
        lastScoreRef.current = gameStateRef.current.score
        if (scoreChangeCallbackRef.current) {
          scoreChangeCallbackRef.current(gameStateRef.current.score)
        }
      }

      if (gameStateRef.current.lives !== lastLivesRef.current) {
        lastLivesRef.current = gameStateRef.current.lives
        if (livesChangeCallbackRef.current) {
          livesChangeCallbackRef.current(gameStateRef.current.lives)
        }
      }

      const currentLevel = Math.floor(gameStateRef.current.score / 2500) + 1
      if (currentLevel !== lastLevelRef.current) {
        lastLevelRef.current = currentLevel
        if (levelChangeCallbackRef.current) {
          levelChangeCallbackRef.current(currentLevel)
        }
      }

      // Check if game over
      if (gameStateRef.current.state === 'gameover' && !lastGameOverStateRef.current) {
        lastGameOverStateRef.current = true
        if (gameOverCallbackRef.current) {
          gameOverCallbackRef.current(gameStateRef.current.score)
        }
      }

      // Reset justPressed after frame
      justPressedRef.current = {}

      frameIdRef.current = requestAnimationFrame(loop)
    }

    frameIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
      }
    }
  }, [])

  return (
    <div className="flex justify-center items-center">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-cyan-400 bg-black"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  )
}
