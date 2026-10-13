import { GameState } from '../types'
import { Paddle } from '../entities/Paddle'
import { Ball } from '../entities/Ball'
import { Explosion } from '../entities/Explosion'
import {
  CANVAS_WIDTH,
  INITIAL_LIVES,
  TOTAL_LEVELS,
  POINTS_PER_BLOCK,
  BASE_BALL_VX,
  BASE_BALL_VY,
} from '../constants'
import { checkBallPaddleCollision, checkBallBlockCollision } from '../physics/collision'
import { createLevel, getLevelSpeedMultiplier } from '../levels'

export function initializeGame(): GameState {
  const paddle = new Paddle()
  const ball = new Ball()

  const gameState: GameState = {
    paddle,
    ball,
    blocks: createLevel(1),
    explosions: [],
    score: 0,
    lives: INITIAL_LIVES,
    currentLevel: 1,
    gameState: 'playing',
    isPaused: false,
  }

  resetBall(gameState)
  return gameState
}

export function resetBall(state: GameState): void {
  const speedMultiplier = getLevelSpeedMultiplier(state.currentLevel)
  const ballVx = BASE_BALL_VX * speedMultiplier
  const ballVy = BASE_BALL_VY * speedMultiplier

  state.ball.reset(state.paddle.x + state.paddle.w / 2, ballVx, ballVy)
}

export function updateGame(
  state: GameState,
  dt: number,
  keys: Record<string, boolean>
): void {
  if (state.gameState !== 'playing' || state.isPaused) return

  // Update entities
  state.paddle.update(dt, keys)
  state.ball.update(dt)

  // Update explosions
  state.explosions = state.explosions.filter((exp) => {
    exp.update(dt)
    return exp.isAlive()
  })

  // Paddle collision
  checkBallPaddleCollision(state.ball, state.paddle)

  // Block collisions
  for (const block of state.blocks) {
    if (checkBallBlockCollision(state.ball, block)) {
      state.score += POINTS_PER_BLOCK
      state.explosions.push(
        new Explosion(block.x, block.y, block.w, block.h, block.color)
      )
    }
  }

  // Check if ball is out of bounds
  if (state.ball.isOutOfBounds()) {
    state.lives--
    if (state.lives <= 0) {
      state.gameState = 'gameover'
    } else {
      resetBall(state)
    }
  }

  // Check level completion (all blocks destroyed)
  const allBlocksDestroyed = state.blocks.every((b) => !b.alive)
  if (allBlocksDestroyed) {
    if (state.currentLevel >= TOTAL_LEVELS) {
      state.gameState = 'win'
    } else {
      state.currentLevel++
      state.blocks = createLevel(state.currentLevel)
      resetBall(state)
    }
  }
}

export function togglePause(state: GameState): void {
  if (state.gameState === 'playing') {
    state.isPaused = !state.isPaused
  }
}
