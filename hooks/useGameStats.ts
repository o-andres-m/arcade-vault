'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './useAuth'
import { createClient } from '@/lib/supabase/client'
import type { GameTableRow } from '@/types'

export function useGameStats(gameIds: string[]) {
  const { user } = useAuth()
  const [stats, setStats] = useState<Record<string, GameTableRow>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        setError(null)

        if (!user || user.is_anonymous) {
          const emptyStats: Record<string, GameTableRow> = {}
          gameIds.forEach((id) => {
            emptyStats[id] = {
              gameId: id,
              gameName: '',
              lastPlayed: null,
              bestScore: null,
              isPending: false,
            }
          })
          setStats(emptyStats)
          setIsLoading(false)
          return
        }

        const statsMap: Record<string, GameTableRow> = {}

        for (const gameId of gameIds) {
          const { data, error: fetchError } = await supabase
            .from('scores')
            .select('score, created_at')
            .eq('user_id', user.id)
            .eq('game_id', gameId)
            .order('score', { ascending: false })
            .limit(1)

          if (fetchError) throw fetchError

          const bestScore = data?.[0]?.score || null
          const lastPlayed = data?.[0]?.created_at || null

          statsMap[gameId] = {
            gameId,
            gameName: '',
            bestScore,
            lastPlayed,
            isPending: false,
          }
        }

        setStats(statsMap)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error desconocido'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user, gameIds.join(',')])

  return { stats, isLoading, error }
}
