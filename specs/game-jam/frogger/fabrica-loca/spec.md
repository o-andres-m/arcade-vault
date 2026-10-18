# GAME JAM: FROGGER — FÁBRICA LOCA

**Estado:** Draft
**Depende de:** SPEC 04 (Juego Asteroides), SPEC 06 (Arkanoid), SPEC 07 (Snake)
**Fecha:** 2026-10-18
**Game Jam Tema:** frogger

**Objetivo:** Implementar FÁBRICA LOCA para Arcade Vault, un juego de cruce de obstáculos inspirado en Frogger pero con temática industrial, donde el jugador salta entre cintas transportadoras que se mueven a diferentes velocidades mientras evita maquinaria peligrosa, integrándolo con Supabase para persistencia de scores y siguiendo la arquitectura establecida.

---

## Alcance

### Incluido

- Creación en TypeScript en `/lib/game/fabrica-loca/`
- Componente React `FabricaLocaGame` para `/juego/fabrica-loca/jugar`
- **5 niveles con complejidad progresiva:**
  - Nivel 1: 5 cintas, velocidades 50-100 px/s
  - Nivel 2: 6 cintas, velocidades 75-125 px/s, introducción de cajas
  - Nivel 3: 7 cintas, velocidades 100-150 px/s, prensas cada 3 segundos
  - Nivel 4: 8 cintas, velocidades 125-175 px/s, engranajes giratorios
  - Nivel 5: 9 cintas, velocidades 150-200 px/s, todos los obstáculos combinados
- **Sistema de puntuación:**
  - Cruzar una cinta: 10 pts
  - Completar nivel: 100 pts × nivel
  - Tiempo restante al completar: 1 pt/segundo
  - Vida extra cada 1000 pts
- **Entidades:**
  - Worker (jugador): sprite 32×32 con 4 direcciones
  - Cintas transportadoras: 800×80 cada una, textura de rayas animadas
  - Cajas: 40×40, se mueven con la cinta
  - Prensas: 64×120, suben/bajan en intervalos
  - Engranajes: radio 30, giran continuamente
  - Zonas seguras: espacios entre cintas donde el jugador descansa
- **Canvas:** 800×640 centrado
- **Controles:**
  - Arrow Up/Down/Left/Right: mover 1 celda en grid (80px)
  - Space: pausa
  - R: reiniciar nivel
- **Assets:** Sprites en `/public/games/fabrica-loca/` (worker, cinta, caja, prensa, engranaje)
- Persistencia de score en Supabase al game over
- Timer de 60 segundos por nivel
- Sistema de vidas (3 iniciales)

### No incluido

- Tests unitarios
- Power-ups (solo mecánica core en v1)
- Efectos de partículas complejos (solo flashes básicos)
- Modo multijugador
- Música de fondo (solo efectos de sonido básicos: salto, golpe, completar nivel)
- Animaciones de transición entre niveles (fade simple)

---

## Modelo de datos

### Entidades del juego

**Worker (Jugador):**
- Position: `x: number, y: number` (centro del sprite)
- Grid position: `gridX: number, gridY: number` (posición en grid 10×8 de 80px)
- Size: `width: 32, height: 32`
- State: `state: 'idle' | 'moving' | 'dead'`
- Direction: `facing: 'up' | 'down' | 'left' | 'right'` (para sprite animation)
- Animation: `animFrame: number` (frame actual de animación)
- Invulnerability: `invulnerable: boolean, invulnTimer: number` (0.5s tras spawn)

**ConveyorBelt (Cinta transportadora):**
- Position: `y: number` (posición vertical fija)
- Size: `width: 800, height: 80`
- Velocity: `speed: number` (pixels/segundo, puede ser negativo para dirección inversa)
- Direction: `dir: 'left' | 'right'`
- Animation: `offset: number` (offset de textura para animar movimiento)
- Active: `active: boolean` (algunas cintas se detienen en niveles avanzados)

