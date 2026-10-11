# 04 — JUEGO ASTEROIDES ADAPTADO A NEXT.JS

**Estado:** Aprobado
**Depende de:** SPEC 03
**Fecha:** 2026-10-11

**Objetivo:** Adaptar la implementación existente del juego Asteroides (Canvas HTML5 puro) a TypeScript + React 19 en Next.js, integrándolo completamente con el sistema de puntuaciones de Supabase en tiempo real, sustituyendo el juego placeholder "ROCAS".

---

## Alcance

### Incluido en esta especificación

- **Migración de código a TypeScript**
  - Reescribir las 5 clases principales (`Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp`) como módulos TypeScript en `/lib/game/`
  - Mantener la lógica de juego exactamente igual (sin cambios en mecánicas, puntuación, velocidades)
  - Crear tipos TypeScript para todas las estructuras de datos del juego

- **Componente React `AsteroidsGame`**
  - Envolver la lógica de juego en un componente React (`/components/games/AsteroidsGame.tsx`)
  - Usar `useEffect` y `useRef` para gestionar el canvas y el game loop
  - Integrarse con el componente `GamePlayer` existente de la app

- **Integración con Supabase en tiempo real**
  - Guardar el score final en la tabla `scores` de Supabase cuando la partida termina
  - Actualizar automáticamente el leaderboard en la página `/juego/rocas` mediante Realtime subscriptions
  - Usar el hook `useAuth` existente para obtener el `user_id` actual

- **Reemplazo del juego "ROCAS"**
  - Usar `game_id: "rocas"` en la base de datos
  - Actualizar `/lib/data.ts` con los metadatos correctos del juego Asteroides
  - La ruta `/juego/rocas/jugar` renderará `AsteroidsGame` en lugar del simulador

- **Canvas responsividad**
  - Canvas siempre renderiza a 800×600 px (resolución fija)
  - Centrado en la pantalla con flexbox
  - Funciona en desktop y móvil sin adaptaciones de resolución

- **Navegación post-juego**
  - Al presionar "Volver" desde game over, redirige a `/juego/rocas`
  - Cargar el leaderboard actualizado en tiempo real

### NO incluido en esta especificación (se difiere)

- Niveles de dificultad — El juego mantiene parámetros fijos (dificultad estándar)
- Personalización de controles — Teclado fijo (ArrowKeys + Space)
- Múltiples resoluciones de canvas — Solo 800×600, sin adaptación por dispositivo
- Sistema de logros o badges — Solo score simple
- Replay o grabación de partidas — Sin guardar estado de juego, solo score final
- Modo multijugador o cooperativo — Juego single-player únicamente
- Soundtracks o efectos de sonido — Solo visuales
- Tutorial o modo práctica — Se inicia directamente en partida 1

---

## Modelo de datos

### Estructura de GameState

El estado del juego se mantendrá en el componente React usando `useState`. No se requiere Zustand porque la lógica está contenida en un componente.

```typescript
// lib/game/types.ts
interface GameState {
  ship: Ship | null
  bullets: Bullet[]
  asteroids: Asteroid[]
  particles: Particle[]
  powerUps: PowerUp[]
  score: number
  lives: number
  level: number
  state: 'playing' | 'dead' | 'gameover'
  deadTimer: number
  powerUpSpawned: boolean
  killsSinceSpawn: number
}

interface ScoreSaveData {
  user_id: string
  game_id: 'rocas'
  score: number
  created_at: string
}
```

### Variables de entorno

No se requieren nuevas variables. Se usan las existentes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Constantes del juego

```typescript
// lib/game/constants.ts
export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

export const ASTEROID_INITIAL_COUNT = 4
export const ASTEROID_SIZE = { LARGE: 3, MEDIUM: 2, SMALL: 1 }
export const ASTEROID_POINTS = { LARGE: 20, MEDIUM: 50, SMALL: 100 }

export const SHIP_RADIUS = 12
export const SHIP_SPEED_MAX = 275
export const SHIP_ROTATION_SPEED = 3.5
export const SHIP_ACCELERATION = 260
export const SHIP_FRICTION = 0.987
export const SHIP_INVINCIBILITY_TIME = 3

export const BULLET_RADIUS = 2
export const BULLET_TTL = 1.1
export const BULLET_SPEED = 350
export const BULLET_COOLDOWN = 0.2

export const POWERUP_TTL = 12
export const POWERUP_TRIPLE_DURATION = 5
export const POWERUP_DROP_CHANCE = 0.15
export const POWERUP_GUARANTEED_KILLS = 5

export const PARTICLE_LIFETIME = 0.5
export const PARTICLES_PER_EXPLOSION = 10
```

