---
name: add-game
description: |
  Analiza un juego vanilla JS desde references/started-games/ (o path custom) 
  y genera una spec completa para migrarlo a Arcade Vault siguiendo el patrón 
  de SPEC 04 (Asteroides). NO implementa código, solo genera la spec. 
  Usa /spec-impl después para implementar.
disable-model-invocation: true
argument-hint: <game-name-or-path>
allowed-tools:
  Read, Glob, Grep, Write, AskUserQuestion, Bash(ls:*), Bash(cat:*), 
  Bash(find:*), Bash(date:*)
---

# /add-game — Game spec generator for Arcade Vault

## Session context

Today's date: !`date +%F`

Existing specs:
!`ls specs/ 2>/dev/null | grep -E '^\d+-' || echo "No specs yet"`

Game references available:
!`ls references/started-games/ 2>/dev/null || echo "No references/ folder"`

---

## Philosophy

This skill helps you add a new game to Arcade Vault in a systematic way. Unlike `/spec-impl` which implements specs, this skill **only generates specs** for new games.

The workflow is:
1. **This skill** analyzes a vanilla JS game → generates a complete spec
2. **User** reviews and approves the spec
3. **`/spec-impl`** implements the spec step-by-step

This separation gives you documentation before code and full control over the migration process.

---

## Phase 1 — Understand the game context

### Step 1.1 — Validate project context

Before starting, read the project setup:
- Check `CLAUDE.md` to understand Arcade Vault architecture
- Note the spec naming convention (NN-slug.md format)
- Understand the game architecture from SPEC 04

### Step 1.2 — Parse and locate the game

The received argument is: `$ARGUMENTS`

**If argument is empty:**
```
Available game references:
  - 02-asteroids/
  - 03-tetris/
  - 04-arkanoid/

Provide a game name (e.g., "tetris") or path (e.g., "./custom-game/")
```

Wait for input.

**If argument is provided:**

Try to resolve in this order:
1. **Reference game match** — Fuzzy match in `references/started-games/`
   - "asteroids" → "02-asteroids"
   - "tetris" → "03-tetris"
   - "ark" → "04-arkanoid"

2. **Exact path** — Check if path exists and contains `game.js`

If not found:
```
❌ Game not found.

Checked:
  - references/started-games/[game-name]/
  - [path]

Available references:
  - 02-asteroids/
  - 03-tetris/
  - 04-arkanoid/

Try again with a valid name or path.
```

Stop and wait for correction.

### Step 1.3 — Validate game structure

Once game is located, verify:
- [ ] File `game.js` exists (or `index.js`)
- [ ] File has reasonable size (not empty, not huge)

If validation fails:
```
❌ Invalid game structure.

Expected: [path]/game.js

Found instead: [files in directory]

Is this the correct directory?
```

Stop and wait for confirmation or correction.

### Step 1.4 — Analyze game code

Read the complete `game.js` file and identify:

**Entities** — Classes or object factories
- Look for: `class Ship`, `function createBullet()`, etc.
- List each unique entity type

**Constants** — Magic numbers that should become constants
- Canvas size (width, height)
- Entity sizes/radii
- Movement speeds
- Physics values (friction, acceleration)
- Timers (cooldowns, TTL)
- Scoring values

**Game state** — What variables are tracked
- Score, lives, level
- Timers, flags
- Current entities

**Input system** — How player controls work
- Keyboard events (which keys)
- Mouse events (if any)
- Button bindings

**Rendering** — How visuals are drawn
- All in canvas or mixed with DOM
- Particle effects
- HUD display

**Game loop** — How update/draw cycle works
- requestAnimationFrame pattern
- Delta time handling

**Assets** — External files needed
- Sprites, textures, images
- Audio files
- Fonts, data files

**Additional files** — Multiple JS files
- `levels.js`, `utils.js`, `spritesheet.js`, etc.

### Step 1.5 — Show analysis summary

