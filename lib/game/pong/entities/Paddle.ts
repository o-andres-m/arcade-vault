import { Paddle as PaddleType } from '../types';
import { CANVAS_HEIGHT, PADDLE_SPEED } from '../constants';

export class Paddle {
  state: PaddleType;

  constructor(x: number, y: number, w: number, h: number) {
    this.state = {
      x,
      y,
      w,
      h,
      speed: PADDLE_SPEED,
      vy: 0,
    };
  }

  move(direction: 'up' | 'down' | 'none', dt: number): void {
    if (direction === 'up') {
      this.state.vy = -this.state.speed;
    } else if (direction === 'down') {
      this.state.vy = this.state.speed;
    } else {
      this.state.vy = 0;
    }

    this.state.y += this.state.vy * dt;
    this.clamp();
  }

  moveTo(targetY: number, dt: number): void {
    const diff = targetY - this.state.y;
    if (Math.abs(diff) < 5) {
      this.state.vy = 0;
      return;
    }

    if (diff > 0) {
      this.move('down', dt);
    } else {
      this.move('up', dt);
    }
  }

  clamp(): void {
    if (this.state.y < 0) {
      this.state.y = 0;
    }
    if (this.state.y + this.state.h > CANVAS_HEIGHT) {
      this.state.y = CANVAS_HEIGHT - this.state.h;
    }
  }
}
