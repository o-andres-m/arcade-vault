import { GameState } from '../types';
import { CPU_REACTION_DELAY, CPU_ERROR_MARGIN } from '../constants';

let reactionTimer = 0;

export function updateCPU(state: GameState, dt: number): void {
  if (state.mode !== '1player' || !state.rightPaddle) return;

  reactionTimer += dt;

  if (reactionTimer >= CPU_REACTION_DELAY) {
    reactionTimer = 0;
    const error = (Math.random() - 0.5) * CPU_ERROR_MARGIN * 2;
    state.cpuTarget = state.ball.y + error;
  }

  const paddleCenter = state.rightPaddle.y + state.rightPaddle.h / 2;
  const diff = state.cpuTarget - paddleCenter;

  if (Math.abs(diff) < 5) {
    state.rightPaddle.vy = 0;
    return;
  }

  if (diff > 0) {
    state.rightPaddle.vy = state.rightPaddle.speed;
  } else {
    state.rightPaddle.vy = -state.rightPaddle.speed;
  }

  state.rightPaddle.y += state.rightPaddle.vy * dt;

  if (state.rightPaddle.y < 0) {
    state.rightPaddle.y = 0;
  }
  if (state.rightPaddle.y + state.rightPaddle.h > 600) {
    state.rightPaddle.y = 600 - state.rightPaddle.h;
  }
}
