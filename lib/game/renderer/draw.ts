import { GameState } from '../types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants'

const drawLifeIcon = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(-Math.PI / 2)
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = 1.2
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(9, 0)
  ctx.lineTo(-6, -5)
  ctx.lineTo(-3, 0)
  ctx.lineTo(-6, 5)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

const drawHUD = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  ctx.fillStyle = '#fff'
  ctx.font = '15px monospace'

  // Score
  ctx.textAlign = 'left'
  ctx.fillText(`SCORE  ${state.score}`, 14, 26)

  // Level
  ctx.textAlign = 'center'
  ctx.fillText(`NIVEL ${state.level}`, CANVAS_WIDTH / 2, 26)

  // Lives
  for (let i = 0; i < state.lives; i++) {
    drawLifeIcon(ctx, CANVAS_WIDTH - 16 - i * 22, 18)
  }

  // Triple shot indicator
  if (state.ship && state.ship.tripleShot > 0) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#0ff'
    ctx.fillText(`3x  ${state.ship.tripleShot.toFixed(1)}s`, 14, 46)
  }
}

const drawOverlay = (ctx: CanvasRenderingContext2D, title: string, sub: string): void => {
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 46px monospace'
  ctx.fillText(title, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 18)
  ctx.font = '18px monospace'
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.fillText(sub, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 22)
}

export const drawGame = (ctx: CanvasRenderingContext2D, state: GameState): void => {
  // Background
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  // Draw entities
  state.particles.forEach(p => p.draw(ctx))
  state.asteroids.forEach(a => a.draw(ctx))
  state.powerUps.forEach(p => p.draw(ctx))
  state.bullets.forEach(b => b.draw(ctx))
  state.ship?.draw(ctx)

  // HUD
  drawHUD(ctx, state)

  // Game over overlay
  if (state.state === 'gameover') {
    drawOverlay(ctx, 'GAME OVER', `PUNTAJE: ${state.score}   —   ESPACIO PARA REINICIAR`)
  }
}
