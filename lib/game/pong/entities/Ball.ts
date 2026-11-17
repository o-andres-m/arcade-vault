import { Ball as BallType } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BALL_RADIUS,
  BALL_SPEED_INITIAL,
  BALL_SPEED_INCREMENT,
  BALL_SPEED_MAX,
  MIN_BALL_ANGLE,
} from '../constants';

export class Ball {
  state: BallType;

  constructor() {
    this.state = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      radius: BALL_RADIUS,
      vx: 0,
      vy: 0,
      speed: BALL_SPEED_INITIAL,
      speedIncrement: BALL_SPEED_INCREMENT,
    };
  }

  move(dt: number): void {
    this.state.x += this.state.vx * dt;
    this.state.y += this.state.vy * dt;
  }

  reset(servingSide: 'left' | 'right'): void {
    this.state.x = CANVAS_WIDTH / 2;
    this.state.y = CANVAS_HEIGHT / 2;
    this.state.speed = BALL_SPEED_INITIAL;

    const angle = this.randomAngle();
    const direction = servingSide === 'left' ? 1 : -1;

    this.state.vx = direction * this.state.speed * Math.cos(angle);
    this.state.vy = this.state.speed * Math.sin(angle);
  }

  serve(servingSide: 'left' | 'right'): void {
    this.reset(servingSide);
  }

  accelerate(): void {
    if (this.state.speed < BALL_SPEED_MAX) {
      this.state.speed += this.state.speedIncrement;
      const angle = Math.atan2(this.state.vy, this.state.vx);
      this.state.vx = this.state.speed * Math.cos(angle);
      this.state.vy = this.state.speed * Math.sin(angle);
    }
  }

  reverseX(): void {
    this.state.vx = -this.state.vx;
  }

  reverseY(): void {
    this.state.vy = -this.state.vy;
  }

  setVelocityFromAngle(angle: number): void {
    const direction = Math.sign(this.state.vx);
    this.state.vx = direction * this.state.speed * Math.cos(angle);
    this.state.vy = this.state.speed * Math.sin(angle);
  }

  private randomAngle(): number {
    const minAngleRad = (MIN_BALL_ANGLE * Math.PI) / 180;
    const maxAngleRad = ((90 - MIN_BALL_ANGLE) * Math.PI) / 180;
    const angle = minAngleRad + Math.random() * (maxAngleRad - minAngleRad);
    return Math.random() < 0.5 ? angle : -angle;
  }
}
