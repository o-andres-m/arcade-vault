# GAME JAM: FROGGER — TORRE DE TRÁFICO

**Estado:** Draft
**Depende de:** SPEC 04 (Juego Asteroides), SPEC 06 (Arkanoid), SPEC 07 (Snake)
**Fecha:** 2026-10-18
**Game Jam Tema:** frogger

**Objetivo:** Implementar TORRE DE TRÁFICO para Arcade Vault, un juego de puzzle basado en la mecánica de cruzar de Frogger pero desde la perspectiva del controlador de tráfico, donde el jugador gestiona semáforos para permitir que vehículos crucen una intersección sin colisionar, integrándolo con Supabase para persistencia de scores y siguiendo la arquitectura establecida.

---

## Alcance

### Incluido

- Creación en TypeScript en `/lib/game/torre-trafico/`
- Componente React `TorreTraficoGame` para `/juego/torre-trafico/jugar`
- **5 niveles con intersecciones progresivamente complejas:**
  - Nivel 1: Intersección 2×2 (2 carriles H + 2 carriles V), 5 vehículos/min
  - Nivel 2: Intersección 3×3 (3H + 3V), 8 vehículos/min
  - Nivel 3: Intersección 4×4 (4H + 4V), 12 vehículos/min + ambulancias prioritarias
  - Nivel 4: Intersección 3×3 con giros permitidos, 15 vehículos/min
  - Nivel 5: Intersección 4×4 con giros y ambulancias, 20 vehículos/min
- **Sistema de puntuación:**
  - Vehículo cruza sin chocar: 10 pts
  - Ambulancia cruza rápido (< 3s esperando): 50 pts bonus
  - Nivel completado sin choques: 200 pts × nivel
  - Penalización por choque: -100 pts
  - Penalización por bloqueo prolongado (> 10s): -20 pts
- **Entidades:**
  - Semáforos: 4-8 semáforos (1-2 por dirección), estado rojo/verde
  - Vehículos: tamaño 40×24, velocidad 100-150 px/s, 3 tipos (auto, camión, ambulancia)
  - Intersección: zona central donde ocurren colisiones
  - Cola de espera: vehículos esperando en cada carril
- **Canvas:** 800×600 centrado
- **Controles:**
  - Click en semáforo: alternar rojo ↔ verde
  - Números 1-8: alternar semáforo N directamente
  - Space: pausa
  - A: modo automático (AI toma control por 5s, -50 pts)
- **Mecánica de nivel:**
  - Cada nivel requiere cruzar N vehículos sin choques (N = 10, 15, 20, 25, 30)
  - 3 choques = game over
  - Bloqueo total (todos los carriles llenos) por 15s = game over
- **Assets:** Sprites en `/public/games/torre-trafico/` (semáforo, auto, camión, ambulancia, intersección)
- Persistencia de score en Supabase al game over
- Sistema de "strikes" (3 choques máximos)

### No incluido

- Tests unitarios
- Giros complejos (U-turn, 3-way) — solo giros izquierda/derecha básicos en niveles 4-5
- Peatones cruzando (solo vehículos)
- Modo endless con dificultad infinita
- Power-ups o habilidades especiales (excepto modo automático básico)
- Modo multijugador
- Música de fondo (solo efectos: bocina, sirena ambulancia, choque)
- Análisis de eficiencia (tiempo promedio de espera, throughput) — solo score y choques

---

## Modelo de datos

### Entidades del juego

**TrafficLight (Semáforo):**
- Position: `x: number, y: number` (centro)
- Size: `width: 32, height: 64`
- State: `state: 'red' | 'green'`
- Direction: `direction: 'north' | 'south' | 'east' | 'west'`
- Lane: `laneIndex: number` (índice del carril que controla)
- Cooldown: `cooldownTimer: number` (0.5s tras cambiar, evita spam de clicks)

**Vehicle (Vehículo):**
- Position: `x: number, y: number` (centro)
- Size: `width: 40, height: 24` (o `width: 24, height: 60` si es vertical)
- Velocity: `speed: number` (px/s)
- Type: `type: 'car' | 'truck' | 'ambulance'`
- Direction: `direction: 'north' | 'south' | 'east' | 'west'`
- State: `state: 'waiting' | 'crossing' | 'crossed' | 'collided'`
- Lane: `laneIndex: number`
- Wait time: `waitTime: number` (segundos esperando en semáforo rojo)
- Turn intent: `willTurn: boolean, turnDirection: 'left' | 'right' | null` (solo niveles 4-5)
- Bounding box: `bbox: {x, y, width, height}` (para detección de colisiones)

