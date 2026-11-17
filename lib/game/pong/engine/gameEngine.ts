import { GameState, InputState, Paddle, Ball, ColorPalette } from '../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_OFFSET,
  PADDLE_SPEED,
  BALL_RADIUS,
  BALL_SPEED_INITIAL,
  BALL_SPEED_INCREMENT,
  LIVES_INITIAL,
  POINTS_PER_GOAL,
  SERVE_DELAY,
  CPU_REACTION_DELAY,
} from '../constants';
import {
  checkPaddleCollision,
  calculateBounceAngle,
  checkWallCollision,
  checkGoal,
} from '../physics/collision';
import { updateCPU } from '../ai/cpuController';

export function initializeGame(mode: '1player' | '2player', colorPalette: ColorPalette = 'neon'): GameState {
  const leftPaddle: Paddle = {
    x: PADDLE_OFFSET,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
    speed: PADDLE_SPEED,
    vy: 0,
  };

  const rightPaddle: Paddle = {
    x: CANVAS_WIDTH - PADDLE_OFFSET - PADDLE_WIDTH,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    w: PADDLE_WIDTH,
    h: PADDLE_HEIGHT,
    speed: PADDLE_SPEED,
    vy: 0,
  };

  const ball: Ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    radius: BALL_RADIUS,
    vx: 0,
    vy: 0,
    speed: BALL_SPEED_INITIAL,
    speedIncrement: BALL_SPEED_INCREMENT,
  };

  return {
    mode, // Bug 3: Usar el parámetro mode en lugar de 'playing'
    leftPaddle,
    rightPaddle,
    ball,
    leftScore: 0,
    rightScore: 0,
    leftLives: LIVES_INITIAL,
    rightLives: LIVES_INITIAL,
    isPaused: false,
    isServing: true,
    servingSide: 'left',
    serveTimer: SERVE_DELAY,
    cpuReactionDelay: CPU_REACTION_DELAY,
    cpuTarget: CANVAS_HEIGHT / 2,
    colorPalette,
  };
}

export function updateGameState(
  state: GameState,
  dt: number,
  input: InputState
): GameState {
  if (state.isPaused || state.mode === 'gameover' || state.mode === 'select') {
    return state;
  }

  const nextState = { ...state };

  if (nextState.isServing) {
    nextState.serveTimer -= dt;
    if (nextState.serveTimer <= 0) {
      serveBall(nextState);
      nextState.isServing = false;
    }
    return nextState;
  }

  updatePaddles(nextState, input, dt);

  if (nextState.mode === '1player') {
    updateCPU(nextState, dt);
  }

  updateBall(nextState, dt);

  handleCollisions(nextState);

  const goal = checkGoal(nextState.ball);
  if (goal) {
    handleGoal(nextState, goal);
  }

  return nextState;
}

function updatePaddles(state: GameState, input: InputState, dt: number): void {
  if (input.up1) {
    state.leftPaddle.vy = -state.leftPaddle.speed;
  } else if (input.down1) {
    state.leftPaddle.vy = state.leftPaddle.speed;
  } else {
    state.leftPaddle.vy = 0;
  }

  state.leftPaddle.y += state.leftPaddle.vy * dt;
  clampPaddle(state.leftPaddle);

  if (state.mode === '2player') {
    if (input.up2) {
      state.rightPaddle.vy = -state.rightPaddle.speed;
    } else if (input.down2) {
      state.rightPaddle.vy = state.rightPaddle.speed;
    } else {
      state.rightPaddle.vy = 0;
    }

    state.rightPaddle.y += state.rightPaddle.vy * dt;
    clampPaddle(state.rightPaddle);
  }
}

function clampPaddle(paddle: Paddle): void {
  if (paddle.y < 0) {
    paddle.y = 0;
  }
  if (paddle.y + paddle.h > CANVAS_HEIGHT) {
    paddle.y = CANVAS_HEIGHT - paddle.h;
  }
}

function updateBall(state: GameState, dt: number): void {
  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;
}

function handleCollisions(state: GameState): void {
  if (checkPaddleCollision(state.ball, state.leftPaddle)) {
    const angle = calculateBounceAngle(state.ball, state.leftPaddle);
    state.ball.vx = Math.abs(state.ball.speed * Math.cos(angle));
    state.ball.vy = state.ball.speed * Math.sin(angle);
    state.ball.x = state.leftPaddle.x + state.leftPaddle.w + state.ball.radius;
    state.ball.speed = Math.min(
      state.ball.speed + state.ball.speedIncrement,
      600
    );
  }

  if (checkPaddleCollision(state.ball, state.rightPaddle)) {
    const angle = calculateBounceAngle(state.ball, state.rightPaddle);
    state.ball.vx = -Math.abs(state.ball.speed * Math.cos(angle));
    state.ball.vy = state.ball.speed * Math.sin(angle);
    state.ball.x = state.rightPaddle.x - state.ball.radius;
    state.ball.speed = Math.min(
      state.ball.speed + state.ball.speedIncrement,
      600
    );
  }

  const wallHit = checkWallCollision(state.ball);
  if (wallHit === 'top') {
    state.ball.vy = Math.abs(state.ball.vy);
    state.ball.y = state.ball.radius;
  } else if (wallHit === 'bottom') {
    state.ball.vy = -Math.abs(state.ball.vy);
    state.ball.y = CANVAS_HEIGHT - state.ball.radius;
  }
}

function serveBall(state: GameState): void {
  const angle = ((Math.random() - 0.5) * 60 * Math.PI) / 180;
  const direction = state.servingSide === 'left' ? 1 : -1;

  state.ball.x = CANVAS_WIDTH / 2;
  state.ball.y = CANVAS_HEIGHT / 2;
  state.ball.speed = BALL_SPEED_INITIAL;
  state.ball.vx = direction * state.ball.speed * Math.cos(angle);
  state.ball.vy = state.ball.speed * Math.sin(angle);
}

function handleGoal(state: GameState, goal: 'left' | 'right'): void {
  if (goal === 'left') {
    state.rightScore += POINTS_PER_GOAL;
    state.leftLives -= 1;
    state.servingSide = 'left';
  } else {
    state.leftScore += POINTS_PER_GOAL;
    state.rightLives -= 1;
    state.servingSide = 'right';
  }

  if (state.leftLives <= 0 || state.rightLives <= 0) {
    state.mode = 'gameover';
  } else {
    state.isServing = true;
    state.serveTimer = SERVE_DELAY;
    state.ball.vx = 0;
    state.ball.vy = 0;
  }
}
