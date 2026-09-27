# 01 — MVP Interfaz Visual de Arcade Vault

**Estado:** Implementado  
**Depende de:** —  
**Fecha:** 2026-09-25

**Objetivo:** Implementar todas las pantallas visuales del MVP de Arcade Vault
basándose en las plantillas de referencia, sin implementar juegos reales,
utilizando Next.js 16 con App Router, React 19 y Tailwind CSS v4.

---

## Alcance

### Incluido en esta especificación

- Migración de 5 pantallas principales desde templates React vanilla a Next.js
  16:
  - **Biblioteca** (`/biblioteca`): Grid de juegos con búsqueda y filtros por
    categoría
  - **Detalle de juego** (`/juego/[id]`): Información del juego y tabla de
    puntuaciones
  - **Reproductor** (`/juego/[id]/jugar`): Simulación visual CRT con HUD y
    efectos
  - **Autenticación** (`/auth`): Login/signup con tabs y opciones sociales
    (mock)
  - **Salón de la Fama** (`/salon`): Podio y tabla de clasificación con tabs por
    juego
- Navegación completa con Next.js App Router (rutas dinámicas)
- Componente de navegación (Nav) responsive con menú hamburguesa
- Sistema de autenticación mock con localStorage (login/signup/logout)
- Persistencia de puntuaciones en localStorage
- Interfaces TypeScript completas para todos los modelos de datos
- Datos mock (8 juegos, categorías, generador de puntuaciones seeded)
- Estética retro arcade completa:
  - Efectos visuales: grid 3D animado, scanlines, noise, glow neon
  - Fuentes pixel art (Press Start 2P) y monospace (JetBrains Mono)
  - Paleta de colores neon (cyan, magenta, yellow, green)
- Diseño responsive (desktop y mobile)

### NO incluido en esta especificación (se difiere)

- Implementación de juegos reales jugables (solo simulación visual)
- Integración con backend o base de datos real
- Autenticación real con OAuth (Google, GitHub)
- Sistema de créditos/monedas funcional
- Modo multijugador o versus
- Sistema de logros o recompensas
- Perfiles de usuario editables
- Filtros avanzados (por dificultad, jugadores online, etc.)
- Búsqueda avanzada con sugerencias
- Animaciones de transición entre páginas (opcional para futuro)
- Tests unitarios (se pueden agregar en spec posterior)

---

## Modelo de datos

### Interfaces TypeScript (`types/index.ts`)

```typescript
export interface Game {
  id: string; // "bloque-buster", "caida", etc.
  title: string; // "BLOQUE BUSTER"
  short: string; // Descripción corta (1 línea)
  long: string; // Descripción larga (2-3 líneas)
  cat: GameCategory; // "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"
  cover: string; // Clase CSS para el cover: "cover-bricks", etc.
  color: string; // "cyan", "magenta", "yellow", "green"
  best: number; // Mejor puntuación global
  plays: string; // Número de partidas: "12.4K"
}

export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export interface User {
  name: string; // Nombre de usuario (max 10 chars, uppercase)
}

export interface Score {
  game: string; // ID del juego
  score: number; // Puntuación
  name: string; // Nombre del jugador
  at: number; // Timestamp (Date.now())
}

export interface LeaderboardEntry {
  rank: number; // Posición en el ranking (1-indexed)
  name: string; // Nombre del jugador
  score: number; // Puntuación
  date: string; // Fecha formato "DD/MM/YYYY"
}
```

### Datos mock (`lib/data.ts`)

- Array `GAMES` con 8 juegos precargados (mismos que en `data.jsx`)
- Array `CATS` con categorías:
  `["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]`
- Array `PLAYERS` con nombres de jugadores para seeding

### Funciones utilitarias (`lib/utils.ts`)

- `seededScores(seed: number, count: number): LeaderboardEntry[]` — Genera
  puntuaciones determinísticas para tablas de clasificación
- `cn(...classes)` — Utilidad para concatenar classNames (tailwind-merge + clsx)

### Persistencia en localStorage

- Clave `av_user`: `User | null` — Usuario autenticado
- Clave `av_scores`: `Score[]` — Array de puntuaciones guardadas

