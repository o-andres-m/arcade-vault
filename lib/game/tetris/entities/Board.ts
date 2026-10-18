import { Piece } from '../types';
import { COLS, ROWS } from '../constants';

export function createBoard(): number[][] {
  return Array(ROWS)
    .fill(null)
    .map(() => Array(COLS).fill(0));
}

export function merge(board: number[][], piece: Piece): void {
  piece.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if (val !== 0) {
        const boardY = piece.y + dy;
        const boardX = piece.x + dx;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          board[boardY][boardX] = val;
        }
      }
    });
  });
}

export function clearLines(board: number[][]): number {
  let cleared = 0;

  for (let r = board.length - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(Array(COLS).fill(0));
      cleared++;
    }
  }

  return cleared;
}
