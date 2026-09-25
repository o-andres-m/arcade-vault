"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/data";
import { seededScores } from "@/lib/utils";
import { User } from "@/types";
import { Podium } from "@/components/games/Podium";
import { Leaderboard } from "@/components/games/Leaderboard";

export default function SalonPage() {
  const router = useRouter();
  const [tab, setTab] = useState(GAMES[0].id);
  const [user, setUser] = useState<User | null>(null);

  // Leer usuario de localStorage
  useEffect(() => {
    const stored = localStorage.getItem("av_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const leaderboard = useMemo(() => {
    const seed = tab.length * 23 + 7;
    return seededScores(seed, 12);
  }, [tab]);

  const userEntry = useMemo(() => {
    if (!user || leaderboard.length < 6) return null;

    const rank = Math.floor(8 + (tab.length % 4));
    const score = leaderboard[5].score - 2400;

    return {
      rank,
      name: user.name,
      score,
      date: new Date().toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    };
  }, [user, leaderboard, tab]);

  const topThree = leaderboard.slice(0, 3);

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
              className={`chip ${tab === game.id ? "active" : ""}`}
              onClick={() => setTab(game.id)}
            >
              {game.title}
            </button>
          ))}
        </div>

        {/* Podio */}
        <Podium entries={topThree} />

        {/* Tabla de clasificación */}
        <Leaderboard entries={leaderboard} userEntry={userEntry} />

        {/* Botón volver */}
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <button className="btn ghost lg" onClick={() => router.push("/biblioteca")}>
            VOLVER A LA BIBLIOTECA
          </button>
        </div>
      </div>
    </main>
  );
}
