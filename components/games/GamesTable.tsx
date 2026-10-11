'use client'

import Link from 'next/link'
import { useGameStats } from '@/hooks/useGameStats'
import type { Game } from '@/types'

interface GamesTableProps {
  games: Game[]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function GamesTable({ games }: GamesTableProps) {
  const gameIds = games.map((g) => g.id)
  const { stats, isLoading } = useGameStats(gameIds)

  if (isLoading) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
        Cargando juegos...
      </div>
    )
  }

  return (
    <div className="games-table-wrapper">
      <h2 className="section-title">JUEGOS DISPONIBLES</h2>
      <div style={{ overflowX: 'auto' }}>
        <table className="games-table">
          <thead>
            <tr>
              <th>Juego</th>
              <th>Última vez jugado</th>
              <th>Mejor score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => {
              const gameStat = stats[game.id] || {
                lastPlayed: null,
                bestScore: null,
              }
              return (
                <tr key={game.id}>
                  <td className="game-name">{game.title}</td>
                  <td className="game-lastplayed">
                    {gameStat.lastPlayed ? formatDate(gameStat.lastPlayed) : '-'}
                  </td>
                  <td className="game-bestscore">
                    {gameStat.bestScore !== null
                      ? gameStat.bestScore.toLocaleString()
                      : '-'}
                  </td>
                  <td className="game-action">
                    <Link href={`/juego/${game.id}/jugar`}>
                      <button className="btn sm">JUGAR</button>
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
