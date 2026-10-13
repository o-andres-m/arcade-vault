import { Segment } from '../types';
import { GRID_COLS, GRID_ROWS, FRUIT_TYPES } from '../constants';

export class Food {
  static generate(snake: Segment[]): { x: number; y: number; type: string } {
    let x: number = 0;
    let y: number = 0;
    let valid = false;

    while (!valid) {
      x = Math.floor(Math.random() * GRID_COLS);
      y = Math.floor(Math.random() * GRID_ROWS);
      valid = !snake.some((seg) => seg.x === x && seg.y === y);
    }

    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    return { x, y, type };
  }
}
