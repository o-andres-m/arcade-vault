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

export interface User {
  name: string;
}

export interface Score {
  game: string;
  score: number;
  name: string;
  at: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  date: string;
}
