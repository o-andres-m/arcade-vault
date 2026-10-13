import { GameState, GameInput } from '../types';
import { Snake } from '../entities/Snake';
import { Food } from '../entities/Food';
import { detectFoodCollision, detectSelfCollision } from '../physics/collision';
import {
  MOVE_SPEED_BASE,
  MOVE_SPEED_INCREMENT,
  FRUIT_POINTS_NORMAL,
  FRUIT_POINTS_RARE,
  FRUITS_PER_LEVEL,
  RARE_FRUITS,
  INITIAL_LIVES,
} from '../constants';

const directionMap = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export function initializeGame(): GameState {
  const snake = new Snake();
  return {
    snake: snake.getSegments(),
    direction: 'right',
    nextDirection: 'right',
    food: Food.generate(snake.getSegments()),
    score: 0,
    lives: INITIAL_LIVES,
    level: 1,
    fruitCounter: 0,
    state: 'playing',
    moveTimer: 0,
  };
}

export function updateGameState(state: GameState, dt: number, input: GameInput): GameState {
  if (state.state === 'gameover') return state;

  const newState = { ...state };

  if (input.pause) {
    newState.state = newState.state === 'paused' ? 'playing' : 'paused';
    return newState;
  }

  if (newState.state === 'paused') return newState;

  const isValidTurn = isValidDirectionChange(newState.direction, input);
  if (isValidTurn) {
    if (input.up) newState.nextDirection = 'up';
    if (input.down) newState.nextDirection = 'down';
    if (input.left) newState.nextDirection = 'left';
    if (input.right) newState.nextDirection = 'right';
  }

  const moveSpeed = MOVE_SPEED_BASE + (newState.level - 1) * MOVE_SPEED_INCREMENT;
  const moveInterval = 1 / moveSpeed;

  newState.moveTimer += dt;

  if (newState.moveTimer >= moveInterval) {
    newState.moveTimer = 0;
    newState.direction = newState.nextDirection;

    const snake = new Snake();
    snake.getSegments().splice(0);
    snake.getSegments().push(...newState.snake);

    const dir = directionMap[newState.direction];
    snake.move(dir.dx, dir.dy);

    newState.snake = snake.getSegments();

    if (detectFoodCollision(newState.snake[0], newState.food)) {
      snake.grow();
      newState.snake = snake.getSegments();

      const isRare = RARE_FRUITS.includes(newState.food.type);
      const points = isRare ? FRUIT_POINTS_RARE : FRUIT_POINTS_NORMAL;
      newState.score += points * newState.level;
      newState.fruitCounter++;

      if (newState.fruitCounter >= FRUITS_PER_LEVEL) {
        newState.fruitCounter = 0;
        newState.level++;
      }

      newState.food = Food.generate(newState.snake);
    }

    if (detectSelfCollision(newState.snake)) {
      newState.lives--;
      if (newState.lives <= 0) {
        newState.state = 'gameover';
      } else {
        snake.reset();
        newState.snake = snake.getSegments();
        newState.direction = 'right';
        newState.nextDirection = 'right';
      }
    }
  }

  return newState;
}

function isValidDirectionChange(current: string, input: GameInput): boolean {
  if (input.up && current !== 'down') return true;
  if (input.down && current !== 'up') return true;
  if (input.left && current !== 'right') return true;
  if (input.right && current !== 'left') return true;
  return false;
}
