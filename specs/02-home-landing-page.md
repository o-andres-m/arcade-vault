# 02 — Página HOME con Landing Page Completa

**Estado:** Implementado  
**Depende de:** SPEC 01  
**Fecha:** 2026-09-26

**Objetivo:** Implementar la página HOME como landing page principal en la ruta
`/`, replicando exactamente el diseño de referencia en
`references/home-about/home.jsx` y `references/home-about/styles.css`,
actualizar la navegación para incluir links "Inicio" y "Acerca de", y crear la
página `/about` con contenido placeholder.

---

## Alcance

### Incluido en esta especificación

- Página HOME en la ruta raíz `/` con 8 secciones completas:
  1. **Hero section** con título animado, CTAs y decoración
     (FloatingSilhouettes)
  2. **¿Por qué Arcade Vault?** — Grid de 4 features con iconos pixel art
  3. **Juegos disponibles ahora** — Mini-rail horizontal con 6 juegos
  4. **Stats** — Bloque de 3 estadísticas destacadas
  5. **Actividad en vivo** — Dos cards: últimas puntuaciones + top jugadores del
     día
  6. **Precios** — Card única con plan gratis
  7. **FAQ** — 3 preguntas frecuentes dentro de la sección de precios
  8. **CTA final** — Botón grande para empezar a jugar
- Componente `FloatingSilhouettes` con 8 siluetas SVG pixel art animadas
  (copiado de `references/home-about/home.jsx`)
- Componente `MiniCard` para preview de juegos en el rail
- Componente `FeatureIcon` con 4 iconos SVG (Gamepad, Free, Trophy, Rocket)
  (copiado de `references/home-about/home.jsx`)
- Efecto de scroll reveal (IntersectionObserver) para secciones con hook
  `useReveal`
- Datos de actividad en vivo generados con funciones `generateRecentActivity` y
  `generateTopPlayers`
- Actualización del componente `Nav` para incluir links "Inicio" y "Acerca de"
- Actualización del logo del Nav para navegar a `/` (home)
- Página `/about` con contenido placeholder
- Estilos completos del HOME copiados desde `references/home-about/styles.css` a
  `app/globals.css`
- Reemplazo del redirect actual en `app/page.tsx` por el componente Home

### NO incluido en esta especificación (se difiere)

- Animaciones avanzadas entre secciones (parallax, GSAP)
- Integración con API real para datos de actividad en vivo
- Vídeos o capturas de pantalla de juegos reales
- Sistema de newsletter o suscripción
- Chat de soporte o ayuda
- Footer expandido con links legales detallados
- Versión multiidioma (todo permanece en español)
- Tests unitarios para el Home (se pueden agregar en spec posterior)

---

## Modelo de datos

### Datos adicionales para el HOME (`lib/data.ts`)

Se agregarán al archivo existente:

```typescript
// Datos para sección de features (¿Por qué Arcade Vault?)
export const FEATURES = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

// Datos para sección de stats
export const STATS = [
  { number: "12+", unit: "JUEGOS", subtitle: "Y CONTANDO" },
  { number: "MILES", unit: "DE PARTIDAS", subtitle: "JUGADAS CADA DÍA" },
  { number: "GLOBAL", unit: "RANKING", subtitle: "COMPITE CON EL MUNDO" },
];

// Nombres de jugadores mock para actividad en vivo (se reutiliza PLAYERS existente)
// Los juegos usan IDs cortos para seeding: "caida", "gloton", etc.
```

### Función utilitaria para generar actividad en vivo

```typescript
// lib/utils.ts - agregar nueva función

export function generateRecentActivity(count: number): RecentScore[] {
  const games = [
    "Caída",
    "Glotón",
    "Invasores",
    "Rocas",
    "Bloque Buster",
    "Serpentina",
    "Ranaria",
  ];
  const players = [
    "NEONFOX",
    "PX_KAI",
    "Z3R0COOL",
    "VAULT_07",
    "GLITCHA",
    "ARKADYA",
    "CYBER_LU",
  ];
  const colors = ["magenta", "yellow", "green", "cyan"];

  return Array.from({ length: count }, (_, i) => ({
    player: players[i % players.length],
    game: games[i % games.length],
    score: Math.floor(Math.random() * 200000) + 10000,
    timeAgo: `hace ${2 + i * 3} min`,
    color: colors[i % colors.length],
  }));
}

export interface RecentScore {
  player: string;
  game: string;
  score: number;
  timeAgo: string;
  color: string;
}

export function generateTopPlayers(count: number): TopPlayer[] {
  const players = ["NEONFOX", "PX_KAI", "M00NRYU", "VAULT_07", "GLITCHA"];
  const baseScore = 312840;

  return players.slice(0, count).map((name, i) => ({
    rank: i + 1,
    player: name,
    score: baseScore - i * 60000,
  }));
}

export interface TopPlayer {
  rank: number;
  player: string;
  score: number;
}
```

