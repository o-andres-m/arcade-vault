import { GameState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, BLOCK_SIZE, GRID_COLS, GRID_ROWS } from '../constants';
import { getFruitSprite } from '../spriteAtlas';

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState, spriteImage: HTMLImageElement) {
  drawBackground(ctx);
  drawGrid(ctx);
  drawFood(ctx, state, spriteImage);
  drawSnake(ctx, state);
  drawHUD(ctx, state);
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID_COLS; i++) {
    ctx.beginPath();
    ctx.moveTo(i * BLOCK_SIZE, 0);
    ctx.lineTo(i * BLOCK_SIZE, CANVAS_HEIGHT);
    ctx.stroke();
  }

  for (let i = 0; i <= GRID_ROWS; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * BLOCK_SIZE);
    ctx.lineTo(CANVAS_WIDTH, i * BLOCK_SIZE);
    ctx.stroke();
  }
}

function drawSnake(ctx: CanvasRenderingContext2D, state: GameState) {
  state.snake.forEach((segment, index) => {
    const x = segment.x * BLOCK_SIZE;
    const y = segment.y * BLOCK_SIZE;

    if (index === 0) {
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
      ctx.strokeStyle = '#00aa00';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
    } else {
      ctx.fillStyle = '#00cc00';
      ctx.fillRect(x + 4, y + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
    }
  });
}

function drawFood(ctx: CanvasRenderingContext2D, state: GameState, spriteImage: HTMLImageElement) {
  const x = state.food.x * BLOCK_SIZE;
  const y = state.food.y * BLOCK_SIZE;

  try {
    const sprite = getFruitSprite(state.food.type);
    if (sprite && spriteImage.complete) {
      ctx.drawImage(spriteImage, sprite.x, sprite.y, sprite.width, sprite.height, x + 4, y + 4, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
    } else {
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(x + 8, y + 8, BLOCK_SIZE - 16, BLOCK_SIZE - 16);
    }
  } catch {
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(x + 8, y + 8, BLOCK_SIZE - 16, BLOCK_SIZE - 16);
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText(`Score: ${state.score}`, 10, 25);
  ctx.fillText(`Lives: ${state.lives}`, 250, 25);
  ctx.fillText(`Level: ${state.level}`, 450, 25);
  ctx.fillText(`Fruits: ${state.fruitCounter}/30`, 620, 25);

  if (state.state === 'paused') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.textAlign = 'left';
  }
}
