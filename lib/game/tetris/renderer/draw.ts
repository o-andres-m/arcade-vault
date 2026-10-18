import { GameState, Piece, Theme, ColorPalette } from '../types';
import { BLOCK, ROWS, COLS, COLOR_PALETTES } from '../constants';
import { ghostY } from '../physics/collision';

export function drawGame(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  const bgColor = state.theme === 'dark' ? '#1a1a1a' : '#f5f5f5';
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  drawGrid(ctx, state.theme);
  drawBoard(ctx, state.board, state.colorPalette);

  if (state.current) {
    const ghost = ghostY(state.current, state.board);
    drawPiece(ctx, state.current.shape, state.current.x, ghost, state.current.type, 0.2, state.colorPalette);
    drawPiece(ctx, state.current.shape, state.current.x, state.current.y, state.current.type, 1, state.colorPalette);
  }
}

export function drawGrid(ctx: CanvasRenderingContext2D, theme: Theme): void {
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;

  for (let row = 0; row <= ROWS; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * BLOCK);
    ctx.lineTo(COLS * BLOCK, row * BLOCK);
    ctx.stroke();
  }

  for (let col = 0; col <= COLS; col++) {
    ctx.beginPath();
    ctx.moveTo(col * BLOCK, 0);
    ctx.lineTo(col * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
}

export function drawBoard(ctx: CanvasRenderingContext2D, board: number[][], palette: ColorPalette): void {
  board.forEach((row, y) => {
    row.forEach((colorIndex, x) => {
      if (colorIndex !== 0) {
        drawBlock(ctx, x, y, colorIndex, BLOCK, 1, palette);
      }
    });
  });
}

export function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  alpha: number,
  palette: ColorPalette = 'retro'
): void {
  const colors = COLOR_PALETTES[palette];
  const color = colors[colorIndex];
  if (!color) return;

  const px = x * size;
  const py = y * size;

  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(px, py, size, size);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(px, py, size, size / 3);

  ctx.globalAlpha = 1;
}

export function drawPiece(
  ctx: CanvasRenderingContext2D,
  shape: number[][],
  px: number,
  py: number,
  type: number,
  alpha: number,
  palette: ColorPalette = 'retro'
): void {
  shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if (val !== 0) {
        drawBlock(ctx, px + dx, py + dy, type, BLOCK, alpha, palette);
      }
    });
  });
}

export function drawNext(ctx: CanvasRenderingContext2D, piece: Piece, palette: ColorPalette = 'retro'): void {
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const shapeHeight = piece.shape.length;
  const shapeWidth = piece.shape[0].length;

  const startX = (4 - shapeWidth) * BLOCK;
  const startY = (4 - shapeHeight) * BLOCK;

  piece.shape.forEach((row, dy) => {
    row.forEach((val, dx) => {
      if (val !== 0) {
        const x = startX / BLOCK + dx;
        const y = startY / BLOCK + dy;
        drawBlock(ctx, x, y, piece.type, BLOCK, 1, palette);
      }
    });
  });
}