---

## Plan de implementación

Cada paso deja el sistema en estado funcional (compilable y navegable).

### 1. Configuración base y tipos

**Archivos:**

- `types/index.ts` — Definir todas las interfaces TypeScript
- `lib/data.ts` — Copiar datos mock de `references/templates/data.jsx`
- `lib/utils.ts` — Implementar `seededScores` y `cn`

**Verificación:** `npm run build` pasa sin errores de tipos.

---

### 2. Configuración de fuentes y variables CSS

**Archivos modificados:**

- `app/layout.tsx` — Importar fuentes con `next/font/google`:
  - `Press_Start_2P` para texto pixel
  - `JetBrains_Mono` para texto monospace
  - Definir variables CSS `--font-pixel` y `--font-mono` en el `<body>`
- `app/globals.css` — Agregar:
  - Variables CSS de colores (`:root`)
  - Reset básico
  - Efectos de fondo (`.av-bg`, `.av-noise`, scanlines, grid 3D animado)

**Verificación:** La página raíz muestra el fondo animado con efectos retro.

---

### 3. Crear CSS modules para efectos complejos

**Archivos nuevos:**

- `styles/effects.module.css` — Grid 3D, scanlines, noise
- `styles/crt.module.css` — Efecto de pantalla CRT (curvatura, glow, scan)
- `styles/neon.module.css` — Clases de texto neon (`.neon-cyan`,
  `.neon-magenta`, etc.)
- `styles/animations.module.css` — Keyframes (fade-in, pulse, flicker, blink,
  slide-in)

**Verificación:** Los CSS modules se pueden importar sin errores.

---

### 4. Componente de navegación (Nav)

**Archivos nuevos:**

- `components/navigation/Nav.tsx` — Navegación principal:
  - Logo (clickeable → `/biblioteca`)
  - Links: Biblioteca, Salón de la Fama
  - Contador de créditos (visual, estático: "CRÉDITOS · 03")
  - Botón de autenticación (si `user` → muestra nombre + logout, si no →
    "Iniciar Sesión")
  - Menú hamburguesa (mobile)
  - Panel mobile con backdrop
- `components/navigation/Nav.module.css` — Estilos específicos del Nav

**Props:**

```typescript
interface NavProps {
  user: User | null;
  onSignOut: () => void;
}
```

**Verificación:** El Nav se renderiza en todas las páginas con navegación
funcional.

---

### 5. Página raíz y redirect

**Archivos modificados:**

- `app/page.tsx` — Redirect automático a `/biblioteca` usando `redirect()` de
  Next.js

**Verificación:** Al entrar a `/` redirige inmediatamente a `/biblioteca`.

---

### 6. Pantalla Biblioteca (`/biblioteca`)

**Archivos nuevos:**

- `app/biblioteca/page.tsx` — Página principal:
  - Hero section con título "ARCADE VAULT" (efecto flicker) y subtítulo con
    cursor blink
  - Barra de búsqueda (input controlado)
  - Chips de filtro por categoría (activa = cyan, resto = ghost)
  - Grid responsive de `GameCard`
  - Estado vacío si no hay resultados
- `components/games/GameCard.tsx` — Card de juego:
  - Cover con gradient y label de categoría
  - Metadata: título, descripción corta, mejor puntuación, botón "JUGAR"
  - Efecto tilt 3D en hover (desktop)
- `components/games/GameCard.module.css` — Estilos del card con transformaciones
  3D

**Lógica:**

- Estado local: `query` (string), `category` (string)
- Filtrado: `useMemo` que filtra `GAMES` por categoría y búsqueda
  case-insensitive
- Click en card → navegar a `/juego/[id]`
- Click en botón "JUGAR" → navegar a `/juego/[id]/jugar` (stopPropagation)

**Verificación:** La biblioteca muestra los 8 juegos, la búsqueda y filtros
funcionan.

---

### 7. Pantalla Detalle de juego (`/juego/[id]`)

**Archivos nuevos:**

