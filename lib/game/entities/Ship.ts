import { Ship as ShipType, InputState } from '../asteroids/types'
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
} from '../asteroids/constants'
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

  update(dt: number, keys: Record<string, boolean>, inputState?: InputState): void {
    if (this.dead) return
    if (this.invincible > 0) this.invincible -= dt
    if (this.shootCooldown > 0) this.shootCooldown -= dt
    if (this.tripleShot > 0) this.tripleShot -= dt

    // Joystick arcade mode (solo para móviles con joystick activo)
    if (inputState?.joystick?.angle !== null && inputState?.joystick?.angle !== undefined && inputState?.joystick?.distance > 0.2) {
      // Convertir ángulo del joystick (0-360 grados) a radianes
      // El joystick usa: 0° = derecha, 90° = abajo, 180° = izquierda, 270° = arriba
      // La nave usa radianes donde -PI/2 = arriba
      const joystickAngleRad = (inputState.joystick.angle * Math.PI / 180)

      // Apuntar directamente al ángulo del joystick
      this.angle = joystickAngleRad

      // Acelerar en la dirección del joystick (proporcional a la distancia)
      this.thrusting = true
      const thrustMultiplier = Math.min(inputState.joystick.distance, 1)
      this.vx += Math.cos(this.angle) * SHIP_ACCELERATION * dt * thrustMultiplier
      this.vy += Math.sin(this.angle) * SHIP_ACCELERATION * dt * thrustMultiplier
    } else {
      // Modo teclado tradicional
      if (keys['ArrowLeft']) this.angle -= SHIP_ROTATION_SPEED * dt
      if (keys['ArrowRight']) this.angle += SHIP_ROTATION_SPEED * dt

      this.thrusting = !!keys['ArrowUp']
      if (this.thrusting) {
        this.vx += Math.cos(this.angle) * SHIP_ACCELERATION * dt
        this.vy += Math.sin(this.angle) * SHIP_ACCELERATION * dt
      }
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

  draw(ctx: CanvasRenderingContext2D, colors?: { ship: string; thruster: string }): void {
    if (this.dead) return
    // Blinking during invincibility
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return

    const shipColor = colors?.ship || '#fff'
    const thrusterColor = colors?.thruster || 'rgba(255, 130, 0, 0.85)'

    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.angle)
    ctx.strokeStyle = shipColor
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
      ctx.strokeStyle = thrusterColor
      ctx.stroke()
    }

    ctx.restore()
  }
}
