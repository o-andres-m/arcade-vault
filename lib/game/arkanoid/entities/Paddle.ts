import {
  PADDLE_W,
  PADDLE_H,
  PADDLE_Y,
  PADDLE_SPEED,
  CANVAS_WIDTH,
} from '../constants'

export class Paddle {
  x: number = 0
  y: number = PADDLE_Y
  w: number = PADDLE_W
  h: number = PADDLE_H

  constructor() {
    this.reset()
  }

  reset(): void {
    this.x = CANVAS_WIDTH / 2 - this.w / 2
    this.y = PADDLE_Y
  }

  update(dt: number, keys: Record<string, boolean>): void {
    if (keys['ArrowLeft']) {
      this.x -= PADDLE_SPEED * dt
    }
    if (keys['ArrowRight']) {
      this.x += PADDLE_SPEED * dt
    }

    // Clamp to canvas boundaries
    if (this.x < 0) this.x = 0
    if (this.x + this.w > CANVAS_WIDTH) this.x = CANVAS_WIDTH - this.w
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(this.x, this.y, this.w, this.h)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.strokeRect(this.x, this.y, this.w, this.h)
  }
}