- `app/juego/[id]/page.tsx` — Página de detalle:
  - Cover grande del juego
  - Tags (categoría, jugadores, controles, año)
  - Título (neon cyan)
  - Descripción larga
  - Stat strip (partidas, mejor global, dificultad con estrellas)
  - Botones:
    - "▶ JUGAR AHORA" (btn xl pulse → navega a `/juego/[id]/jugar`)
    - "VOLVER AL VAULT" (btn ghost → navega a `/biblioteca`)
  - Sidebar con tabla de mejores puntuaciones (leaderboard)

**Lógica:**

- Obtener `id` desde `params`
- Buscar juego en `GAMES` con `useMemo`
- Generar leaderboard con `seededScores(id.length * 17 + 3, 10)`
- Si no existe el juego, mostrar 404 o redirect

**Verificación:** Al clickear un juego en la biblioteca, se abre su detalle con
información correcta.

---

### 8. Pantalla Reproductor (`/juego/[id]/jugar`)

**Archivos nuevos:**

- `app/juego/[id]/jugar/page.tsx` — Página del reproductor:
  - HUD superior (jugador, puntuación, vidas, nivel)
  - Controles (Pausa/Reanudar, Fin, Salir)
  - Pantalla CRT con:
    - Arena de juego (grid animado, 3 enemigos CSS animados, nave jugadora)
    - Overlay de pausa (si `paused === true`)
  - Barra inferior del CRT (señal, nombre del juego, carga)
  - Modal de Game Over (aparece cuando `over === true`):
    - Puntuación final
    - Input para nombre (max 10 chars, uppercase)
    - Botón "GUARDAR PUNTUACIÓN"
    - Toast de confirmación "PUNTUACIÓN GUARDADA_"
    - Botones: "JUGAR DE NUEVO", "VOLVER AL VAULT"
- `components/games/GamePlayer.tsx` — Componente del reproductor (toda la
  lógica)
- `components/games/GamePlayer.module.css` — Estilos del CRT, arena, modal

**Lógica:**

- Estado local: `score`, `lives`, `level`, `paused`, `over`, `name`, `saved`
- Efecto auto-incremento de `score` cada 220ms (solo si no está pausado ni
  terminado)
- Efecto para subir `level` cada 2500 puntos
- Botón "FIN" → `setOver(true)`
- Botón "PAUSA" → toggle `paused`
- Botón "SALIR" → navegar a `/juego/[id]`
- Botón "GUARDAR PUNTUACIÓN":
  - Llamar a función que guarda en localStorage: `av_scores`
  - Marcar `saved = true`
- Botón "JUGAR DE NUEVO" → resetear todos los estados
- Botón "VOLVER AL VAULT" → navegar a `/biblioteca`

**Verificación:** El juego simula una partida visual, la puntuación sube
automáticamente, se puede pausar y guardar.

---

### 9. Pantalla Autenticación (`/auth`)

**Archivos nuevos:**

- `app/auth/page.tsx` — Página de login/signup:
  - Header con logo y título "ARCADE VAULT"
  - Tabs: "INICIAR SESIÓN" / "CREAR CUENTA"
  - Formulario:
    - Input: Usuario
    - Input: Email (solo visible en tab "CREAR CUENTA", con slide-in)
    - Input: Contraseña (type="password")
    - Botón submit: "ENTRAR AL VAULT" o "CREAR Y JUGAR" según tab
  - Botón "JUGAR COMO INVITADO" (guarda `user = null`, navega a `/biblioteca`)
  - Divider "O CONTINÚA CON"
  - Botones sociales (mock, no funcionales): "◆ GOOGLE", "▣ GITHUB"
  - Footer con texto legal
- `components/auth/AuthForm.tsx` — Formulario de autenticación
- `components/auth/AuthForm.module.css` — Estilos del formulario

**Lógica:**

- Estado local: `tab` ("in" | "up"), `user`, `pass`, `email`
- Submit:
  - Crear objeto `User` con `name = user.toUpperCase().slice(0, 10)` (o
    "PLAYER1" si está vacío)
  - Guardar en localStorage: `av_user`
  - Navegar a `/biblioteca`
- No hay validación real (es mock)

