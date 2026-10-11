'use client'

import { useLeaderboard } from '@/hooks/useLeaderboard'

interface LeaderboardProps {
  gameId: string
}

export function Leaderboard({ gameId }: LeaderboardProps) {
  const { entries, isLoading } = useLeaderboard(gameId, 10)

  if (isLoading) {
    return (
      <div className="leaderboard">
        <h3>◆ MEJORES PUNTUACIONES</h3>
        <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
          Cargando...
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="leaderboard">
        <h3>◆ MEJORES PUNTUACIONES</h3>
        <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
          No hay puntuaciones aún. ¡Sé el primero!
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard">
      <h3>◆ MEJORES PUNTUACIONES</h3>
      {entries.map((entry) => (
        <div
          key={entry.rank}
          className={`lb-row ${
            entry.rank === 1
              ? 'top1'
              : entry.rank === 2
                ? 'top2'
                : entry.rank === 3
                  ? 'top3'
                  : ''
          }`}
        >
          <span className="rk">#{entry.rank}</span>
          <span className="pl">{entry.name}</span>
          <span className="sc">{entry.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}