```
✅ Game analyzed: [game-name]

Location: [path]/game.js ([N] lines)

Structure detected:
  Entities:       [Ship, Bullet, Enemy, ...]
  Canvas size:    [W]×[H]
  Input:          [Keyboard arrows + space / Mouse / etc]
  Game state:     [score, lives, level, ...]
  Constants:      [~N values extracted]
  Assets:         [None / Sprites / Audio / etc]
  Extra files:    [None / levels.js, utils.js, etc]

Ready to clarify metadata and migration decisions?
```

**Wait for confirmation before proceeding to Phase 2.**

---

## Phase 2 — Clarify through questions

This phase follows the `/spec` methodology: ask in blocks of 3-5 questions, then wait for answers.

**Important:** Do not ask questions one at a time. Group related questions together.

### Block 1 — Basic metadata

```
Before generating the spec, I need metadata for game registration.

1. **Game ID** (kebab-case, unique in the system)
   Examples: "tetris", "arkanoid", "frogger"
   What ID do you want for this game?

2. **Display Title** (UPPERCASE, how it appears in menus)
   Examples: "TETRIS", "ARKANOID", "FROGGER"
   What's the title?

3. **Category** (choose one)
   - ARCADE (general action games)
   - PUZZLE (tetris, match-3, sokoban, etc.)
   - SHOOTER (space invaders, asteroids, etc.)
   - VERSUS (competitive, pong, fighting games)
   Which category fits best?

4. **Theme color** (choose one)
   - cyan (tech, space, sci-fi games)
   - magenta (puzzle, retro games)
   - yellow (classic arcade)
   - green (nature, retro)
   What color theme?
```

Wait for answers to all 4 before moving on.

### Block 2 — Descriptions

```
Now for the promotional descriptions:

1. **Short description** (~50 characters)
   This appears in game tables and lists.
   Example: "Encaja piezas antes de que caigan"
   What's a short hook for the game?

2. **Long description** (2-3 sentences)
   This appears on the game detail page.
   Example: "Piezas geométricas descienden desde la oscuridad. Rótalas, 
   encástralas y limpia líneas para sobrevivir. La velocidad aumenta 
   sin piedad cada 10 líneas."
   What's the full description?
```

Wait for both descriptions.

### Block 3 — Game mechanics

```
Understanding game mechanics helps plan the migration:

1. **Starting lives** (or health)
   How many lives does the player start with?
   Default suggestion: 3
   
2. **Level progression** (if any)
   Does the game have levels? How do they progress?
   Examples:
   - No levels (single endless mode)
   - Level per set of obstacles (Arkanoid)
   - Level when all enemies cleared (Asteroids)
   - Score-based levels (Tetris: every 10 lines)
   What's the level system?

3. **Power-ups or bonuses** (if any)
   Are there special items/buffs?
   Example: "Triple shot for 5 seconds, appears randomly"
   Describe any power-ups, or say "None"

4. **Scoring rules**
   How do points work?
   Examples:
   - Per enemy destroyed (20 pts small, 50 pts medium)
   - Per line cleared (100 pts)
   - Combination bonuses
   Explain the scoring
```

Wait for all 4 answers.

### Block 4 — Migration decisions

```
These decisions shape the technical spec:

1. **Canvas size**
   Keep original ([W]×[H]) or standardize to 800×600?
   Recommendation: 800×600 for consistency
   Which?

2. **Keyboard controls**
   Keep original controls or standardize?
   Example standardization: ArrowKeys + Space
   Keep or standardize?

3. **External assets** (if detected)
   The game has [sprites/audio/etc].
   Migrate with the code or configure separately?
   Recommendation: Configure separately after code migration
   Which approach?

4. **Multiple JS files** (if detected)
   Game has [levels.js, utils.js, etc].
   How to handle?
   Options:
   - Merge into single game engine
   - Separate modules in lib/game/[game-id]/
   Which approach?
```

Wait for all 4 answers.

### Block 5 — Scope clarification

```
Final clarifications on what to include:

1. **Features to exclude** (if any)
   Are there vanilla features you don't want to migrate?
   Examples: tutorial, replay mode, high-score saving
   List any to exclude, or say "None"

2. **New features to add** (if any)
   Should the spec include new features not in vanilla?
   Recommendation: Only migrated logic in first spec; new features in separate spec
   Any new features to include?

3. **Anything else to clarify?**
   Any ambiguities or edge cases to document?
```

