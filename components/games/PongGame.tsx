'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, InputState, ColorPalette } from '@/lib/game/pong/types';
import { initializeGame, updateGameState } from '@/lib/game/pong/engine/gameEngine';
import { drawGame } from '@/lib/game/pong/renderer/draw';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTES } from '@/lib/game/pong/constants';

interface PongGameProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
  onScoreChange?: (score: number) => void;
  colorPalette?: ColorPalette;
  onColorPaletteChange?: (palette: ColorPalette) => void;
}

export default function PongGame({ onGameOver, isPaused, onScoreChange, colorPalette = 'neon', onColorPaletteChange }: PongGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedMode, setSelectedMode] = useState<'1player' | '2player' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<InputState>({
    up1: false,
    down1: false,
    up2: false,
    down2: false,
  });
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 768px)').matches);
  }, []);

  useEffect(() => {
    if (gameState) {
      setGameState(prev => prev ? { ...prev, colorPalette } : prev);
    }
  }, [colorPalette, gameState]);

  const startGame = useCallback((mode: '1player' | '2player') => {
    setSelectedMode(mode);
    const initialState = initializeGame(mode, colorPalette);
    setGameState(initialState);
  }, [colorPalette]);

  const gameLoop = useCallback((timestamp: number) => {
    if (!gameState || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    let dt = (timestamp - lastTimeRef.current) / 1000;
    if (dt > 0.05) dt = 0.05; // Clamp delta time

    lastTimeRef.current = timestamp;

    const currentState = { ...gameState };
    currentState.isPaused = isPaused;

    const nextState = updateGameState(currentState, dt, inputRef.current);

    if (nextState.mode === 'playing' && selectedMode === '1player') {
      const currentScore = nextState.leftScore;
      if (onScoreChange) {
        onScoreChange(currentScore);
      }
    }

    if (nextState.mode === 'gameover' && gameState.mode !== 'gameover') {
      const finalScore = nextState.leftScore;
      if (selectedMode === '1player') {
        setTimeout(() => onGameOver(finalScore), 100);
      } else {
        setTimeout(() => onGameOver(0), 100);
      }
    }

    setGameState(nextState);
    drawGame(ctx, nextState);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, isPaused, selectedMode, onGameOver, onScoreChange]);

  useEffect(() => {
    if (!gameState) return;

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Bug 4: Reiniciar con R cuando está en gameover
      if (key === 'r' && gameState?.mode === 'gameover') {
        setGameState(null);
        setSelectedMode(null);
        lastTimeRef.current = 0;
        return;
      }

      // Bug 2: Intercambiar A/Q - Q sube, A baja
      if (key === 'q') inputRef.current.up1 = true;
      if (key === 'a') inputRef.current.down1 = true;

      // Bug 1: En modo 1P, las flechas también controlan paddle izquierdo
      if (key === 'arrowup') {
        e.preventDefault();
        if (selectedMode === '1player') {
          inputRef.current.up1 = true;
        } else {
          inputRef.current.up2 = true;
        }
      }
      if (key === 'arrowdown') {
        e.preventDefault();
        if (selectedMode === '1player') {
          inputRef.current.down1 = true;
        } else {
          inputRef.current.down2 = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Bug 2: Intercambiar A/Q
      if (key === 'q') inputRef.current.up1 = false;
      if (key === 'a') inputRef.current.down1 = false;

      // Bug 1: En modo 1P, las flechas también controlan paddle izquierdo
      if (key === 'arrowup') {
        if (selectedMode === '1player') {
          inputRef.current.up1 = false;
        } else {
          inputRef.current.up2 = false;
        }
      }
      if (key === 'arrowdown') {
        if (selectedMode === '1player') {
          inputRef.current.down1 = false;
        } else {
          inputRef.current.down2 = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedMode, gameState]);

  useEffect(() => {
    if (!canvasRef.current || gameState) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const colors = COLOR_PALETTES[colorPalette];

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
  }, [gameState, colorPalette]);

  if (!selectedMode) {
    return (
      <div className="flex flex-col items-center gap-6 w-full">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-gray-700 rounded-lg shadow-lg"
          style={{
            width: isMobile ? '85vw' : '100%',
            maxWidth: isMobile ? '85vw' : '800px',
            height: 'auto',
          }}
        />
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-white mb-2">Selecciona Modo</h2>
          <div className="flex gap-4">
            <button
              onClick={() => startGame('1player')}
              className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-xl transition-colors"
            >
              1 JUGADOR
              <div className="text-sm font-normal mt-1">vs CPU</div>
            </button>
            {!isMobile && (
              <button
                onClick={() => startGame('2player')}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xl transition-colors"
              >
                2 JUGADORES
                <div className="text-sm font-normal mt-1">Local</div>
              </button>
            )}
          </div>
          <div className="text-center text-gray-400 mt-4 max-w-md">
            {isMobile ? (
              <p>En móvil solo está disponible el modo 1 jugador con controles táctiles.</p>
            ) : (
              <>
                <p className="mb-2">
                  <strong className="text-white">1 Jugador:</strong> Q (arriba) / A (abajo) o Flechas
                </p>
                <p>
                  <strong className="text-white">2 Jugadores:</strong> Jugador 1: Q/A | Jugador 2: Flechas
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-gray-700 rounded-lg shadow-lg"
        style={{
          width: isMobile ? '85vw' : '100%',
          maxWidth: isMobile ? '85vw' : '800px',
          height: 'auto',
        }}
      />

      {!isMobile && (
        <div className="text-center text-gray-400 text-sm mt-2">
          {selectedMode === '1player' ? (
            <p>Controles: Q (arriba) / A (abajo) o Flechas | CPU a la derecha | R para reiniciar</p>
          ) : (
            <p>Jugador 1: Q (arriba) / A (abajo) | Jugador 2: Flechas | R para reiniciar</p>
          )}
        </div>
      )}
    </div>
  );
}
