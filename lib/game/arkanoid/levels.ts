import { Block } from './entities/Block'
import { BlockColor } from './types'
import {
  BLOCK_COLS,
  BLOCK_ROWS,
  BLOCK_W,
  BLOCK_H,
  BLOCK_PADDING,
  CANVAS_WIDTH,
  LEVEL_SPEED_MULTIPLIERS,
} from './constants'

const BLOCK_COLORS: BlockColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
]

export function createLevel(levelNumber: number): Block[] {
  const blocks: Block[] = []

  // Calculate starting position to center the grid
  const totalWidth = BLOCK_COLS * BLOCK_W + (BLOCK_COLS - 1) * BLOCK_PADDING
  const startX = (CANVAS_WIDTH - totalWidth) / 2
  const startY = 40

  for (let row = 0; row < BLOCK_ROWS; row++) {
    const colorIndex = row % BLOCK_COLORS.length
    const color = BLOCK_COLORS[colorIndex]

    for (let col = 0; col < BLOCK_COLS; col++) {
      const x = startX + col * (BLOCK_W + BLOCK_PADDING)
      const y = startY + row * (BLOCK_H + BLOCK_PADDING)

      blocks.push(new Block(x, y, color))
    }
  }

  return blocks
}

export function getLevelSpeedMultiplier(levelNumber: number): number {
  const index = Math.min(levelNumber - 1, LEVEL_SPEED_MULTIPLIERS.length - 1)
  return LEVEL_SPEED_MULTIPLIERS[index]
}
