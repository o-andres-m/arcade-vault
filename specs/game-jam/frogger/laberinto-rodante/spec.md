# GAME JAM: FROGGER — LABERINTO RODANTE

**Estado:** Draft
**Depende de:** SPEC 04 (Juego Asteroides), SPEC 06 (Arkanoid), SPEC 07 (Snake)
**Fecha:** 2026-10-18
**Game Jam Tema:** frogger

**Objetivo:** Implementar LABERINTO RODANTE para Arcade Vault, un juego inspirado en Donkey Kong y Frogger donde el jugador escala plataformas inclinadas esquivando barriles que ruedan hacia abajo, con timing de saltos preciso y progresión vertical, integrándolo con Supabase para persistencia de scores y siguiendo la arquitectura establecida.

---

## Alcance

### Incluido

- Creación en TypeScript en `/lib/game/laberinto-rodante/`
- Componente React `LaberintoRodanteGame` para `/juego/laberinto-rodante/jugar`
- **4 niveles con diseño de plataformas único:**
  - Nivel 1: 6 plataformas horizontales, spawn lento (3s entre barriles)
  - Nivel 2: 7 plataformas con inclinación leve (5°), spawn moderado (2s)
  - Nivel 3: 8 plataformas con inclinación media (10°), spawn rápido (1.5s)
  - Nivel 4: 9 plataformas con inclinación fuerte (15°), spawn muy rápido (1s) + barriles explosivos
- **Sistema de puntuación:**
  - Subir a plataforma superior: 20 pts
  - Completar nivel: 200 pts × nivel
  - Recoger moneda: 50 pts
  - Destruir barril explosivo: 100 pts (solo nivel 4)
- **Entidades:**
  - Climber (jugador): sprite 24×32 con animación de escalada
  - Plataformas: 600px de ancho, inclinación variable
  - Barriles: radio 16, ruedan con física (gravedad + fricción)
  - Escaleras: conectan plataformas, 32px de ancho
  - Monedas: radio 8, coleccionables opcionales
  - Barriles explosivos: radio 20, detectable con color rojo
  - Meta: zona en la plataforma superior
- **Canvas:** 800×600 centrado
- **Controles:**
  - Arrow Left/Right: mover horizontalmente (200 px/s)
  - Arrow Up/Down: subir/bajar escalera cuando está en una
  - Space: saltar (altura 100px, duración 0.4s)
  - P: pausa
- **Assets:** Sprites en `/public/games/laberinto-rodante/` (climber, barril, plataforma, escalera, moneda)
- Persistencia de score en Supabase al game over
- Sistema de vidas (3 iniciales)
- Física de barril: gravedad, rebote en bordes, aceleración en pendiente

### No incluido

- Tests unitarios
- Niveles generados proceduralmente (usar 4 niveles fijos diseñados manualmente)
- Enemigos adicionales (solo barriles)
- Martillo o power-ups de ataque (solo esquivar)
- Modo multijugador
- Música de fondo (solo efectos de sonido: rodar, saltar, morir, recoger moneda)
- Partículas complejas (solo explosión básica para barriles explosivos)

---

## Modelo de datos

### Entidades del juego

**Climber (Jugador):**
- Position: `x: number, y: number` (bottom-center del sprite)
- Size: `width: 24, height: 32`
- Velocity: `vx: number, vy: number`
- State: `state: 'ground' | 'jumping' | 'climbing' | 'falling' | 'dead'`
- Direction: `facing: 'left' | 'right'`
- Animation: `animFrame: number, animTimer: number`
- Climbing: `onLadder: Ladder | null` (escalera actual si está subiendo)
- Platform: `currentPlatform: Platform | null` (plataforma donde está parado)
- Jump: `jumpTimer: number` (tiempo restante de salto activo)
- Invulnerability: `invulnerable: boolean, invulnTimer: number` (1s tras perder vida)

**Platform (Plataforma):**
- Position: `x: number, y: number` (top-left corner)
- Size: `width: 600, height: 20`
- Angle: `angle: number` (grados de inclinación, positivo = sube a la derecha)
- Level: `level: number` (altura en stack, 0 = bottom)
- Surface: `leftY: number, rightY: number` (altura real de bordes para colisiones)

**Ladder (Escalera):**
- Position: `x: number, yTop: number, yBottom: number` (coordenadas verticales)
- Size: `width: 32`
- Platforms: `topPlatform: number, bottomPlatform: number` (índices de plataformas conectadas)