**Verificación:** Se puede hacer login/signup, el usuario persiste en
localStorage y aparece en el Nav.

---

### 10. Pantalla Salón de la Fama (`/salon`)

**Archivos nuevos:**

- `app/salon/page.tsx` — Página del hall of fame:
  - Header con título "SALÓN DE LA FAMA" y subtítulo
  - Tabs de juegos (chips con todos los juegos)
  - Podio con top 3:
    - Slot oro (centro, más grande): #1
    - Slot plata (izquierda): #2
    - Slot bronce (derecha): #3
  - Tabla de clasificación (12 primeras posiciones):
    - Headers: Rango, Jugador, Puntuación, Fecha
    - Filas con clases especiales para top 3 (gold, silver, bronze)
    - Si hay usuario logueado: agregar fila extra "TU MEJOR MARCA" con datos
      mock
  - Botón "VOLVER A LA BIBLIOTECA"
- `components/games/Leaderboard.tsx` — Componente de tabla de clasificación
- `components/games/Podium.tsx` — Componente de podio
- `components/games/Leaderboard.module.css` y `Podium.module.css` — Estilos

**Lógica:**

- Estado local: `tab` (id del juego seleccionado, inicia en `GAMES[0].id`)
- Generar leaderboard con `seededScores(tab.length * 23 + 7, 12)`
- Si hay usuario:
  - Calcular rango mock: `Math.floor(8 + (tab.length % 4))`
  - Calcular puntuación mock: `rows[5].score - 2400`
  - Agregar fila al final con clase `.you`

**Verificación:** El salón muestra el podio y la tabla, los tabs cambian los
datos, el usuario logueado ve su posición.

---

### 11. Integración global: layout y contexto de usuario

**Archivos modificados:**

- `app/layout.tsx`:
  - Crear lógica para leer/escribir usuario en localStorage (Client Component o
    hook)
  - Pasar `user` y `onSignOut` al `<Nav>`
  - Definir estructura: `<Nav>` +
    `<main className="av-main">{children}</main>` + `<footer>`

**Opción de implementación:**

- Crear un hook `useAuth()` en `hooks/useAuth.ts` que:
  - Lee `av_user` de localStorage al montar
  - Provee `user`, `login(user)`, `logout()`
  - Persiste cambios en localStorage
- Usar el hook en un Client Component wrapper
  (`components/providers/AuthProvider.tsx`)

**Verificación:** El estado de autenticación se sincroniza entre todas las
páginas.

---

### 12. Componentes de UI reutilizables

**Archivos nuevos:**

- `components/ui/Button.tsx` — Botón con variantes:
  - `default` (cyan)
  - `ghost` (outline)
  - `magenta`
  - `yellow`
  - Tamaños: `sm`, `md` (default), `lg`, `xl`
  - Clases: `pulse` (para CTA principal)
- `components/ui/Input.tsx` — Input con estilos retro
- `components/ui/Modal.tsx` — Modal con backdrop
- `components/ui/Chip.tsx` — Chip para filtros y tabs
- CSS modules correspondientes

**Verificación:** Todos los componentes de UI se reutilizan sin duplicación de
estilos.

---

### 13. Responsive design y mobile

**Archivos modificados:**

- Todos los CSS modules — Agregar media queries para mobile
  (`@media (max-width: 768px)`):
  - Grid de juegos: 1 columna en mobile
  - Nav: ocultar links y mostrar hamburguesa
  - Detalle: layout vertical, sidebar abajo
  - Reproductor: HUD apilado, controles verticales
  - Salón: podio vertical, tabla scrollable horizontal

**Verificación:** Todas las pantallas se ven correctamente en mobile y desktop.

---

### 14. Ajustes finales y pulido

- Verificar que todos los links de navegación funcionan
- Verificar que localStorage persiste correctamente (auth + scores)
- Revisar que los efectos visuales (neon, glow, flicker, pulse) se aplican
  correctamente
- Agregar meta tags en `layout.tsx` (título, descripción, favicon)
- Verificar accesibilidad básica (aria-labels en botones hamburguesa y cerrar)

**Verificación final:**