### Integración con Supabase

Usar funciones existentes de `/lib/supabase/scores.ts`:
- `saveScore(gameId: 'rocas', score: number)` — Guarda el score cuando termina la partida
- Automáticamente actualiza `profiles.total_games` y `profiles.total_score` vía trigger en BD

---

## Plan de implementación

### 1. Crear módulo base de tipos y constantes

**Archivos nuevos:**
- `lib/game/types.ts`
- `lib/game/constants.ts`

**Cambios:**
- Definir interfaces TypeScript para todas las entidades del juego (Ship, Asteroid, Bullet, Particle, PowerUp)
- Definir tipos de estado del juego (GameState, GameMode)
- Exportar constantes de física, velocidades, puntuaciones

**Lógica:**
Los tipos definen la forma del estado. Las constantes reemplazan los valores mágicos del código original.

**Verificación:**
```bash
# Compilar sin errores de TypeScript
npm run typecheck
```

---

### 2. Separar clases del juego en módulos individuales

**Archivos nuevos:**
- `lib/game/entities/Ship.ts`
- `lib/game/entities/Bullet.ts`
- `lib/game/entities/Asteroid.ts`
- `lib/game/entities/Particle.ts`
- `lib/game/entities/PowerUp.ts`

**Cambios:**
- Convertir cada clase de `game.js` a un módulo TypeScript exportable
- Agregar tipos explícitos a constructores y métodos
- Mantener lógica interna exactamente igual (sin cambios en comportamiento)

**Lógica:**
Cada clase es una entidad del juego con métodos `update(dt: number)` y `draw(ctx: CanvasRenderingContext2D)`. Las clases son puras (no referencias a variables globales).

**Verificación:**
```typescript
// Verificar que cada clase se puede instanciar
const ship = new Ship(400, 300)
ship.update(0.016)
ship.draw(mockContext)
```

---

### 3. Crear sistema de colisiones y física

**Archivos nuevos:**
- `lib/game/physics/collision.ts`
- `lib/game/physics/utils.ts`

**Cambios:**
- Función `detectCollisions(state: GameState)` que retorna array de colisiones detectadas
- Función `wrap(value: number, max: number)` para envolvimiento toroidal
- Función `distance(x1, y1, x2, y2)` para distancia euclidiana

**Lógica:**
Las colisiones se calculan basándose en distancia entre centros y radios. El resultado es un objeto que describe qué colisionó con qué.

**Verificación:**
```typescript
const collisions = detectCollisions(gameState)
expect(collisions).toEqual([
  { type: 'bullet-asteroid', bulletIdx: 0, asteroidIdx: 1 }
])
```

---

### 4. Crear motor del juego (game loop lógica)

**Archivos nuevos:**
- `lib/game/engine/gameEngine.ts`

**Cambios:**
- Función `initializeGame()` que retorna `GameState` inicial
- Función `updateGameState(state: GameState, dt: number, input: InputState)` que retorna nuevo estado
- Función `spawnAsteroids(count: number)` que genera asteroides aleatorios
- Función `handleCollisions(state: GameState, collisions: Collision[])` que procesa colisiones
- Función `checkLevelUp(state: GameState)` que verifica si subir de nivel

**Lógica:**
El motor es una máquina de estados pura. Recibe estado actual + delta time + input, retorna nuevo estado. Sin efectos secundarios.

**Verificación:**
```typescript
const state1 = initializeGame()
const input = { left: false, right: true, up: false, shoot: false }
const state2 = updateGameState(state1, 0.016, input)
expect(state2.ship?.angle).toBeGreaterThan(state1.ship?.angle)
```

