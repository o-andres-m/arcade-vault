import { Segment } from '../types';
import { GRID_COLS, GRID_ROWS } from '../constants';

export class Snake {
  private segments: Segment[];

  constructor() {
    const startX = Math.floor(GRID_COLS / 2);
    const startY = Math.floor(GRID_ROWS / 2);
    this.segments = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
  }

  getSegments(): Segment[] {
    return this.segments;
  }

  move(dx: number, dy: number) {
    const head = this.segments[0];
    const newHead = {
      x: (head.x + dx + GRID_COLS) % GRID_COLS,
      y: (head.y + dy + GRID_ROWS) % GRID_ROWS,
    };
    this.segments.unshift(newHead);
    this.segments.pop();
  }

  grow() {
    const tail = this.segments[this.segments.length - 1];
    this.segments.push({ ...tail });
  }

  checkSelfCollision(): boolean {
    const head = this.segments[0];
    for (let i = 4; i < this.segments.length; i++) {
      if (this.segments[i].x === head.x && this.segments[i].y === head.y) {
        return true;
      }
    }
    return false;
  }

  reset() {
    const startX = Math.floor(GRID_COLS / 2);
    const startY = Math.floor(GRID_ROWS / 2);
    this.segments = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
  }
}