- ✅ Todas las 5 pantallas se renderizan correctamente
- ✅ La navegación funciona entre todas las rutas
- ✅ El usuario puede hacer login/logout y persiste en localStorage
- ✅ Las puntuaciones se pueden guardar y se leen desde localStorage
- ✅ El diseño es responsive (mobile + desktop)
- ✅ La estética retro arcade está completa (fuentes, colores, efectos)
- ✅ No hay errores de compilación o TypeScript

---

## Criterios de aceptación

- [ ] La ruta `/` redirige automáticamente a `/biblioteca`
- [ ] La página `/biblioteca` muestra un grid de 8 juegos con búsqueda y filtros
      funcionales
- [ ] Al clickear un juego, navega a `/juego/[id]` con la información correcta
- [ ] La página `/juego/[id]` muestra el detalle del juego y una tabla de
      puntuaciones seeded
- [ ] El botón "JUGAR AHORA" navega a `/juego/[id]/jugar`
- [ ] La página `/juego/[id]/jugar` muestra:
  - HUD con puntuación auto-incrementada
  - Pantalla CRT con animaciones visuales
  - Controles de pausa funcionales
  - Modal de game over con input para guardar puntuación
- [ ] Al guardar una puntuación, se persiste en `localStorage` bajo la clave
      `av_scores`
- [ ] La página `/auth` muestra formulario de login/signup con tabs
- [ ] Al hacer login/signup, el usuario se guarda en `localStorage` bajo la
      clave `av_user`
- [ ] El componente `Nav` muestra el nombre del usuario logueado y permite
      logout
- [ ] Al hacer logout, se elimina `av_user` de localStorage y el Nav muestra
      "Iniciar Sesión"
- [ ] La página `/salon` muestra:
  - Tabs para cambiar entre juegos
  - Podio con top 3
  - Tabla de clasificación con 12 posiciones
  - Fila especial con posición del usuario si está logueado
- [ ] Todas las páginas tienen la estética retro completa:
  - Fondo con grid 3D animado
  - Scanlines y noise
  - Fuentes pixel art y monospace
  - Colores neon (cyan, magenta, yellow, green)
  - Efectos de texto (glow, flicker, blink, pulse)
- [ ] El diseño es responsive (se ve correctamente en mobile y desktop)
- [ ] El menú hamburguesa en mobile abre un panel lateral con navegación
- [ ] No hay errores de TypeScript ni de compilación (`npm run build` pasa)
- [ ] No hay errores de consola en el navegador
- [ ] La navegación entre páginas es fluida (sin recargas completas)

---

## Decisiones tomadas

1. **App Router con páginas dinámicas**: Se eligió usar el sistema moderno de
   Next.js 16 con App Router en lugar de mantener el hash routing original. Esto
   permite aprovechar las capacidades de SSR, routing nativo, y mejor SEO
   (aunque no sea crítico para este MVP).

2. **Componentes organizados por tipo**: Se estructura `components/` con
   subcarpetas por categoría (navigation, games, ui, auth) en lugar de una
   estructura plana o colocation. Esto facilita encontrar y reutilizar
   componentes a medida que crece el proyecto.

3. **Híbrido Tailwind + CSS modules**: Se usa Tailwind para utilidades básicas
   (spacing, layout, typography) pero se mantienen CSS modules para efectos
   complejos que definen la identidad visual (CRT, grid 3D, scanlines, neon
   glow). Esta decisión balancea la velocidad de Tailwind con la precisión que
   requieren los efectos retro.

4. **Datos mock centralizados**: Los datos de juegos, categorías y funciones
   utilitarias viven en `lib/` siguiendo las convenciones de Next.js. Esto
   facilita futuras migraciones a APIs reales sin cambiar los componentes.

5. **localStorage completo**: Aunque es mock, se implementa autenticación y
   guardado de puntuaciones con localStorage real. Esto permite probar el flujo
   completo de la aplicación y facilita futuras migraciones a backend real (solo
   hay que cambiar las funciones de persistencia).

6. **Simulación CRT completa**: Se implementa toda la experiencia visual del
   reproductor (HUD, CRT, animaciones, pausa, game over) aunque no haya juego
   real. Esto valida que el diseño funciona y permite integrar juegos reales en
   specs futuras sin cambiar la estructura.

