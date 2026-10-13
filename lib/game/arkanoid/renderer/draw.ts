import { GameState } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants'

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Clear canvas
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw border
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw game elements
  state.paddle.draw(ctx)
  state.ball.draw(ctx)

  for (const block of state.blocks) {
    block.draw(ctx)
  }

  for (const explosion of state.explosions) {
    explosion.draw(ctx)
  }

  // Draw HUD
  drawHUD(ctx, state)

  // Draw overlays
  if (state.isPaused) {
    drawPauseOverlay(ctx)
  }

  if (state.gameState === 'gameover') {
    drawGameOverOverlay(ctx, state.score)
  }

  if (state.gameState === 'win') {
    drawWinOverlay(ctx, state.score)
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = '#fff'
  ctx.font = '16px monospace'
  ctx.textAlign = 'left'

  ctx.fillText(`Score: ${state.score}`, 10, 20)
  ctx.fillText(`Lives: ${state.lives}`, 10, 40)
  ctx.fillText(`Level: ${state.currentLevel}`, 10, 60)

  // Remaining blocks count
  const blocksRemaining = state.blocks.filter((b) => b.alive).length
  ctx.textAlign = 'right'
  ctx.fillText(`Blocks: ${blocksRemaining}`, CANVAS_WIDTH - 10, 20)
}

function drawPauseOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = '#fff'
  ctx.font = 'bold 32px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)

  ctx.font = '16px monospace'
  ctx.fillText('Press P or ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
}

function drawGameOverOverlay(
  ctx: CanvasRenderingContext2D,
  score: number
): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = '#ff0000'
  ctx.font = 'bold 40px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

  ctx.fillStyle = '#fff'
  ctx.font = '24px monospace'
  ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)

  ctx.font = '16px monospace'
  ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
}

function drawWinOverlay(ctx: CanvasRenderingContext2D, score: number): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = '#00ff00'
  ctx.font = 'bold 40px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

  ctx.fillStyle = '#fff'
  ctx.font = '24px monospace'
  ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)

  ctx.font = '16px monospace'
  ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
}