Wait for all 3 answers.

### Stopping condition

Stop asking when you can answer these three questions without guessing:

1. **Which TypeScript files will be created?**
   (types.ts, entities/Ship.ts, engine/gameEngine.ts, etc.)

2. **What's the first implementation step and the last?**
   (Migrations always follow SPEC 04: types → entities → physics → engine → renderer → React component)

3. **How do we verify it works?**
   (Run typecheck, play game, check scores, etc.)

If you still cannot answer one of these, ask again.

---

## Phase 3 — Write the spec

Once Phase 2 is complete, write the complete spec following the `/spec` template.

### Section 1 — Header

```markdown
# NN — ADD [GAME-NAME] TO ARCADE VAULT

**Estado:** Draft
**Depende de:** SPEC 04 (Juego Asteroides)
**Fecha:** [date from session context, YYYY-MM-DD]

**Objetivo:** Migrar el juego [Game-Name] desde vanilla JavaScript a TypeScript + React 19, integrándolo completamente con el sistema de scores de Supabase en tiempo real y siguiendo el patrón arquitectural establecido en SPEC 04.
```

### Section 2 — Alcance

```markdown
## Alcance

### Incluido en esta especificación

- **Migración de código a TypeScript**
  - Reescribir el/los archivo(s) JavaScript como módulos TypeScript en `/lib/game/[game-id]/`
  - Mantener la lógica de juego exactamente igual (sin cambios en mecánicas, puntuación, velocidades)
  - Crear tipos TypeScript para todas las estructuras de datos del juego

- **Estructura modular**
  - `lib/game/[game-id]/types.ts` — Interfaces de entidades
  - `lib/game/[game-id]/constants.ts` — Constantes extraídas
  - `lib/game/[game-id]/entities/` — Clases de entidades
  - `lib/game/[game-id]/physics/` — Sistema de colisiones
  - `lib/game/[game-id]/engine/` — Motor del juego
  - `lib/game/[game-id]/renderer/` — Sistema de renderizado

- **Componente React `[Game]Game`**
  - Envolver la lógica de juego en un componente React
  - Usar `useEffect` y `useRef` para gestionar el canvas y el game loop
  - Integrarse con el componente `GamePlayer` existente

- **Integración con Supabase en tiempo real**
  - Guardar el score final en la tabla `scores` cuando la partida termina
  - Actualizar automáticamente el leaderboard via Realtime subscriptions
  - Usar el hook `useAuth` existente para obtener el `user_id` actual

- **Reemplazo en la plataforma**
  - Usar `game_id: "[game-id]"` en la base de datos
  - Actualizar `/lib/data.ts` con los metadatos del juego
  - La ruta `/juego/[game-id]/jugar` renderizará `[Game]Game`

- **Canvas responsividad**
  - Canvas renderiza a [W]×[H] px (resolución estándar o original)
  - Centrado en la pantalla con flexbox
  - Funciona en desktop y móvil

### NO incluido en esta especificación (se difiere)

- [Features del vanilla JS que se omiten]
- Tests unitarios
- [Assets externos - si aplica: "Migración de sprites/audio", "Poner después"]
- Sonido o efectos de audio (si no estaban en vanilla)
- Nuevas mecanicas o features no presentes en vanilla
- Niveles de dificultad variables
- Personalización avanzada de controles
```

### Section 3 — Modelo de datos

```markdown
## Modelo de datos

### Entidades del juego

[For each entity detected, describe]:

**[Entity Name]**
- Position: x, y
- Velocity: vx, vy
- Size: radius/width/height
- State: dead, active, etc.
- Special properties: [any unique to this entity]

### GameState

\`\`\`typescript
interface GameState {
  // Entidades
  [entity1]: [EntityType] | null
  [entity2]: [EntityType][]
  [entity3]: [EntityType][]
  
  // Progreso del juego
  score: number
  lives: number
  level: number
  state: 'playing' | 'dead' | 'gameover'
  
  // Timers y flags
  [timer]: number
  [flag]: boolean
}
\`\`\`

### Constantes del juego

\`\`\`typescript
// Canvas
CANVAS_WIDTH = [W]
CANVAS_HEIGHT = [H]

// Entidades
[ENTITY]_SPEED = [value]
[ENTITY]_SIZE = [value]
// ... más constantes
\`\`\`

### Variables de entorno

No se requieren nuevas variables. Se usan las existentes:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
```

