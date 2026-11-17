# 11 — ADD PONG TO ARCADE VAULT

**Estado:** Approved  
**Depende de:** SPEC 04 (Juego Asteroides), SPEC 06 (Arkanoid)  
**Fecha:** 2026-11-17

**Objetivo:** Implementar el juego clásico PONG en TypeScript + React 19, con soporte para 1 y 2 jugadores, controles móviles táctiles, e integración con Supabase para scores en modo single-player. Reemplaza el placeholder "DUELO PIXEL".

---

## Alcance

### Incluido

- **Migración a TypeScript** con módulos en `lib/game/pong/`
- **Estructura modular:** types.ts, constants.ts, entities/, physics/, engine/, renderer/
- **Componente React `PongGame`** con canvas 800×600
- **Modos de juego:**
  - **1 Jugador:** Jugador (izquierda) vs CPU (derecha) con IA básica
  - **2 Jugadores:** Local, Jugador 1 (izquierda) vs Jugador 2 (derecha)
- **Controles Desktop:**
  - **Modo 1 Jugador:** A/Q (arriba/abajo) o Flechas (arriba/abajo)
  - **Modo 2 Jugadores:** Jugador 1 = A/Q, Jugador 2 = Flechas
- **Controles Móvil:**
  - Solo modo 1 jugador (2 jugadores deshabilitado en mobile)
  - Teclado táctil debajo del canvas (botones Arriba/Abajo)
- **Mecánicas:**
  - Cada jugador empieza con 3 vidas
  - Pierde vida cuando la pelota pasa su paddle
  - Juego termina cuando un jugador llega a 0 vidas
  - Velocidad de pelota aumenta progresivamente cada rebote
- **Puntuación:**
  - +10 pts por cada punto ganado (pelota pasa al oponente)
  - Score acumulativo durante la partida
- **Integración Supabase:**
  - Guardar score final en `scores` solo en modo 1 jugador
  - `game_id: 'duelo-pixel'` (reemplaza placeholder)
- **UI:**
  - Pantalla de selección de modo (1 o 2 jugadores) al inicio
  - Instrucciones claras de controles según modo elegido
  - HUD con vidas y score de cada jugador

### NO incluido (se difiere)

- Power-ups o modificadores de pelota
- IA avanzada con múltiples niveles de dificultad
- Efectos de sonido
- Modo online multijugador
- Tests unitarios

---

## Modelo de datos

### GameState

```typescript
interface GameState {
  // Modo de juego
  mode: 'select' | '1player' | '2player' | 'playing' | 'gameover'
  
  // Entidades
  leftPaddle: Paddle   // Jugador 1
  rightPaddle: Paddle  // Jugador 2 o CPU
  ball: Ball
  
  // Progreso
  leftScore: number    // Puntos jugador izquierda
  rightScore: number   // Puntos jugador derecha
  leftLives: number    // Vidas jugador izquierda
  rightLives: number   // Vidas jugador derecha
  
  // Estado
  isPaused: boolean
  isServing: boolean   // True cuando se resetea después de punto
  servingSide: 'left' | 'right'  // Quién sirve
  serveTimer: number   // Countdown antes de lanzar pelota
  
  // CPU (solo modo 1 jugador)
  cpuReactionDelay: number  // Para hacer CPU menos perfecta
  cpuTarget: number         // Y target que CPU intenta alcanzar
}

interface Paddle {
  x: number
  y: number
  w: number  // width
  h: number  // height
  speed: number
  vy: number // velocidad vertical actual
}

interface Ball {
  x: number
  y: number
  radius: number
  vx: number  // velocidad X
  vy: number  // velocidad Y
  speed: number // magnitud de velocidad
  speedIncrement: number // cuánto sube por rebote
}
```

### Constantes

```typescript
CANVAS_WIDTH = 800
CANVAS_HEIGHT = 600

// Paddle
PADDLE_WIDTH = 12
PADDLE_HEIGHT = 80
PADDLE_SPEED = 400  // px/s
PADDLE_OFFSET = 40  // distancia desde borde

// Ball
BALL_RADIUS = 6
BALL_SPEED_INITIAL = 300  // px/s
BALL_SPEED_INCREMENT = 20  // sube por rebote
BALL_SPEED_MAX = 600

// Juego
LIVES_INITIAL = 3
POINTS_PER_GOAL = 10
SERVE_DELAY = 2  // segundos antes de servir

// CPU
CPU_REACTION_DELAY = 0.1  // segundos de delay
CPU_ERROR_MARGIN = 20     // px de margen de error
```

---

## Plan de implementación

### 1. Crear módulo base
- `lib/game/pong/types.ts` — GameState, Paddle, Ball, GameMode
- `lib/game/pong/constants.ts` — Dimensiones, velocidades, vidas

### 2. Crear entidades
- `lib/game/pong/entities/Paddle.ts` — Clase Paddle: move(direction), clamp()
- `lib/game/pong/entities/Ball.ts` — Clase Ball: move(), reset(), accelerate()

### 3. Física y colisiones
- `lib/game/pong/physics/collision.ts` — checkPaddleCollision(), checkWallCollision()
- `lib/game/pong/physics/utils.ts` — clamp(), randomAngle()

### 4. IA de CPU
- `lib/game/pong/ai/cpuController.ts` — updateCPU(state, dt) para paddle derecho

### 5. Motor del juego
- `lib/game/pong/engine/gameEngine.ts` — initializeGame(mode), updateGameState(state, dt, input)
- Lógica de serving, scoring, game over

### 6. Renderizador
- `lib/game/pong/renderer/draw.ts` — drawGame(ctx, state), drawPaddles(), drawBall(), drawHUD(), drawModeSelect()

