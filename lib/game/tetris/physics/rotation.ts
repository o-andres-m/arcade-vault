import { Piece } from '../types';
import { WALL_KICKS } from '../constants';
import { collide } from './collision';

function rotateCW(shape: number[][]): number[][] {
  const n = shape.length;
  const rotated = Array(shape[0].length)
    .fill(null)
    .map(() => Array(n).fill(0));

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      rotated[shape[y].length - 1 - x][y] = shape[y][x];
    }
  }

  return rotated;
}

export function tryRotate(
  piece: Piece,
  board: number[][]
): Piece | null {
  const newShape = rotateCW(piece.shape);

  for (const offset of WALL_KICKS) {
    const newX = piece.x + offset;

    if (!collide(newShape, newX, piece.y, board)) {
      return {
        ...piece,
        shape: newShape,
        x: newX,
      };
    }
  }

  return null;
}
