'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useReveal } from '@/hooks/useReveal'
import FloatingSilhouettes from '@/components/home/FloatingSilhouettes'
import MiniCard from '@/components/home/MiniCard'
import FeatureIcon from '@/components/home/FeatureIcon'
import { GAMES, FEATURES, STATS } from '@/lib/data'
import { generateRecentActivity, generateTopPlayers, type RecentScore, type TopPlayer } from '@/lib/utils'
import { getRecentActivity, getTopPlayersToday } from '@/lib/supabase/scores'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()
  useReveal()

  const [recentActivity, setRecentActivity] = useState<(RecentScore & { player?: string; game?: string; timeAgo?: string })[]>([])
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Intentar cargar datos reales de Supabase
        const [realActivity, realTopPlayers] = await Promise.all([
          getRecentActivity(7),
          getTopPlayersToday(5),
        ])

        // Convertir RecentActivity a RecentScore
        setRecentActivity(
          realActivity.map((item) => ({
            ...item,
            player: item.username,
            game: item.game_title,
            timeAgo: 'hace poco',
          })) as any
        )

        // Convertir topPlayers
        setTopPlayers(
          realTopPlayers.map((item) => ({
            rank: item.rank,
            player: item.username,
            score: item.score,
          }))
        )
      } catch (err) {
        // Fallback a datos mock si Supabase falla
        console.log('Usando datos mock para actividad')
        setRecentActivity(generateRecentActivity(7))
        setTopPlayers(generateTopPlayers(5))
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel('home-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'scores',
        },
        () => {
          loadData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="home fade-in">
      {/* 1. HERO */}
      <section className="home-hero">
        <FloatingSilhouettes />
        <div className="home-hero-inner">
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className="home-title">
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className="home-sub">
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className="home-ctas">
            <button className="btn xl pulse" onClick={() => router.push("/biblioteca")}>
              ▶ EXPLORAR JUEGOS
            </button>
            <button className="btn xl magenta" onClick={() => router.push("/auth")}>
              ✦ CREAR CUENTA
            </button>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      {/* 2. ¿POR QUÉ ARCADE VAULT? */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-magenta">// 01</div>
          <h2 className="section-title">¿POR QUÉ ARCADE VAULT?</h2>
          <div className="section-rule"></div>
        </div>
        <div className="feature-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`feature-card ${f.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <FeatureIcon kind={f.icon} />
              <div className="ft-title pixel">{f.title}</div>
              <div className="ft-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. JUEGOS DISPONIBLES */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-cyan">// 02</div>
          <h2 className="section-title">JUEGOS DISPONIBLES AHORA</h2>
          <div className="section-rule"></div>
        </div>
        <div className="mini-rail">
          {GAMES.slice(0, 6).map((g) => (
            <MiniCard key={g.id} game={g} onClick={() => router.push(`/juego/${g.id}`)} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn lg" onClick={() => router.push("/biblioteca")}>
            VER TODOS LOS JUEGOS →
          </button>
        </div>
      </section>

      {/* 4. STATS */}
      <section className="home-stats reveal">
        <div className="stats-inner">
          {STATS.map((st, i) => (
            <div key={i} className="stat-block" style={{ transitionDelay: `${i * 90}ms` }}>
              <div className="stat-n neon-yellow">{st.number}</div>
              <div className="stat-u pixel">{st.unit}</div>
              <div className="stat-s">{st.subtitle}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ACTIVIDAD EN VIVO */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-yellow">// 03</div>
          <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
          <div className="section-rule"></div>
        </div>
        <div className="activity-grid">
          {/* Card: Últimas puntuaciones */}
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className="ticker">
              {recentActivity.map((r, i) => (
                <div key={i} className="tick-row" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className={`tk-p neon-${r.color}`}>{r.player}</span>
                  <span className="tk-mid">▸ {r.game}</span>
                  <span className="tk-s">+{r.score.toLocaleString("es-ES")}</span>
                  <span className="tk-t">{r.timeAgo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Top jugadores */}
          <div className="activity-card">
            <div className="ac-head">
              <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES · HOY</div>
              <button className="lb-link" onClick={() => router.push("/salon")}>
                VER SALÓN →
              </button>
            </div>
            <div className="top-list">
              {topPlayers.map((r, i) => (
                <div
                  key={i}
                  className={`top-row ${
                    i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""
                  }`}
                >
                  <span className="tp-rk">#{String(r.rank).padStart(2, "0")}</span>
                  <span className="tp-bar">
                    <span className="tp-fill" style={{ width: `${100 - i * 16}%` }}></span>
                  </span>
                  <span className="tp-p">{r.player}</span>
                  <span className="tp-s">{r.score.toLocaleString("es-ES")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 y 7. PRECIOS + FAQ */}
      <section className="home-section reveal">
        <div className="section-head">
          <div className="kicker pixel neon-green">// 04</div>
          <h2 className="section-title">PRECIOS</h2>
          <div className="section-rule"></div>
        </div>
        <div className="pricing-grid">
          <div className="price-card">
            <div className="pc-label pixel">PLAN ÚNICO</div>
            <div className="pc-name pixel">JUGADOR VAULT</div>
            <div className="pc-amount">
              <span className="pc-amount-n">$0</span>
              <span className="pc-amount-u">/ SIEMPRE</span>
            </div>
            <div className="pc-tag">SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className="pc-list">
              <li>✔ Acceso a todos los juegos</li>
              <li>✔ Ranking global y salón de la fama</li>
              <li>✔ Sin anuncios entre partidas</li>
              <li>✔ Guarda tus puntuaciones</li>
              <li>✔ Nuevos juegos cada mes</li>
              <li>✔ Funciona en cualquier navegador</li>
            </ul>
            <button
              className="btn xl pulse"
              style={{ width: "100%" }}
              onClick={() => router.push("/auth")}
            >
              EMPEZAR GRATIS →
            </button>
            <div className="pc-foot">No pedimos tarjeta. Nunca lo haremos.</div>
            <div className="pc-stamp pixel">
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className="pricing-faq">
            <div className="faq-item">
              <div className="faq-q pixel">¿REALMENTE ES GRATIS?</div>
              <div className="faq-a">
                Sí. Arcade Vault es un proyecto sin fines de lucro hecho por amor a los clásicos. No
                hay versión &quot;premium&quot; escondida.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q pixel">¿NECESITO CREAR CUENTA?</div>
              <div className="faq-a">
                No. Puedes jugar como invitado. Si quieres guardar tu puntuación y aparecer en el
                ranking, regístrate en 10 segundos.
              </div>
            </div>
            <div className="faq-item">
              <div className="faq-q pixel">¿CÓMO SOBREVIVEN SIN COBRAR?</div>
              <div className="faq-a">
                Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda la moneda que
                aceptamos.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA FINAL */}
      <section className="home-final reveal">
        <h2 className="final-title pixel">¿LISTO PARA JUGAR?</h2>
        <button className="btn xl pulse final-cta" onClick={() => router.push("/biblioteca")}>
          INSERTAR MONEDA →
        </button>
        <div className="final-tag">Gratis. Sin registro obligatorio. Empieza en segundos.</div>
      </section>
    </div>
  );
}
