import type { BlockColor } from '../types'
import { EXPLOSION_LIFETIME } from '../constants'

const BLOCK_COLORS: Record<BlockColor, string> = {
  red: '#ff0000',
  orange: '#ff7f00',
  yellow: '#ffff00',
  green: '#00ff00',
  blue: '#0000ff',
  purple: '#7f00ff',
}

export class Explosion {
  x: number
  y: number
  w: number
  h: number
  color: BlockColor
  elapsed: number = 0

  constructor(x: number, y: number, w: number, h: number, color: BlockColor) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.color = color
  }

  update(dt: number): void {
    this.elapsed += dt
  }

  isAlive(): boolean {
    return this.elapsed < EXPLOSION_LIFETIME
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.isAlive()) return

    const progress = this.elapsed / EXPLOSION_LIFETIME
    const alpha = 1 - progress
    const scale = 1 + progress * 0.3

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2)
    ctx.scale(scale, scale)
    ctx.translate(-(this.x + this.w / 2), -(this.y + this.h / 2))

    ctx.fillStyle = BLOCK_COLORS[this.color]
    ctx.fillRect(this.x, this.y, this.w, this.h)

    ctx.restore()
  }
}
