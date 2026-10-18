import { GameState } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTES } from '../constants'

type ColorPalette = typeof COLOR_PALETTES[keyof typeof COLOR_PALETTES]

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState, colors: ColorPalette): void {
  // Clear canvas
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw border
  ctx.strokeStyle = colors.border
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw game elements with colors
  state.paddle.draw(ctx, colors)
  state.ball.draw(ctx, colors)

  for (const block of state.blocks) {
    block.draw(ctx, colors)
  }

  for (const explosion of state.explosions) {
    explosion.draw(ctx, colors)
  }

  // Draw HUD
  drawHUD(ctx, state, colors)

  // Draw overlays
  if (state.isPaused) {
    drawPauseOverlay(ctx, colors)
  }

  if (state.gameState === 'gameover') {
    drawGameOverOverlay(ctx, state.score, colors)
  }

  if (state.gameState === 'win') {
    drawWinOverlay(ctx, state.score, colors)
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, colors: ColorPalette): void {
  ctx.fillStyle = colors.hudText
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

function drawPauseOverlay(ctx: CanvasRenderingContext2D, colors: ColorPalette): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = colors.hudText
  ctx.font = 'bold 32px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30)

  ctx.font = '16px monospace'
  ctx.fillText('Press P or ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
}

function drawGameOverOverlay(
  ctx: CanvasRenderingContext2D,
  score: number,
  colors: ColorPalette
): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = colors.brick1
  ctx.font = 'bold 40px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

  ctx.fillStyle = colors.hudText
  ctx.font = '24px monospace'
  ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)

  ctx.font = '16px monospace'
  ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
}

function drawWinOverlay(ctx: CanvasRenderingContext2D, score: number, colors: ColorPalette): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = colors.brick4
  ctx.font = 'bold 40px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillText('YOU WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40)

  ctx.fillStyle = colors.hudText
  ctx.font = '24px monospace'
  ctx.fillText(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)

  ctx.font = '16px monospace'
  ctx.fillText('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60)
}