7. **TypeScript estricto**: Se definen interfaces completas desde el inicio en
   lugar de usar `any` o inferencia. Esto previene errores y facilita refactors
   futuros.

8. **Fuentes originales**: Se cargan las fuentes exactas de las plantillas
   (Press Start 2P, JetBrains Mono) con `next/font/google` en lugar de usar las
   fuentes del proyecto (Geist). Esto mantiene la identidad visual retro arcade.

9. **Sin animaciones de transición de página**: Se difieren las animaciones
   entre páginas (page transitions) para simplificar el MVP. Se pueden agregar
   en una spec posterior si se desean.

10. **Footer estático**: El footer con copyright y versión se mantiene simple y
    estático, sin lógica adicional.

---

## Decisiones descartadas

1. **Pages Router**: Descartado porque Next.js 16 prioriza App Router y el
   proyecto ya está configurado con esta estructura.

2. **Context API para datos**: Descartado porque los datos son estáticos (no
   cambian durante la sesión) y se pueden importar directamente. Context API
   agregaría complejidad innecesaria.

3. **Mantener hash routing**: Descartado porque no aprovecha las capacidades de
   Next.js y hace que la navegación no sea shareable (los hashes no actualizan
   la URL del navegador de forma SEO-friendly).

4. **CSS-in-JS (styled-components, emotion)**: Descartado porque el proyecto ya
   usa Tailwind y los efectos complejos se resuelven mejor con CSS puro que con
   JS.

5. **Implementar juegos con canvas**: Fuera del alcance del MVP (solo se pide
   interfaz visual). Los juegos reales se pueden implementar en specs
   posteriores usando canvas, WebGL, o iframes con juegos externos.

6. **Validación de formularios**: Descartado porque la autenticación es mock. No
   tiene sentido validar emails o contraseñas si no hay backend real.

7. **Optimistic UI updates**: Descartado porque localStorage es síncrono y
   rápido. No hay necesidad de mostrar estados de carga o actualizar
   optimistamente.

8. **Server Components para todo**: Aunque App Router permite Server Components,
   las páginas que necesitan interactividad (biblioteca con filtros, reproductor
   con estado) serán Client Components. Solo se usarán Server Components donde
   tenga sentido (layout, páginas estáticas).

---

## Riesgos identificados

1. **Next.js 16 breaking changes**: Como se menciona en CLAUDE.md, Next.js 16
   tiene cambios importantes respecto a versiones anteriores. **Mitigación**:
   Leer la documentación oficial en `node_modules/next/dist/docs/` antes de
   implementar cada página.

2. **Rendimiento de efectos CSS**: Los efectos visuales (grid 3D animado,
   scanlines, noise) pueden afectar el rendimiento en dispositivos de gama baja.
   **Mitigación**: Usar `will-change`, `transform` en lugar de `top/left`, y
   considerar reducir efectos en mobile con media queries.

3. **Compatibilidad de fuentes pixel art**: Las fuentes pixel art pueden verse
   mal en pantallas de alta densidad (Retina). **Mitigación**: Usar
   `text-rendering: geometricPrecision` y tamaños específicos que sean múltiplos
   de la grilla de pixeles.

4. **localStorage límite de tamaño**: Si se guardan muchas puntuaciones, se
   puede alcanzar el límite de localStorage (~5MB). **Mitigación**: En esta spec
   no se implementa limpieza, pero se puede agregar en el futuro (mantener solo
   las top N puntuaciones por juego).

5. **TypeScript strict mode**: El modo estricto puede generar errores
   inesperados al migrar código de JavaScript. **Mitigación**: Definir tipos
   explícitos desde el inicio y usar `@ts-expect-error` solo como último
   recurso, documentando el por qué.

6. **Responsive en reproductor**: La pantalla CRT con efectos 3D puede ser
   difícil de adaptar a mobile sin perder calidad visual. **Mitigación**:
   Simplificar algunos efectos en mobile (reducir curvatura del CRT, eliminar
   tilt 3D de cards) usando media queries.
