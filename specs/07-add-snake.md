# 07 — ADD SNAKE TO ARCADE VAULT

**Estado:** Approved  
**Depende de:** SPEC 04 (Juego Asteroides), SPEC 05 (Leaderboard)  
**Fecha:** 2026-10-13

**Objetivo:** Migrar el juego Snake desde vanilla JavaScript a TypeScript + React 19, integrándolo completamente con el sistema de scores de Supabase en tiempo real usando los assets de frutas preexistentes.

---

## Alcance

### Incluido

- **Migración a TypeScript** con módulos en `lib/game/snake/`
- **Estructura modular:** types.ts, constants.ts, entities/, physics/, engine/, renderer/
- **Componente React `SnakeGame`** con canvas 800×600 y grid 20×15 bloques de 40px
- **Lógica de juego:** serpiente que crece, frutas aleatorias (atlas 21 frutas), colisiones
- **Mecánicas:** 5 vidas iniciales, niveles (cada 30 frutas comidas), aceleración progresiva
- **Controles:** Flechas (arriba/abajo/izquierda/derecha), Pausa con tecla P y botón UI
- **Puntuación:** Frutas normales = 10 pts, frutas raras = 50 pts, multiplicador por level
- **Integración Supabase:** Guardar score final en tabla `scores` con `game_id: 'snake'`
- **Assets:** Frutas PNG desde `sprites.js` (21 variantes del atlas)

### NO incluido (se difiere)

- Tests unitarios, sonido, replay mode, animaciones de transición

---

## Modelo de datos

### GameState

```typescript
interface GameState {
  // Serpiente
  snake: Segment[] // [{x, y}, {x, y}, ...]
  direction: 'up' | 'down' | 'left' | 'right'
  nextDirection: 'up' | 'down' | 'left' | 'right' // input buffer para cambios rápidos
  
  // Comida
  food: { x: number; y: number; type: string } // type: 'apple', 'banana', etc
  
  // Progreso
  score: number
  lives: number
  level: number
  fruitCounter: number // frutas comidas en este level
  
  // Estado del juego
  state: 'playing' | 'paused' | 'dead' | 'gameover'
  
  // Timers
  moveTimer: number // delta acumulado para movimiento a velocidad variable
}

interface Segment {
  x: number // grid col 0-19
  y: number // grid row 0-14
}
```

### Constantes

```typescript
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600
GRID_COLS = 20
GRID_ROWS = 15
BLOCK_SIZE = 40

// Velocidad base: movimientos por segundo
MOVE_SPEED_BASE = 6 // nivel 1
MOVE_SPEED_INCREMENT = 0.5 // por cada nivel

// Puntuación
FRUIT_POINTS_NORMAL = 10
FRUIT_POINTS_RARE = 50
FRUITS_PER_LEVEL = 30

// Frutas (desde SPRITE_ATLAS)
FRUIT_TYPES = ['apple', 'banana', 'orange', 'grape', 'garlic', 'eggplant', 'strawberry', 'cherry', 'carrot', 'mushroom', 'broccoli', 'watermelon', 'pepper', 'kiwi', 'lemon', 'peach', 'peanut', 'tomato', 'berries', 'grapes2', 'pineapple', 'melon'] // de sprites.js

// Rareza (arbitraria, para scoring)
RARE_FRUITS = ['pineapple', 'melon', 'kiwi', 'watermelon'] // 50 pts
NORMAL_FRUITS = [...resto] // 10 pts
```

---

## Plan de implementación

### 1. Crear módulo base
- `lib/game/snake/types.ts` — GameState, Segment, input types
- `lib/game/snake/constants.ts` — Velocidades, grid, frutas, puntuación
- `lib/game/snake/spriteAtlas.ts` — Re-export de SPRITE_ATLAS + helper para dibujar frutas

### 2. Crear entidades
- `lib/game/snake/entities/Snake.ts` — Clase Snake: move(), grow(), checkSelfCollision()
- `lib/game/snake/entities/Food.ts` — Generador de frutas aleatorias

### 3. Física y colisiones
- `lib/game/snake/physics/collision.ts` — detectFoodCollision(), detectWallCollision(), detectSelfCollision()
- `lib/game/snake/physics/utils.ts` — wrap(), random()

### 4. Motor del juego
- `lib/game/snake/engine/gameEngine.ts` — initializeGame(), updateGameState(state, dt, input)

### 5. Renderizador
- `lib/game/snake/renderer/draw.ts` — drawGame(ctx, state), drawSnake(), drawFood(), drawHUD()

### 6. Componente React
- `components/games/SnakeGame.tsx` — Canvas, game loop, input handling, callbacks onGameOver, onPause

### 7. Integración
- `components/games/GamePlayer.tsx` — Agregar condicional para snake
- `lib/data.ts` — Registrar juego con metadatos

### 8. Supabase (si aplica)
- SQL: INSERT INTO games (id, title, category, theme_color) VALUES ('snake', 'SNAKE', 'ARCADE', 'green')

---

## Criterios de aceptación

- [ ] Canvas 800×600, grid 20×15 visible
- [ ] Serpiente se renderiza (cabeza + cuerpo diferenciados)
- [ ] Controles responden: flechas mueven, P pausa/reanuda, botón arcade vault pausa
- [ ] Frutas aparecen aleatorias, se dibujan desde PNG (SPRITE_ATLAS)
- [ ] Al comer fruta: serpiente crece, score sube (10 o 50 según tipo), counter++
- [ ] Cada 30 frutas: level++, velocidad sube, contador reset
- [ ] Colisión con pared/self: se pierde una vida, serpiente reset (posición inicial)
- [ ] 0 vidas: game over modal
- [ ] Score se guarda en Supabase al game over
- [ ] Leaderboard actual se en `/juego/snake/jugar`
- [ ] TypeScript sin errores
- [ ] Funciona en navegadores modernos

---

## Decisiones tomadas

1. **Grid 20×15, bloque 40px** — Estándar clásico snake, llena 800×600 perfectamente
2. **5 vidas** — Balance entre accesibilidad y desafío (vs arcade clásico de 3)
3. **Nivel cada 30 frutas** — Progresión visible sin ser abrumador
4. **Frutas PNG reales** — Visualidad superior vs bloques de color + assets ya están hechos
5. **Score: 10/50 pts** — Diferencial mínimo entre frutas para incentivar raras sin romper balance
6. **Pausa con P + botón** — Coherente con UI arcade vault, alternativa accesible

---

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| Rendimiento: 60 FPS × cambios de dirección rápidos | Input buffer (nextDirection) evita turns imposibles y lag |
| Assets PNG sin cargar | Precargar en SnakeGame.tsx useEffect antes de iniciar juego |
| Velocidad sube mucho rápido | Tuning: MOVE_SPEED_INCREMENT = 0.5 (testear en gameplay) |

---

## Estado

**Listo para review.** La spec está compacta y directa. Una vez aprobada, ejecuta:
```
/spec-impl 07-add-snake
```