---

### 5. Crear renderizador

**Archivos nuevos:**
- `lib/game/renderer/draw.ts`

**Cambios:**
- Función `drawGame(ctx: CanvasRenderingContext2D, state: GameState)` que renderiza todo el juego
- Función `drawAsteroids(ctx, asteroids)`, `drawShip(ctx, ship)`, etc. (funciones auxiliares)
- Función `drawHUD(ctx, state)` que dibuja score, vidas, nivel, powerup activo

**Lógica:**
El renderizador toma el estado y lo dibuja en el canvas. Es puro: entrada → salida visual.

**Verificación:**
```typescript
drawGame(mockCtx, gameState)
expect(mockCtx.fillStyle).toBeDefined()
expect(mockCtx.drawImage).toHaveBeenCalled()
```

---

### 6. Crear componente React `AsteroidsGame`

**Archivos nuevos:**
- `components/games/AsteroidsGame.tsx`

**Cambios:**
- Componente funcional con `useState` para el game state
- `useRef` para la referencia al canvas
- `useEffect` para setup del game loop con `requestAnimationFrame`
- `useEffect` para limpiar el game loop
- Manejo de input: `keydown` y `keyup` events
- Props: `onGameOver(score: number)` callback

**Lógica:**
El componente monta el canvas, inicia el game loop, y llamaback cuando termina. El game loop actualiza estado y renderiza en cada frame.

```typescript
// Pseudocódigo
function AsteroidsGame({ onGameOver }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState(() => initializeGame())
  
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    
    let lastTime = performance.now()
    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      
      const newState = updateGameState(gameState, dt, inputState)
      setGameState(newState)
      drawGame(ctx, newState)
      
      if (newState.state === 'gameover') {
        onGameOver(newState.score)
      } else {
        frameId = requestAnimationFrame(loop)
      }
    }
    
    let frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [gameState])
  
  return <canvas ref={canvasRef} width={800} height={600} />
}
```

**Verificación:**
```bash
# Componente se renderiza sin errores
npm run dev
# Navegar a /juego/rocas/jugar
# Verificar que el canvas aparece y responde a teclas
```

---

### 7. Integrar `AsteroidsGame` con `GamePlayer`

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**
- Agregar prop `gameId` para identificar qué juego renderizar
- Importar y renderizar `AsteroidsGame` cuando `gameId === 'rocas'`
- Pasar callback `onGameOver` a `AsteroidsGame` que dispare el modal de fin de juego
- Capturar `onGameOver(finalScore)` y guardarlo en estado local
- Mostrar modal de "Game Over" cuando se llama el callback

**Lógica:**
`GamePlayer` es el contenedor que sabe cuándo mostrar UI (modal, botones) y maneja la navegación. El juego solo se preocupa por lógica de juego.

**Verificación:**
```bash
# Navegar a /juego/rocas/jugar
# Jugar hasta game over
# Verificar que aparece modal de guardado
```

---

### 8. Guardar scores en Supabase en tiempo real

**Archivos modificados:**
- `components/games/GamePlayer.tsx`
- Usar hook `useAuth()` existente

**Cambios:**
- Cuando `GamePlayer` recibe el callback `onGameOver(score)`:
  - Verificar si el usuario está autenticado (hook `useAuth`)
  - Si es guest, guardar en localStorage solamente
  - Si es usuario registrado, llamar a `saveScore('rocas', score)` de `lib/supabase/scores.ts`
  - El trigger en Supabase actualiza `profiles` automáticamente
  - Mostrar confirmación visual ("Score guardado ✓")

**Lógica:**
Los scores se persisten a Supabase via la función existente. El leaderboard se actualiza automáticamente por Realtime.

**Verificación:**
```typescript
// Completar una partida
// Verificar en Supabase que se creó un registro en tabla `scores`
// Verificar que `profiles.total_score` subió
// Navegar a /juego/rocas y verificar leaderboard actualizado en tiempo real
```

---

### 9. Actualizar metadatos del juego en `/lib/data.ts`

**Archivos modificados:**
- `lib/data.ts`

