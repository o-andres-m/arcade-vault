"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Game, Score } from "@/types";
import styles from "./GamePlayer.module.css";

interface GamePlayerProps {
  game: Game;
}

export function GamePlayer({ game }: GamePlayerProps) {
  const router = useRouter();
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  // Auto-incremento de puntuación
  useEffect(() => {
    if (paused || over) return;

    const interval = setInterval(() => {
      setScore((prev) => prev + Math.floor(Math.random() * 50 + 10));
    }, 220);

    return () => clearInterval(interval);
  }, [paused, over]);

  // Subir nivel cada 2500 puntos
  useEffect(() => {
    const newLevel = Math.floor(score / 2500) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }
  }, [score, level]);

  const handleEnd = () => {
    setOver(true);
  };

  const handleExit = () => {
    router.push(`/juego/${game.id}`);
  };

  const handleSaveScore = () => {
    const playerName = name.trim().toUpperCase().slice(0, 10) || "PLAYER1";

    // Guardar en localStorage
    const newScore: Score = {
      game: game.id,
      score: score,
      name: playerName,
      at: Date.now(),
    };

    const existingScores = localStorage.getItem("av_scores");
    const scores: Score[] = existingScores ? JSON.parse(existingScores) : [];
    scores.push(newScore);
    localStorage.setItem("av_scores", JSON.stringify(scores));

    setSaved(true);
  };

  const handlePlayAgain = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setName("");
    setSaved(false);
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
          <div className={`${styles.value} ${styles.cyan}`}>
            {score.toLocaleString()}
          </div>
        </div>
        <div className={styles.hudStat}>
          <div className={styles.label}>VIDAS</div>
          <div className={`${styles.value} ${styles.magenta}`}>
            {"❤".repeat(lives)}
          </div>
        </div>
        <div className={styles.hudStat}>
          <div className={styles.label}>NIVEL</div>
          <div className={`${styles.value} ${styles.yellow}`}>{level}</div>
        </div>

        <div className={styles.hudActions}>
          <button className="btn" onClick={() => setPaused(!paused)} disabled={over}>
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
            <div className={styles.gridFloor} />
            <div className={styles.playerShip} />
            <div className={`${styles.enemy} ${styles.e1}`} />
            <div className={`${styles.enemy} ${styles.e2}`} />
            <div className={`${styles.enemy} ${styles.e3}`} />
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
                  <input
                    type="text"
                    placeholder="TU NOMBRE"
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                    maxLength={10}
                    className={styles.nameInput}
                  />
                  <button className="btn" onClick={handleSaveScore}>
                    GUARDAR
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