**Lane (Carril):**
- Direction: `direction: 'north' | 'south' | 'east' | 'west'`
- Position: `x: number, y: number` (punto de spawn)
- Traffic light: `trafficLightIndex: number`
- Queue: `vehiclesInQueue: number` (cantidad esperando)
- Spawn timer: `spawnTimer: number` (tiempo hasta próximo vehículo)

**Intersection (Intersección):**
- Position: `x: number, y: number, width: number, height: number` (zona central)
- Active vehicles: `vehiclesCrossing: Vehicle[]` (vehículos dentro de intersección)

### GameState

```typescript
interface GameState {
  // Entidades principales
  trafficLights: TrafficLight[]
  vehicles: Vehicle[]
  lanes: Lane[]
  intersection: Intersection
  
  // Progreso del juego
  score: number
  strikes: number  // choques acumulados (máximo 3)
  currentLevel: number
  vehiclesCrossed: number  // vehículos que completaron cruce
  vehiclesRequired: number  // objetivo del nivel
  
  // Máquina de estados
  gameState: 'playing' | 'paused' | 'gameover' | 'win' | 'level-complete'
  
  // Timers
  spawnRate: number  // segundos entre spawns
  totalBlockTime: number  // tiempo con intersección bloqueada
  autoModeTimer: number  // tiempo restante de modo automático (0 = inactivo)
  
  // Flags
  isBlocked: boolean  // true si todos los carriles están llenos
  levelComplete: boolean
}
```

### Constantes del juego

```typescript
// Canvas
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600

// Intersección
INTERSECTION_SIZE = 240  // px (cuadrado central)
INTERSECTION_X = 280  // (800 - 240) / 2
INTERSECTION_Y = 180  // (600 - 240) / 2

// Semáforos
TRAFFIC_LIGHT_WIDTH = 32
TRAFFIC_LIGHT_HEIGHT = 64
LIGHT_COOLDOWN = 0.5  // segundos entre cambios

// Vehículos
VEHICLE_WIDTH = 40
VEHICLE_HEIGHT = 24
VEHICLE_SPEED_CAR = 120  // px/s
VEHICLE_SPEED_TRUCK = 90  // px/s más lento
VEHICLE_SPEED_AMBULANCE = 150  // px/s más rápido
VEHICLE_WAIT_THRESHOLD = 10  // segundos antes de penalización
AMBULANCE_PRIORITY_TIME = 3  // segundos para bonus

// Carriles
LANE_WIDTH = 60  // px
LANE_OFFSET = 30  // px desde borde de intersección

// Spawning
SPAWN_RATE_LEVEL_1 = 12  // segundos entre spawns (5 veh/min)
SPAWN_RATE_LEVEL_2 = 7.5
SPAWN_RATE_LEVEL_3 = 5
SPAWN_RATE_LEVEL_4 = 4
SPAWN_RATE_LEVEL_5 = 3
AMBULANCE_SPAWN_CHANCE = 0.15  // 15% en niveles 3-5
TRUCK_SPAWN_CHANCE = 0.25  // 25% siempre

// Niveles
TOTAL_LEVELS = 5
VEHICLES_LEVEL_1 = 10
VEHICLES_LEVEL_2 = 15
VEHICLES_LEVEL_3 = 20
VEHICLES_LEVEL_4 = 25
VEHICLES_LEVEL_5 = 30

// Puntuación
POINTS_PER_VEHICLE = 10
POINTS_AMBULANCE_BONUS = 50
POINTS_PER_LEVEL = 200  // × nivel
PENALTY_CRASH = -100
PENALTY_LONG_WAIT = -20

// Strikes
MAX_STRIKES = 3  // 3 choques = game over

// Bloqueo
BLOCK_TIMEOUT = 15  // segundos de bloqueo total = game over

// Modo automático
AUTO_MODE_DURATION = 5  // segundos
AUTO_MODE_PENALTY = -50  // puntos
```

### Variables de entorno

No se requieren nuevas variables. Se usan las existentes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Plan de implementación

### 1. Crear módulo base de tipos y constantes

**Archivos nuevos:**
- `lib/game/torre-trafico/types.ts`
- `lib/game/torre-trafico/constants.ts`

**Cambios:**
- Definir interfaces: `TrafficLight`, `Vehicle`, `Lane`, `Intersection`, `GameState`
- Tipos auxiliares: `Direction`, `LightState`, `VehicleType`, `VehicleState`
- Exportar todas las constantes numéricas

### 2. Crear entidades del juego