**Barrel (Barril):**
- Position: `x: number, y: number` (centro)
- Size: `radius: 16`
- Velocity: `vx: number, vy: number`
- Angular velocity: `angularVel: number` (rotación visual, radianes/s)
- State: `state: 'rolling' | 'falling' | 'bouncing'`
- Platform: `currentPlatform: Platform | null`
- Type: `type: 'normal' | 'explosive'` (explosive solo en nivel 4)
- Active: `active: boolean` (false si salió de pantalla)

**Coin (Moneda):**
- Position: `x: number, y: number` (centro)
- Size: `radius: 8`
- Platform: `platformIndex: number`
- Collected: `collected: boolean`
- Animation: `bobOffset: number` (oscilación vertical para efecto flotante)

**Goal (Meta):**
- Position: `x: number, y: number, width: number, height: number`
- Platform: `platformIndex: number` (plataforma superior)

### GameState

```typescript
interface GameState {
  // Entidades principales
  climber: Climber
  platforms: Platform[]
  ladders: Ladder[]
  barrels: Barrel[]
  coins: Coin[]
  goal: Goal
  
  // Progreso del juego
  score: number
  lives: number
  currentLevel: number
  
  // Máquina de estados
  gameState: 'playing' | 'paused' | 'gameover' | 'win' | 'level-complete'
  
  // Spawn de barriles
  barrelSpawnTimer: number
  barrelSpawnRate: number  // segundos entre spawns
  
  // Flags
  goalReached: boolean
}
```

### Constantes del juego

```typescript
// Canvas
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600

// Climber
CLIMBER_WIDTH = 24
CLIMBER_HEIGHT = 32
CLIMBER_SPEED = 200  // px/s horizontal
CLIMBER_CLIMB_SPEED = 120  // px/s en escalera
CLIMBER_JUMP_HEIGHT = 100  // px
CLIMBER_JUMP_DURATION = 0.4  // segundos
CLIMBER_GRAVITY = 800  // px/s² cuando cae
CLIMBER_INVULN_TIME = 1  // segundos

// Plataformas
PLATFORM_WIDTH = 600
PLATFORM_HEIGHT = 20
PLATFORM_SPACING = 80  // px verticales entre plataformas
PLATFORM_OFFSET_X = 100  // offset desde borde izquierdo

// Escaleras
LADDER_WIDTH = 32
LADDER_SPEED = 120  // px/s de subida/bajada

// Barriles
BARREL_RADIUS = 16
BARREL_NORMAL_RADIUS = 16
BARREL_EXPLOSIVE_RADIUS = 20
BARREL_SPEED_BASE = 150  // px/s inicial
BARREL_GRAVITY = 600  // px/s² cuando cae entre plataformas
BARREL_FRICTION = 0.98  // multiplicador por frame en plataforma plana
BARREL_SLOPE_ACCELERATION = 300  // px/s² en pendiente
BARREL_BOUNCE_DAMPING = 0.6  // factor de reducción al rebotar en bordes

// Monedas
COIN_RADIUS = 8
COIN_POINTS = 50
COIN_BOB_SPEED = 2  // radianes/s de oscilación
COIN_BOB_AMPLITUDE = 4  // px de oscilación vertical

// Niveles
TOTAL_LEVELS = 4
LEVEL_1_SPAWN_RATE = 3  // segundos
LEVEL_2_SPAWN_RATE = 2
LEVEL_3_SPAWN_RATE = 1.5
LEVEL_4_SPAWN_RATE = 1

// Puntuación
POINTS_PER_PLATFORM = 20
POINTS_PER_LEVEL = 200  // × nivel
POINTS_PER_COIN = 50
POINTS_EXPLOSIVE_BARREL = 100  // destruir saltándole encima

// Vidas
INITIAL_LIVES = 3

// Física
GRAVITY = 800  // px/s²
```

### Variables de entorno

No se requieren nuevas variables. Se usan las existentes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Plan de implementación

### 1. Crear módulo base de tipos y constantes

**Archivos nuevos:**
- `lib/game/laberinto-rodante/types.ts`
- `lib/game/laberinto-rodante/constants.ts`

**Cambios:**
- Definir interfaces: `Climber`, `Platform`, `Ladder`, `Barrel`, `Coin`, `Goal`, `GameState`
- Tipos auxiliares: `ClimberState`, `BarrelType`, `Direction`
- Exportar todas las constantes numéricas

### 2. Crear entidades del juego