### Componentes nuevos

```typescript
// components/home/FloatingSilhouettes.tsx
interface FloatingSilhouettesProps {}

// components/home/MiniCard.tsx
interface MiniCardProps {
  game: Game; // Reutiliza interface Game de types/index.ts
  onClick: () => void;
}

// components/home/FeatureIcon.tsx
interface FeatureIconProps {
  kind: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
}
```

---

## Plan de implementación

Cada paso deja el sistema en estado funcional (compilable y navegable).

### 1. Actualizar navegación con link "Inicio" y "Acerca de"

**Archivos modificados:**

- `components/navigation/Nav.tsx` — Actualizar estructura de navegación:
  - Agregar link "Inicio" como primer elemento (navega a `/`)
  - Agregar link "Acerca de" después de "Salón de la Fama" (navega a `/about`)
  - Actualizar el logo para que navegue a `/` en lugar de `/biblioteca`
  - Mantener estructura: Logo → Links → Spacer → Coin Counter → Auth Button →
    Hamburger

**Lógica de resaltado activo:**

- El link "Inicio" debe resaltar cuando la ruta actual sea `/`
- El link "Biblioteca" debe resaltar cuando la ruta sea `/biblioteca`,
  `/juego/[id]` o `/juego/[id]/jugar` (detalle y player también cuentan como
  biblioteca)
- El link "Salón de la Fama" debe resaltar cuando la ruta sea `/salon`
- El link "Acerca de" debe resaltar cuando la ruta sea `/about`
- En mobile, todos los links deben aparecer en el menú hamburguesa (incluir
  también link a "Cuenta" o "Iniciar Sesión")

**Verificación:** El Nav muestra "Inicio" y "Acerca de", el logo navega a `/`,
el resaltado activo funciona correctamente.

---

### 2. Agregar datos mock para el HOME

**Archivos modificados:**

- `lib/data.ts` — Agregar exports: `FEATURES`, `STATS`
- `lib/utils.ts` — Agregar funciones: `generateRecentActivity`,
  `generateTopPlayers` con sus interfaces

**Verificación:** `npm run build` pasa sin errores de tipos. Los datos se pueden
importar desde otros archivos.

---

### 3. Crear componentes visuales del HOME

**Archivos nuevos:**

- `components/home/FloatingSilhouettes.tsx` — Componente con 8 SVGs animados (s1
  a s8):
  - s1: Alien con forma de cangrejo
  - s2: Alien con forma de calamar
  - s3: UFO
  - s4: Cruz/símbolo plus
  - s5: UFO / platillo
  - s6: Moneda pixel
  - s7: Corazón pixel
  - s8: D-pad
  - Cada SVG con clase `.silo` y `.s{N}` para animación CSS
  - `aria-hidden="true"` (decorativo)
- `components/home/MiniCard.tsx` — Card pequeña de juego:
  - Cover con gradient (reutiliza clases de cover del spec 01)
  - Título y categoría
  - Click navega al detalle del juego
- `components/home/FeatureIcon.tsx` — Iconos SVG pixel art 16x16:
  - GAMEPAD: gamepad con d-pad y botones
  - FREE: letras F y E en cuadro
  - TROPHY: trofeo con asas
  - ROCKET: cohete con llamas
  - Props: `kind`, color heredado de `currentColor`

**CSS:**