**Cambios:**
- Buscar el objeto game con `id: 'rocas'`
- Actualizar campos:
  - `title: "ASTEROIDES"` (o "ROCAS ASTEROIDES")
  - `short: "Destruye asteroides y sobrevive"` (descripción corta)
  - `long: "El clásico juego de arcade. Gira tu nave, dispara y esquiva los asteroides que se parten en pedazos."` (descripción larga)
  - `cat: "SHOOTER"` (mantener categoria)
  - `color: "#00f5ff"` (cyan, mantener)

**Verificación:**
```bash
# Navegar a /biblioteca
# Verificar que la tarjeta de "ROCAS" muestra los nuevos metadatos
# Hacer click en JUGAR
```

---

### 10. Verificación end-to-end del flujo completo

**Acciones a realizar:**
1. Iniciar app: `npm run dev`
2. Navegar a `/biblioteca`
3. Verificar que "ROCAS/ASTEROIDES" aparece en la galería
4. Hacer click en "JUGAR"
5. Llegar a `/juego/rocas/jugar`
6. Verificar que se renderiza el canvas 800×600
7. Jugar: verificar que funcionen los controles (flechas, espacio)
8. Causar game over (perder todas las vidas o presionar ESC)
9. Verificar que aparece modal de fin de juego
10. Ingresar nombre (si está logueado) o ver mensaje para registrarse
11. Hacer click en "Guardar score" / "Volver"
12. Navegar a `/juego/rocas`
13. Verificar que aparece el leaderboard con el nuevo score
14. Verificar en Supabase que existe el registro en tabla `scores`

**Criterio de éxito:**
- Canvas renderiza sin errores
- Juego responde a controles
- Score se guarda en Supabase
- Leaderboard se actualiza en tiempo real
- Navegación es fluida

---

## Criterios de aceptación

- [ ] Componente `AsteroidsGame` se renderiza en `/juego/rocas/jugar`
- [ ] Canvas es 800×600 px y está centrado
- [ ] Controles funcionan: ArrowLeft/Right rotan, ArrowUp propulsa, Space dispara
- [ ] Lógica del juego es idéntica a la versión original (puntos, velocidades, colisiones)
- [ ] El juego genera 4 asteroides grandes iniciales
- [ ] Los asteroides se dividen correctamente (grande → 2 medianos, mediano → 2 pequeños)
- [ ] Al destruir todos los asteroides, sube de nivel y aparecen más asteroides
- [ ] El sistema de vidas funciona (empieza con 3, pierde 1 cada vez que colisiona nave/asteroide)
- [ ] La nave tiene 3 segundos de invencibilidad al reaparecer (parpadea)
- [ ] PowerUp "Triple disparo" aparece aleatoriamente (15% de probabilidad)
- [ ] PowerUp triple disparo dura 5 segundos y permite 3 disparos simultáneos
- [ ] Score se incrementa correctamente: asteroide grande 20pts, mediano 50pts, pequeño 100pts
- [ ] HUD muestra: SCORE, NIVEL, VIDAS, PowerUp activo (si aplica)
- [ ] Game Over ocurre cuando se acaban las vidas
- [ ] Modal de "Game Over" aparece al terminar la partida
- [ ] Botón "Volver" redirige a `/juego/rocas`
- [ ] Score se guarda en tabla `scores` de Supabase cuando termina partida
- [ ] Usuario registrado tiene su score asociado (user_id correcto)
- [ ] Score aparece en leaderboard de `/juego/rocas` en tiempo real
- [ ] Perfil del usuario se actualiza: `total_games` +1, `total_score` sumado
- [ ] TypeScript compila sin errores (`npm run typecheck`)
- [ ] No hay warnings de consola durante juego
- [ ] Funciona en navegadores modernos (Chrome, Firefox, Safari)

---

## Decisiones tomadas

1. **Refactorización Opción B (TypeScript + módulos, no Zustand)**: Se decidió refactorizar a TypeScript y separar el código en módulos (`/lib/game/`), pero mantener el estado **solo en el componente React** (useState) en lugar de usar Zustand. Razón: El juego es self-contained y no necesita compartir estado con el resto de la app. Simplifica sin sacrificar claridad.

