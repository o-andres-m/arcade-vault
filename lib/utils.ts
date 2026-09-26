import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LeaderboardEntry } from "@/types";
import { PLAYERS } from "./data";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function seededScores(seed: number, count: number = 12): LeaderboardEntry[] {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const used = new Set<string>();
  const rows: LeaderboardEntry[] = [];

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = PLAYERS[Math.floor(rand() * PLAYERS.length)];
    } while (used.has(name) && used.size < PLAYERS.length);
    used.add(name);

    const base = Math.floor(50000 + rand() * 250000);
    const score = base - i * Math.floor(2000 + rand() * 4000);
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
    const mon = String(1 + Math.floor(rand() * 12)).padStart(2, "0");

    rows.push({
      rank: i + 1,
      name,
      score: Math.max(score, 1000),
      date: `${day}/${mon}/2026`,
    });
  }

  return rows.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
}

export interface RecentScore {
  player: string;
  game: string;
  score: number;
  timeAgo: string;
  color: string;
}

export function generateRecentActivity(count: number): RecentScore[] {
  const games = ["Caída", "Glotón", "Invasores", "Rocas", "Bloque Buster", "Serpentina", "Ranaria"];
  const players = ["NEONFOX", "PX_KAI", "Z3R0COOL", "VAULT_07", "GLITCHA", "ARKADYA", "CYBER_LU"];
  const colors = ["magenta", "yellow", "green", "cyan"];

  return Array.from({ length: count }, (_, i) => ({
    player: players[i % players.length],
    game: games[i % games.length],
    score: Math.floor(Math.random() * 200000) + 10000,
    timeAgo: `hace ${2 + i * 3} min`,
    color: colors[i % colors.length],
  }));
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}

export function generateTopPlayers(count: number): TopPlayer[] {
  const players = ["NEONFOX", "PX_KAI", "M00NRYU", "VAULT_07", "GLITCHA"];
  const baseScore = 312840;

  return players.slice(0, count).map((name, i) => ({
    rank: i + 1,
    player: name,
    score: baseScore - (i * 60000),
  }));
}
