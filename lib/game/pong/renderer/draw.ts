import { GameState } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTES, PaletteColors } from '../constants';

export function drawGame(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const colors = COLOR_PALETTES[state.colorPalette];

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (state.mode === 'select') {
    drawModeSelect(ctx, colors);
    return;
  }

  drawCenterLine(ctx, colors);
  drawPaddles(ctx, state, colors);
  drawBall(ctx, state, colors);
  drawHUD(ctx, state, colors);

  if (state.isServing) {
    drawServingMessage(ctx, state, colors);
  }

  if (state.mode === 'gameover') {
    drawGameOver(ctx, state, colors);
  }
}

function drawCenterLine(ctx: CanvasRenderingContext2D, colors: PaletteColors): void {
  ctx.strokeStyle = colors.centerLine;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(CANVAS_WIDTH / 2, 0);
  ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPaddles(ctx: CanvasRenderingContext2D, state: GameState, colors: PaletteColors): void {
  ctx.fillStyle = colors.leftPaddle;

  ctx.fillRect(
    state.leftPaddle.x,
    state.leftPaddle.y,
    state.leftPaddle.w,
    state.leftPaddle.h
  );

  ctx.fillStyle = colors.rightPaddle;
  ctx.fillRect(
    state.rightPaddle.x,
    state.rightPaddle.y,
    state.rightPaddle.w,
    state.rightPaddle.h
  );
}

function drawBall(ctx: CanvasRenderingContext2D, state: GameState, colors: PaletteColors): void {
  ctx.fillStyle = colors.ball;
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, colors: PaletteColors): void {
  ctx.fillStyle = colors.text;
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';

  const leftX = CANVAS_WIDTH * 0.25;
  const rightX = CANVAS_WIDTH * 0.75;
  const topY = 40;

  ctx.fillText(`${state.leftScore}`, leftX, topY);
  ctx.fillText(`${state.rightScore}`, rightX, topY);

  ctx.font = '20px monospace';
  const livesY = 70;

  const leftLives = '♥'.repeat(state.leftLives);
  const rightLives = '♥'.repeat(state.rightLives);

  ctx.fillStyle = colors.leftPaddle;
  ctx.fillText(leftLives, leftX, livesY);

  ctx.fillStyle = colors.rightPaddle;
  ctx.fillText(rightLives, rightX, livesY);
}

function drawServingMessage(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  colors: PaletteColors
): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 40, 300, 80);

  ctx.fillStyle = colors.text;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';

  const countdown = Math.ceil(state.serveTimer);
  ctx.fillText(`Get Ready!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  ctx.fillText(`${countdown}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

function drawGameOver(ctx: CanvasRenderingContext2D, state: GameState, colors: PaletteColors): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = colors.text;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';

  const winner = state.leftLives > 0 ? 'JUGADOR 1' : 'JUGADOR 2';
  const winnerScore = state.leftLives > 0 ? state.leftScore : state.rightScore;

  ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.font = 'bold 32px monospace';
  ctx.fillStyle = state.leftLives > 0 ? colors.leftPaddle : colors.rightPaddle;
  ctx.fillText(`${winner} WINS!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

  ctx.fillStyle = colors.text;
  ctx.font = '24px monospace';
  ctx.fillText(
    `Final Score: ${winnerScore}`,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2 + 50
  );
}

function drawModeSelect(ctx: CanvasRenderingContext2D, colors: PaletteColors): void {
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = colors.text;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';

  ctx.fillText('PONG', CANVAS_WIDTH / 2, 150);

  ctx.font = '24px monospace';
  ctx.fillText('DUELO PIXEL', CANVAS_WIDTH / 2, 190);

  ctx.font = '20px monospace';
  ctx.fillText('Selecciona modo de juego', CANVAS_WIDTH / 2, 280);
}
