import {
  BALL_W,
  BALL_H,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_Y,
} from '../constants'

export class Ball {
  x: number = 0
  y: number = 0
  w: number = BALL_W
  h: number = BALL_H
  vx: number = 0
  vy: number = 0

  reset(startX: number, startVx: number, startVy: number): void {
    this.x = startX
    this.y = PADDLE_Y - 20
    this.vx = startVx
    this.vy = startVy
  }

  update(dt: number): void {
    this.x += this.vx * dt
    this.y += this.vy * dt

    // Wall bounces (left/right)
    if (this.x < 0) {
      this.x = 0
      this.vx = Math.abs(this.vx)
    }
    if (this.x + this.w > CANVAS_WIDTH) {
      this.x = CANVAS_WIDTH - this.w
      this.vx = -Math.abs(this.vx)
    }

    // Top bounce
    if (this.y < 0) {
      this.y = 0
      this.vy = Math.abs(this.vy)
    }
  }

  isOutOfBounds(): boolean {
    return this.y > CANVAS_HEIGHT
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffff00'
    ctx.beginPath()
    ctx.arc(
      this.x + this.w / 2,
      this.y + this.h / 2,
      this.w / 2,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
}