2. **Canvas fijo 800×600**: Se decidió mantener el canvas a resolución fija en lugar de hacer responsive. Razón: Los juegos retro de arcade funcionan mejor con resoluciones fijas. Es más simple, predecible y auténtico. El responsive viene después si se necesita.

3. **Guardar score solo al finalizar**: Se decidió guardar el score UNA VEZ cuando termina la partida (game over), no en tiempo real cada frame o cada X segundos. Razón: Reduce carga en Supabase (de 60 saves/seg a 1 por partida). El lag es imperceptible para el jugador.

4. **Reemplazo completo de "ROCAS"**: Se decidió que el juego Asteroides reemplaza completamente el placeholder "ROCAS" en `lib/data.ts` (mismo `game_id: 'rocas'`). Razón: La arquitectura ya existe, no crear duplicados. El juego real tiene el mismo slot en la UI.

5. **Usar funciones existentes de Supabase**: Se decidió reutilizar `saveScore()` de `/lib/supabase/scores.ts` en lugar de escribir lógica nueva. Razón: El trigger en BD ya actualiza `profiles` automáticamente. No hay que reinventar.

6. **Integración via callback en GamePlayer**: Se decidió que `AsteroidsGame` notifica al componente padre `GamePlayer` via callback `onGameOver(score)`, en lugar de que el juego llame directamente a Supabase. Razón: Separación de concerns. El juego no conoce a Supabase; GamePlayer orquesta guardado + UI.

7. **No agregar niveles de dificultad en esta spec**: Se decidió que el juego mantiene parámetros fijos (dificultad estándar) por ahora. Razón: Scope. Dificultad es una feature adicional que se puede implementar después si se requiere.

---

## Decisiones descartadas

1. **Usar Zustand para estado global del juego**: Se descartó porque el juego es auto-contenido. useState es suficiente y evita dependencias extra.

2. **Canvas responsivo con múltiples resoluciones**: Se descartó por ahora. Mobile UX es mejor con canvas fijo que con intentos de scaling.

3. **Guardar estado de juego en progress (localStorage/Supabase)**: Se descartó. Si el usuario cierra la ventana, la partida se pierde. Simplifica UX (no hay recuperación de partida vieja).

4. **Guardar scores cada frame (tiempo real)**: Se descartó porque es ineficiente. Una request por fin de partida es el approach correcto.

5. **Crear nuevas entidades de juego en BD (power-ups, etc.)**: Se descartó. Los power-ups del juego son solo visuales. No necesitan persistencia.

---

## Riesgos identificados

1. **Rendimiento del canvas en navegadores lentos o móviles**: Si el game loop está sincronizado con RAF, puede caer a 30fps en devices antiguos. **Mitigación**: Usar delta-time clamping (máximo 50ms por frame) para evitar teleporteos. Implementar frame limiting si es necesario.

2. **Desincronización de input si el usuario usa múltiples teclas simultáneamente**: En JavaScript, si presiona ArrowUp + Space muy rápido, puede haber lag de input. **Mitigación**: Guardar estado de teclas en un objeto `keyState` que se actualiza en eventos de keydown/keyup, no procesar eventos individuales.

3. **Fugas de memoria si el component se desmonta sin limpiar**: Si `AsteroidsGame` se desmonta durante un juego activo, el `requestAnimationFrame` podría seguir corriendo. **Mitigación**: El cleanup en `useEffect` debe cancelar el frameId antes de desmontar.

4. **Race condition: Score se guarda pero la navegación ocurre antes de que Supabase responda**: El usuario hace click en "Volver" y se va a `/juego/rocas` antes de que la request a Supabase haya completado. **Mitigación**: Mostrar un `isLoading` state durante el guardado. Deshabilitar botón "Volver" hasta que se complete. O aceptar que el score se guarde async en background.

5. **Colisiones imprecisas si el deltaTime es muy grande**: Si el game loop se ralentiza mucho, un asteroide podría "pasar a través" de la nave sin detectar colisión. **Mitigación**: Clamping de deltaTime a máximo 50ms. También se puede hacer continuous collision detection, pero es más complejo.

---

**FIN DE SPEC 04**
