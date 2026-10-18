'use client';

import { useEffect, useRef, useState } from 'react';
import { GameState, InputState, Theme, ColorPalette } from '@/lib/game/tetris/types';
import {
  initializeGame,
  updateGameState,
} from '@/lib/game/tetris/engine/gameEngine';
import { drawGame } from '@/lib/game/tetris/renderer/draw';
import { drawNext } from '@/lib/game/tetris/renderer/draw';
import { DEFAULT_THEME, CANVAS_WIDTH, CANVAS_HEIGHT, NEXT_CANVAS_SIZE, DEFAULT_COLOR_PALETTE } from '@/lib/game/tetris/constants';

interface GameProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
  onScoreChange?: (score: number) => void;
  colorPalette?: ColorPalette;
  onColorPaletteChange?: (palette: ColorPalette) => void;
}

export default function TetrisGame({
  onGameOver,
  isPaused,
  onScoreChange,
  colorPalette: initialColorPalette,
  onColorPaletteChange,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [colorPalette, setColorPalette] = useState<ColorPalette>(initialColorPalette || DEFAULT_COLOR_PALETTE);
  const inputRef = useRef<InputState>({
    moveLeft: false,
    moveRight: false,
    softDrop: false,
    hardDrop: false,
    rotate: false,
  });
  const gameLoopRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(Date.now());

  // Load theme and color palette from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tetris-theme') as Theme | null;
    if (saved && (saved === 'dark' || saved === 'light')) {
      setTheme(saved);
    }
    if (!initialColorPalette) {
      const savedPalette = localStorage.getItem('tetris-color-palette') as ColorPalette | null;
      if (savedPalette && (savedPalette === 'neon' || savedPalette === 'pastel' || savedPalette === 'retro')) {
        setColorPalette(savedPalette);
      }
    }
  }, []);

  // Update color palette when prop changes
  useEffect(() => {
    if (initialColorPalette) {
      setColorPalette(initialColorPalette);
    }
  }, [initialColorPalette]);

  // Initialize game when theme changes
  useEffect(() => {
    const state = initializeGame(theme, colorPalette);
    setGameState(state);
    lastTimeRef.current = Date.now();
  }, [theme]);

  // Update gameState color palette when it changes
  useEffect(() => {
    setGameState(prev => prev ? { ...prev, colorPalette } : prev);
  }, [colorPalette]);

  // Handle color palette change
  const handleColorPaletteChange = (palette: ColorPalette) => {
    setColorPalette(palette);
    localStorage.setItem('tetris-color-palette', palette);
    if (onColorPaletteChange) {
      onColorPaletteChange(palette);
    }
  };

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'arrowleft') {
        inputRef.current.moveLeft = true;
        e.preventDefault();
      } else if (key === 'arrowright') {
        inputRef.current.moveRight = true;
        e.preventDefault();
      } else if (key === 'arrowdown') {
        inputRef.current.softDrop = true;
        e.preventDefault();
      } else if (key === ' ') {
        inputRef.current.hardDrop = true;
        e.preventDefault();
      } else if (key === 'arrowup' || key === 'x') {
        inputRef.current.rotate = true;
        e.preventDefault();
      } else if (key === 'p') {
        // Pause toggle handled by GamePlayer
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'arrowleft') {
        inputRef.current.moveLeft = false;
      } else if (key === 'arrowright') {
        inputRef.current.moveRight = false;
      } else if (key === 'arrowdown') {
        inputRef.current.softDrop = false;
      } else if (key === ' ') {
        inputRef.current.hardDrop = false;
      } else if (key === 'arrowup' || key === 'x') {
        inputRef.current.rotate = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const gameLoop = () => {
      if (!gameState || isPaused) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const now = Date.now();
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      const newState = updateGameState(gameState, dt, inputRef.current);

      // Reset input flags each frame
      inputRef.current.moveLeft = false;
      inputRef.current.moveRight = false;
      inputRef.current.rotate = false;
      inputRef.current.hardDrop = false;

      if (newState.score !== gameState.score && onScoreChange) {
        onScoreChange(newState.score);
      }

      if (newState.state === 'gameover' && gameState.state !== 'gameover') {
        onGameOver(newState.score);
      }

      setGameState(newState);

      // Draw main canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          drawGame(ctx, newState);
        }
      }

      // Draw next preview
      if (nextCanvasRef.current) {
        const ctx = nextCanvasRef.current.getContext('2d');
        if (ctx) {
          drawNext(ctx, newState.next, newState.colorPalette);
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, isPaused, onGameOver, onScoreChange]);

  return (
    <div className="flex items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-cyan-500 bg-black"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-sm font-bold text-gray-400 tracking-widest">
            SIGUIENTE
          </h3>
          <canvas
            ref={nextCanvasRef}
            width={NEXT_CANVAS_SIZE}
            height={NEXT_CANVAS_SIZE}
            className="border border-gray-600 bg-black"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      </div>
    </div>
  );
}