- `app/globals.css` — Agregar estilos del HOME (copiar desde
  `references/home-about/css`):
  - **HOME PAGE section** (líneas 930-1069):
    - `.home` — Contenedor principal
    - `.home-hero` — Hero full-height con flexbox centrado
    - `.home-hero-inner` — Contenido interior del hero
    - `.hero-eyebrow` — Texto decorativo superior
    - `.home-title` — Título principal con gradient por línea
    - `.home-sub` — Subtítulo
    - `.home-ctas` — Contenedor de botones CTA
    - `.hero-scroll` — Indicador de scroll con flecha animada
    - `.home-silos` — Contenedor absoluto para silhouettes flotantes
    - `.silo` — Estilos base + animaciones de flotación (keyframe `float`)
    - `.home-section` — Contenedor de sección estándar
    - `.section-head` — Header de sección con kicker, título y rule
    - `.section-title` — Título de sección
    - `.section-rule` — Línea decorativa con gradient
    - `.feature-grid` — Grid 4 columnas (desktop) / 2 (tablet) / 1 (mobile)
    - `.feature-card` — Card con hover elevado y border color
    - `.ft-icon`, `.ft-title`, `.ft-desc` — Elementos de feature card
    - `.mini-rail` — Grid responsive 6-3-2 columnas
    - `.mini-card` — Card pequeña de juego
    - `.mini-cover`, `.mini-meta`, `.mini-title`, `.mini-cat` — Elementos de
      mini card
    - `.home-stats` — Sección de stats con background especial
    - `.stats-inner` — Grid de 3 stats
    - `.stat-block` — Bloque individual de estadística
    - `.stat-n`, `.stat-u`, `.stat-s` — Elementos de stat
    - `.home-final` — CTA final con líneas decorativas
    - `.final-title` — Título final con gradient
    - `.final-cta` — Botón CTA grande
    - `.final-tag` — Texto secundario
    - `.reveal` y `.reveal.in` — Animación de scroll reveal
  - **ACTIVITY section** (líneas 1621-1670):
    - `.activity-grid` — Grid 2 columnas (desktop) / 1 (mobile)
    - `.activity-card` — Card de actividad
    - `.ac-head` — Header de activity card
    - `.ac-title` — Título de activity card
    - `.lb-link` — Link "VER SALÓN"
    - `.ticker` — Contenedor de últimas puntuaciones
    - `.tick-row` — Fila de puntuación con animación `tickin`
    - `.tk-p`, `.tk-mid`, `.tk-s`, `.tk-t` — Elementos de tick row
    - `.top-list` — Lista de top jugadores
    - `.top-row` — Fila de top player con background gradient
    - `.tp-rk`, `.tp-p`, `.tp-s` — Elementos de top row
    - Clases `.top1`, `.top2`, `.top3` — Estilos especiales para podio
  - **PRICING section** (líneas 1672-1729):
    - `.pricing-grid` — Grid 2 columnas (desktop) / 1 (mobile)
    - `.price-card` — Card de precio con border verde y efectos
    - `.pc-label`, `.pc-name`, `.pc-amount`, `.pc-amount-n`, `.pc-amount-u` —
      Elementos de precio
    - `.pc-tag` — Tag decorativo
    - `.pc-list` — Lista de features
    - `.pc-foot` — Footer del price card
    - `.pc-stamp` — Stamp "FREE PLAY" rotado
    - `.pricing-faq` — Contenedor de FAQ
    - `.faq-item` — Item individual de FAQ con border lateral
    - `.faq-q`, `.faq-a` — Pregunta y respuesta
  - Animaciones adicionales: `fadeIn`, `slideIn`

**Verificación:** Los estilos se aplican correctamente en todas las secciones
del HOME.

---

### 4. Crear custom hook `useReveal`

**Archivos nuevos:**

- `hooks/useReveal.ts` — Hook para scroll reveal:
  - Selecciona todos los elementos con clase `.reveal`
  - Crea IntersectionObserver con threshold 0.12
  - Al intersectar, agrega clase `.in` al target
  - Desconecta el observer en cleanup

**Verificación:** El hook se puede importar y usar en componentes.

---

### 5. Implementar página HOME en `/`

**Archivos modificados:**

- `app/page.tsx` — Reemplazar redirect por el componente Home completo