**Box (Caja en cinta):**
- Position: `x: number, y: number` (top-left corner)
- Size: `width: 40, height: 40`
- Velocity: `vx: number` (heredada de la cinta)
- Belt: `beltIndex: number` (índice de la cinta a la que pertenece)
- State: `active: boolean` (false si salió de pantalla)

**Press (Prensa):**
- Position: `x: number, y: number` (top-left corner)
- Size: `width: 64, height: 120`
- State: `state: 'up' | 'down' | 'moving-down' | 'moving-up'`
- Timer: `timer: number` (controla ciclo de bajada/subida)
- Cycle duration: `cycleDuration: 3` (segundos)
- Danger zone: `dangerZone: {x, y, width, height}` (área que mata al jugador)

**Gear (Engranaje):**
- Position: `x: number, y: number` (centro)
- Size: `radius: 30`
- Rotation: `angle: number` (radianes)
- Speed: `rotationSpeed: number` (radianes/segundo)
- Active: `active: boolean`

**SafeZone (Zona segura):**
- Position: `y: number` (posición vertical)
- Size: `width: 800, height: 80`
- Type: `type: 'start' | 'checkpoint' | 'goal'`

### GameState

```typescript
interface GameState {
  // Entidades principales
  worker: Worker
  belts: ConveyorBelt[]
  boxes: Box[]
  presses: Press[]
  gears: Gear[]
  safeZones: SafeZone[]
  
  // Progreso del juego
  score: number
  lives: number
  currentLevel: number
  
  // Máquina de estados
  gameState: 'playing' | 'paused' | 'gameover' | 'win' | 'level-complete'
  
  // Timer
  levelTimer: number  // segundos restantes
  
  // Flags
  goalReached: boolean
  canMove: boolean  // false durante animación de muerte
}
```

### Constantes del juego

```typescript
// Canvas
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 640

// Grid
GRID_COLS = 10
GRID_ROWS = 8
CELL_SIZE = 80

// Worker
WORKER_SIZE = 32
WORKER_SPEED = 400  // px/s durante animación de movimiento
WORKER_MOVE_DURATION = 0.15  // segundos para mover 1 celda
WORKER_INVULN_TIME = 0.5  // segundos de invulnerabilidad tras spawn

// Cintas transportadoras
BELT_HEIGHT = 80
BELT_SPEED_BASE = 50  // nivel 1
BELT_SPEED_INCREMENT = 25  // por nivel
BELT_ANIMATION_SPEED = 100  // px/s de textura

// Cajas
BOX_SIZE = 40
BOX_SPAWN_RATE = 2  // segundos entre spawns por cinta
BOX_POINTS = 0  // no dan puntos, solo obstáculos

// Prensas
PRESS_WIDTH = 64
PRESS_HEIGHT = 120
PRESS_CYCLE = 3  // segundos
PRESS_DOWN_TIME = 1  // segundos que permanece abajo
PRESS_SPEED = 200  // px/s de movimiento

// Engranajes
GEAR_RADIUS = 30
GEAR_ROTATION_SPEED = 2  // radianes/segundo

// Zonas seguras
SAFE_ZONE_HEIGHT = 80

// Niveles
TOTAL_LEVELS = 5
LEVEL_TIME_LIMIT = 60  // segundos por nivel

// Puntuación
POINTS_PER_LANE = 10
POINTS_PER_LEVEL = 100  // × nivel
POINTS_PER_SECOND_REMAINING = 1
LIFE_BONUS_THRESHOLD = 1000  // pts

// Vidas
INITIAL_LIVES = 3
```

### Variables de entorno

No se requieren nuevas variables. Se usan las existentes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Plan de implementación

### 1. Crear módulo base de tipos y constantes

**Archivos nuevos:**
- `lib/game/fabrica-loca/types.ts`
- `lib/game/fabrica-loca/constants.ts`

**Cambios:**
- Definir interfaces TypeScript: `Worker`, `ConveyorBelt`, `Box`, `Press`, `Gear`, `SafeZone`, `GameState`
- Exportar todas las constantes numéricas del juego
- Tipos auxiliares: `Direction`, `WorkerState`, `PressState`

