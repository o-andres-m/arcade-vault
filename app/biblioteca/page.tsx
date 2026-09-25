"use client";

import { useState, useMemo } from "react";
import { GAMES, CATS } from "@/lib/data";
import { GameCard } from "@/components/games/GameCard";

export default function BibliotecaPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("TODOS");

  const filteredGames = useMemo(() => {
    return GAMES.filter((game) => {
      const matchesCategory = category === "TODOS" || game.cat === category;
      const matchesQuery =
        query === "" ||
        game.title.toLowerCase().includes(query.toLowerCase()) ||
        game.short.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <main className="av-main">
      {/* Hero */}
      <div className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          JUEGA • COMPITE • DOMINA <span className="blink">_</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="av-filters">
        <div className="av-search">
          <span className="ico">◆</span>
          <input
            type="text"
            placeholder="Buscar juegos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="av-chips">
          {CATS.map((cat) => (
            <button
              key={cat}
              className={`chip ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de juegos */}
      {filteredGames.length > 0 ? (
        <div className="av-grid">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "var(--ink-dim)",
            fontFamily: "var(--pixel)",
            fontSize: "11px",
            letterSpacing: "0.12em",
          }}
        >
          NO SE ENCONTRARON JUEGOS_
        </div>
      )}
    </main>
  );
}