**Archivos nuevos:**
- `lib/game/torre-trafico/entities/TrafficLight.ts`
- `lib/game/torre-trafico/entities/Vehicle.ts`
- `lib/game/torre-trafico/entities/Lane.ts`
- `lib/game/torre-trafico/entities/Intersection.ts`

**Cambios:**
- Factory `createTrafficLight(x, y, direction, laneIndex): TrafficLight`
- Factory `createVehicle(type, direction, lane, willTurn?): Vehicle` — calcula posición de spawn basado en dirección
- Factory `createLane(direction, trafficLightIndex): Lane`
- Factory `createIntersection(x, y, size): Intersection`
- Método `toggleLight(light): void` — alterna red ↔ green con cooldown check
- Método `updateVehicle(vehicle, dt, canMove): void` — mover si semáforo verde

### 3. Crear sistema de física y colisiones

**Archivos nuevos:**
- `lib/game/torre-trafico/physics/collision.ts`
- `lib/game/torre-trafico/physics/utils.ts`

**Cambios:**
- Función `detectVehicleCollisions(vehicles): {v1: Vehicle, v2: Vehicle}[]` — AABB collision en intersección
- Función `isVehicleInIntersection(vehicle, intersection): boolean`
- Función `canVehicleEnter(vehicle, trafficLight): boolean` — verificar si luz está verde
- Utilidades: `rectIntersects()`, `distance()`, `clamp()`

### 4. Crear sistema de niveles

**Archivos nuevos:**
- `lib/game/torre-trafico/levels.ts`

**Cambios:**
- Array `LEVELS: LevelConfig[]` con 5 configuraciones
- Cada nivel define:
  - `laneCount: {horizontal: number, vertical: number}`
  - `turnsEnabled: boolean`
  - `spawnRate: number` (segundos)
  - `vehiclesRequired: number`
  - `ambulancesEnabled: boolean`
- Función `loadLevel(levelNumber): LevelData` — genera carriles, semáforos, intersección

### 5. Crear sistema de AI (modo automático)

**Archivos nuevos:**
- `lib/game/torre-trafico/ai/autoMode.ts`

**Cambios:**
- Función `autoControlLights(state, dt): void` — AI básica que gestiona semáforos
- Algoritmo simple:
  1. Contar vehículos esperando en cada dirección (H vs V)
  2. Si H > V, dar verde a horizontales
  3. Si ambulancia esperando, prioridad inmediata
  4. Cambiar luz solo si cola opuesta está vacía o tras timeout
- No es perfecto (intencional) — el jugador manual puede ser más eficiente

### 6. Crear motor del juego

**Archivos nuevos:**
- `lib/game/torre-trafico/engine/gameEngine.ts`

**Cambios:**
- `initializeGame(level): GameState` — Estado inicial
- `updateGameState(state, dt): GameState` — Loop principal:
  - Si modo automático activo, ejecutar AI
  - Actualizar timers de spawn por carril
  - Spawn de nuevos vehículos según spawn rate
  - Actualizar posición de vehículos (solo si luz verde)
  - Incrementar waitTime de vehículos detenidos
  - Detectar colisiones en intersección → +1 strike
  - Remover vehículos que cruzaron completamente
  - Verificar bloqueo total (todas las colas llenas)
  - Verificar objetivo del nivel alcanzado
  - Verificar game over (strikes ≥ 3 o bloqueo > 15s)
- `handleLightToggle(state, lightIndex): void` — Click en semáforo
- `spawnVehicle(state, lane): void` — Generar vehículo aleatorio
- `checkLevelComplete(state): boolean`
- `checkGameOver(state): boolean`

### 7. Crear renderizador

**Archivos nuevos:**
- `lib/game/torre-trafico/renderer/draw.ts`

**Cambios:**
- `drawGame(ctx, state): void` — Renderiza todo
- `drawBackground(ctx): void` — Carreteras con líneas
- `drawIntersection(ctx, intersection): void` — Zona central con cruce
- `drawLanes(ctx, lanes): void` — Carriles con dirección
- `drawTrafficLights(ctx, lights): void` — Semáforos (círculos rojo/verde)
- `drawVehicles(ctx, vehicles): void` — Vehículos con color por tipo (ambulancia = rojo+azul parpadeante)
- `drawHUD(ctx, state): void` — Score, strikes (corazones), vehículos cruzados/requeridos, modo auto activo

### 8. Crear componente React

**Archivos nuevos:**
- `components/games/TorreTraficoGame.tsx`

