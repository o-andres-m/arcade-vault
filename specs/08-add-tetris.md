# 08 — ADD TETRIS TO ARCADE VAULT

**Estado:** Approved
**Depende de:** SPEC 04 (Juego Asteroides)
**Fecha:** 2026-10-18

**Objetivo:** Migrar el juego Tetris desde vanilla JavaScript a TypeScript + React 19, integrándolo completamente con el sistema de scores de Supabase en tiempo real y siguiendo el patrón arquitectural establecido en SPEC 04.

---

## Alcance

### Incluido en esta especificación

- **Migración de código a TypeScript**
  - Reescribir `game.js` (333 líneas) como módulos TypeScript en `/lib/game/tetris/`
  - Mantener la lógica de juego exactamente igual (rotación, colisiones, scoring, velocidad)
  - Crear tipos TypeScript para todas las estructuras de datos del juego
  - **IMPORTANTE:** Usar solo las 7 piezas clásicas (I, O, T, S, Z, J, L). Eliminar la pieza N (tuerca) del original.

- **Estructura modular**
  - `lib/game/tetris/types.ts` — Interfaces de piezas, tablero, estado del juego
  - `lib/game/tetris/constants.ts` — Constantes de dimensiones, colores, piezas, scoring
  - `lib/game/tetris/entities/Piece.ts` — Representación de piezas (current, next)
  - `lib/game/tetris/entities/Board.ts` — Tablero 10×20 con operaciones
  - `lib/game/tetris/physics/collision.ts` — Sistema de colisiones y wall kicks
  - `lib/game/tetris/physics/rotation.ts` — Rotación clockwise con validación
  - `lib/game/tetris/engine/gameEngine.ts` — Motor principal (init, update, spawn, clear lines)
  - `lib/game/tetris/renderer/draw.ts` — Sistema de renderizado (board, ghost, pieces, grid)

- **Componente React `TetrisGame`**
  - Envolver la lógica de juego en un componente React
  - Usar `useEffect` y `useRef` para gestionar el canvas principal y el canvas de "next piece"
  - Game loop con `requestAnimationFrame` y delta time acumulativo
  - Integrarse con el componente `GamePlayer` existente

- **Theme toggle en barra superior**
  - Botón con icono (🌙/☀️) en la barra superior del juego
  - Alterna entre modo oscuro y modo claro
  - Persiste en localStorage (`tetris-theme`)
  - Afecta: fondo del canvas, color de grid, contraste de piezas

- **Next piece preview**
  - Canvas secundario (120×120px) que muestra la siguiente pieza
  - Ubicado junto al canvas principal (mismo layout que el original)
  - Se actualiza cada vez que se genera una nueva pieza

- **Integración con Supabase en tiempo real**
  - Guardar el score final en la tabla `scores` cuando la partida termina
  - Actualizar automáticamente el leaderboard via Realtime subscriptions
  - Usar el hook `useAuth` existente para obtener el `user_id` actual

- **Reemplazo en la plataforma**
  - Usar `game_id: "tetris"` en la base de datos
  - Actualizar `/lib/data.ts` con los metadatos del juego
  - La ruta `/juego/tetris/jugar` renderizará `TetrisGame`

- **Canvas responsividad**
  - Canvas principal renderiza a 300×600px (proporciones clásicas de Tetris)
  - Canvas "next" renderiza a 120×120px
  - Ambos centrados en la pantalla con flexbox
  - Funciona en desktop y móvil

### NO incluido en esta especificación (se difiere)

- Tests unitarios
- Sonido o efectos de audio
- Nuevas mecánicas o features no presentes en vanilla
- Sistema de hold piece (guardar pieza actual)
- Animaciones de líneas completadas
- Tabla de high scores históricos personales
- Multijugador o modos competitivos
- T-spins o scoring avanzado

---

## Modelo de datos

### Entidades del juego

**Piece (Pieza)**
- `type`: número 1-7 (índice de pieza: I, O, T, S, Z, J, L)
- `shape`: matriz 2D de números (representa la forma rotada actual)
- `x`: posición horizontal en el tablero (columna, 0-9)
- `y`: posición vertical en el tablero (fila, 0-19)

**Board (Tablero)**
- Matriz 20×10 de números
- `0` = celda vacía
- `1-7` = celda ocupada con color de pieza correspondiente

**Ghost (Proyección fantasma)**
- No se almacena como entidad separada
- Se calcula en cada frame: posición Y donde caería la pieza actual si se hiciera hard drop
- Se dibuja con alpha reducido (0.2)