### 2. Crear entidades del juego

**Archivos nuevos:**
- `lib/game/fabrica-loca/entities/Worker.ts`
- `lib/game/fabrica-loca/entities/ConveyorBelt.ts`
- `lib/game/fabrica-loca/entities/Box.ts`
- `lib/game/fabrica-loca/entities/Press.ts`
- `lib/game/fabrica-loca/entities/Gear.ts`

**Cambios:**
- Función factory `createWorker(gridX, gridY): Worker`
- Función factory `createConveyorBelt(y, speed, dir): ConveyorBelt`
- Función factory `createBox(x, y, beltIndex): Box`
- Función factory `createPress(x, y): Press`
- Función factory `createGear(x, y, speed): Gear`
- Métodos `update(dt)` para cada entidad con lógica interna

### 3. Crear sistema de física y colisiones

**Archivos nuevos:**
- `lib/game/fabrica-loca/physics/collision.ts`
- `lib/game/fabrica-loca/physics/utils.ts`

**Cambios:**
- Función `checkWorkerBoxCollision(worker, boxes): boolean`
- Función `checkWorkerPressCollision(worker, presses): boolean`
- Función `checkWorkerGearCollision(worker, gears): boolean`
- Función `isWorkerOnBelt(worker, belt): boolean` (para heredar velocidad)
- Función `isWorkerInSafeZone(worker, safeZones): SafeZone | null`
- Utilidades: `rectIntersects()`, `circleRectIntersects()`, `clamp()`

### 4. Crear sistema de niveles

**Archivos nuevos:**
- `lib/game/fabrica-loca/levels.ts`

**Cambios:**
- Array `LEVELS: LevelConfig[]` con 5 configuraciones
- Cada nivel define:
  - `beltCount: number`
  - `beltSpeeds: number[]` (uno por cinta)
  - `boxesEnabled: boolean`
  - `pressesEnabled: boolean`
  - `pressPositions: {x, beltIndex}[]`
  - `gearsEnabled: boolean`
  - `gearPositions: {x, y}[]`
- Función `loadLevel(levelNumber): LevelData` que genera estado inicial

### 5. Crear motor del juego

**Archivos nuevos:**
- `lib/game/fabrica-loca/engine/gameEngine.ts`

**Cambios:**
- `initializeGame(level): GameState` — Estado inicial de nivel
- `updateGameState(state, dt, input): GameState` — Loop principal
  - Actualizar worker (grid movement, animación)
  - Actualizar cintas (animación de textura)
  - Actualizar cajas (movimiento, spawn)
  - Actualizar prensas (ciclo up/down)
  - Actualizar engranajes (rotación)
  - Aplicar velocidad de cinta al worker si está sobre una
  - Detectar colisiones y matar al worker si aplica
  - Actualizar timer
  - Verificar win/game over
- `handleInput(state, input): GameState` — Procesar teclas de dirección
- `moveWorker(state, direction): GameState` — Mover 1 celda en grid
- `spawnBoxes(state, dt): void` — Generar cajas en cintas
- `checkGoalReached(state): boolean` — Worker llegó a zona goal
- `checkGameOver(state): boolean` — Timer agotado o sin vidas

### 6. Crear renderizador

**Archivos nuevos:**
- `lib/game/fabrica-loca/renderer/draw.ts`

**Cambios:**
- `drawGame(ctx, state): void` — Renderiza todo
- `drawBackground(ctx): void` — Fondo de fábrica
- `drawSafeZones(ctx, safeZones): void` — Zonas con color diferenciado
- `drawConveyorBelts(ctx, belts): void` — Cintas con textura animada
- `drawBoxes(ctx, boxes): void` — Cajas sobre cintas
- `drawPresses(ctx, presses): void` — Prensas con animación up/down
- `drawGears(ctx, gears): void` — Engranajes con dientes giratorios
- `drawWorker(ctx, worker): void` — Sprite del trabajador con dirección
- `drawHUD(ctx, state): void` — Score, vidas, timer, nivel

