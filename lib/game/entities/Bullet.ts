import { Bullet as BulletType } from '../types'
import { wrap } from '../physics/utils'
import { CANVAS_WIDTH, CANVAS_HEIGHT, BULLET_SPEED, BULLET_TTL, BULLET_RADIUS } from '../constants'

export class Bullet implements BulletType {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  ttl: number
  dead: boolean

  constructor(x: number, y: number, angle: number) {
    this.x = x
    this.y = y
    this.vx = Math.cos(angle) * BULLET_SPEED
    this.vy = Math.sin(angle) * BULLET_SPEED
    this.ttl = BULLET_TTL
    this.radius = BULLET_RADIUS
    this.dead = false
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, CANVAS_WIDTH)
    this.y = wrap(this.y + this.vy * dt, CANVAS_HEIGHT)
    this.ttl -= dt
    if (this.ttl <= 0) this.dead = true
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}