### GameState

```typescript
interface GameState {
  // Tablero y piezas
  board: number[][]           // 20×10 matrix
  current: Piece | null       // pieza actual controlada por el jugador
  next: Piece                 // siguiente pieza (preview)
  
  // Progreso del juego
  score: number               // puntuación acumulada
  lines: number               // líneas completadas totales
  level: number               // nivel actual (floor(lines/10) + 1)
  state: 'playing' | 'paused' | 'gameover'
  
  // Timers y físicas
  dropAccum: number           // acumulador de tiempo para auto-drop (ms)
  dropInterval: number        // intervalo actual de caída (ms, decrece con nivel)
  lastTime: number            // timestamp del último frame (para delta time)
  
  // Theme
  theme: 'dark' | 'light'     // tema actual (persiste en localStorage)
}
```

### Constantes del juego

```typescript
// Tablero
COLS = 10
ROWS = 20
BLOCK = 30  // tamaño de cada celda en px

// Canvas
CANVAS_WIDTH = COLS * BLOCK = 300
CANVAS_HEIGHT = ROWS * BLOCK = 600
NEXT_CANVAS_SIZE = 120

// Colores (7 piezas clásicas)
COLORS = [
  null,
  '#4dd0e1',  // I - cyan
  '#ffd54f',  // O - yellow
  '#ba68c8',  // T - purple
  '#81c784',  // S - green
  '#e57373',  // Z - red
  '#90caf9',  // J - pale blue
  '#ffb74d',  // L - orange
]

// Formas de piezas (matrices 2D)
PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
]

// Scoring
LINE_SCORES = [0, 100, 300, 500, 800]  // pts por 0, 1, 2, 3, 4+ líneas
SOFT_DROP_BONUS = 1   // pts por fila al hacer soft drop (↓)
HARD_DROP_BONUS = 2   // pts por fila al hacer hard drop (Space)

// Velocidad
INITIAL_DROP_INTERVAL = 1000  // ms
MIN_DROP_INTERVAL = 100       // ms (velocidad máxima)
SPEED_INCREASE_PER_LEVEL = 90 // ms que se reduce por nivel

// Wall kicks para rotación
WALL_KICKS = [0, -1, 1, -2, 2]  // offsets horizontales a probar al rotar
```

### Variables de entorno

No se requieren nuevas variables. Se usan las existentes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Plan de implementación

### 1. Crear módulo base de tipos y constantes

**Archivos nuevos:**
- `lib/game/tetris/types.ts`
- `lib/game/tetris/constants.ts`

**Cambios:**
- Definir interfaces TypeScript: `Piece`, `GameState`, `Theme`
- Exportar constantes: `COLS`, `ROWS`, `BLOCK`, `COLORS`, `PIECES`, `LINE_SCORES`, `WALL_KICKS`, etc.
- **IMPORTANTE:** Array `PIECES` debe tener solo 7 piezas (índices 1-7), no incluir la pieza N del original

**Verificación:**
- TypeScript compila sin errores
- Constantes exportadas son accesibles desde otros módulos

---

### 2. Migrar entidades del juego

**Archivos nuevos:**
- `lib/game/tetris/entities/Piece.ts`
- `lib/game/tetris/entities/Board.ts`

**Cambios en `Piece.ts`:**
- Función `randomPiece(): Piece` — genera pieza aleatoria (tipo 1-7)
- Función `createPiece(type: number): Piece` — crea pieza de tipo específico
- Cada pieza inicia centrada horizontalmente en el tablero

**Cambios en `Board.ts`:**
- Función `createBoard(): number[][]` — tablero vacío 20×10
- Función `merge(board, piece): void` — fusiona pieza actual en el tablero
- Función `clearLines(board): number` — elimina líneas completas, retorna cantidad eliminada
- Las líneas completas se detectan con `board[r].every(v => v !== 0)`
- Al eliminar una línea, se hace splice y se agrega fila vacía al inicio

**Verificación:**
- Las funciones generan estructuras de datos correctas
- `randomPiece()` solo genera tipos 1-7 (no 8)

---

### 3. Crear sistema de física y colisiones

**Archivos nuevos:**
- `lib/game/tetris/physics/collision.ts`
- `lib/game/tetris/physics/rotation.ts`

**Cambios en `collision.ts`:**
- Función `collide(shape, x, y, board): boolean` — detecta colisión con bordes o tablero
- Función `ghostY(piece, board): number` — calcula posición Y del ghost (proyección)
- Chequea: fuera de límites (x < 0, x >= COLS, y >= ROWS) o celda ocupada en board