### 7. Crear componente React

**Archivos nuevos:**
- `components/games/FabricaLocaGame.tsx`

**Cambios:**
- Componente funcional con canvas ref
- Game loop con `requestAnimationFrame`
- Input handling:
  - `useEffect` para escuchar `keydown`
  - Mapear arrows a direcciones
  - Space para pausa
  - R para reiniciar
- Props: `onGameOver(score: number)`, `isPaused`, `onScoreChange(score)`
- Estados locales: `gameState`, `lastFrameTime`
- Lógica de transición entre niveles (mostrar "NIVEL X" por 2s)

### 8. Integrar con GamePlayer y data

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**
- Importar `FabricaLocaGame`
- Agregar condicional:
  ```typescript
  if (game.id === 'fabrica-loca') {
    return <FabricaLocaGame onGameOver={handleGameOver} isPaused={isPaused} onScoreChange={setScore} />
  }
  ```

**Archivos modificados:**
- `lib/data.ts`

**Cambios:**
- Agregar entrada en array `GAMES`:
  ```typescript
  {
    id: 'fabrica-loca',
    title: 'FÁBRICA LOCA',
    short: 'Cruza cintas transportadoras y evita la maquinaria',
    long: 'Una fábrica industrial descontrolada. Salta entre cintas transportadoras que se mueven a diferentes velocidades mientras evitas cajas, prensas y engranajes. Llega a la puerta de salida antes de que te aplasten.',
    cat: 'ARCADE',
    cover: 'cover-fabrica',
    color: 'orange',
    best: 0,
    plays: '0'
  }
  ```

### 9. Verificación end-to-end

**Comandos:**
```bash
npm run typecheck  # TypeScript compila sin errores
npm run dev        # Iniciar servidor
```

**Verificar manualmente:**
- Navegar a `/juego/fabrica-loca/jugar`
- Canvas se renderiza (800×640)
- Controles responden (arrows para mover, space para pausa)
- Worker se mueve en grid de 80px
- Cintas se animan con textura en movimiento
- Worker hereda velocidad de la cinta (se desplaza horizontalmente)
- Cajas aparecen y se mueven con la cinta
- Colisión con caja mata al worker
- Prensas bajan y suben en ciclo de 3 segundos
- Colisión con prensa abajo mata al worker
- Engranajes giran continuamente
- Colisión con engranaje mata al worker
- Alcanzar zona goal completa el nivel
- Timer cuenta regresivamente
- Score se acumula correctamente
- Vidas disminuyen al morir
- Nivel aumenta al completar
- Score se guarda en Supabase al game over
- Leaderboard se actualiza en tiempo real

---

## Criterios de aceptación

- [ ] Componente `FabricaLocaGame` se renderiza en `/juego/fabrica-loca/jugar`
- [ ] Canvas es 800×640 px y está centrado
- [ ] Controles funcionan: Arrow keys mueven al worker 1 celda (80px) en grid
- [ ] Space pausa el juego
- [ ] R reinicia el nivel actual
- [ ] Worker se renderiza como sprite 32×32 con animación de dirección
- [ ] 5 niveles implementados con configuraciones únicas
- [ ] Cintas transportadoras se animan con textura en movimiento
- [ ] Worker hereda velocidad de la cinta cuando está sobre ella
- [ ] Worker se detiene en zonas seguras (no hereda velocidad)
- [ ] Cajas aparecen en cintas y se mueven con ellas
- [ ] Colisión worker-caja mata al worker y resta 1 vida
- [ ] Prensas suben y bajan en ciclos de 3 segundos
- [ ] Colisión worker-prensa (cuando está abajo) mata al worker
- [ ] Engranajes giran continuamente
- [ ] Colisión worker-engranaje mata al worker
- [ ] Timer de 60 segundos cuenta regresivamente por nivel
- [ ] Alcanzar zona goal completa el nivel y otorga bonus
- [ ] Sistema de puntuación funciona: 10 pts/cinta, 100×nivel al completar, 1 pt/seg restante
- [ ] Vida extra cada 1000 pts
- [ ] Game over ocurre cuando vidas = 0 o timer = 0
- [ ] Win ocurre al completar nivel 5
- [ ] Modal de game over aparece con score final
- [ ] Botón "Volver" redirige a `/juego/fabrica-loca`
- [ ] Score se guarda en tabla `scores` de Supabase
- [ ] Score aparece en leaderboard en tiempo real
- [ ] Perfil del usuario se actualiza (`total_games` +1, `total_score` sumado)
- [ ] TypeScript compila sin errores (`npm run typecheck`)
- [ ] No hay warnings en consola durante juego
- [ ] Funciona en navegadores modernos (Chrome, Firefox, Safari)

