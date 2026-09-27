import { LeaderboardEntry } from "@/types";
import styles from "./Leaderboard.module.css";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  userEntry?: LeaderboardEntry | null;
}

export function Leaderboard({ entries, userEntry }: LeaderboardProps) {
  return (
    <div className={styles.table}>
      {/* Headers */}
      <div className={styles.th}>
        <span>RANGO</span>
        <span>JUGADOR</span>
        <span>PUNTUACIÓN</span>
        <span>FECHA</span>
      </div>

      {/* Filas */}
      {entries.map((entry, index) => (
        <div
          key={entry.rank}
          className={`${styles.tr} ${
            entry.rank === 1
              ? styles.top1
              : entry.rank === 2
                ? styles.top2
                : entry.rank === 3
                  ? styles.top3
                  : ""
          }`}
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <span className={styles.rk}>#{entry.rank}</span>
          <span className={styles.pl}>{entry.name}</span>
          <span className={styles.sc}>{entry.score.toLocaleString()}</span>
          <span className={styles.dt}>{entry.date}</span>
        </div>
      ))}

      {/* Fila del usuario */}
      {userEntry && (
        <>
          <div className={styles.youLabel}>TU MEJOR MARCA</div>
          <div className={`${styles.tr} ${styles.you}`}>
            <span className={styles.rk}>#{userEntry.rank}</span>
            <span className={styles.pl}>{userEntry.name}</span>
            <span className={styles.sc}>{userEntry.score.toLocaleString()}</span>
            <span className={styles.dt}>{userEntry.date}</span>
          </div>
        </>
      )}
    </div>
  );
}