**Cambios en `rotation.ts`:**
- Función `rotateCW(shape): number[][]` — rotación clockwise (transpose + reverse)
- Función `tryRotate(piece, board): Piece | null` — intenta rotar con wall kicks
- Wall kicks: prueba offsets `[0, -1, 1, -2, 2]` hasta encontrar posición válida
- Retorna nueva pieza rotada o null si no es posible

**Verificación:**
- Colisiones detectadas correctamente en bordes y celdas ocupadas
- Rotación funciona cerca de paredes y otras piezas

---

### 4. Crear motor del juego

**Archivos nuevos:**
- `lib/game/tetris/engine/gameEngine.ts`

**Cambios:**
- `initializeGame(theme: Theme): GameState` — estado inicial
  - Board vacío
  - Score 0, lines 0, level 1
  - Genera primera pieza next, luego spawn
  - dropInterval = 1000ms

- `updateGameState(state, dt, input): GameState` — actualiza lógica cada frame
  - Acumula dt en dropAccum
  - Si dropAccum >= dropInterval: auto-drop (pieza baja 1 fila)
  - Si hay colisión al bajar: lockPiece()
  - Procesa input del jugador (move left/right, soft/hard drop, rotate)

- `lockPiece(state): GameState` — fija pieza actual en el tablero
  - Merge pieza en board
  - Clear lines + calcular score
  - Actualizar level si corresponde
  - Spawn nueva pieza
  - Si nueva pieza colisiona inmediatamente: game over

- `calculateScore(linesCleared, level, dropBonus): number`
  - Score por líneas: `LINE_SCORES[linesCleared] * level`
  - Bonus por drops: suma acumulada

- `updateLevel(lines): number` — `Math.floor(lines / 10) + 1`

- `updateDropInterval(level): number` — `Math.max(100, 1000 - (level - 1) * 90)`

**Verificación:**
- Game loop funciona con delta time
- Score se calcula correctamente
- Level aumenta cada 10 líneas
- Velocidad aumenta con nivel
- Game over ocurre cuando nueva pieza no cabe

---

### 5. Crear renderizador

**Archivos nuevos:**
- `lib/game/tetris/renderer/draw.ts`

**Cambios:**
- `drawGame(ctx, state): void` — renderiza el frame completo
  - Clear canvas
  - Draw grid
  - Draw board (celdas ocupadas)
  - Draw ghost (proyección con alpha 0.2)
  - Draw current piece

- `drawGrid(ctx, theme): void` — líneas de grilla
  - Color depende del theme (dark: rgba(255,255,255,0.1), light: rgba(0,0,0,0.1))

- `drawBlock(ctx, x, y, colorIndex, size, alpha): void` — dibuja una celda
  - Fondo con color del array COLORS
  - Highlight en la parte superior (rgba(255,255,255,0.12))
  - Respeta alpha para ghost

- `drawNext(ctx, piece): void` — renderiza preview de siguiente pieza
  - Canvas 120×120px
  - Pieza centrada en canvas
  - Usa `drawBlock` con tamaño 30px

**Verificación:**
- Canvas se renderiza correctamente
- Ghost piece es visible con transparencia
- Grid se adapta al theme
- Next piece se muestra centrado

---

### 6. Crear componente React

**Archivos nuevos:**
- `components/games/TetrisGame.tsx`

**Cambios:**
- Componente funcional con props: `{ onGameOver, isPaused, onScoreChange }`
- Refs: `canvasRef` (main board), `nextCanvasRef` (preview)
- State: `gameState`, `theme`
- useEffect para game loop con requestAnimationFrame
- useEffect para cargar theme desde localStorage
- Handlers:
  - `handleKeyDown`: ArrowLeft/Right (move), ArrowUp/X (rotate), ArrowDown (soft drop), Space (hard drop)
  - `handleThemeToggle`: alterna theme, guarda en localStorage, actualiza state
- Callbacks:
  - `onScoreChange(score)` — cada vez que score cambia
  - `onGameOver(score)` — cuando state === 'gameover'
- Pausa: cuando `isPaused` es true, detener game loop (no cancelar RAF, solo skip update)

**Layout del componente:**
```tsx
<div className="tetris-container">
  <div className="tetris-game">
    <canvas ref={canvasRef} width={300} height={600} />
  </div>
  <div className="tetris-sidebar">
    <div className="theme-toggle">
      <button onClick={handleThemeToggle}>
        {theme === 'dark' ? '🌙' : '☀️'}
      </button>
    </div>
    <div className="next-piece">
      <h3>SIGUIENTE</h3>
      <canvas ref={nextCanvasRef} width={120} height={120} />
    </div>
  </div>
</div>
```

