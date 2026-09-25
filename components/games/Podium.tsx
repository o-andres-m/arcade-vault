import { LeaderboardEntry } from "@/types";
import styles from "./Podium.module.css";

interface PodiumProps {
  entries: LeaderboardEntry[];
}

export function Podium({ entries }: PodiumProps) {
  if (entries.length < 3) return null;

  const [gold, silver, bronze] = entries;

  return (
    <div className={styles.podium}>
      {/* Plata (izquierda) */}
      <div className={`${styles.slot} ${styles.silver}`}>
        <div className={styles.rankNum}>2</div>
        <div className={styles.name}>{silver.name}</div>
        <div className={styles.score}>{silver.score.toLocaleString()}</div>
        <div className={styles.date}>{silver.date}</div>
      </div>

      {/* Oro (centro) */}
      <div className={`${styles.slot} ${styles.gold}`}>
        <div className={styles.rankNum}>1</div>
        <div className={styles.name}>{gold.name}</div>
        <div className={styles.score}>{gold.score.toLocaleString()}</div>
        <div className={styles.date}>{gold.date}</div>
      </div>

      {/* Bronce (derecha) */}
      <div className={`${styles.slot} ${styles.bronze}`}>
        <div className={styles.rankNum}>3</div>
        <div className={styles.name}>{bronze.name}</div>
        <div className={styles.score}>{bronze.score.toLocaleString()}</div>
        <div className={styles.date}>{bronze.date}</div>
      </div>
    </div>
  );
}
