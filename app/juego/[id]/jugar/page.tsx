"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/data";
import { GamePlayer } from "@/components/games/GamePlayer";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function JugarPage({ params }: PageProps) {
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
      <GamePlayer game={game} />
    </main>
  );
}