**Estructura del componente Home:**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useReveal } from "@/hooks/useReveal";
import FloatingSilhouettes from "@/components/home/FloatingSilhouettes";
import MiniCard from "@/components/home/MiniCard";
import FeatureIcon from "@/components/home/FeatureIcon";
import { GAMES, FEATURES, STATS } from "@/lib/data";
import { generateRecentActivity, generateTopPlayers } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  useReveal();

  const recentActivity = generateRecentActivity(7);
  const topPlayers = generateTopPlayers(5);

  return (
    <div className="home fade-in">
      {/* 1. HERO */}
      <section className={homeHero}>
        <FloatingSilhouettes />
        <div className={homeHeroInner}>
          <div className="hero-eyebrow pixel neon-yellow">
            ▸ INSERTA UNA MONEDA<span className="blink">_</span>
          </div>
          <h1 className={homeTitle}>
            <span className="line-1">EL ARCADE</span>
            <span className="line-2">CLÁSICO ESTÁ</span>
            <span className="line-3">DE VUELTA</span>
          </h1>
          <p className={homeSub}>
            Juega los mejores clásicos directamente en tu navegador.
            <br />
            Sin descargas. Sin costo. Solo diversión.
          </p>
          <div className={homeCtasContainer}>
            <button
              className="btn xl pulse"
              onClick={() => router.push("/biblioteca")}
            >
              ▶ EXPLORAR JUEGOS
            </button>
            <button
              className="btn xl magenta"
              onClick={() => router.push("/auth")}
            >
              ✦ CREAR CUENTA
            </button>
          </div>
          <div className={heroScroll} aria-hidden="true">
            <span>DESLIZA</span>
            <span className="arrow">▼</span>
          </div>
        </div>
      </section>

      {/* 2. ¿POR QUÉ ARCADE VAULT? */}
      <section className={homeSection + " reveal"}>
        <div className={sectionHead}>
          <div className="kicker pixel neon-magenta">// 01</div>
          <h2 className={sectionTitle}>¿POR QUÉ ARCADE VAULT?</h2>
          <div className={sectionRule}></div>
        </div>
        <div className={featureGrid}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`${featureCard} ${f.color}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <FeatureIcon kind={f.icon} />
              <div className={ftTitle + " pixel"}>{f.title}</div>
              <div className={ftDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. JUEGOS DISPONIBLES */}
      <section className={homeSection + " reveal"}>
        <div className={sectionHead}>
          <div className="kicker pixel neon-cyan">// 02</div>
          <h2 className={sectionTitle}>JUEGOS DISPONIBLES AHORA</h2>
          <div className={sectionRule}></div>
        </div>
        <div className={miniRail}>
          {GAMES.slice(0, 6).map((g) => (
            <MiniCard
              key={g.id}
              game={g}
              onClick={() => router.push(`/juego/${g.id}`)}
            />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button className="btn lg" onClick={() => router.push("/biblioteca")}>
            VER TODOS LOS JUEGOS →
          </button>
        </div>
      </section>

      {/* 4. STATS */}
      <section className={homeStats + " reveal"}>
        <div className={statsInner}>
          {STATS.map((st, i) => (
            <div
              key={i}
              className={statBlock}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className={statN + " neon-yellow"}>{st.number}</div>
              <div className={statU + " pixel"}>{st.unit}</div>
              <div className={statS}>{st.subtitle}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ACTIVIDAD EN VIVO */}
      <section className={homeSection + " reveal"}>
        <div className={sectionHead}>
          <div className="kicker pixel neon-yellow">// 03</div>
          <h2 className={sectionTitle}>ACTIVIDAD EN VIVO</h2>
          <div className={sectionRule}></div>
        </div>
        <div className={activityGrid}>
          {/* Card: Últimas puntuaciones */}
          <div className={activityCard}>
            <div className={acHead}>
              <div className={acTitle + " pixel"}>▸ ÚLTIMAS PUNTUACIONES</div>
            </div>
            <div className={ticker}>
              {recentActivity.map((r, i) => (
                <div
                  key={i}
                  className={tickRow}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className={`tk-p neon-${r.color}`}>{r.player}</span>
                  <span className="tk-mid">▸ {r.game}</span>
                  <span className="tk-s">
                    +{r.score.toLocaleString("es-ES")}
                  </span>
                  <span className="tk-t">{r.timeAgo}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Top jugadores */}
          <div className={activityCard}>
            <div className={acHead}>
              <div className={acTitle + " pixel neon-magenta"}>
                ▸ TOP JUGADORES · HOY
              </div>
              <button className={lbLink} onClick={() => router.push("/salon")}>
                VER SALÓN →
              </button>
            </div>
            <div className={topList}>
              {topPlayers.map((r, i) => (
                <div
                  key={i}
                  className={`${topRow} ${i === 0 ? top1 : i === 1 ? top2 : i === 2 ? top3 : ""}`}
                >
                  <span className={tpRk}>
                    #{String(r.rank).padStart(2, "0")}
                  </span>
                  <span className={tpBar}>
                    <span
                      className={tpFill}
                      style={{ width: `${100 - i * 16}%` }}
                    ></span>
                  </span>
                  <span className={tpP}>{r.player}</span>
                  <span className={tpS}>{r.score.toLocaleString("es-ES")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6 y 7. PRECIOS + FAQ */}
      <section className={homeSection + " reveal"}>
        <div className={sectionHead}>
          <div className="kicker pixel neon-green">// 04</div>
          <h2 className={sectionTitle}>PRECIOS</h2>
          <div className={sectionRule}></div>
        </div>
        <div className={pricingGrid}>
          <div className={priceCard}>
            <div className={pcLabel + " pixel"}>PLAN ÚNICO</div>
            <div className={pcName + " pixel"}>JUGADOR VAULT</div>
            <div className={pcAmount}>
              <span className={pcAmountN}>$0</span>
              <span className={pcAmountU}>/ SIEMPRE</span>
            </div>
            <div className={pcTag}>SIN TRUCOS · SIN LETRA PEQUEÑA</div>
            <ul className={pcList}>
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
            <div className={pcFoot}>No pedimos tarjeta. Nunca lo haremos.</div>
            <div className={pcStamp + " pixel"}>
              FREE
              <br />
              PLAY
            </div>
          </div>

          <div className={pricingFaq}>
            <div className={faqItem}>
              <div className={faqQ + " pixel"}>¿REALMENTE ES GRATIS?</div>
              <div className={faqA}>
                Sí. Arcade Vault es un proyecto sin fines de lucro hecho por
                amor a los clásicos. No hay versión "premium" escondida.
              </div>
            </div>
            <div className={faqItem}>
              <div className={faqQ + " pixel"}>¿NECESITO CREAR CUENTA?</div>
              <div className={faqA}>
                No. Puedes jugar como invitado. Si quieres guardar tu puntuación
                y aparecer en el ranking, regístrate en 10 segundos.
              </div>
            </div>
            <div className={faqItem}>
              <div className={faqQ + " pixel"}>
                ¿CÓMO SOBREVIVEN SIN COBRAR?
              </div>
              <div className={faqA}>
                Es un proyecto comunitario. Si te gusta, compártelo. Esa es toda
                la moneda que aceptamos.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA FINAL */}
      <section className={homeFinal + " reveal"}>
        <h2 className={finalTitle + " pixel"}>¿LISTO PARA JUGAR?</h2>
        <button
          className="btn xl pulse final-cta"
          onClick={() => router.push("/biblioteca")}
        >
          INSERTAR MONEDA →
        </button>
        <div className={finalTag}>
          Gratis. Sin registro obligatorio. Empieza en segundos.
        </div>
      </section>
    </div>
  );
}
```

**Verificación:** La ruta `/` muestra el HOME completo con todas las secciones.
Los botones navegan correctamente.

---

### 6. Crear página About con placeholder

**Archivos nuevos:**

- `app/about/page.tsx` — Página simple con texto placeholder:

```tsx
export default function About() {
  return (
    <div
      className="page-container"
      style={{ padding: "4rem 2rem", textAlign: "center" }}
    >
      <h1
        className="pixel neon-cyan"
        style={{ fontSize: "2rem", marginBottom: "1rem" }}
      >
        SOBRE NOSOTROS
      </h1>
      <p style={{ fontSize: "1.2rem", color: "#888" }}>
        Contenido próximamente...
      </p>
    </div>
  );
}
```

**Verificación:** La ruta `/about` carga sin errores y muestra el placeholder.

---

### 7. Ajustes de estilos globales y responsive

**Archivos modificados:**

- `app/globals.css` — Verificar que existan todas las clases utilitarias del
  archivo de referencia:
  - `.fade-in` — Animación de entrada (keyframe `fadeIn`)
  - `.blink` — Animación de cursor (keyframe `blink`)
  - `.btn.pulse` — Animación de pulso para CTAs (keyframe `pulse`)
  - Clases `.neon-cyan`, `.neon-magenta`, `.neon-yellow`, `.neon-green` con
    text-shadow
  - `.pixel` — Fuente pixel art con letter-spacing
  - `.kicker` — Pequeño label decorativo (si no existe)
  - Animaciones de keyframes: `float`, `bounce`, `tickin`, `fadeIn`, `slideIn`
  - Todas las media queries para responsive ya están incluidas en los estilos
    copiados del paso 3

**Verificación:** Todas las clases CSS referenciadas en el Home se aplican
correctamente. El diseño es completamente responsive.

---

### 8. Verificación final y ajustes

- Probar navegación completa: `/` → `/biblioteca` → `/juego/[id]` → `/auth` →
  `/salon` → `/about` → `/`
- Verificar que el link "Inicio" en Nav funciona y resalta en `/`
- Verificar scroll reveal en todas las secciones del Home
- Verificar responsive (mobile + desktop):
  - Hero con CTAs apilados en mobile
  - Feature grid 1 columna en mobile
  - Mini-rail con scroll horizontal
  - Activity grid apilado en mobile
  - Pricing grid apilado en mobile
- Verificar que no hay errores de compilación: `npm run build`
- Verificar que no hay errores de consola en el navegador

**Verificación final:**

- ✅ La ruta `/` muestra el HOME completo con 8 secciones
- ✅ Los botones "EXPLORAR JUEGOS" y "CREAR CUENTA" navegan correctamente
- ✅ El Nav tiene link "Inicio" que navega a `/`
- ✅ La página `/about` existe con placeholder
- ✅ Los datos de actividad en vivo se generan con funciones mock
- ✅ El diseño es responsive (mobile + desktop)
- ✅ Efectos de scroll reveal funcionan correctamente
- ✅ No hay errores de TypeScript ni de compilación

---

## Criterios de aceptación

- [ ] La ruta `/` renderiza el componente Home (ya no redirige a `/biblioteca`)
- [ ] El componente `Nav` muestra el link "Inicio" como primer elemento de
      navegación
- [ ] El componente `Nav` muestra el link "Acerca de" después de "Salón de la
      Fama"
- [ ] El link "Inicio" en el Nav resalta cuando la ruta actual es `/`
- [ ] El link "Acerca de" en el Nav resalta cuando la ruta actual es `/about`
- [ ] El logo del Nav navega a `/` (home) en lugar de `/biblioteca`
- [ ] El HOME muestra las 8 secciones en orden:
  - [ ] Hero con título "EL ARCADE CLÁSICO ESTÁ DE VUELTA" y 2 CTAs
  - [ ] "¿POR QUÉ ARCADE VAULT?" con 4 feature cards (Gamepad, Free, Trophy,
        Rocket)
  - [ ] "JUEGOS DISPONIBLES AHORA" con mini-rail de 6 juegos
  - [ ] Stats con 3 bloques (12+ juegos, Miles de partidas, Global ranking)
  - [ ] "ACTIVIDAD EN VIVO" con 2 cards (últimas puntuaciones + top jugadores)
  - [ ] "PRECIOS" con 1 price card (plan gratis)
  - [ ] FAQ con 3 preguntas dentro de la sección de precios
  - [ ] CTA final "¿LISTO PARA JUGAR?"
- [ ] El componente `FloatingSilhouettes` renderiza 8 SVGs animados (s1 a s8)
- [ ] Las siluettes flotan con animación CSS (translateY + duración variable)
- [ ] Los iconos de features (Gamepad, Free, Trophy, Rocket) se renderizan
      correctamente
- [ ] El botón "▶ EXPLORAR JUEGOS" navega a `/biblioteca`
- [ ] El botón "✦ CREAR CUENTA" navega a `/auth`
- [ ] El botón "VER TODOS LOS JUEGOS →" navega a `/biblioteca`
- [ ] Los `MiniCard` en el rail son clickeables y navegan a `/juego/[id]`
- [ ] El botón "VER SALÓN →" en actividad en vivo navega a `/salon`
- [ ] El botón "EMPEZAR GRATIS →" en precios navega a `/auth`
- [ ] El botón "INSERTAR MONEDA →" en CTA final navega a `/biblioteca`
- [ ] La sección de actividad en vivo muestra:
  - [ ] 7 filas de últimas puntuaciones con datos generados por
        `generateRecentActivity`
  - [ ] 5 filas de top jugadores con datos generados por `generateTopPlayers`
  - [ ] Cada fila de puntuación tiene: jugador (con color neon), juego,
        puntuación formateada, tiempo relativo
  - [ ] Cada fila de top players tiene: rango (#01, #02...), barra de progreso,
        jugador, puntuación
- [ ] Las secciones con clase `.reveal` aparecen al hacer scroll
      (IntersectionObserver)
- [ ] Al intersectar, se agrega la clase `.in` y se aplica la animación de
      entrada
- [ ] La ruta `/about` existe y muestra:
  - [ ] Título "SOBRE NOSOTROS" con estilo pixel neon cyan
  - [ ] Texto placeholder "Contenido próximamente..."
- [ ] El diseño del HOME es responsive:
  - [ ] Feature grid 2x2 en desktop, 1 columna en mobile
  - [ ] Activity grid 2 columnas en desktop, 1 columna en mobile
  - [ ] Pricing grid 2 columnas en desktop, 1 columna en mobile
  - [ ] CTAs del hero apilados verticalmente en mobile
  - [ ] Mini-rail con scroll horizontal en mobile
- [ ] No hay errores de TypeScript: `npm run build` pasa
- [ ] No hay errores de consola en el navegador al navegar por el HOME
- [ ] No hay warnings de accesibilidad en componentes decorativos (aria-hidden
      en silhouettes)
- [ ] Los datos de features, stats, actividad se importan correctamente desde
      `lib/data.ts` y `lib/utils.ts`

---

## Decisiones tomadas

1. **HOME como ruta raíz**: Se decidió que el HOME viva en `/` y reemplace el
   redirect actual a `/biblioteca`. Esto sigue el patrón estándar de landing
   pages donde la ruta raíz es la presentación del producto y la biblioteca es
   una sección interna.

2. **Datos de actividad generados con funciones**: Se crean funciones
   `generateRecentActivity` y `generateTopPlayers` para generar datos mock
   consistentes en lugar de hardcodear arrays. Esto facilita futura integración
   con API real (solo cambiar la implementación de las funciones).

3. **Componentes separados para elementos reutilizables**: Se crean componentes
   independientes (`FloatingSilhouettes`, `MiniCard`, `FeatureIcon`) en lugar de
   definir todo en el archivo de página. Esto mejora la legibilidad y permite
   reutilización futura (ej: `MiniCard` podría usarse en otras páginas).

4. **Estilos globales para el Home**: Todos los estilos del HOME se agregan a
   `app/globals.css` siguiendo el patrón del diseño de referencia. Se mantienen
   en CSS global para facilitar la consistencia visual con el resto de la
   aplicación arcade retro.

5. **IntersectionObserver con hook personalizado**: Se crea un hook `useReveal`
   reutilizable en lugar de implementar IntersectionObserver directamente en el
   componente. Esto permite usar el mismo efecto en otras páginas futuras sin
   duplicar lógica.

6. **Links "Inicio" y "Acerca de" en el Nav**: Se agregan dos nuevos links de
   navegación:
   - "Inicio" como primer elemento (navega a `/`)
   - "Acerca de" después de "Salón de la Fama" (navega a `/about`) Esto completa
     la navegación siguiendo el patrón estándar de sitios web donde "Home"
     aparece primero y "About" al final.

7. **Logo navega a home**: El logo del Nav ahora navega a `/` (home) en lugar de
   `/biblioteca`. Esto sigue el comportamiento estándar de logos en landing
   pages donde siempre llevan al usuario a la página principal.

8. **Página About como placeholder**: La página `/about` se implementa con
   contenido mínimo (título + texto) sin diseño elaborado. Esto cumple el
   requisito sin gastar tiempo en contenido que no está definido. Se puede
   expandir en spec futura.

9. **Reutilización de interfaces existentes**: `MiniCard` usa la interface
   `Game` del spec 01 sin modificaciones. Esto mantiene consistencia en el
   modelo de datos y evita duplicación de tipos.

10. **Números mock sin lógica de backend**: Los stats ("12+ juegos", "MILES de
    partidas") son strings estáticos porque no hay backend real. Cuando se
    integre API, se pueden reemplazar por números dinámicos.

11. **Client Component para el Home**: El Home es un Client Component
    (`'use client'`) porque usa hooks (`useRouter`, `useReveal`) y event
    handlers (`onClick`). Aunque Next.js App Router prefiere Server Components,
    la interactividad del Home lo requiere.

12. **Estilos copiados directamente del diseño de referencia**: Todos los
    estilos del HOME se copian tal cual desde `references/home-about/css` para
    mantener fidelidad visual absoluta con el diseño original. Esto incluye
    todas las animaciones, responsive breakpoints, y efectos visuales.

---

## Decisiones descartadas

1. **Cargar actividad en vivo desde localStorage**: Se descartó leer `av_scores`
   de localStorage para mostrar actividad real. Razón: localStorage puede estar
   vacío (usuario nuevo) o tener pocos datos, lo que resultaría en una sección
   vacía o incompleta. Los datos mock garantizan que la sección siempre se vea
   poblada.

2. **Animaciones con GSAP**: Se descartó usar GSAP para animaciones avanzadas
   (parallax, timeline). Razón: agrega dependencia externa y complejidad. Las
   animaciones CSS son suficientes para el MVP y mantienen el bundle size
   pequeño.

3. **Video o screenshots de juegos reales**: Se descartó agregar media rica en
   el hero o sección de juegos. Razón: los juegos aún son simulaciones visuales
   (no reales) según spec 01, así que no hay contenido auténtico para mostrar.

4. **Sistema de tabs para secciones**: Se descartó agrupar contenido en tabs
   (ej: features + games en una sola sección con tabs). Razón: el diseño de
   referencia usa scroll largo (long scroll landing page), que es mejor para SEO
   y engagement.

5. **Footer expandido con links legales**: Se descartó crear footer con
   secciones de "Términos", "Privacidad", etc. Razón: fuera del alcance de esta
   spec. El footer del spec 01 es simple y suficiente para el MVP.

6. **Lazy loading de secciones**: Se descartó implementar lazy loading para
   componentes del Home. Razón: el Home es una sola página sin mucho contenido
   pesado (solo SVGs y texto). Lazy loading agregaría complejidad sin beneficio
   medible.

7. **Internacionalización (i18n)**: Se descartó preparar el Home para
   multiidioma. Razón: según CLAUDE.md, el proyecto está completamente en
   español. No hay requisito de soportar otros idiomas.

8. **About con diseño completo**: Se descartó diseñar la página About con layout
   elaborado. Razón: el requisito del usuario especifica explícitamente que "el
   about no tiene que tener nada dentro (solo aparecerá el texto)". El contenido
   real de About no está definido, así que se implementa solo como placeholder
   para que el link del Nav no quede roto. La página completa de About se puede
   desarrollar en una spec futura cuando se defina el contenido.

---

## Riesgos identificados

1. **Cambio de ruta raíz puede afectar usuarios que guardaron `/` como
   bookmark**: Si alguien guardó la ruta `/` antes (que redirige a
   `/biblioteca`), ahora verá el HOME. **Mitigación**: Es un cambio esperado en
   una landing page. No es crítico porque el botón principal del HOME lleva a
   `/biblioteca`.

2. **Scroll reveal puede no funcionar en navegadores sin IntersectionObserver**:
   Navegadores muy antiguos (IE11) no soportan IntersectionObserver.
   **Mitigación**: El spec 01 ya usa APIs modernas (React 19, Next.js 16), así
   que no hay soporte legacy. Las secciones simplemente aparecerán de inmediato
   sin animación, lo cual es aceptable.

3. **Muchas animaciones CSS pueden afectar rendimiento en mobile**: El Home
   tiene silhouettes flotantes, scroll reveal, animaciones de ticker, etc.
   **Mitigación**: Usar `will-change` en elementos animados, `transform` en
   lugar de `top/left`, y considerar reducir animaciones en mobile con
   `@media (prefers-reduced-motion: reduce)`.

4. **Mini-rail horizontal puede no ser obvio que es scrollable**: En mobile, el
   usuario puede no darse cuenta que puede hacer scroll horizontal en la lista
   de juegos. **Mitigación**: Agregar efecto de fade en los bordes del rail o
   flechas de navegación visibles en desktop.

5. **Datos mock de actividad en vivo siempre son los mismos**: Cada vez que se
   carga el HOME, los datos de "actividad en vivo" son generados de nuevo pero
   con los mismos valores (porque no hay seed variable). **Mitigación**:
   Aceptable para MVP. En producción se reemplazará con API real.
   Alternativamente, se puede usar `Math.random()` con seed basado en timestamp
   para variación.

6. **Cambio en navegación del logo puede afectar usuarios acostumbrados**: El
   Nav del spec 01 tiene logo clickeable que navega a `/biblioteca`. Ahora
   navega a `/` (home). **Mitigación**: Es un cambio esperado en el patrón de
   landing pages. El link "Biblioteca" en el Nav siempre está disponible para
   acceso directo.