**Verificación:**
- Canvas renderiza en 300×600px
- Next canvas renderiza en 120×120px
- Controles responden correctamente
- Theme toggle funciona y persiste
- onGameOver se llama con score correcto

---

### 7. Integrar con GamePlayer

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**
- Agregar import: `import TetrisGame from './TetrisGame'`
- En el switch/conditional de renderizado de juegos:
  ```tsx
  if (game.id === 'tetris') {
    return (
      <TetrisGame
        onGameOver={handleGameOver}
        isPaused={isPaused}
        onScoreChange={handleScoreChange}
      />
    )
  }
  ```
- `handleScoreChange` actualiza currentScore en real-time para mostrar en HUD
- `handleGameOver` llama a saveScore + muestra modal

**Verificación:**
- TetrisGame se renderiza cuando `game.id === 'tetris'`
- Score en HUD se actualiza en tiempo real
- Modal de game over aparece correctamente

---

### 8. Registrar juego en lib/data.ts

**Archivos modificados:**
- `lib/data.ts`

**Cambios:**
- Agregar entrada en array `GAMES`:
  ```typescript
  {
    id: 'tetris',
    title: 'TETRIS',
    description: 'Encaja bloques y completa líneas',
    longDescription: 'Piezas geométricas descienden desde arriba. Rótalas y encájalas para completar líneas horizontales. La velocidad aumenta cada 10 líneas completadas.',
    category: 'PUZZLE',
    difficulty: 'medium',
    controls: {
      keyboard: '←/→: Mover | ↑/X: Rotar | ↓: Caída rápida | Espacio: Caída instantánea | P: Pausa',
      mobile: 'Botones en pantalla'
    },
    themeColor: 'cyan',
    hasLives: false,  // Tetris usa vidas infinitas
    livesDisplay: '∞',
    featured: true,
    available: true
  }
  ```

**Verificación:**
- Juego aparece en `/biblioteca`
- Metadata correcta en tarjeta del juego
- Link a `/juego/tetris/jugar` funciona

---

### 9. Configurar Supabase

**No requiere cambios en esquema.** El juego usa:
- Tabla `scores` existente (game_id: 'tetris')
- Tabla `profiles` existente para usuarios

**Verificación manual:**
- Iniciar sesión en Arcade Vault
- Jugar Tetris hasta game over
- Verificar que score se guardó en Supabase (check tabla `scores`)
- Verificar que aparece en leaderboard de `/salon`

---

### 10. Verificación end-to-end

**Checklist completo:**
- [ ] `npm run typecheck` sin errores
- [ ] Componente `TetrisGame` se renderiza en `/juego/tetris/jugar`
- [ ] Canvas principal es 300×600px y está centrado
- [ ] Canvas "next" es 120×120px y muestra siguiente pieza
- [ ] Theme toggle funciona (🌙/☀️) y persiste en localStorage
- [ ] Controles funcionan: ←/→ (mover), ↑/X (rotar), ↓ (soft drop), Space (hard drop), P (pausa)
- [ ] Solo aparecen las 7 piezas clásicas (no aparece la pieza N)
- [ ] Ghost piece (proyección) es visible con transparencia
- [ ] Wall kicks funcionan al rotar cerca de bordes
- [ ] Score se incrementa correctamente:
  - 1 línea: 100 × level
  - 2 líneas: 300 × level
  - 3 líneas: 500 × level
  - 4 líneas: 800 × level
  - Soft drop: +1 por fila
  - Hard drop: +2 por fila
- [ ] Líneas se cuentan correctamente
- [ ] Level aumenta cada 10 líneas
- [ ] Velocidad aumenta con el nivel
- [ ] Game over ocurre cuando nueva pieza no cabe
- [ ] Modal de game over aparece con score final
- [ ] Score se guarda en Supabase (usuarios logueados)
- [ ] Score se guarda en localStorage (usuarios anónimos)
- [ ] Juego aparece en `/biblioteca` con metadata correcta
- [ ] Leaderboard funciona en tiempo real en `/salon`
- [ ] No hay warnings en consola del browser
- [ ] Funciona en navegadores modernos (Chrome, Firefox, Safari)
- [ ] Funciona en mobile (responsive)

---

## Criterios de aceptación

