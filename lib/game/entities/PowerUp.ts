import { PowerUp as PowerUpType } from '../asteroids/types'
import { wrap, random } from '../physics/utils'
import { CANVAS_WIDTH, CANVAS_HEIGHT, POWERUP_TTL, POWERUP_RADIUS } from '../asteroids/constants'

export class PowerUp implements PowerUpType {
  x: number
  y: number
  radius: number
  vx: number
  vy: number
  ttl: number
  dead: boolean

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    const angle = random(0, Math.PI * 2)
    const speed = random(20, 40)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.radius = POWERUP_RADIUS
    this.ttl = POWERUP_TTL
    this.dead = false
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, CANVAS_WIDTH)
    this.y = wrap(this.y + this.vy * dt, CANVAS_HEIGHT)
    this.ttl -= dt
    if (this.ttl <= 0) this.dead = true
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Blink effect in last 2 seconds
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return

    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(Math.PI / 4)
    ctx.strokeStyle = '#0ff'
    ctx.lineWidth = 2
    const r = this.radius * pulse
    ctx.strokeRect(-r, -r, r * 2, r * 2)
    ctx.restore()

    ctx.fillStyle = '#0ff'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('3x', this.x, this.y)
  }
}
