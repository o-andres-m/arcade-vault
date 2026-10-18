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

// Mapeo de colores de bloques a propiedades de la paleta
const COLOR_TO_PALETTE_KEY: Record<BlockColor, keyof { brick1: string; brick2: string; brick3: string; brick4: string; brick5: string; brick6: string }> = {
  red: 'brick1',
  orange: 'brick2',
  yellow: 'brick3',
  green: 'brick4',
  blue: 'brick5',
  purple: 'brick6',
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

  draw(ctx: CanvasRenderingContext2D, colors?: { brick1: string; brick2: string; brick3: string; brick4: string; brick5: string; brick6: string }): void {
    if (!this.alive) return

    const paletteKey = COLOR_TO_PALETTE_KEY[this.color]
    const brickColor = colors ? colors[paletteKey] : BLOCK_COLORS[this.color]

    ctx.fillStyle = brickColor
    ctx.fillRect(this.x, this.y, this.w, this.h)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.strokeRect(this.x, this.y, this.w, this.h)
  }
}
