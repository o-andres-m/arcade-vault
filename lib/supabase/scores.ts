import { createClient } from './client'
import { LeaderboardEntry, RecentActivity, Score } from '@/types'
import { GAMES } from '@/lib/data'

export async function saveScore(gameId: string, score: number): Promise<Score> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Usuario no autenticado')

  const { data, error } = await supabase
    .from('scores')
    .insert({ user_id: user.id, game_id: gameId, score })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getLeaderboard(gameId: string, limit = 10): Promise<LeaderboardEntry[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      id,
      user_id,
      score,
      created_at,
      profiles (
        username,
        avatar_url
      )
    `
    )
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) throw error

  // Formatear respuesta con rank
  return data.map((entry, index) => ({
    rank: index + 1,
    user_id: entry.user_id,
    username: (entry.profiles as any)?.username || 'UNKNOWN',
    avatar_url: (entry.profiles as any)?.avatar_url || null,
    score: entry.score,
    created_at: entry.created_at,
  }))
}

export async function getRecentActivity(limit = 20): Promise<RecentActivity[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      id,
      game_id,
      score,
      created_at,
      profiles (
        username
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  // Lookup de game_title y color desde GAMES array
  return data.map((entry) => {
    const game = GAMES.find((g) => g.id === entry.game_id)
    return {
      id: entry.id,
      username: (entry.profiles as any)?.username || 'UNKNOWN',
      game_id: entry.game_id,
      game_title: game?.title || entry.game_id,
      score: entry.score,
      created_at: entry.created_at,
      color: game?.color || 'cyan',
    }
  })
}

export async function getTopPlayersToday(limit = 5) {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      user_id,
      score,
      profiles (
        username,
        avatar_url
      )
    `
    )
    .gte('created_at', today.toISOString())
    .order('score', { ascending: false })
    .limit(limit)

  if (error) throw error

  const grouped = new Map<string, { username: string; avatar_url: string | null; score: number }>()

  // Agrupar por user_id y tomar el score más alto
  data.forEach((entry) => {
    const key = entry.user_id
    if (!grouped.has(key) || entry.score > grouped.get(key)!.score) {
      grouped.set(key, {
        username: (entry.profiles as any)?.username || 'UNKNOWN',
        avatar_url: (entry.profiles as any)?.avatar_url || null,
        score: entry.score,
      })
    }
  })

  return Array.from(grouped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }))
}
