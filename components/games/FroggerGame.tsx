'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { COLOR_PALETTES, type ColorPalette } from '@/lib/game/frogger/constants';

interface FroggerGameProps {
  paused: boolean;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
  colorPalette?: ColorPalette;
}

const COLS = 16;
const ROWS = 14;
const CELL = 40;
const CANVAS_W = COLS * CELL;
const CANVAS_H = ROWS * CELL;

const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

type Direction = 'up' | 'down' | 'left' | 'right';

interface Lane {
  row: number;
  speed: number;
  dir: 1 | -1;
  entities: Entity[];
}

interface Entity {
  col: number;
  width: number;
  type: 'car' | 'truck' | 'log' | 'turtle';
  submerged?: boolean;
  submergeTimer?: number;
}

interface Frog {
  col: number;
  row: number;
  animating: boolean;
  animT: number;
  targetCol: number;
  targetRow: number;
}

interface GameStateType {
  frog: Frog;
  lives: number;
  score: number;
  level: number;
  lanes: Lane[];
  goals: { occupied: boolean[] };
  roundTimer: number;
  gameOver: boolean;
}

function buildLanes(level: number): Lane[] {
  const baseLevelSpeed = 1 + (level - 1) * 0.15;
  const lanes: Lane[] = [];

  const roadSpeeds = [0.01, 0.015, 0.02, 0.025, 0.03];

  for (let i = ROW_ROAD_TOP; i <= ROW_ROAD_BOT; i++) {
    const speedIdx = i - ROW_ROAD_TOP;
    const speed = roadSpeeds[speedIdx] * baseLevelSpeed;
    const dir = speedIdx % 2 === 0 ? 1 : -1;
    const entities: Entity[] = [];

    if (dir === 1) {
      for (let col = 0; col < COLS; col += 4) {
        entities.push({
          col,
          width: speedIdx % 2 === 0 ? 1 : 2,
          type: speedIdx % 2 === 0 ? 'car' : 'truck',
        });
      }
    } else {
      for (let col = COLS - 1; col >= 0; col -= 4) {
        entities.push({
          col: col - (speedIdx % 2 === 0 ? 1 : 2),
          width: speedIdx % 2 === 0 ? 1 : 2,
          type: speedIdx % 2 === 0 ? 'car' : 'truck',
        });
      }
    }

    lanes.push({ row: i, speed, dir, entities });
  }

  for (let i = ROW_RIVER_TOP; i <= ROW_RIVER_BOT; i++) {
    const speedIdx = i - ROW_RIVER_TOP;
    const riverSpeeds = [0.0075, 0.0125, 0.0175, 0.0225, 0.0275, 0.0325];
    const speed = (riverSpeeds[speedIdx] || 1) * baseLevelSpeed;
    const dir = speedIdx % 2 === 0 ? 1 : -1;
    const entities: Entity[] = [];

    const isTurtles = speedIdx % 2 === 1;

    if (isTurtles) {
      if (dir === 1) {
        for (let col = 0; col < COLS; col += 6) {
          entities.push({
            col,
            width: 3,
            type: 'turtle',
            submerged: false,
            submergeTimer: 0,
          });
        }
      } else {
        for (let col = COLS - 1; col >= 0; col -= 6) {
          entities.push({
            col: col - 3,
            width: 3,
            type: 'turtle',
            submerged: false,
            submergeTimer: 0,
          });
        }
      }
    } else {
      if (dir === 1) {
        for (let col = 0; col < COLS; col += 5) {
          const logWidth = 2 + Math.floor(Math.random() * 3);
          entities.push({
            col,
            width: logWidth,
            type: 'log',
          });
        }
      } else {
        for (let col = COLS - 1; col >= 0; col -= 5) {
          const logWidth = 2 + Math.floor(Math.random() * 3);
          entities.push({
            col: col - logWidth,
            width: logWidth,
            type: 'log',
          });
        }
      }
    }

    lanes.push({ row: i, speed, dir, entities });
  }

  return lanes;
}