### Section 4 — Plan de implementación

Follow SPEC 04 structure exactly:

```markdown
## Plan de implementación

### 1. Crear módulo base de tipos y constantes

**Archivos nuevos:**
- `lib/game/[game-id]/types.ts`
- `lib/game/[game-id]/constants.ts`

**Cambios:**
- Definir interfaces TypeScript para todas las entidades del juego
- Exportar constantes de física, velocidades, puntuaciones

### 2. Migrar entidades del juego

**Archivos nuevos:**
- `lib/game/[game-id]/entities/[Entity1].ts`
- `lib/game/[game-id]/entities/[Entity2].ts`
- ... (una por cada entidad)

**Cambios:**
- Convertir cada clase/factory de vanilla a módulo TypeScript
- Agregar tipos explícitos
- Mantener lógica interna exactamente igual

### 3. Crear sistema de física y colisiones

**Archivos nuevos:**
- `lib/game/[game-id]/physics/utils.ts`
- `lib/game/[game-id]/physics/collision.ts`

**Cambios:**
- Función `detectCollisions(state: GameState): Collision[]`
- Utilidades: wrap(), distance(), random()

### 4. Crear motor del juego

**Archivos nuevos:**
- `lib/game/[game-id]/engine/gameEngine.ts`

**Cambios:**
- `initializeGame()` → GameState inicial
- `updateGameState(state, dt, input)` → nuevo estado
- `handleCollisions(state, collisions)` → procesamiento
- Helpers: spawnEntities(), checkLevelUp(), etc.

### 5. Crear renderizador

**Archivos nuevos:**
- `lib/game/[game-id]/renderer/draw.ts`

**Cambios:**
- `drawGame(ctx, state)` → renderiza todo
- `drawHUD(ctx, state)` → UI en pantalla
- Helpers de dibujo por entidad

### 6. Crear componente React

**Archivos nuevos:**
- `components/games/[Game]Game.tsx`

**Cambios:**
- Componente funcional con canvas ref
- Game loop con requestAnimationFrame
- Input handling (keyboard)
- Callbacks: onGameOver, onScoreChange, etc.

### 7. Integrar con GamePlayer

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**
- Agregar import de [Game]Game
- Agregar condicional: `if (game.id === '[game-id]')`
- Renderizar componente con callbacks

### 8. Registrar juego en lib/data.ts

**Archivos modificados:**
- `lib/data.ts`

**Cambios:**
- Agregar entrada en array GAMES con metadatos

### 9. Configurar Supabase (si aplica)

**Cambios:**
- Ejecutar SQL para agregar juego a tabla games

### 10. Verificación end-to-end

- Typecheck sin errores
- Juego funciona en `/juego/[game-id]/jugar`
- Controles responden
- Scores se guardan
```

### Section 5 — Criterios de aceptación

```markdown
## Criterios de aceptación

- [ ] Componente `[Game]Game` se renderiza en `/juego/[game-id]/jugar`
- [ ] Canvas es [W]×[H] px y está centrado
- [ ] Controles funcionan: [listar teclas/botones]
- [ ] Lógica del juego es idéntica a vanilla
- [ ] [Entity]-specific criteria: "se divide en dos medianas", "power-up dura 5s", etc.
- [ ] Score se incrementa correctamente según reglas
- [ ] [Lives/Level]-specific criteria
- [ ] Game over ocurre cuando [condición]
- [ ] Modal de game over aparece
- [ ] Score se guarda en Supabase (usuarios logueados)
- [ ] Score se guarda en localStorage (anónimos)
- [ ] Juego aparece en /biblioteca
- [ ] Leaderboard funciona en tiempo real
- [ ] TypeScript compila sin errores
- [ ] No hay warnings en consola del browser
- [ ] Funciona en navegadores modernos (Chrome, Firefox, Safari)
```