- [ ] Componente `TetrisGame` se renderiza en `/juego/tetris/jugar`
- [ ] Canvas es 300×600px y está centrado
- [ ] Canvas "next" muestra la siguiente pieza correctamente
- [ ] Theme toggle (🌙/☀️) funciona y persiste en localStorage
- [ ] Controles funcionan: flechas para mover/rotar, Space para hard drop, P para pausa
- [ ] Solo se usan las 7 piezas clásicas (I, O, T, S, Z, J, L)
- [ ] Ghost piece se muestra con transparencia
- [ ] Wall kicks permiten rotar cerca de paredes
- [ ] Score se calcula según reglas exactas del original
- [ ] Level aumenta cada 10 líneas completadas
- [ ] Velocidad de caída aumenta con el nivel
- [ ] Game over ocurre cuando nueva pieza colisiona al aparecer
- [ ] Modal de game over aparece con score final
- [ ] Score se guarda en Supabase (usuarios logueados)
- [ ] Score se guarda en localStorage (usuarios anónimos)
- [ ] Juego aparece en /biblioteca con categoría PUZZLE
- [ ] Leaderboard funciona en tiempo real
- [ ] TypeScript compila sin errores
- [ ] No hay warnings en consola del browser
- [ ] Funciona en navegadores modernos (Chrome, Firefox, Safari)
- [ ] Funciona en móvil

---

## Decisiones tomadas

1. **Estructura modular lib/game/tetris/** — Escalable para múltiples juegos sin conflictos. Separa entidades, física, motor y renderer.

2. **Canvas 300×600px** — Mantener proporciones clásicas de Tetris (10×20 grid con bloques de 30px). Más auténtico que escalar a 800×600px.

3. **Solo 7 piezas clásicas** — Eliminar la pieza N (tuerca) del original. Mantiene el Tetris estándar reconocible.

4. **Theme toggle en UI** — Botón con icono en la barra superior. Persiste en localStorage. Afecta colores de grid y fondo.

5. **Next piece preview separado** — Canvas 120×120px junto al main canvas. Mismo layout que el original para familiaridad.

6. **Vidas infinitas** — Tetris no usa sistema de vidas. Mostrar "∞" en HUD o ocultar el display de vidas.

7. **Ghost piece incluido** — Feature útil del original que mejora UX. Se dibuja con alpha 0.2.

8. **Wall kicks al rotar** — Sistema de offsets `[0, -1, 1, -2, 2]` permite rotaciones cerca de paredes. Mantiene jugabilidad fluida.

9. **Guardar score solo al finalizar** — Reduce carga en Supabase (1 request por partida vs múltiples durante el juego).

10. **Usar callbacks para integración** — GamePlayer orquesta guardado + UI; TetrisGame no conoce Supabase directamente.

---

## Decisiones descartadas

1. **Canvas 800×600px** — Descartado. Prefiero mantener proporciones clásicas 10×20 (300×600px) para autenticidad.

2. **Incluir pieza N (tuerca)** — Descartado. No es parte del Tetris estándar, confundiría a jugadores.

3. **Hold piece (guardar pieza)** — Descartado. Feature moderna no presente en el original. Se puede agregar en spec futura.

4. **Animación de líneas completadas** — Descartado. El original no la tiene. Se puede agregar después.

5. **Sonido** — Descartado. El original no tiene audio integrado en game.js. Se difiere para spec futura de audio global.

6. **T-spins o scoring avanzado** — Descartado. Mantener scoring simple del original. Complejidad adicional no justificada para MVP.

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| **Theme toggle puede no integrarse bien con el estilo de Arcade Vault** | Usar estilos consistentes con el resto de la plataforma. Botón simple con icono, sin agregar complejidad visual. |
| **Canvas 300×600px puede verse pequeño en pantallas grandes** | Centrar con flexbox y agregar padding generoso. Considerar agregar zoom/scale en spec futura si es necesario. |
| **Wall kicks pueden sentirse diferentes al Tetris oficial** | Usar el sistema de offsets del vanilla original (probado y funcional). Si se detectan problemas, ajustar en iteraciones. |
| **Performance del game loop con requestAnimationFrame** | Delta time asegura consistencia. Testear en dispositivos de gama baja. Canvas 300×600px es suficientemente pequeño para render rápido. |
| **Usuarios pueden confundir theme toggle con controles del juego** | Ubicar el botón de theme en un lugar visualmente separado de los controles. Label claro con icono reconocible. |

---

**FIN DE SPEC 08**