**Cambios:**
- Componente funcional con canvas ref
- Game loop con `requestAnimationFrame`
- Input handling:
  - `onClick` en canvas para detectar clicks en semáforos
  - `onKeyDown` para números 1-8 (toggle directo)
  - Space para pausa
  - Tecla A para activar modo automático
- Props: `onGameOver(score: number)`, `isPaused`, `onScoreChange(score)`
- Estados locales: `gameState`, `lastFrameTime`
- Lógica de transición entre niveles (mostrar "NIVEL X" por 2s)
- Hover effect en semáforos (resaltar cuando mouse está encima)

### 9. Integrar con GamePlayer y data

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**
- Importar `TorreTraficoGame`
- Agregar condicional:
  ```typescript
  if (game.id === 'torre-trafico') {
    return <TorreTraficoGame onGameOver={handleGameOver} isPaused={isPaused} onScoreChange={setScore} />
  }
  ```

**Archivos modificados:**
- `lib/data.ts`

**Cambios:**
- Agregar entrada en array `GAMES`:
  ```typescript
  {
    id: 'torre-trafico',
    title: 'TORRE DE TRÁFICO',
    short: 'Gestiona semáforos para evitar choques masivos',
    long: 'Eres el controlador de tráfico de una intersección caótica. Alterna semáforos en rojo y verde para que vehículos crucen sin colisionar. Cada nivel añade más carriles y velocidades impredecibles.',
    cat: 'PUZZLE',
    cover: 'cover-trafico',
    color: 'cyan',
    best: 0,
    plays: '0'
  }
  ```

### 10. Verificación end-to-end

**Comandos:**
```bash
npm run typecheck
npm run dev
```

**Verificar manualmente:**
- Navegar a `/juego/torre-trafico/jugar`
- Canvas se renderiza (800×600)
- Intersección central se renderiza correctamente
- Semáforos aparecen en posiciones correctas (1 por carril)
- Click en semáforo alterna rojo ↔ verde
- Teclas 1-8 alternan semáforos directamente
- Space pausa el juego
- Vehículos aparecen en carriles según spawn rate
- Vehículos esperan si semáforo está en rojo
- Vehículos avanzan si semáforo está en verde
- Vehículos se detienen antes de intersección si luz roja
- Vehículos cruzan intersección si luz verde
- Colisión entre 2 vehículos incrementa strikes
- HUD muestra strikes (corazones o contador)
- Ambulancias se renderizan con colores distintivos
- Ambulancias generan bonus si cruzan rápido (< 3s espera)
- Camiones se mueven más lento que autos
- Nivel completo cuando vehiclesCrossed = vehiclesRequired
- Game over cuando strikes = 3
- Game over cuando bloqueo total > 15s
- Modo automático (tecla A) toma control por 5s y resta 50 pts
- Score se acumula correctamente
- Penalización por choque (-100 pts)
- Penalización por espera larga (-20 pts)
- Score se guarda en Supabase al game over
- Leaderboard se actualiza en tiempo real

---

## Criterios de aceptación

- [ ] Componente `TorreTraficoGame` se renderiza en `/juego/torre-trafico/jugar`
- [ ] Canvas es 800×600 px y está centrado
- [ ] Intersección central (240×240) se renderiza visualmente
- [ ] Semáforos aparecen en posiciones correctas (2-8 según nivel)
- [ ] Click en semáforo alterna estado rojo ↔ verde
- [ ] Cooldown de 0.5s entre cambios de un mismo semáforo
- [ ] Teclas 1-8 alternan semáforos directamente
- [ ] Space pausa el juego
- [ ] Tecla A activa modo automático por 5s y resta 50 pts
- [ ] 5 niveles implementados con configuraciones únicas
- [ ] Vehículos aparecen en carriles según spawn rate del nivel
- [ ] Vehículos tienen 3 tipos: auto (verde), camión (gris), ambulancia (rojo)
- [ ] Vehículos esperan si semáforo está en rojo
- [ ] Vehículos avanzan hacia intersección si semáforo está en verde
- [ ] Vehículos se detienen antes de entrar si luz roja
- [ ] Vehículos cruzan intersección y salen por lado opuesto
- [ ] Colisión entre 2 vehículos en intersección incrementa strikes en 1
- [ ] Strikes se muestran en HUD (máximo 3)
- [ ] Game over cuando strikes = 3
- [ ] Ambulancias se renderizan con colores distintivos (rojo con luz parpadeante)
- [ ] Ambulancias generan 50 pts bonus si cruzan en < 3s de espera
- [ ] Camiones se mueven a 90 px/s (más lento que autos a 120 px/s)
- [ ] Vehículos que esperan > 10s generan penalización de -20 pts
- [ ] Sistema de puntuación funciona: 10 pts/vehículo, 50 bonus ambulancia, 200×nivel al completar
- [ ] Objetivo del nivel se muestra en HUD (X/N vehículos cruzados)
- [ ] Nivel completo cuando vehiclesCrossed = vehiclesRequired
- [ ] Bloqueo total (todos carriles llenos) se detecta
- [ ] Game over si bloqueo total > 15s
- [ ] Modo automático (AI) controla luces por 5s
- [ ] Indicador visual de modo auto activo
- [ ] Win al completar nivel 5
- [ ] Modal de game over aparece con score final
- [ ] Botón "Volver" redirige a `/juego/torre-trafico`
- [ ] Score se guarda en tabla `scores` de Supabase
- [ ] Score aparece en leaderboard en tiempo real
- [ ] Perfil del usuario se actualiza
- [ ] TypeScript compila sin errores
- [ ] No hay warnings en consola
- [ ] Funciona en navegadores modernos

