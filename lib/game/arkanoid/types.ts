import type { Paddle } from './entities/Paddle'
import type { Ball } from './entities/Ball'
import type { Block } from './entities/Block'
import type { Explosion } from './entities/Explosion'

export type BlockColor =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'

export interface GameState {
  paddle: Paddle
  ball: Ball
  blocks: Block[]
  explosions: Explosion[]
  score: number
  lives: number
  currentLevel: number
  gameState: 'playing' | 'gameover' | 'win'
  isPaused: boolean
}
