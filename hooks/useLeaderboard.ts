'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLeaderboard } from '@/lib/supabase/scores'
import { seededScores } from '@/lib/utils'
import type { LeaderboardEntry } from '@/types'

export function useLeaderboard(gameId: string, limit = 10) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data = await getLeaderboard(gameId, limit)
        setEntries(data.length > 0 ? data : seededScores(gameId.length * 17 + 3, limit))
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'))
        setEntries(seededScores(gameId.length * 17 + 3, limit))
      } finally {
        setIsLoading(false)
      }
    }

    fetchScores()

    const channel = supabase
      .channel(`leaderboard-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scores',
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          fetchScores()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId, limit])

  return { entries, isLoading, error }
}
