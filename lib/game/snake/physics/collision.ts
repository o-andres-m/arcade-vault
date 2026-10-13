import { Segment } from '../types';

export function detectFoodCollision(head: Segment, foodPos: { x: number; y: number }): boolean {
  return head.x === foodPos.x && head.y === foodPos.y;
}

export function detectSelfCollision(segments: Segment[]): boolean {
  const head = segments[0];
  for (let i = 4; i < segments.length; i++) {
    if (segments[i].x === head.x && segments[i].y === head.y) {
      return true;
    }
  }
  return false;
}
