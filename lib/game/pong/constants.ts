// Canvas
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// Paddle
export const PADDLE_WIDTH = 12;
export const PADDLE_HEIGHT = 80;
export const PADDLE_SPEED = 400; // px/s
export const PADDLE_OFFSET = 40; // distancia desde borde

// Ball
export const BALL_RADIUS = 6;
export const BALL_SPEED_INITIAL = 300; // px/s
export const BALL_SPEED_INCREMENT = 20; // sube por rebote
export const BALL_SPEED_MAX = 600;

// Juego
export const LIVES_INITIAL = 3;
export const POINTS_PER_GOAL = 10;
export const SERVE_DELAY = 2; // segundos antes de servir

// CPU
export const CPU_REACTION_DELAY = 0.1; // segundos de delay
export const CPU_ERROR_MARGIN = 20; // px de margen de error

// Ángulo mínimo para evitar pelota horizontal
export const MIN_BALL_ANGLE = 15; // grados

// Color Palettes
export const COLOR_PALETTES = {
  neon: {
    leftPaddle: '#00ff88',
    rightPaddle: '#ff0088',
    ball: '#00ffff',
    centerLine: '#0066ff',
    background: '#0a0a0a',
    text: '#ffffff',
  },
  pastel: {
    leftPaddle: '#a8e6cf',
    rightPaddle: '#ffaaa5',
    ball: '#ffffba',
    centerLine: '#dcedc1',
    background: '#1a1a1a',
    text: '#ffffff',
  },
  retro: {
    leftPaddle: '#00ff00',
    rightPaddle: '#ff0000',
    ball: '#ffffff',
    centerLine: '#666666',
    background: '#000000',
    text: '#ffffff',
  },
} as const;

export type ColorPalette = keyof typeof COLOR_PALETTES;
export type PaletteColors = {
  leftPaddle: string;
  rightPaddle: string;
  ball: string;
  centerLine: string;
  background: string;
  text: string;
};
