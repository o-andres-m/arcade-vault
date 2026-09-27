'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GAMES } from '@/lib/data'
import { seededScores } from '@/lib/utils'
import { LeaderboardEntry } from '@/types'
import { Podium } from '@/components/games/Podium'
import { Leaderboard } from '@/components/games/Leaderboard'
import { getLeaderboard } from '@/lib/supabase/scores'
import { createClient } from '@/lib/supabase/client'

export default function SalonPage() {
  const router = useRouter()
  const supabase = createClient()
  const [tab, setTab] = useState(GAMES[0].id)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null)

  // Cargar leaderboard al cambiar de juego
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true)
      try {
        const data = await getLeaderboard(tab, 12)
        setLeaderboard(data.length > 0 ? data : seededScores(tab.length * 23 + 7, 12))
      } catch (err) {
        console.error('Error cargando leaderboard:', err)
        setLeaderboard(seededScores(tab.length * 23 + 7, 12))
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`leaderboard-${tab}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scores',
          filter: `game_id=eq.${tab}`,
        },
        () => {
          fetchLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tab])

  const topThree = useMemo(() => leaderboard.slice(0, 3), [leaderboard])

  return (
    <main className="av-main">
      <div className="av-hall">
        {/* Header */}
        <div className="hall-head">
          <h1>SALÓN DE LA FAMA</h1>
          <p>Los mejores jugadores de todos los tiempos</p>
        </div>

        {/* Tabs de juegos */}
        <div className="hall-tabs">
          {GAMES.map((game) => (
            <button
              key={game.id}
              className={`chip ${tab === game.id ? 'active' : ''}`}
              onClick={() => setTab(game.id)}
              disabled={loading}
            >
              {game.title}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p>CARGANDO LEADERBOARD...</p>
          </div>
        ) : (
          <>
            {/* Podio */}
            <Podium entries={topThree} />

            {/* Tabla de clasificación */}
            <Leaderboard entries={leaderboard} userEntry={userEntry} />
          </>
        )}

        {/* Botón volver */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button className="btn ghost lg" onClick={() => router.push('/biblioteca')} disabled={loading}>
            VOLVER A LA BIBLIOTECA
          </button>
        </div>
      </div>
    </main>
  )
}