### 7. Componente React
- `components/games/PongGame.tsx` — Canvas, game loop, input handling
- Detección de mobile para deshabilitar modo 2 jugadores
- Controles táctiles en mobile (botones Arriba/Abajo)

### 8. Integración
- `components/games/GamePlayer.tsx` — Agregar condicional para `game.id === 'duelo-pixel'`
- `lib/data.ts` — Actualizar metadatos del juego (ya existe como placeholder)

### 9. Supabase
- Score se guarda solo en modo 1 jugador
- `game_id: 'duelo-pixel'` (mantiene ID existente)

---

## Criterios de aceptación

- [ ] Canvas 800×600, centrado, fondo oscuro con línea central punteada
- [ ] Pantalla inicial: Selector de modo "1 JUGADOR" / "2 JUGADORES"
- [ ] Instrucciones visibles según modo seleccionado:
  - 1 Jugador: "Controles: A/Q o Flechas | CPU a la derecha"
  - 2 Jugadores: "Jugador 1: A/Q | Jugador 2: Flechas"
- [ ] En mobile: Solo opción "1 JUGADOR" disponible, teclado táctil visible
- [ ] Paddle izquierdo responde a A (arriba) / Q (abajo) en ambos modos
- [ ] Paddle derecho:
  - Modo 1P: CPU se mueve automáticamente (IA básica)
  - Modo 2P: Responde a Flechas Arriba/Abajo
- [ ] Pelota rebota en paredes superior/inferior
- [ ] Pelota rebota en paddles con cambio de ángulo según punto de impacto
- [ ] Velocidad de pelota aumenta +20 px/s por rebote (max 600 px/s)
- [ ] Al pasar pelota: se pierde 1 vida, oponente gana 10 pts
- [ ] Después de punto: serve delay de 2s, pelota resetea al centro
- [ ] Sirve alternado: quien perdió punto, sirve siguiente
- [ ] Juego termina cuando un jugador llega a 0 vidas
- [ ] HUD muestra: Vidas (♥ × 3), Score de cada lado
- [ ] Game Over modal muestra ganador y score final
- [ ] Modo 1P: Score se guarda en Supabase
- [ ] Modo 2P: Sin guardado, solo local
- [ ] Botón Pausa (P) funciona durante partida
- [ ] TypeScript sin errores
- [ ] Funciona en navegadores modernos (desktop y mobile)

---

## Decisiones tomadas

1. **Canvas 800×600** — Estándar retro, consistente con otros juegos de la plataforma
2. **3 vidas cada jugador** — Balance clásico, partidas de ~5-10 minutos
3. **Velocidad incremental** — Pelota acelera +20 px/s por rebote para aumentar dificultad
4. **CPU IA básica** — Sigue la pelota con delay y margen de error para ser vencible
5. **Mobile solo 1P** — Controles táctiles solo para un jugador, 2P requiere teclado físico
6. **Score solo 1P en Supabase** — Modo 2P es local/casual, no competitivo global
7. **Controles A/Q** — Además de flechas para que jugador tenga opciones en 1P
8. **Serve delay 2s** — Da tiempo al jugador para prepararse después de punto
9. **ID 'duelo-pixel'** — Mantiene ID del placeholder, conserva estructura de BD

---

## Decisiones descartadas

1. **Power-ups (pelota rápida, paddle grande, etc.)** — Out of scope, se puede agregar en spec futura
2. **Niveles de dificultad de CPU** — IA única con parámetros fijos, simplifica implementación
3. **Spin en pelota** — Rebote simple basado en ángulo, sin física avanzada
4. **Efectos de sonido** — Se difiere para mantener scope manejable
5. **Modo online** — Requiere WebSockets/Supabase Realtime, complejidad alta

---

## Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| CPU muy difícil o muy fácil | Parámetros CPU_REACTION_DELAY y CPU_ERROR_MARGIN tunneables, ajustar en testing |
| Pelota se "atasca" en ángulo horizontal | Al rebotar en paddle, forzar ángulo mínimo de 15° |
| Controles móviles incómodos | Botones grandes (80×80 px), bien espaciados, feedback visual al presionar |
| Colisión imprecisa a alta velocidad | Delta time clamping (max 50ms), collision detection continua |
| Jugadores confundidos por controles en modo 2P | Pantalla de instrucciones clara antes de iniciar, HUD con recordatorio |

---

## Wireframe de UI

```
┌─────────────────────────────────────────────────┐
│                                                 │
│           PONG - DUELO PIXEL                    │
│                                                 │
│         ┌─────────────┐  ┌─────────────┐       │
│         │ 1 JUGADOR   │  │ 2 JUGADORES │       │
│         └─────────────┘  └─────────────┘       │
│                                                 │
│         (En mobile: solo 1 JUGADOR)             │
│                                                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ♥ ♥ ♥  SCORE: 20      :      SCORE: 10  ♥ ♥ ♥ │
├─────────────────────────────────────────────────┤
│                                                 │
│  ║                         :                 ║  │
│  ║                         :                 ║  │
│  ║                         :      ●          ║  │
│  ║         Paddle          :     BALL        ║  │
│  ║        Izq (P1)         :                 ║  │
│  ║                         :    Paddle       ║  │
│  ║                         :    Der (P2/CPU) ║  │
│  ║                         :                 ║  │
│                                                 │
└─────────────────────────────────────────────────┘
      (En mobile: Botones ▲ ▼ aquí)
```

---

## Estado

**Draft - Listo para review.** Una vez aprobada, ejecutar:
```
/spec-impl 11-add-pong
```

Luego, para agregar skins y controles móviles mejorados:
```
/spec-impl-game 11-add-pong
```