export default function FroggerGame({
  paused,
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
  colorPalette = 'neon',
}: FroggerGameProps) {
  const colors = useMemo(() => COLOR_PALETTES[colorPalette], [colorPalette]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameStateType>({
    frog: { col: 7, row: ROW_START, animating: false, animT: 0, targetCol: 7, targetRow: ROW_START },
    lives: 3,
    score: 0,
    level: 1,
    lanes: buildLanes(1),
    goals: { occupied: [false, false, false, false, false] },
    roundTimer: 15,
    gameOver: false,
  });

  const pendingDirRef = useRef<Direction | null>(null);
  const lastScoreRef = useRef(0);
  const lastLivesRef = useRef(3);
  const lastLevelRef = useRef(1);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
      for (const lane of lanes) {
        if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT && frog.row === lane.row) {
          for (const entity of lane.entities) {
            const entityStart = entity.col;
            const entityEnd = entity.col + entity.width;
            const frogStart = frog.col;
            const frogEnd = frog.col + 1;
            if (frogEnd > entityStart && frogStart < entityEnd) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function getSupport(frog: Frog, lanes: Lane[]): Entity | null {
      for (const lane of lanes) {
        if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT && frog.row === lane.row) {
          for (const entity of lane.entities) {
            const entityStart = entity.col;
            const entityEnd = entity.col + entity.width;
            const frogStart = frog.col;
            const frogEnd = frog.col + 1;
            if (frogEnd > entityStart && frogStart < entityEnd) {
              return entity;
            }
          }
        }
      }
      return null;
    }

    function checkGoal(frog: Frog, goals: { occupied: boolean[] }): { reached: boolean; points: number } {
      if (frog.row !== ROW_GOALS) return { reached: false, points: 0 };

      const goalCol = Math.floor(frog.col / 3.2);
      if (goalCol < 0 || goalCol >= 5) return { reached: false, points: 0 };

      if (goals.occupied[goalCol] === true) {
        return { reached: false, points: 0 };
      }

      goals.occupied[goalCol] = true;
      return { reached: true, points: 250 };
    }

    function completeRound(state: GameStateType): GameStateType {
      const newLevel = state.level + 1;
      const newLanes = buildLanes(newLevel);
      return {
        ...state,
        frog: { col: 7, row: ROW_START, animating: false, animT: 0, targetCol: 7, targetRow: ROW_START },
        level: newLevel,
        lanes: newLanes,
        goals: { occupied: [false, false, false, false, false] },
        roundTimer: Math.max(10, 15 - (newLevel - 1)),
      };
    }

    function killFrog(state: GameStateType): GameStateType {
      const newLives = state.lives - 1;
      if (newLives === 0) {
        return { ...state, lives: newLives, gameOver: true };
      }
      return {
        ...state,
        lives: newLives,
        frog: { col: 7, row: ROW_START, animating: false, animT: 0, targetCol: 7, targetRow: ROW_START },
        roundTimer: Math.max(10, 15 - (state.level - 1)),
      };
    }

    function update(dt: number, state: GameStateType): GameStateType {
      if (state.gameOver) return state;

      let newState = { ...state };
      let frogDied = false; // Flag para evitar múltiples muertes en un frame

      if (paused) {
        return newState;
      }

      for (const lane of newState.lanes) {
        for (const entity of lane.entities) {
          entity.col += lane.speed * lane.dir * (dt / 16);

          if (lane.dir === 1) {
            if (entity.col >= COLS) {
              entity.col = -entity.width;
            }
          } else {
            if (entity.col + entity.width <= 0) {
              entity.col = COLS;
            }
          }

          // Los cocodrilos ya no se sumergen
          if (entity.type === 'turtle') {
            entity.submerged = false;
          }
        }
      }

      const frog = newState.frog;

      if (!frog.animating && pendingDirRef.current) {
        const dir = pendingDirRef.current;
        let newRow = frog.row;
        let newCol = frog.col;

        if (dir === 'up') newRow = Math.max(0, frog.row - 1);
        else if (dir === 'down') newRow = Math.min(ROW_START, frog.row + 1);
        else if (dir === 'left') newCol = Math.max(0, frog.col - 1);
        else if (dir === 'right') newCol = Math.min(COLS - 1, frog.col + 1);

        if (newCol !== frog.col || newRow !== frog.row) {
          frog.animating = true;
          frog.animT = 0;
          frog.targetCol = newCol;
          frog.targetRow = newRow;

          const heightGain = frog.row - newRow;
          if (heightGain > 0) {
            newState.score += heightGain * 10;
          }

          pendingDirRef.current = null;
        }
      }

      if (frog.animating) {
        frog.animT += dt;
        if (frog.animT >= 120) {
          frog.col = frog.targetCol;
          frog.row = frog.targetRow;
          frog.animating = false;

          if (newState.roundTimer <= 0) {
            newState = killFrog(newState);
            frogDied = true;
          } else if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
            const support = getSupport(frog, newState.lanes);
            if (!support) {
              newState = killFrog(newState);
              frogDied = true;
            }
          } else if (checkRoadCollision(frog, newState.lanes)) {
            newState = killFrog(newState);
            frogDied = true;
          } else {
            const goalResult = checkGoal(frog, newState.goals);
            if (goalResult.reached) {
              newState.score += goalResult.points + Math.max(0, Math.floor(newState.roundTimer * 10));
              // Al llegar a cualquier meta, cambiar de nivel inmediatamente
              newState = completeRound(newState);
            } else if (frog.row === ROW_GOALS) {
              newState = killFrog(newState);
              frogDied = true;
            }
          }
        }
      }

      // Verificar colisión con vehículos constantemente (no solo después de animación)
      if (!frogDied && !frog.animating && frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
        if (checkRoadCollision(frog, newState.lanes)) {
          newState = killFrog(newState);
          frogDied = true;
        }
      }

      if (!frogDied && !frog.animating && frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
        const support = getSupport(frog, newState.lanes);
        if (support) {
          const lane = newState.lanes.find((l: Lane) => l.row === frog.row);
          if (lane) {
            frog.col += lane.speed * lane.dir * (dt / 16);
            if (frog.col < 0 || frog.col >= COLS) {
              newState = killFrog(newState);
              frogDied = true;
            }
          }
        } else {
          newState = killFrog(newState);
          frogDied = true;
        }
      }

      if (!frogDied) {
        newState.roundTimer -= dt / 1000;
        if (newState.roundTimer <= 0) {
          newState = killFrog(newState);
          frogDied = true;
        }
      }

      return newState;
    }

    function draw(state: GameStateType) {
      if (!ctx) return;
      const frog = state.frog;

      ctx.fillStyle = colors.hudBg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.fillStyle = colors.roadBg;
      for (let row = ROW_ROAD_TOP; row <= ROW_ROAD_BOT; row++) {
        ctx.fillRect(0, row * CELL, CANVAS_W, CELL);
      }

      ctx.fillStyle = colors.riverBg;
      for (let row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++) {
        ctx.fillRect(0, row * CELL, CANVAS_W, CELL);
      }

      ctx.fillStyle = colors.safeZone;
      for (let row = ROW_SAFE_MID; row < ROW_ROAD_TOP; row++) {
        ctx.fillRect(0, row * CELL, CANVAS_W, CELL);
      }

      ctx.fillStyle = colors.safeZone;
      ctx.fillRect(0, ROW_GOALS * CELL, CANVAS_W, CELL);

      for (const lane of state.lanes) {
        for (const entity of lane.entities) {
          const x = entity.col * CELL;
          const y = lane.row * CELL;

          if (entity.type === 'car') {
            // Cuerpo principal del coche rojo
            ctx.fillStyle = colors.carRed;
            ctx.fillRect(x + 2, y + 10, CELL - 4, CELL - 14);

            // Capó/techo del coche
            ctx.fillRect(x + 6, y + 6, CELL - 12, 8);

            // Ventanas (más oscuras)
            ctx.fillStyle = colors.hudBg + '80';
            ctx.fillRect(x + 8, y + 8, CELL - 16, 4);

            // Ruedas negras
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 2, y + 12, 4, 6);
            ctx.fillRect(x + CELL - 6, y + 12, 4, 6);

            // Faros
            ctx.fillStyle = colors.timerMid;
            ctx.fillRect(x + 4, y + CELL - 6, 3, 2);
            ctx.fillRect(x + CELL - 7, y + CELL - 6, 3, 2);
          } else if (entity.type === 'truck') {
            // Cuerpo principal del camión gris
            ctx.fillStyle = colors.carGray;
            ctx.fillRect(x + 2, y + 10, CELL * 2 - 4, CELL - 14);

            // Cabina del camión
            ctx.fillStyle = colors.truck;
            ctx.fillRect(x + CELL * 1.6, y + 6, CELL * 0.35, 12);

            // Ventana de la cabina
            ctx.fillStyle = colors.hudBg + '80';
            ctx.fillRect(x + CELL * 1.65, y + 8, CELL * 0.25, 6);

            // Ruedas negras
            ctx.fillStyle = '#000000';
            ctx.fillRect(x + 4, y + 12, 4, 6);
            ctx.fillRect(x + CELL - 4, y + 12, 4, 6);
            ctx.fillRect(x + CELL * 2 - 8, y + 12, 4, 6);

            // Faros
            ctx.fillStyle = colors.timerMid;
            ctx.fillRect(x + CELL * 1.9, y + CELL - 6, 3, 2);
          } else if (entity.type === 'log') {
            ctx.fillStyle = colors.log;
            ctx.fillRect(x, y + 10, entity.width * CELL, CELL - 20);
            ctx.strokeStyle = colors.logStroke;
            ctx.lineWidth = 1;
            for (let i = 0; i < entity.width; i++) {
              ctx.strokeRect(x + i * CELL + 2, y + 12, CELL - 4, CELL - 24);
            }
          } else if (entity.type === 'turtle') {
            if (entity.submerged) {
              ctx.strokeStyle = colors.turtleStroke + '80';
              ctx.lineWidth = 2;
              ctx.strokeRect(x, y + 8, entity.width * CELL, CELL - 16);
            } else {
              ctx.fillStyle = colors.turtle;
              ctx.beginPath();
              for (let i = 0; i < entity.width; i++) {
                ctx.arc(x + (i + 0.5) * CELL, y + CELL / 2, CELL / 2 - 5, 0, Math.PI * 2);
              }
              ctx.fill();
              ctx.strokeStyle = colors.turtleStroke;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      for (let i = 0; i < 5; i++) {
        const goalX = i * 3.2 * CELL + CELL;
        ctx.fillStyle = colors.goalSlot;
        ctx.fillRect(goalX, ROW_GOALS * CELL + 2, CELL * 2.8, CELL - 4);
        ctx.strokeStyle = colors.goalStroke;
        ctx.lineWidth = 2;
        ctx.strokeRect(goalX, ROW_GOALS * CELL + 2, CELL * 2.8, CELL - 4);

        if (state.goals.occupied[i]) {
          ctx.fillStyle = colors.goalFilled;
          ctx.beginPath();
          ctx.arc(goalX + CELL * 1.4, ROW_GOALS * CELL + CELL / 2, CELL / 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const frogX = frog.col * CELL + CELL / 2;
      const frogY = frog.row * CELL + CELL / 2;
      const progress = frog.animating ? frog.animT / 120 : 0;

      ctx.fillStyle = colors.frog;
      ctx.beginPath();
      ctx.ellipse(frogX, frogY - 2 + progress * 15, CELL / 3, CELL / 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(frogX - 4, frogY - 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(frogX - 4, frogY - 4, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(frogX + 4, frogY - 4, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(frogX + 4, frogY - 4, 1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px monospace';
      ctx.fillText(`SCORE: ${Math.floor(state.score)}`, 10, 25);

      ctx.fillText(`LVL ${state.level}`, CANVAS_W / 2 - 20, 25);

      for (let i = 0; i < state.lives; i++) {
        ctx.fillStyle = colors.frog;
        ctx.beginPath();
        ctx.arc(CANVAS_W - 20 - i * 20, 15, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      const timerWidth = Math.max(0, (state.roundTimer / (Math.max(10, 15 - (state.level - 1)))) * (CANVAS_W - 20));
      const timerColor =
        state.roundTimer > 5 ? colors.timerGood : state.roundTimer > 2 ? colors.timerMid : colors.timerBad;
      ctx.fillStyle = timerColor;
      ctx.fillRect(10, 2, timerWidth, 4);
      ctx.strokeStyle = colors.hudText;
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 2, CANVAS_W - 20, 4);
    }

    function gameLoop(currentTime: number) {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTime;
      }
      const dt = Math.min(currentTime - lastTimeRef.current, 16.67);
      lastTimeRef.current = currentTime;

      setGameState((prevState) => {
        const newState = update(dt, prevState);
        draw(newState);

        // Notificar cambios fuera del render cycle
        queueMicrotask(() => {
          if (newState.score !== lastScoreRef.current) {
            onScoreChange(Math.floor(newState.score));
            lastScoreRef.current = newState.score;
          }

          if (newState.lives !== lastLivesRef.current) {
            onLivesChange(newState.lives);
            lastLivesRef.current = newState.lives;

            if (newState.lives === 0) {
              onGameOver(Math.floor(newState.score));
            }
          }

          if (newState.level !== lastLevelRef.current) {
            onLevelChange(newState.level);
            lastLevelRef.current = newState.level;
          }
        });

        return newState;
      });

      if (!gameState.gameOver) {
        animFrameRef.current = requestAnimationFrame(gameLoop);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        e.preventDefault();
        pendingDirRef.current = 'up';
      } else if (key === 'arrowdown' || key === 's') {
        e.preventDefault();
        pendingDirRef.current = 'down';
      } else if (key === 'arrowleft' || key === 'a') {
        e.preventDefault();
        pendingDirRef.current = 'left';
      } else if (key === 'arrowright' || key === 'd') {
        e.preventDefault();
        pendingDirRef.current = 'right';
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [paused, onScoreChange, onLivesChange, onLevelChange, onGameOver, gameState.gameOver]);

  const canvasStyle = useMemo(
    () => ({
      border: `2px solid ${colors.frog}`,
      backgroundColor: colors.hudBg,
      display: 'block' as const,
      width: '100%',
      height: 'auto',
      maxWidth: '640px',
      imageRendering: 'pixelated' as const,
    }),
    [colors]
  );

  return <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={canvasStyle} />;
}