**Archivos nuevos:**
- `lib/game/laberinto-rodante/entities/Climber.ts`
- `lib/game/laberinto-rodante/entities/Platform.ts`
- `lib/game/laberinto-rodante/entities/Ladder.ts`
- `lib/game/laberinto-rodante/entities/Barrel.ts`
- `lib/game/laberinto-rodante/entities/Coin.ts`

**Cambios:**
- Factory `createClimber(x, y): Climber`
- Factory `createPlatform(x, y, angle, level): Platform` — calcula `leftY` y `rightY` basado en ángulo
- Factory `createLadder(x, topPlatform, bottomPlatform, platforms): Ladder` — calcula yTop/yBottom
- Factory `createBarrel(x, y, type): Barrel`
- Factory `createCoin(x, platformIndex, platforms): Coin`
- Métodos `update(dt)` con lógica interna de física

### 3. Crear sistema de física y colisiones

**Archivos nuevos:**
- `lib/game/laberinto-rodante/physics/collision.ts`
- `lib/game/laberinto-rodante/physics/platformPhysics.ts`
- `lib/game/laberinto-rodante/physics/utils.ts`

**Cambios:**
- `checkClimberBarrelCollision(climber, barrels): boolean` — colisión círculo-rect
- `checkClimberCoinCollision(climber, coins): Coin | null`
- `checkClimberOnPlatform(climber, platforms): Platform | null` — raycasting hacia abajo
- `checkClimberOnLadder(climber, ladders): Ladder | null` — overlap horizontal + vertical
- `applyPlatformSlope(barrel, platform, dt): void` — acelera barril en pendiente
- `applyGravityToBarrel(barrel, dt): void` — gravedad cuando está en el aire
- `bounceBarrelAtEdge(barrel, platform): void` — rebote en bordes de plataforma
- Utilidades: `circleRectIntersects()`, `lerp()`, `clamp()`

### 4. Crear sistema de niveles

**Archivos nuevos:**
- `lib/game/laberinto-rodante/levels.ts`

**Cambios:**
- Array `LEVELS: LevelConfig[]` con 4 configuraciones
- Cada nivel define:
  - `platformCount: number`
  - `platformAngles: number[]` (array de ángulos, uno por plataforma)
  - `ladderPositions: {topPlatform, bottomPlatform, x}[]`
  - `coinPositions: {platformIndex, x}[]`
  - `barrelSpawnRate: number`
  - `explosiveBarrelsEnabled: boolean`
- Función `loadLevel(levelNumber): LevelData` que genera plataformas, escaleras, monedas, goal

### 5. Crear motor del juego

**Archivos nuevos:**
- `lib/game/laberinto-rodante/engine/gameEngine.ts`

**Cambios:**
- `initializeGame(level): GameState` — Estado inicial
- `updateGameState(state, dt, input): GameState` — Loop principal:
  - Actualizar climber (movimiento, salto, escalada)
  - Aplicar gravedad a climber si está en el aire
  - Verificar si climber está sobre plataforma
  - Verificar si climber está en escalera
  - Actualizar barriles (física, rotación, caída)
  - Aplicar pendiente a barriles en plataformas inclinadas
  - Spawn de nuevos barriles según timer
  - Detectar colisiones climber-barril → perder vida
  - Detectar colisiones climber-moneda → recoger
  - Detectar climber alcanza goal → nivel completo
  - Verificar game over (sin vidas)
- `handleInput(state, input): void` — Procesar teclas
- `moveClimber(state, direction, dt): void` — Movimiento horizontal
- `climbLadder(state, direction, dt): void` — Subir/bajar escalera
- `jumpClimber(state): void` — Iniciar salto
- `spawnBarrel(state): void` — Crear barril en plataforma superior
- `checkGoalReached(state): boolean`
- `checkGameOver(state): boolean`

### 6. Crear renderizador

**Archivos nuevos:**
- `lib/game/laberinto-rodante/renderer/draw.ts`

**Cambios:**
- `drawGame(ctx, state): void` — Renderiza todo
- `drawBackground(ctx): void` — Fondo de estructura industrial
- `drawPlatforms(ctx, platforms): void` — Plataformas inclinadas con textura
- `drawLadders(ctx, ladders): void` — Escaleras con peldaños
- `drawCoins(ctx, coins): void` — Monedas con animación de bobbing
- `drawBarrels(ctx, barrels): void` — Barriles con rotación, color rojo para explosivos
- `drawClimber(ctx, climber): void` — Sprite con animación de caminar/subir
- `drawGoal(ctx, goal): void` — Zona de meta destacada
- `drawHUD(ctx, state): void` — Score, vidas, nivel

