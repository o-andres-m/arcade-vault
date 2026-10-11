'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { GameState, InputState } from '@/lib/game/types'
import { initializeGame, updateGameState } from '@/lib/game/engine/gameEngine'
import { drawGame } from '@/lib/game/renderer/draw'
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAX_DELTA_TIME } from '@/lib/game/constants'

interface AsteroidsGameProps {
  onGameOver?: (score: number) => void
}

export const AsteroidsGame = ({ onGameOver }: AsteroidsGameProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<GameState>(() => initializeGame())
  const keysRef = useRef<Record<string, boolean>>({})
  const justPressedRef = useRef<Record<string, boolean>>({})
  const lastTimeRef = useRef<number | null>(null)
  const frameIdRef = useRef<number | null>(null)
  const gameOverCallbackRef = useRef(onGameOver)

  useEffect(() => {
    gameOverCallbackRef.current = onGameOver
  }, [onGameOver])

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const code = e.code
      if (!keysRef.current[code]) {
        justPressedRef.current[code] = true
      }
      keysRef.current[code] = true
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Game loop
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

      setGameState(prevState => {
        const newState = { ...prevState }
        const inputState: InputState = {
          left: false,
          right: false,
          up: false,
          shoot: false,
        }
        updateGameState(newState, dt, inputState, keysRef.current, justPressedRef.current)
        return newState
      })

      // Reset justPressed after frame
      justPressedRef.current = {}
    }

    frameIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current)
      }
    }
  }, [])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawGame(ctx, gameState)
  }, [gameState])

  // Call onGameOver when game ends
  useEffect(() => {
    if (gameState.state === 'gameover' && gameOverCallbackRef.current) {
      gameOverCallbackRef.current(gameState.score)
    }
  }, [gameState.state, gameState.score])

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
