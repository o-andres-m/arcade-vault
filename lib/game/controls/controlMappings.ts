export interface GameControlMapping {
  gameId: string
  directional: {
    up?: string
    down?: string
    left?: string
    right?: string
  }
  buttons: {
    a?: { label: string; action: string; keyCode: string }
    b?: { label: string; action: string; keyCode: string }
    x?: { label: string; action: string; keyCode: string }
    y?: { label: string; action: string; keyCode: string }
  }
}

export const GAME_CONTROLS: Record<string, GameControlMapping> = {
  snake: {
    gameId: 'snake',
    directional: {
      up: 'Arriba',
      down: 'Abajo',
      left: 'Izquierda',
      right: 'Derecha'
    },
    buttons: {}
  },

  tetris: {
    gameId: 'tetris',
    directional: {
      left: 'Mover izq',
      right: 'Mover der',
      down: 'Soft drop'
    },
    buttons: {
      a: { label: '↻', action: 'Rotar', keyCode: 'ArrowUp' }
    }
  },

  rocas: {
    gameId: 'rocas',
    directional: {
      up: 'Acelerar',
      left: 'Rotar izq',
      right: 'Rotar der'
    },
    buttons: {
      a: { label: 'A', action: 'Disparar', keyCode: 'Space' },
      b: { label: 'B', action: 'Hiperespacio', keyCode: 'KeyH' }
    }
  },

  arkanoid: {
    gameId: 'arkanoid',
    directional: {
      left: 'Mover izq',
      right: 'Mover der'
    },
    buttons: {}
  }
}

export function getGameControls(gameId: string): GameControlMapping | null {
  return GAME_CONTROLS[gameId] || null
}