### 7. Crear componente React

**Archivos nuevos:**
- `components/games/LaberintoRodanteGame.tsx`

**Cambios:**
- Componente funcional con canvas ref
- Game loop con `requestAnimationFrame`
- Input handling:
  - `useEffect` para escuchar `keydown` y `keyup`
  - Estado de teclas presionadas (`keys: Set<string>`)
  - Mapear arrows a direcciones y escalada
  - Space para saltar
  - P para pausa
- Props: `onGameOver(score: number)`, `isPaused`, `onScoreChange(score)`
- Estados locales: `gameState`, `lastFrameTime`
- Lógica de transición entre niveles (mostrar "NIVEL X" por 2s)

### 8. Integrar con GamePlayer y data

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**
- Importar `LaberintoRodanteGame`
- Agregar condicional:
  ```typescript
  if (game.id === 'laberinto-rodante') {
    return <LaberintoRodanteGame onGameOver={handleGameOver} isPaused={isPaused} onScoreChange={setScore} />
  }
  ```

**Archivos modificados:**
- `lib/data.ts`

**Cambios:**
- Agregar entrada en array `GAMES`:
  ```typescript
  {
    id: 'laberinto-rodante',
    title: 'LABERINTO RODANTE',
    short: 'Escala plataformas esquivando barriles rodantes',
    long: 'Inspirado en Donkey Kong. Sube por plataformas inclinadas mientras barriles ruedan hacia abajo. Salta en el momento preciso, evita caer y alcanza la cima. La velocidad aumenta cada nivel.',
    cat: 'ARCADE',
    cover: 'cover-laberinto',
    color: 'brown',
    best: 0,
    plays: '0'
  }
  ```

### 9. Verificación end-to-end

**Comandos:**
```bash
npm run typecheck
npm run dev
```

**Verificar manualmente:**
- Navegar a `/juego/laberinto-rodante/jugar`
- Canvas se renderiza (800×600)
- Controles responden (arrows para mover, space para saltar, P para pausa)
- Climber se mueve horizontalmente sobre plataformas
- Climber puede subir/bajar escaleras con arrow up/down
- Salto funciona (altura 100px, arco parabólico)
- Gravedad aplica cuando climber está en el aire
- Climber aterriza sobre plataformas correctamente
- Plataformas inclinadas se renderizan visualmente
- Barriles aparecen en plataforma superior según timer
- Barriles ruedan hacia abajo por plataformas
- Barriles aceleran en pendientes inclinadas
- Barriles rebotan en bordes de plataforma
- Barriles caen entre plataformas cuando no hay superficie
- Colisión climber-barril resta 1 vida y resetea posición
- Monedas se renderizan con bobbing animation
- Recoger moneda suma 50 pts y desaparece
- Alcanzar goal completa el nivel
- Score se acumula correctamente
- Nivel aumenta al completar
- Game over cuando vidas = 0
- Score se guarda en Supabase al game over
- Leaderboard se actualiza en tiempo real

---

## Criterios de aceptación

- [ ] Componente `LaberintoRodanteGame` se renderiza en `/juego/laberinto-rodante/jugar`
- [ ] Canvas es 800×600 px y está centrado
- [ ] Controles: Arrow Left/Right mueven climber a 200 px/s
- [ ] Arrow Up/Down suben/bajan escalera cuando climber está en una
- [ ] Space hace saltar al climber (altura 100px, duración 0.4s)
- [ ] P pausa el juego
- [ ] 4 niveles implementados con plataformas inclinadas
- [ ] Plataformas se renderizan con ángulo visual
- [ ] Escaleras conectan plataformas verticalmente
- [ ] Climber puede subir/bajar escaleras fluidamente
- [ ] Gravedad aplica al climber cuando no está en plataforma ni escalera
- [ ] Climber aterriza correctamente sobre plataformas inclinadas
- [ ] Barriles aparecen en plataforma superior según spawn rate del nivel
- [ ] Barriles ruedan horizontalmente sobre plataformas
- [ ] Barriles aceleran en pendientes (más rápido cuesta abajo)
- [ ] Barriles rebotan al llegar a borde de plataforma
- [ ] Barriles caen verticalmente entre plataformas cuando no hay superficie
- [ ] Colisión climber-barril resta 1 vida
- [ ] Invulnerabilidad de 1s tras perder vida (parpadeo visual)
- [ ] Monedas se renderizan en posiciones fijas por nivel
- [ ] Monedas tienen animación de bobbing (oscilación vertical)
- [ ] Recoger moneda suma 50 pts y la hace desaparecer
- [ ] Goal en plataforma superior
- [ ] Alcanzar goal completa el nivel y suma 200×nivel pts
- [ ] Barriles explosivos (rojos) aparecen solo en nivel 4
- [ ] Sistema de puntuación funciona: 20 pts/plataforma, 200×nivel al completar, 50 pts/moneda
- [ ] Game over cuando vidas = 0
- [ ] Win al completar nivel 4
- [ ] Modal de game over aparece con score final
- [ ] Botón "Volver" redirige a `/juego/laberinto-rodante`
- [ ] Score se guarda en tabla `scores` de Supabase
- [ ] Score aparece en leaderboard en tiempo real
- [ ] Perfil del usuario se actualiza
- [ ] TypeScript compila sin errores
- [ ] No hay warnings en consola
- [ ] Funciona en navegadores modernos

