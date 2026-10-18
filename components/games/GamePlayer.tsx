"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Game, Score } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { saveScore } from "@/lib/supabase/scores";
import { AsteroidsGame } from "./AsteroidsGame";
import { ArkanoidGame, ArkanoidGameHandle } from "./ArkanoidGame";
import SnakeGame, { SnakeGameHandle } from "./SnakeGame";
import TetrisGame from "./TetrisGame";
import type { ColorPalette } from "@/lib/game/tetris/types";
import styles from "./GamePlayer.module.css";

interface GamePlayerProps {
  game: Game;
}

export function GamePlayer({ game }: GamePlayerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(0);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tetrisResetKey, setTetrisResetKey] = useState(0);
  const [tetrisColorPalette, setTetrisColorPalette] = useState<ColorPalette>("retro");
  const [asteroidsColorPalette, setAsteroidsColorPalette] = useState<ColorPalette>("retro");
  const [arkanoidColorPalette, setArkanoidColorPalette] = useState<ColorPalette>("retro");
  const [snakeColorPalette, setSnakeColorPalette] = useState<ColorPalette>("retro");
  const arkanoidRef = useRef<ArkanoidGameHandle>(null);
  const snakeRef = useRef<SnakeGameHandle>(null);

  // Para juegos específicos
  const isAsteroidsGame = game.id === 'rocas';
  const isArkanoidGame = game.id === 'arkanoid';
  const isSnakeGame = game.id === 'snake';
  const isTetrisGame = game.id === 'tetris';

  useEffect(() => {
    const initialLives = isSnakeGame ? 5 : 3;
    setLives(initialLives);
  }, [isSnakeGame]);

  // Auto-incremento de puntuación (solo para juegos no-Asteroides/Arkanoid/Snake/Tetris)
  useEffect(() => {
    if (isAsteroidsGame || isArkanoidGame || isSnakeGame || isTetrisGame || paused || over) return;

    const interval = setInterval(() => {
      setScore((prev) => prev + Math.floor(Math.random() * 50 + 10));
    }, 220);

    return () => clearInterval(interval);
  }, [isAsteroidsGame, isArkanoidGame, isSnakeGame, isTetrisGame, paused, over]);

  // Subir nivel cada 2500 puntos
  useEffect(() => {
    const newLevel = Math.floor(score / 2500) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }
  }, [score, level]);

  const handleAsteroidsGameOver = (finalScore: number) => {
    setScore(finalScore);
    setOver(true);
  };

  const handleAsteroidsScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  const handleAsteroidsLivesChange = (newLives: number) => {
    setLives(newLives);
  };

  const handleAsteroidsLevelChange = (newLevel: number) => {
    setLevel(newLevel);
  };

  const handleArkanoidGameEnd = (finalScore: number) => {
    setScore(finalScore);
    setOver(true);
  };

  const handleArkanoidScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  const handleArkanoidLivesChange = (newLives: number) => {
    setLives(newLives);
  };

  const handleArkanoidLevelChange = (newLevel: number) => {
    setLevel(newLevel);
  };

  const handleArkanoidPausedChange = (isPaused: boolean) => {
    setPaused(isPaused);
  };

  const handleSnakeGameOver = (finalScore: number) => {
    setScore(finalScore);
    setOver(true);
  };

  const handleSnakePause = (isPaused: boolean) => {
    setPaused(isPaused);
  };

  const handleSnakeScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  const handleSnakeLivesChange = (newLives: number) => {
    setLives(newLives);
  };

  const handleSnakeLevelChange = (newLevel: number) => {
    setLevel(newLevel);
  };

  const handleTetrisGameOver = (finalScore: number) => {
    setScore(finalScore);
    setOver(true);
  };

  const handleTetrisScoreChange = (newScore: number) => {
    setScore(newScore);
  };

  const handleEnd = () => {
    setOver(true);
  };

  const handleExit = () => {
    router.push(`/juego/${game.id}`);
  };

  const handleSaveScore = async () => {
    setIsSaving(true);
    const playerName = name.trim().toUpperCase().slice(0, 10) || "PLAYER1";

    try {
      // Si es juego Asteroides/Arkanoid/Snake/Tetris y está logueado, guardar en Supabase
      if ((isAsteroidsGame || isArkanoidGame || isSnakeGame || isTetrisGame) && user) {
        await saveScore(game.id, score);
      } else {
        // Guardar en localStorage
        const newScore: Score = {
          id: `local-${Date.now()}`,
          user_id: 'local',
          game_id: game.id,
          score: score,
          created_at: new Date().toISOString(),
          game: game.id,
          name: playerName,
          at: Date.now(),
        };

        const existingScores = localStorage.getItem("av_scores");
        const scores: Score[] = existingScores ? JSON.parse(existingScores) : [];
        scores.push(newScore);
        localStorage.setItem("av_scores", JSON.stringify(scores));
      }

      setSaved(true);
    } catch (error) {
      console.error('Error saving score:', error);
      alert('No se pudo guardar el score. Por favor, intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayAgain = () => {
    setScore(0);
    const initialLives = isSnakeGame ? 5 : 3;
    setLives(initialLives);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setName("");
    setSaved(false);
    if (isTetrisGame) {
      setTetrisResetKey(prev => prev + 1);
    }
  };

  const handleBackToVault = () => {
    router.push("/biblioteca");
  };

  return (
    <div className={styles.player}>
      {/* HUD */}
      <div className={styles.hud}>
        <div className={styles.hudStat}>
          <div className={styles.label}>JUGADOR</div>
          <div className={styles.value}>PLAYER1</div>
        </div>
        <div className={styles.hudStat}>
          <div className={styles.label}>PUNTUACIÓN</div>
          <div className={`${styles.value} ${styles.cyan}`}>{score.toLocaleString()}</div>
        </div>
        {!isTetrisGame && (
          <>
            <div className={styles.hudStat}>
              <div className={styles.label}>VIDAS</div>
              <div className={`${styles.value} ${styles.magenta}`}>{"❤".repeat(lives)}</div>
            </div>
            <div className={styles.hudStat}>
              <div className={styles.label}>NIVEL</div>
              <div className={`${styles.value} ${styles.yellow}`}>{level}</div>
            </div>
          </>
        )}

        <div className={styles.hudActions}>
          {isTetrisGame && (
            <select
              value={tetrisColorPalette}
              onChange={(e) => setTetrisColorPalette(e.target.value as ColorPalette)}
              className={`btn ${styles.colorSelect}`}
              title="Select color palette"
            >
              <option value="neon">🟢 Neon</option>
              <option value="pastel">🎨 Pastel</option>
              <option value="retro">✨ Retro</option>
            </select>
          )}
          {isAsteroidsGame && (
            <select
              value={asteroidsColorPalette}
              onChange={(e) => setAsteroidsColorPalette(e.target.value as ColorPalette)}
              className={`btn ${styles.colorSelect}`}
              title="Select color palette"
            >
              <option value="neon">🟢 Neon</option>
              <option value="pastel">🎨 Pastel</option>
              <option value="retro">✨ Retro</option>
            </select>
          )}
          {isArkanoidGame && (
            <select
              value={arkanoidColorPalette}
              onChange={(e) => setArkanoidColorPalette(e.target.value as ColorPalette)}
              className={`btn ${styles.colorSelect}`}
              title="Select color palette"
            >
              <option value="neon">🟢 Neon</option>
              <option value="pastel">🎨 Pastel</option>
              <option value="retro">✨ Retro</option>
            </select>
          )}
          {isSnakeGame && (
            <select
              value={snakeColorPalette}
              onChange={(e) => setSnakeColorPalette(e.target.value as ColorPalette)}
              className={`btn ${styles.colorSelect}`}
              title="Select color palette"
            >
              <option value="neon">🟢 Neon</option>
              <option value="pastel">🎨 Pastel</option>
              <option value="retro">✨ Retro</option>
            </select>
          )}
          <button
            className="btn"
            onClick={() => {
              if (isArkanoidGame && arkanoidRef.current) {
                arkanoidRef.current.setPaused(!paused);
              } else if (isSnakeGame && snakeRef.current) {
                snakeRef.current.setPaused(!paused);
              } else {
                setPaused(!paused);
              }
            }}
            disabled={over}
          >
            {paused ? "▶ REANUDAR" : "❚❚ PAUSA"}
          </button>
          <button className="btn magenta" onClick={handleEnd} disabled={over}>
            ■ FIN
          </button>
          <button className="btn ghost" onClick={handleExit}>
            ← SALIR
          </button>
        </div>
      </div>

      {/* CRT */}
      <div className={styles.crt}>
        <div className={styles.screen}>
          {/* Arena de juego */}
          <div className={styles.arena}>
            {isAsteroidsGame ? (
              <AsteroidsGame
                onGameOver={handleAsteroidsGameOver}
                onScoreChange={handleAsteroidsScoreChange}
                onLivesChange={handleAsteroidsLivesChange}
                onLevelChange={handleAsteroidsLevelChange}
                colorPalette={asteroidsColorPalette}
                onColorPaletteChange={setAsteroidsColorPalette}
              />
            ) : isArkanoidGame ? (
              <ArkanoidGame
                ref={arkanoidRef}
                onGameEnd={handleArkanoidGameEnd}
                onScoreChange={handleArkanoidScoreChange}
                onLivesChange={handleArkanoidLivesChange}
                onLevelChange={handleArkanoidLevelChange}
                onPausedChange={handleArkanoidPausedChange}
                colorPalette={arkanoidColorPalette}
                onColorPaletteChange={setArkanoidColorPalette}
              />
            ) : isSnakeGame ? (
              <SnakeGame
                ref={snakeRef}
                onGameOver={handleSnakeGameOver}
                onPause={handleSnakePause}
                onScoreChange={handleSnakeScoreChange}
                onLivesChange={handleSnakeLivesChange}
                onLevelChange={handleSnakeLevelChange}
                colorPalette={snakeColorPalette}
                onColorPaletteChange={setSnakeColorPalette}
              />
            ) : isTetrisGame ? (
              <TetrisGame
                key={tetrisResetKey}
                onGameOver={handleTetrisGameOver}
                isPaused={paused}
                onScoreChange={handleTetrisScoreChange}
                colorPalette={tetrisColorPalette}
                onColorPaletteChange={setTetrisColorPalette}
              />
            ) : (
              <>
                <div className={styles.gridFloor} />
                <div className={styles.playerShip} />
                <div className={`${styles.enemy} ${styles.e1}`} />
                <div className={`${styles.enemy} ${styles.e2}`} />
                <div className={`${styles.enemy} ${styles.e3}`} />
              </>
            )}
          </div>

          {/* Overlay de pausa */}
          {paused && (
            <div className={styles.pauseOverlay}>
              <div className={styles.pauseText}>
                PAUSA
                <div className={styles.pauseSub}>Presiona REANUDAR para continuar_</div>
              </div>
            </div>
          )}
        </div>

        {/* Barra inferior */}
        <div className={styles.bottom}>
          <div className={styles.led}>
            <span>SEÑAL</span>
          </div>
          <span>{game.title}</span>
          <span>█████████░ 90%</span>
        </div>
      </div>

      {/* Modal Game Over */}
      {over && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>GAME OVER</h2>

            <div className={styles.finalScoreLabel}>PUNTUACIÓN FINAL</div>
            <div className={styles.finalScore}>{score.toLocaleString()}</div>

            {!saved ? (
              <>
                <div className={styles.inputRow}>
                  {!isAsteroidsGame && !isArkanoidGame && !isSnakeGame && !isTetrisGame && (
                    <input
                      type="text"
                      placeholder="TU NOMBRE"
                      value={name}
                      onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                      maxLength={10}
                      className={styles.nameInput}
                    />
                  )}
                  <button className="btn" onClick={handleSaveScore} disabled={isSaving}>
                    {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.toastSaved}>PUNTUACIÓN GUARDADA_</div>
            )}

            <div className={styles.modalActions}>
              <button className="btn pulse" onClick={handlePlayAgain}>
                ▶ JUGAR DE NUEVO
              </button>
              <button className="btn ghost" onClick={handleBackToVault}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