---

## Decisiones tomadas

1. **Canvas 800×600** — Razón: suficiente espacio para intersección 240×240 + carriles + HUD

2. **Click para alternar semáforos** — Razón: interfaz intuitiva; más accesible que hold-to-green (reduce carga cognitiva)

3. **Cooldown de 0.5s entre cambios** — Razón: evita spam de clicks; fuerza al jugador a tomar decisiones deliberadas

4. **3 strikes máximos** — Razón: perdona errores iniciales pero mantiene tensión; balance entre hardcore y casual

5. **Modo automático con penalización** — Razón: escape hatch para jugadores bloqueados, pero desincentiva abuso (-50 pts)

6. **Ambulancias prioritarias con bonus** — Razón: añade capa estratégica; el jugador debe decidir entre optimizar throughput vs priorizar emergencias

7. **Sistema de strikes en vez de game over inmediato** — Razón: permite recuperación; un choque no arruina toda la partida

8. **Bloqueo total como condición de game over** — Razón: penaliza estrategia pasiva (dejar todo en rojo); incentiva gestión activa

9. **5 niveles con escalado de carriles** — Razón: curva de dificultad clara; nivel 1 enseña, nivel 5 desafía

10. **Giros solo en niveles 4-5** — Razón: complejidad progresiva; aprender mecánica base antes de añadir variaciones

11. **Guardar score solo al finalizar** — Razón: consistencia con otros juegos de Arcade Vault

12. **Spawn rate basado en tiempo, no eventos** — Razón: presión constante; el jugador no puede "pausar" el flujo siendo eficiente

---

## Decisiones descartadas

1. **Semáforos con fase amarilla** — Razón: añade complejidad innecesaria; rojo/verde es binario y más claro

2. **Modo endless con dificultad infinita** — Razón: scope creep; 5 niveles diseñados son suficientes para MVP

3. **Peatones cruzando** — Razón: cambia género a simulador complejo; mantener foco en vehículos únicamente

4. **Rotondas o intersecciones en T** — Razón: requiere física de pathfinding compleja; intersección cruciforme es más simple

5. **Sistema de semáforos coordinados (olas verdes)** — Razón: demasiado avanzado para jugador casual; mejor mantener control directo

6. **Vehículos que pueden retroceder** — Razón: poco realista y confuso; el flujo debe ser unidireccional

7. **Penalización por tiempo total del nivel** — Razón: contradice filosofía de puzzle; el jugador debe poder tomarse su tiempo para pensar

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| Colisiones falsas entre vehículos que no se tocan visualmente | Usar AABB ajustado con padding de -2px; colisión solo si overlap > 4px |
| Vehículos se acumulan infinitamente en cola | Máximo 5 vehículos en cola por carril; detener spawn si cola llena |
| Modo automático demasiado bueno, jugadores abusan | Penalización de -50 pts + cooldown de 10s entre usos |
| Niveles 4-5 con giros son frustrantes | Giros solo 20% de vehículos; señalización visual (flecha) 2s antes de girar |
| Bloqueo accidental por mala gestión difícil de recuperar | Timeout de 15s antes de game over da oportunidad de desbloquear; modo auto como último recurso |
| Ambulancias generan presión excesiva | Solo 15% de vehículos son ambulancias; bonus es opcional, no obligatorio |
| Clicks en semáforos imprecisos (área pequeña) | Área de click de 48×80 (más grande que sprite visual de 32×64) |

---

**FIN DE SPEC**
