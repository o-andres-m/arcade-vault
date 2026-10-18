// Canvas
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

// Paddle
export const PADDLE_W = 80
export const PADDLE_H = 12
export const PADDLE_Y = CANVAS_HEIGHT - 30
export const PADDLE_SPEED = 400

// Ball
export const BALL_W = 8
export const BALL_H = 8
export const BASE_BALL_VX = 200
export const BASE_BALL_VY = -300

// Blocks
export const BLOCK_W = 64
export const BLOCK_H = 24
export const BLOCK_ROWS = 6
export const BLOCK_COLS = 10
export const BLOCK_PADDING = 4

// Game
export const INITIAL_LIVES = 3
export const TOTAL_LEVELS = 5
export const POINTS_PER_BLOCK = 10

// Explosion
export const EXPLOSION_LIFETIME = 0.3

// Level speed multipliers
export const LEVEL_SPEED_MULTIPLIERS = [1, 1.15, 1.3, 1.45, 1.6]

// Color Palettes para el sistema de skins
export const COLOR_PALETTES = {
  neon: {
    paddle: '#39ff14',         // Verde neón
    ball: '#ff006e',           // Rosa neón
    brick1: '#00ffff',         // Cyan neón
    brick2: '#ffff00',         // Amarillo neón
    brick3: '#ff00ff',         // Magenta neón
    brick4: '#ff0080',         // Rosa fuerte
    brick5: '#00ff80',         // Verde agua neón
    brick6: '#ff6600',         // Naranja neón
    border: '#39ff14',         // Verde neón
    hudText: '#39ff14',        // Verde neón
  },
  pastel: {
    paddle: '#a8e6cf',         // Verde menta pastel
    ball: '#ffd3b6',           // Durazno pastel
    brick1: '#ffaaa5',         // Rosa coral pastel
    brick2: '#ffd700',         // Dorado suave
    brick3: '#dda0dd',         // Ciruela pastel
    brick4: '#f0a8d8',         // Rosa claro
    brick5: '#b4d8ff',         // Azul cielo pastel
    brick6: '#ffe4b5',         // Vainilla pastel
    border: '#a8e6cf',         // Verde menta pastel
    hudText: '#ffffff',        // Blanco
  },
  retro: {
    paddle: '#00ff00',         // Verde clásico
    ball: '#ffff00',           // Amarillo clásico
    brick1: '#ff0000',         // Rojo
    brick2: '#ff7f00',         // Naranja
    brick3: '#ffff00',         // Amarillo
    brick4: '#00ff00',         // Verde
    brick5: '#0000ff',         // Azul
    brick6: '#7f00ff',         // Púrpura
    border: '#ffffff',         // Blanco
    hudText: '#ffffff',        // Blanco
  },
} as const

export type ColorPalette = 'neon' | 'pastel' | 'retro'
export const DEFAULT_COLOR_PALETTE: ColorPalette = 'retro'
