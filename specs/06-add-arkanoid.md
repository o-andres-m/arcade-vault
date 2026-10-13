# 06 — ADD ARKANOID TO ARCADE VAULT

**Estado:** Approved
**Depende de:** SPEC 04 (Juego Asteroides)
**Fecha:** 2026-10-13

**Objetivo:** Migrar Arkanoid desde vanilla JavaScript a TypeScript + React 19, integrando con Supabase para persistencia de scores y siguiendo la arquitectura establecida en SPEC 04.

---

## Alcance

### Incluido

- Migración a TypeScript en `/lib/game/arkanoid/`
- Componente React `ArkanoidGame` para `/juego/arkanoid/jugar`
- 5 niveles con velocidades progresivas
- Sistema de puntuación: 10 pts/bloque
- Sprites (paddle, ball, bloques × 6 colores) desde spritesheet
- Sonidos (bounce, break) en `/public/games/arkanoid/`
- Persistencia de score en Supabase al game over
- Canvas 800×600 centrado

### No incluido

- Nuevos power-ups o mecanicasExtra
- Tests unitarios
- Dificultad variable / custom levels

---

## Modelo de datos

**Entidades:**
- `Paddle`: { x, y, w, h }
- `Ball`: { x, y, w, h, vx, vy }
- `Block`: { x, y, w, h, color, alive }
- `Explosion`: { x, y, w, h, color, elapsed }

**GameState:**
```typescript
interface GameState {
  paddle: Paddle
  ball: Ball
  blocks: Block[]
  explosions: Explosion[]
  score: number
  lives: number
  currentLevel: number
  gameState: 'playing' | 'gameover' | 'win'
  isPaused: boolean
}
```

**Constantes:**
```typescript
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600
PADDLE_SPEED = 400
BLOCK_W = 64
BLOCK_H = 24
BASE_BALL_VX = 200
BASE_BALL_VY = -300
BLOCK_ROWS = 6
BLOCK_COLS = 10
```

---

## Plan de implementación

### 1. Crear tipos y constantes
- `lib/game/arkanoid/types.ts`
- `lib/game/arkanoid/constants.ts` (canvas, speeds, sizing)

### 2. Migrar entidades
- `lib/game/arkanoid/entities/Paddle.ts`
- `lib/game/arkanoid/entities/Ball.ts`
- `lib/game/arkanoid/entities/Block.ts`
- `lib/game/arkanoid/entities/Explosion.ts`

### 3. Crear physics/colisiones
- `lib/game/arkanoid/physics/collision.ts` (AABB detection)

### 4. Crear niveles
- `lib/game/arkanoid/levels.ts` (5 niveles con layout + speed multipliers)

### 5. Motor del juego
- `lib/game/arkanoid/engine/gameEngine.ts` (init, update, collision handling, level progression)

### 6. Renderizador
- `lib/game/arkanoid/renderer/draw.ts` (canvas drawing, HUD, overlays)

### 7. Componente React
- `components/games/ArkanoidGame.tsx` (canvas ref, game loop, input, Supabase callbacks)

### 8. Integración
- Actualizar `components/games/GamePlayer.tsx` con condicional `game.id === 'arkanoid'`
- Registrar en `lib/data.ts` con metadatos

### 9. Verificación end-to-end
- Typecheck limpio
- Juego funciona en `/juego/arkanoid/jugar`
- Controles responden (arrows + P para pausa)
- Scores guardados en Supabase
- Leaderboard en tiempo real

---

## Criterios de aceptación

- [ ] Componente `ArkanoidGame` se renderiza
- [ ] Canvas 800×600 px, centrado
- [ ] Controles: Arrow Left/Right, P/Esc para pausa
- [ ] Paddle se mueve a 400 px/s
- [ ] Pelota rebota en paredes, paddle, bloques
- [ ] Bloques se destruyen → +10 pts, generan explosión
- [ ] 5 niveles con velocidad progresiva
- [ ] Pierde vida si pelota sale por abajo
- [ ] Game over cuando vidas = 0
- [ ] Win cuando nivel 5 completado
- [ ] Score se guarda en Supabase
- [ ] Juega en `/juego/arkanoid/jugar`
- [ ] Leaderboard actualiza en tiempo real
- [ ] TypeScript sin errores

---

## Decisiones

1. **Canvas 800×600** — Mantener original para consistencia visual retro.
2. **Mouse solo en pausa** — Arrows para movimiento continuo (gameplay más fluido).
3. **Assets copiados** — Spritesheet + sonidos en `/public/games/arkanoid/`.
4. **Mergear JS** — game.js + levels.js → un único engine TypeScript.
5. **Score al final** — Solo guardar en Supabase cuando gameState = 'gameover' o 'win'.

---

## Decisiones descartadas

1. **Modificar velocidades de nivel** — Usar las del original; están balanceadas.
2. **Multi-ball / power-ups** — Out of scope; agregar en spec futuro si se requiere.