---

## Decisiones tomadas

1. **Canvas 800×600** — Razón: formato estándar arcade, suficiente altura para 9 plataformas con spacing de 80px

2. **Plataformas inclinadas (no escalones)** — Razón: diferenciación visual con Donkey Kong original; permite física de pendiente en barriles

3. **Física de barril con pendiente** — Razón: realismo; barriles aceleran cuesta abajo, crean timing variable y aumentan dificultad

4. **Escaleras como entidad separada** — Razón: modularidad; permite diseño de nivel flexible (no todas las plataformas conectadas)

5. **Salto con duración fija (0.4s)** — Razón: predecibilidad; el jugador aprende altura exacta, mejora timing

6. **Monedas opcionales en plataformas** — Razón: risk/reward; incentiva exploración pero no son obligatorias para ganar

7. **Barriles explosivos solo en nivel 4** — Razón: progresión de dificultad; último nivel añade elemento de sorpresa (radio mayor, más peligrosos)

8. **4 niveles (no 5)** — Razón: scope; diseño manual de plataformas requiere balanceo cuidadoso, 4 niveles bien diseñados mejor que 5 genéricos

9. **Spawn de barriles en plataforma superior** — Razón: fidelidad a Donkey Kong; los barriles vienen "de arriba", el jugador siempre tiene visibilidad anticipada

10. **Invulnerabilidad de 1s tras morir** — Razón: evitar muertes consecutivas injustas (barril se queda en posición del respawn)

---

## Decisiones descartadas

1. **Martillo para destruir barriles** — Razón: cambia género de esquiva a acción; mejor mantener foco en timing y evasión pura

2. **Enemigos adicionales (pájaros, llamas)** — Razón: dilute la mecánica core; barriles son suficiente variedad con tipos normal/explosivo

3. **Plataformas que colapsan tras pisarlas** — Razón: frustrante en combinación con barriles; una mecánica de presión es suficiente

4. **Sistema de combo por monedas consecutivas** — Razón: incentiva prisa, contradice diseño de timing cuidadoso

5. **Vidas infinitas con timer por nivel** — Razón: cambia tensión de "sobrevivir" a "optimizar"; el límite de vidas es más arcade

6. **Generación procedural de niveles** — Razón: requiere algoritmo complejo de validación (plataformas alcanzables, escaleras correctas); manual es más confiable para MVP

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| Colisión climber-plataforma inclinada imprecisa | Interpolar altura de plataforma basado en X del climber: `y = lerp(leftY, rightY, (x - platformX) / platformWidth)` |
| Barriles atraviesan plataformas con deltaTime grande | Clamping de deltaTime a 50ms máximo; usar swept AABB para movimiento rápido |
| Climber se atasca en escalera | Verificar transición escalera→plataforma con overlap threshold (4px); forzar salida si Y alcanza plataforma |
| Barriles se acumulan y causan lag | Eliminar barriles fuera de pantalla (y > CANVAS_HEIGHT + 50); máximo 15 barriles activos |
| Física de rebote en bordes imprevisible | Damping de 0.6 reduce velocidad cada rebote; tras 3 rebotes, eliminar barril (probablemente atrapado) |
| Niveles muy difíciles para casual players | Playtesting; ajustar spawn rates si completion rate < 30% |
| Salto muy bajo, imposible esquivar barriles | Altura de 100px permite saltar SOBRE barriles (radio 16); verificar con hitboxes |

---

**FIN DE SPEC**
