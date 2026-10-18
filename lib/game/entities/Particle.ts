import { Particle as ParticleType } from '../asteroids/types'
import { random } from '../physics/utils'
import { PARTICLE_MIN_SPEED, PARTICLE_MAX_SPEED } from '../asteroids/constants'

export class Particle implements ParticleType {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  ttl: number
  dead: boolean

  constructor(x: number, y: number) {
    this.x = x
    this.y = y
    const angle = random(0, Math.PI * 2)
    const speed = random(PARTICLE_MIN_SPEED, PARTICLE_MAX_SPEED)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.life = random(0.4, 1.1)
    this.ttl = this.life
    this.dead = false
  }

  update(dt: number): void {
    this.x += this.vx * dt
    this.y += this.vy * dt
    this.ttl -= dt
    if (this.ttl <= 0) this.dead = true
  }

  draw(ctx: CanvasRenderingContext2D, colors?: { particle: string }): void {
    const alpha = this.ttl / this.life
    const particleColor = colors?.particle || '#ffffff'

    // Convert hex to rgba
    const hex = particleColor.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)

    ctx.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(this.x, this.y)
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05)
    ctx.stroke()
  }
}
