export type Theme = 'dark' | 'light';
export type GameStatus = 'playing' | 'paused' | 'gameover';
export type ColorPalette = 'neon' | 'pastel' | 'retro';

export interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

export interface GameState {
  board: number[][];
  current: Piece | null;
  next: Piece;
  score: number;
  lines: number;
  level: number;
  state: GameStatus;
  dropAccum: number;
  dropInterval: number;
  lastTime: number;
  theme: Theme;
  colorPalette: ColorPalette;
}

export interface InputState {
  moveLeft: boolean;
  moveRight: boolean;
  softDrop: boolean;
  hardDrop: boolean;
  rotate: boolean;
}
