export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;

export const CANVAS_WIDTH = COLS * BLOCK;
export const CANVAS_HEIGHT = ROWS * BLOCK;
export const NEXT_CANVAS_SIZE = 120;

export const COLOR_PALETTES = {
  neon: [null, '#39ff14', '#ffff00', '#ff006e', '#00ffff', '#ff0000', '#0080ff', '#ff7700'],
  pastel: [null, '#a8e6cf', '#ffd3b6', '#ffaaa5', '#dda0dd', '#f0a8d8', '#b4d8ff', '#ffe4b5'],
  retro: [null, '#00ffff', '#ffff00', '#ff00ff', '#00ff00', '#ff0000', '#0000ff', '#ff8800'],
} as const;

export const PIECES = [
  null,
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  [[2, 2], [2, 2]],
  [[0, 3, 0], [3, 3, 3], [0, 0, 0]],
  [[0, 4, 4], [4, 4, 0], [0, 0, 0]],
  [[5, 5, 0], [0, 5, 5], [0, 0, 0]],
  [[6, 0, 0], [6, 6, 6], [0, 0, 0]],
  [[0, 0, 7], [7, 7, 7], [0, 0, 0]],
];

export const LINE_SCORES = [0, 100, 300, 500, 800];
export const SOFT_DROP_BONUS = 1;
export const HARD_DROP_BONUS = 2;

export const INITIAL_DROP_INTERVAL = 1000;
export const MIN_DROP_INTERVAL = 100;
export const SPEED_INCREASE_PER_LEVEL = 90;

export const WALL_KICKS = [0, -1, 1, -2, 2];

export const DEFAULT_THEME = 'dark' as const;
export const DEFAULT_COLOR_PALETTE = 'retro' as const;
