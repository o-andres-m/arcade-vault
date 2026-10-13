'use client';

import { useEffect, useRef, useState, forwardRef } from 'react';
import { GameState, GameInput } from '@/lib/game/snake/types';
import { initializeGame, updateGameState } from '@/lib/game/snake/engine/gameEngine';
import { drawGame } from '@/lib/game/snake/renderer/draw';

export interface SnakeGameHandle {
  setPaused: (paused: boolean) => void;
}

interface SnakeGameProps {
  onGameOver?: (score: number) => void;
  onPause?: (isPaused: boolean) => void;
  onScoreChange?: (score: number) => void;
  onLivesChange?: (lives: number) => void;
  onLevelChange?: (level: number) => void;
}

function SnakeGameComponent({ onGameOver, onPause, onScoreChange, onLivesChange, onLevelChange }: SnakeGameProps, ref: React.Ref<SnakeGameHandle>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const prevScoreRef = useRef<number>(0);
  const prevLivesRef = useRef<number>(5);
  const prevLevelRef = useRef<number>(1);
  const inputRef = useRef<GameInput>({
    up: false,
    down: false,
    left: false,
    right: false,
    pause: false,
  });
  const spriteImageRef = useRef<HTMLImageElement | null>(null);
  const lastFrameRef = useRef<number>(0);
  const gameLoopIdRef = useRef<number | null>(null);
  const callbacksRef = useRef({ onGameOver, onPause, onScoreChange, onLivesChange, onLevelChange });
  const manualPauseRef = useRef<boolean>(false);
  const prevPauseStateRef = useRef<'paused' | 'playing'>('playing');

  useEffect(() => {
    callbacksRef.current = { onGameOver, onPause, onScoreChange, onLivesChange, onLevelChange };
  }, [onGameOver, onPause, onScoreChange, onLivesChange, onLevelChange]);

  useEffect(() => {
    const handle: SnakeGameHandle = {
      setPaused: (paused: boolean) => {
        manualPauseRef.current = paused;
        if (gameStateRef.current) {
          gameStateRef.current.state = paused ? 'paused' : 'playing';
          callbacksRef.current.onPause?.(paused);
        }
      },
    };

    if (ref && typeof ref === 'object' && 'current' in ref) {
      ref.current = handle;
    }
  }, [ref]);

  useEffect(() => {
    const image = new Image();
    image.src = '/sprites.png';
    image.onload = () => {
      spriteImageRef.current = image;
    };

    gameStateRef.current = initializeGame();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup') {
        e.preventDefault();
        inputRef.current.up = true;
      } else if (key === 'arrowdown') {
        e.preventDefault();
        inputRef.current.down = true;
      } else if (key === 'arrowleft') {
        e.preventDefault();
        inputRef.current.left = true;
      } else if (key === 'arrowright') {
        e.preventDefault();
        inputRef.current.right = true;
      } else if (key === 'p') {
        e.preventDefault();
        inputRef.current.pause = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowup') inputRef.current.up = false;
      else if (key === 'arrowdown') inputRef.current.down = false;
      else if (key === 'arrowleft') inputRef.current.left = false;
      else if (key === 'arrowright') inputRef.current.right = false;
      else if (key === 'p') inputRef.current.pause = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const gameLoop = (timestamp: number) => {
      if (!gameStateRef.current) return;

      if (lastFrameRef.current === 0) {
        lastFrameRef.current = timestamp;
      }

      const dt = Math.min((timestamp - lastFrameRef.current) / 1000, 0.016);
      lastFrameRef.current = timestamp;

      const input = { ...inputRef.current };
      inputRef.current.pause = false;

      if (!manualPauseRef.current) {
        gameStateRef.current = updateGameState(gameStateRef.current, dt, input);
      }

      // Detectar cambios de pausa y notificar
      if (gameStateRef.current.state !== prevPauseStateRef.current) {
        prevPauseStateRef.current = gameStateRef.current.state;
        callbacksRef.current.onPause?.(gameStateRef.current.state === 'paused');
      }

      // Callback para cambios en tiempo real
      if (gameStateRef.current.score !== prevScoreRef.current) {
        prevScoreRef.current = gameStateRef.current.score;
        callbacksRef.current.onScoreChange?.(gameStateRef.current.score);
      }

      if (gameStateRef.current.lives !== prevLivesRef.current) {
        prevLivesRef.current = gameStateRef.current.lives;
        callbacksRef.current.onLivesChange?.(gameStateRef.current.lives);
      }

      if (gameStateRef.current.level !== prevLevelRef.current) {
        prevLevelRef.current = gameStateRef.current.level;
        callbacksRef.current.onLevelChange?.(gameStateRef.current.level);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx && spriteImageRef.current && gameStateRef.current) {
          drawGame(ctx, gameStateRef.current, spriteImageRef.current);
        }
      }

      if (gameStateRef.current.state === 'gameover') {
        callbacksRef.current.onGameOver?.(gameStateRef.current.score);
        lastFrameRef.current = 0;
        return;
      }

      gameLoopIdRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopIdRef.current !== null) {
        cancelAnimationFrame(gameLoopIdRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border-4 border-green-400 bg-black"
      />
      <div className="flex gap-4 text-sm text-gray-400">
        <span>↑↓←→ Move | P Pause</span>
      </div>
    </div>
  );
}

export default forwardRef(SnakeGameComponent);
