export interface Segment {
  x: number;
  y: number;
}

export interface GameState {
  snake: Segment[];
  direction: 'up' | 'down' | 'left' | 'right';
  nextDirection: 'up' | 'down' | 'left' | 'right';
  food: { x: number; y: number; type: string };
  score: number;
  lives: number;
  level: number;
  fruitCounter: number;
  state: 'playing' | 'paused' | 'dead' | 'gameover';
  moveTimer: number;
}

export interface GameInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  pause: boolean;
}