### Section 6 — Decisiones tomadas

```markdown
## Decisiones tomadas

1. **Estructura modular lib/game/[game-id]/** — Escalable para múltiples juegos sin conflictos.

2. **Canvas [W]×[H]** — [Razón: mantener original para autenticidad / estandarizar para consistencia]

3. **Guardar score solo al finalizar** — Reduce carga en Supabase (1 request por partida vs 60/seg).

4. **Reemplazo completo** — El juego [game-id] ocupa el slot anterior; no duplicados.

5. **Usar callbacks para integración** — GamePlayer orquesta guardado + UI; juego no conoce Supabase.

6. **[Decisión específica del juego]** — [Razón]
```

### Section 7 — Decisiones descartadas

```markdown
## Decisiones descartadas

1. **[Feature X]** — Razón: [out of scope, too complex, etc.]
2. **[Approach Y]** — Razón: [why not chosen]
```

### Section 8 — Riesgos (optional, only if applicable)

```markdown
## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| [Risk description] | [How we'll handle it] |
```

---

## Phase 4 — Save the spec

Once Phase 3 is complete, perform final steps:

### Step 4.1 — Determine spec number

Read the specs listing from session context above.
- Find the highest existing number (e.g., 05)
- Next number: 06 (zero-padded)

### Step 4.2 — Generate slug

Format: `add-[game-id]`
Examples: `add-tetris`, `add-arkanoid`, `add-frogger`

### Step 4.3 — Check/create config

Check if `specs/.spec-config.yml` exists.

If missing, create it:
```yaml
# spec workflow configuration
# AutoCreateBranch controls whether /spec-impl creates branches automatically
AutoCreateBranch: true
```

If exists, do not modify.

### Step 4.4 — Write spec file

Path: `specs/NN-add-[game-id].md`

Use the complete spec from Phase 3, starting with header.
State: Always `Draft` (user approves manually).

### Step 4.5 — Confirmation

```
✅ Spec created successfully

File: specs/NN-add-[game-id].md
Status: Draft
Dependencies: SPEC 04 (Asteroides)

Next steps:

1. **Review** the spec:
   cat specs/NN-add-[game-id].md

2. **Edit** if needed (fix any inaccuracies)

3. **Approve** when ready:
   - Change "Status: Draft" to "Status: Approved"
   - Save the file

4. **Implement** with /spec-impl:
   /spec-impl NN-add-[game-id]

The implementation will follow the plan step by step with pauses for review.

That's it from my side. The spec is ready for your review. 🎮
```

**STOP HERE. Do not implement. Do not propose next actions.**

---

## Hard Rules

These are absolute. Never break them.

1. **NEVER write code** — This skill only generates the `.md` spec file
2. **NEVER implement after saving** — User runs `/spec-impl` when ready
3. **NEVER skip Phase 2 questions** — Clarification is the whole point
4. **NEVER mark as Approved** — State is always `Draft`. User approves manually
5. **NEVER guess dates** — Use `date +%F` from session context
6. **NEVER deviate from SPEC 04 structure** — Follow it exactly
7. **NEVER assume decisions** — Ask if ambiguous
8. **ALWAYS use concrete names** — Real file paths, real constants
9. **ALWAYS keep it clear** — One sentence per idea
10. **IF game is too complex** — Suggest splitting into multiple specs before proceeding

---

## Tone and style

- Be direct. No apologies for asking questions. That's the point.
- Use concrete examples from the detected game.
- Ask yes/no or multiple choice when possible.
- Group related questions together.
- Wait for complete answers before moving on.

---

## Arguments

`$ARGUMENTS` is the game name or path, not the spec file name.

Examples:
- `/add-game tetris` → search references/started-games/03-tetris/
- `/add-game asteroids` → search references/started-games/02-asteroids/
- `/add-game ./my-game/` → check ./my-game/game.js
- `/add-game` → list available references and ask for input

---

**END OF SKILL DEFINITION**
