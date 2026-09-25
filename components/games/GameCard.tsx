"use client";

import { useRouter } from "next/navigation";
import { Game } from "@/types";
import styles from "./GameCard.module.css";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/juego/${game.id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/juego/${game.id}/jugar`);
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.cover}>
        <div className={`cover-bg ${game.cover}`} />
        <div className={styles.label}>{game.cat}</div>
      </div>

      <div className={styles.meta}>
        <h3 className={styles.title}>{game.title}</h3>
        <p className={styles.desc}>{game.short}</p>

        <div className={styles.row}>
          <div className={styles.scoreBadge}>
            <span>MEJOR</span>
            <b>{game.best.toLocaleString()}</b>
          </div>

          <button className={styles.playBtn} onClick={handlePlayClick}>
            JUGAR
          </button>
        </div>
      </div>
    </div>
  );
}
