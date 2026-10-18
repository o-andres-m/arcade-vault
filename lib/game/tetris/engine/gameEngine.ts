import { GameState, InputState, Piece, Theme, ColorPalette } from '../types';
import { createBoard, merge, clearLines } from '../entities/Board';
import { randomPiece } from '../entities/Piece';
import { collide } from '../physics/collision';
import { tryRotate } from '../physics/rotation';
import {
  INITIAL_DROP_INTERVAL,
  MIN_DROP_INTERVAL,
  SPEED_INCREASE_PER_LEVEL,
  LINE_SCORES,
  SOFT_DROP_BONUS,
  HARD_DROP_BONUS,
  DEFAULT_COLOR_PALETTE,
} from '../constants';

export function initializeGame(theme: Theme, colorPalette: ColorPalette = DEFAULT_COLOR_PALETTE): GameState {
  const board = createBoard();
  const next = randomPiece();
  const current = randomPiece();

  return {
    board,
    current,
    next,
    score: 0,
    lines: 0,
    level: 1,
    state: 'playing',
    dropAccum: 0,
    dropInterval: INITIAL_DROP_INTERVAL,
    lastTime: Date.now(),
    theme,
    colorPalette,
  };
}

export function updateGameState(
  state: GameState,
  dt: number,
  input: InputState
): GameState {
  if (state.state !== 'playing') {
    return state;
  }

  let newState = { ...state };

  if (input.moveLeft && newState.current) {
    const newX = newState.current.x - 1;
    if (!collide(newState.current.shape, newX, newState.current.y, newState.board)) {
      newState.current = { ...newState.current, x: newX };
    }
  }

  if (input.moveRight && newState.current) {
    const newX = newState.current.x + 1;
    if (!collide(newState.current.shape, newX, newState.current.y, newState.board)) {
      newState.current = { ...newState.current, x: newX };
    }
  }

  if (input.rotate && newState.current) {
    const rotated = tryRotate(newState.current, newState.board);
    if (rotated) {
      newState.current = rotated;
    }
  }

  let softDropBonus = 0;

  if (input.softDrop && newState.current) {
    const newY = newState.current.y + 1;
    if (!collide(newState.current.shape, newState.current.x, newY, newState.board)) {
      newState.current = { ...newState.current, y: newY };
      softDropBonus += SOFT_DROP_BONUS;
      newState.dropAccum = 0;
    } else {
      newState = lockPiece(newState);
    }
  } else if (input.hardDrop && newState.current) {
    let hardDropDistance = 0;
    let testY = newState.current.y;

    while (
      !collide(newState.current.shape, newState.current.x, testY + 1, newState.board)
    ) {
      testY++;
      hardDropDistance++;
    }

    newState.current = { ...newState.current, y: testY };
    softDropBonus += hardDropDistance * HARD_DROP_BONUS;
    newState = lockPiece(newState);
  } else {
    newState.dropAccum += dt;

    if (newState.dropAccum >= newState.dropInterval) {
      newState.dropAccum = 0;

      if (newState.current) {
        const newY = newState.current.y + 1;

        if (
          !collide(newState.current.shape, newState.current.x, newY, newState.board)
        ) {
          newState.current = { ...newState.current, y: newY };
        } else {
          newState = lockPiece(newState);
        }
      }
    }
  }

  if (softDropBonus > 0 && newState.state === 'playing') {
    newState.score += softDropBonus;
  }

  return newState;
}

function lockPiece(state: GameState): GameState {
  if (!state.current) return state;

  const newBoard = state.board.map(row => [...row]);
  merge(newBoard, state.current);

  const linesCleared = clearLines(newBoard);
  const scoreGain =
    linesCleared > 0 ? LINE_SCORES[Math.min(linesCleared, 4)] * state.level : 0;

  const newLines = state.lines + linesCleared;
  const newLevel = updateLevel(newLines);
  const newDropInterval = updateDropInterval(newLevel);

  const newCurrent = state.next;
  const newNext = randomPiece();

  if (collide(newCurrent.shape, newCurrent.x, newCurrent.y, newBoard)) {
    return {
      ...state,
      board: newBoard,
      score: state.score + scoreGain,
      lines: newLines,
      level: newLevel,
      dropInterval: newDropInterval,
      state: 'gameover',
      current: null,
      next: newNext,
    };
  }

  return {
    ...state,
    board: newBoard,
    current: newCurrent,
    next: newNext,
    score: state.score + scoreGain,
    lines: newLines,
    level: newLevel,
    dropInterval: newDropInterval,
    dropAccum: 0,
  };
}

export function updateLevel(lines: number): number {
  return Math.floor(lines / 10) + 1;
}

export function updateDropInterval(level: number): number {
  return Math.max(MIN_DROP_INTERVAL, INITIAL_DROP_INTERVAL - (level - 1) * SPEED_INCREASE_PER_LEVEL);
}
