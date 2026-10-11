"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/data";
import { Leaderboard } from "@/components/leaderboard/Leaderboard";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function JuegoDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);

  const game = useMemo(() => {
    return GAMES.find((g) => g.id === id);
  }, [id]);

  if (!game) {
    return (
      <main className="av-main" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h1 className="pixel neon-magenta" style={{ fontSize: "24px", marginBottom: "20px" }}>
          JUEGO NO ENCONTRADO
        </h1>
        <button className="btn ghost" onClick={() => router.push("/biblioteca")}>
          VOLVER AL VAULT
        </button>
      </main>
    );
  }

  return (
    <main className="av-main">
      <div className="av-detail">
        {/* Columna izquierda */}
        <div>
          <div className="detail-cover">
            <div className={`cover-bg ${game.cover}`} />
          </div>

          <div className="detail-info">
            <div className="detail-tags">
              <span>{game.cat}</span>
              <span>1-2 JUGADORES</span>
              <span>TECLADO</span>
              <span>2026</span>
            </div>

            <h2 className="neon-cyan">{game.title}</h2>

            <p>{game.long}</p>

            <div className="stat-strip">
              <div>
                <div className="l">Partidas</div>
                <div className="v">{game.plays}</div>
              </div>
              <div>
                <div className="l">Mejor global</div>
                <div className="v">{game.best.toLocaleString()}</div>
              </div>
              <div>
                <div className="l">Dificultad</div>
                <div className="v">★★★☆☆</div>
              </div>
            </div>

            <div className="detail-actions">
              <button
                className="btn xl pulse"
                onClick={() => router.push(`/juego/${game.id}/jugar`)}
              >
                ▶ JUGAR AHORA
              </button>
              <button className="btn ghost lg" onClick={() => router.push("/biblioteca")}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>

        {/* Columna derecha: Leaderboard */}
        <Leaderboard gameId={id} />
      </div>
    </main>
  );
}
