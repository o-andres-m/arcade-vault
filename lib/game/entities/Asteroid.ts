import { Asteroid as AsteroidType, AsteroidSize } from '../asteroids/types'
import { wrap, random, randomInt } from '../physics/utils'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ASTEROID_RADII,
  ASTEROID_BASE_SPEEDS,
  ASTEROID_SPEED_VARIATION,
  ASTEROID_VERTEX_MIN,
  ASTEROID_VERTEX_MAX,
  ASTEROID_VERTEX_RADIUS_VARIATION,
} from '../asteroids/constants'

export class Asteroid implements AsteroidType {
  x: number
  y: number
  size: AsteroidSize
  radius: number
  vx: number
  vy: number
  rot: number
  rotSpeed: number
  verts: [number, number][]
  dead: boolean

  constructor(x: number, y: number, size: AsteroidSize = 3) {
    this.x = x
    this.y = y
    this.size = size
    this.radius = ASTEROID_RADII[size]
    this.dead = false

    const angle = random(0, Math.PI * 2)
    const baseSpeed = ASTEROID_BASE_SPEEDS[size]
    const speed = baseSpeed + random(-ASTEROID_SPEED_VARIATION, ASTEROID_SPEED_VARIATION)
    this.vx = Math.cos(angle) * speed
    this.vy = Math.sin(angle) * speed
    this.rotSpeed = random(-1.2, 1.2)
    this.rot = random(0, Math.PI * 2)

    // Generate irregular polygon
    const n = randomInt(ASTEROID_VERTEX_MIN, ASTEROID_VERTEX_MAX)
    this.verts = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      const r = this.radius * random(ASTEROID_VERTEX_RADIUS_VARIATION, 1.0)
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r])
    }
  }

  update(dt: number): void {
    this.x = wrap(this.x + this.vx * dt, CANVAS_WIDTH)
    this.y = wrap(this.y + this.vy * dt, CANVAS_HEIGHT)
    this.rot += this.rotSpeed * dt
  }

  split(): Asteroid[] {
    if (this.size <= 1) return []
    const newSize = (this.size - 1) as AsteroidSize
    return [
      new Asteroid(this.x, this.y, newSize),
      new Asteroid(this.x, this.y, newSize),
    ]
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate(this.rot)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(this.verts[0][0], this.verts[0][1])
    for (let i = 1; i < this.verts.length; i++) {
      ctx.lineTo(this.verts[i][0], this.verts[i][1])
    }
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
}
