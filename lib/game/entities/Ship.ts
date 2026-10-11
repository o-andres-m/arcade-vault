import { Ship as ShipType } from '../types'
import { wrap, random } from '../physics/utils'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SHIP_ROTATION_SPEED,
  SHIP_ACCELERATION,
  SHIP_FRICTION,
  SHIP_INVINCIBILITY_TIME,
  SHIP_RADIUS,
  SHIP_NOSE_LENGTH,
} from '../constants'
import { Bullet } from './Bullet'

export class Ship implements ShipType {
  x: number = 0
  y: number = 0
  angle: number = 0
  vx: number = 0
  vy: number = 0
  radius: number
  thrusting: boolean = false
  invincible: number = 0
  shootCooldown: number = 0
  tripleShot: number = 0
  dead: boolean = false

  constructor() {
    this.radius = SHIP_RADIUS
    this.reset()
  }

  reset(): void {
    this.x = CANVAS_WIDTH / 2
    this.y = CANVAS_HEIGHT / 2
    this.angle = -Math.PI / 2
    this.vx = 0
    this.vy = 0
    this.thrusting = false
    this.invincible = SHIP_INVINCIBILITY_TIME
    this.shootCooldown = 0
    this.tripleShot = 0
    this.dead = false
  }

  update(dt: number, keys: Record<string, boolean>): void {
    if (this.dead) return
    if (this.invincible > 0) this.invincible -= dt
    if (this.shootCooldown > 0) this.shootCooldown -= dt
    if (this.tripleShot > 0) this.tripleShot -= dt

    if (keys['ArrowLeft']) this.angle -= SHIP_ROTATION_SPEED * dt
    if (keys['ArrowRight']) this.angle += SHIP_ROTATION_SPEED * dt

    this.thrusting = !!keys['ArrowUp']
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * SHIP_ACCELERATION * dt
      this.vy += Math.sin(this.angle) * SHIP_ACCELERATION * dt
    }

    this.vx *= SHIP_FRICTION
    this.vy *= SHIP_FRICTION
    this.x = wrap(this.x + this.vx * dt, CANVAS_WIDTH)
    this.y = wrap(this.y + this.vy * dt, CANVAS_HEIGHT)
  }

  tryShoot(spreadAngle: number): Bullet[] {
    if (this.shootCooldown > 0 || this.dead) return []
    this.shootCooldown = 0.2

    const ox = this.x + Math.cos(this.angle) * SHIP_NOSE_LENGTH
    const oy = this.y + Math.sin(this.angle) * SHIP_NOSE_LENGTH

    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - spreadAngle),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + spreadAngle),
      ]
    }
    return [new Bullet(ox, oy, this.angle)]
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.dead) return
    // Blinking during invincibility
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return

    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'

    // Classic triangle with notch
    ctx.beginPath()
    ctx.moveTo(20, 0) // nose
    ctx.lineTo(-12, -9) // left wing
    ctx.lineTo(-7, 0) // rear notch
    ctx.lineTo(-12, 9) // right wing
    ctx.closePath()
    ctx.stroke()

    // Thruster flame
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath()
      ctx.moveTo(-8, -4)
      ctx.lineTo(-8 - random(6, 14), 0)
      ctx.lineTo(-8, 4)
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)'
      ctx.stroke()
    }

    ctx.restore()
  }
}