---

## Decisiones tomadas

1. **Canvas 800×640** — Razón: mantener consistencia con otros juegos de Arcade Vault, altura extra (640 vs 600) para acomodar más cintas verticalmente

2. **Grid de 80px** — Razón: balance entre precisión y jugabilidad; 10×8 celdas permite 8 filas (6 cintas + 2 zonas seguras)

3. **Worker hereda velocidad de cinta** — Razón: fidelidad a mecánica Frogger original donde troncos arrastran al jugador; aumenta dificultad y timing

4. **Zonas seguras entre cintas** — Razón: dar al jugador espacios para planear el siguiente movimiento sin ser arrastrado; reduce frustración

5. **3 tipos de obstáculos (cajas, prensas, engranajes)** — Razón: variedad visual y mecánica; cada uno introduce timing diferente (constante, cíclico, continuo)

6. **5 niveles con escalado progresivo** — Razón: curva de dificultad balanceada; introducir obstáculos gradualmente (nivel 2: cajas, nivel 3: prensas, nivel 4: engranajes)

7. **Timer de 60 segundos por nivel** — Razón: añadir presión sin ser excesivamente estresante; promedio de 10s por cinta con margen

8. **Movimiento discreto en grid (no fluido)** — Razón: mantener simplicidad de arcade clásico; evitar física compleja

9. **Guardar score solo al finalizar** — Razón: reduce carga en Supabase (1 request por partida vs múltiples durante juego)

10. **Sprites simples 32×32** — Razón: rendimiento, estética pixel-art retro, facilidad de animación (4 frames por dirección)

---

## Decisiones descartadas

1. **Power-ups temporales (escudo, slowdown)** — Razón: añade complejidad innecesaria para MVP; puede implementarse en v2 si se requiere

2. **Cintas que cambian de dirección aleatoriamente** — Razón: frustrante para el jugador; patrones predecibles son más justos y permiten estrategia

3. **Modo endless con generación procedural** — Razón: scope creep; 5 niveles diseñados manualmente son suficientes para v1

4. **Múltiples tipos de worker (fast, strong, etc.)** — Razón: dilute el foco en timing; un solo tipo mantiene la pureza arcade

5. **Sistema de combo por cruzar múltiples cintas sin parar** — Razón: incentiva risk-taking excesivo; contraproducente con diseño de zonas seguras

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| Worker se atasca en borde de pantalla cuando cinta lo arrastra | Clamping de posición: `x = clamp(x, 0, CANVAS_WIDTH - WORKER_SIZE)` |
| Colisiones falsas cuando worker está en transición entre celdas | Usar centro del worker para collision checks, no esquinas |
| Timing de prensas imprevisible con deltaTime variable | Usar timer acumulativo independiente, no depender de frames |
| Cajas se acumulan y causan lag | Eliminar cajas que salen de pantalla (`x < -BOX_SIZE` o `x > CANVAS_WIDTH`) |
| Niveles muy difíciles o muy fáciles | Playtesting y ajuste de velocidades; números actuales son estimados |
| Rendimiento bajo con muchas entidades | Limitar cajas activas a 20 máximo por nivel; object pooling si es necesario |
| Worker invisible tras muerte durante invulnerabilidad | Efecto de parpadeo (alpha alternando 0/1) durante invulnerabilidad |

---

**FIN DE SPEC**
