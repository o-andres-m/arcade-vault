import type { BlockColor } from '../types'
import { BLOCK_W, BLOCK_H } from '../constants'

const BLOCK_COLORS: Record<BlockColor, string> = {
  red: '#ff0000',
  orange: '#ff7f00',
  yellow: '#ffff00',
  green: '#00ff00',
  blue: '#0000ff',
  purple: '#7f00ff',
}

export class Block {
  x: number
  y: number
  w: number = BLOCK_W
  h: number = BLOCK_H
  color: BlockColor
  alive: boolean = true

  constructor(x: number, y: number, color: BlockColor) {
    this.x = x
    this.y = y
    this.color = color
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return

    ctx.fillStyle = BLOCK_COLORS[this.color]
    ctx.fillRect(this.x, this.y, this.w, this.h)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(this.x, this.y, this.w, this.h)
  }
}
