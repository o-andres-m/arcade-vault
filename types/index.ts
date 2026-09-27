export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: string;
  best: number;
  plays: string;
}

export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

// Legacy type for backward compatibility
export interface User {
  name: string;
}

// Tipo de sesión de Supabase
export interface AuthUser {
  id: string;
  email?: string;
  is_anonymous: boolean;
}

// Tipo de perfil (tabla profiles)
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  total_games: number;
  total_score: number;
  created_at: string;
  updated_at: string;
}

// Tipo de score (tabla scores) - Extiende el tipo antiguo para compatibilidad
export interface Score {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  created_at: string;
  // Campos heredados para compatibilidad
  game?: string;
  name?: string;
  at?: number;
  // Campos opcionales si se hace JOIN con profiles
  username?: string;
  avatar_url?: string | null;
}

// Tipo para leaderboard entry - Mantiene compatibilidad con propiedades antiguas
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  created_at: string;
  // Propiedades heredadas para compatibilidad
  name?: string;
  date?: string;
}

// Tipo para actividad en vivo (últimos scores)
export interface RecentActivity {
  id: string;
  username: string;
  game_id: string;
  game_title: string;
  score: number;
  created_at: string;
  color: string;
}
