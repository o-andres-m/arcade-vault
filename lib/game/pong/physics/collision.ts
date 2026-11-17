import { Ball, Paddle } from '../types';
import { CANVAS_HEIGHT, MIN_BALL_ANGLE } from '../constants';

export function checkPaddleCollision(ball: Ball, paddle: Paddle): boolean {
  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;
  const ballTop = ball.y - ball.radius;
  const ballBottom = ball.y + ball.radius;

  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + paddle.w;
  const paddleTop = paddle.y;
  const paddleBottom = paddle.y + paddle.h;

  return (
    ballRight >= paddleLeft &&
    ballLeft <= paddleRight &&
    ballBottom >= paddleTop &&
    ballTop <= paddleBottom
  );
}

export function calculateBounceAngle(ball: Ball, paddle: Paddle): number {
  const paddleCenter = paddle.y + paddle.h / 2;
  const hitPosition = (ball.y - paddleCenter) / (paddle.h / 2);
  const maxAngle = ((90 - MIN_BALL_ANGLE) * Math.PI) / 180;
  const minAngle = (MIN_BALL_ANGLE * Math.PI) / 180;

  let angle = hitPosition * maxAngle;
  if (Math.abs(angle) < minAngle) {
    angle = angle >= 0 ? minAngle : -minAngle;
  }

  return angle;
}

export function checkWallCollision(ball: Ball): 'top' | 'bottom' | null {
  if (ball.y - ball.radius <= 0) {
    return 'top';
  }
  if (ball.y + ball.radius >= CANVAS_HEIGHT) {
    return 'bottom';
  }
  return null;
}

export function checkGoal(ball: Ball): 'left' | 'right' | null {
  if (ball.x + ball.radius < 0) {
    return 'left'; // Gol a la izquierda, punto para derecha
  }
  if (ball.x - ball.radius > 800) {
    // CANVAS_WIDTH
    return 'right'; // Gol a la derecha, punto para izquierda
  }
  return null;
}
