import { Piece } from '../types';
import { COLS, ROWS } from '../constants';

export function collide(
  shape: number[][],
  x: number,
  y: number,
  board: number[][]
): boolean {
  for (let dy = 0; dy < shape.length; dy++) {
    for (let dx = 0; dx < shape[dy].length; dx++) {
      if (shape[dy][dx] !== 0) {
        const boardX = x + dx;
        const boardY = y + dy;

        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
          return true;
        }

        if (boardY >= 0 && board[boardY][boardX] !== 0) {
          return true;
        }
      }
    }
  }

  return false;
}

export function ghostY(piece: Piece, board: number[][]): number {
  let y = piece.y;

  while (!collide(piece.shape, piece.x, y + 1, board)) {
    y++;
  }

  return y;
}
