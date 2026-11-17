import type { ColorPalette } from './constants';

export type GameMode = 'select' | '1player' | '2player' | 'playing' | 'gameover';
export type ServingSide = 'left' | 'right';
export type { ColorPalette };

export interface Paddle {
  x: number;
  y: number;
  w: number; // width
  h: number; // height
  speed: number;
  vy: number; // velocidad vertical actual
}

export interface Ball {
  x: number;
  y: number;
  radius: number;
  vx: number; // velocidad X
  vy: number; // velocidad Y
  speed: number; // magnitud de velocidad
  speedIncrement: number; // cuánto sube por rebote
}

export interface GameState {
  // Modo de juego
  mode: GameMode;

  // Entidades
  leftPaddle: Paddle;
  rightPaddle: Paddle;
  ball: Ball;

  // Progreso
  leftScore: number; // Puntos jugador izquierda
  rightScore: number; // Puntos jugador derecha
  leftLives: number; // Vidas jugador izquierda
  rightLives: number; // Vidas jugador derecha

  // Estado
  isPaused: boolean;
  isServing: boolean; // True cuando se resetea después de punto
  servingSide: ServingSide; // Quién sirve
  serveTimer: number; // Countdown antes de lanzar pelota

  // CPU (solo modo 1 jugador)
  cpuReactionDelay: number; // Para hacer CPU menos perfecta
  cpuTarget: number; // Y target que CPU intenta alcanzar

  // Visual
  colorPalette: ColorPalette;
}

export interface InputState {
  up1: boolean; // A key
  down1: boolean; // Q key
  up2: boolean; // Arrow Up
  down2: boolean; // Arrow Down
}
