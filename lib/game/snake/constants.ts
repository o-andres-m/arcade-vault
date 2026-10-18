export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const GRID_COLS = 20;
export const GRID_ROWS = 15;
export const BLOCK_SIZE = 40;

export const MOVE_SPEED_BASE = 10;
export const MOVE_SPEED_INCREMENT = 1.5;

export const FRUIT_POINTS_NORMAL = 10;
export const FRUIT_POINTS_RARE = 50;
export const FRUITS_PER_LEVEL = 30;

export const RARE_FRUITS = ['pineapple', 'melon', 'kiwi', 'watermelon'];
export const FRUIT_TYPES = [
  'apple',
  'banana',
  'orange',
  'grape',
  'garlic',
  'eggplant',
  'strawberry',
  'cherry',
  'carrot',
  'mushroom',
  'broccoli',
  'watermelon',
  'pepper',
  'kiwi',
  'lemon',
  'peach',
  'peanut',
  'tomato',
  'berries',
  'grapes2',
  'pineapple',
  'melon',
];

export const INITIAL_LIVES = 5;

// Color Palettes para el sistema de skins
export const COLOR_PALETTES = {
  neon: {
    background: '#0a0a0a',     // Negro profundo
    grid: '#ff006e',           // Rosa neón (para la cuadrícula)
    snakeHead: '#39ff14',      // Verde neón brillante
    snakeHeadStroke: '#00ff00', // Verde neón más oscuro
    snakeBody: '#7fff00',      // Verde chartreuse neón
    food: '#ff00ff',           // Magenta neón
    hudText: '#00ffff',        // Cyan neón
    pausedOverlay: '#ff006e',  // Rosa neón
  },
  pastel: {
    background: '#1a1a1a',     // Gris muy oscuro
    grid: '#ffd3b6',           // Durazno pastel
    snakeHead: '#a8e6cf',      // Verde menta pastel
    snakeHeadStroke: '#7ec4a6', // Verde menta más oscuro
    snakeBody: '#c7f5d9',      // Verde menta muy claro
    food: '#ffaaa5',           // Rosa coral pastel
    hudText: '#ffffff',        // Blanco
    pausedOverlay: '#ffd3b6',  // Durazno pastel
  },
  retro: {
    background: '#1a1a1a',     // Gris muy oscuro
    grid: 'rgba(100, 100, 100, 0.2)', // Gris transparente
    snakeHead: '#00ff00',      // Verde clásico
    snakeHeadStroke: '#00aa00', // Verde oscuro clásico
    snakeBody: '#00cc00',      // Verde medio clásico
    food: '#ffaa00',           // Naranja clásico
    hudText: '#ffffff',        // Blanco
    pausedOverlay: '#ffff00',  // Amarillo clásico
  },
} as const

export type ColorPalette = 'neon' | 'pastel' | 'retro'
export const DEFAULT_COLOR_PALETTE: ColorPalette = 'retro'
