import { Piece } from '../types';
import { PIECES, COLS } from '../constants';

export function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 7) + 1;
  return createPiece(type);
}

export function createPiece(type: number): Piece {
  const shapeData = PIECES[type];
  if (!shapeData) throw new Error(`Invalid piece type: ${type}`);

  const shape = shapeData.map(row => [...row]);
  const x = Math.floor((COLS - shape[0].length) / 2);

  return {
    type,
    shape,
    x,
    y: 0,
  };
}
