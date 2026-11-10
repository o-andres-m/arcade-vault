# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

**Arcade Vault** - A platform for playing online games and competing for the
highest scores.

This is a Next.js 16.3.6 application using React 19, TypeScript, and Tailwind
CSS v4, with Supabase as backend for authentication, profiles, and scores.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Type check without emitting
npm run typecheck
```

## Tech Stack

- **Framework**: Next.js 16.3.6 (App Router)
- **UI**: React 19.2.8
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Realtime)
- **Email**: Resend
- **Code Quality**: ESLint 9, Prettier 3.9.9

## Spec Driven Design Workflow

This project follows **Spec Driven Design** methodology based on `/spec` and
`/spec-impl` commands.

Reference: https://github.com/Klerith/fernando-skills

Skills installed:

```bash
npx skills@latest add Klerith/fernando-skills
```

When implementing features:

1. Start with `/spec` to define the specification
2. Use `/spec-impl` to implement based on the specification

### Custom Skills

Arcade Vault usa slash commands para workflows de desarrollo que el usuario
invoca manualmente.

**Location:** `.claude/skills/`

#### `/add-game` - Game Spec Generator

Custom skill for adding new games to Arcade Vault. **Only generates specs, does
not implement code.**

**Usage:**

```bash
/add-game <game-name-or-path>
```

**Examples:**

```bash
# From references folder
/add-game tetris

# From custom path
/add-game ./my-custom-game/
```

**Workflow:**

1. `/add-game` analyzes vanilla JS game → generates spec
2. Review and approve the spec
3. `/spec-impl` implements the spec step-by-step

**Location:** `.claude/skills/add-game/`

#### `/spec-impl-game` - Post-Implementation Game Enhancer

Post-implementation enhancer para juegos. Después de ejecutar `/spec-impl`,
este skill invoca automáticamente los agentes `skin-designer` y `mobile-porter`
para agregar skins y controles táctiles. **Automatiza los pasos posteriores a la
implementación base.**

**Usage:**

```bash
# Paso 1: Implementar juego base primero
/spec-impl [spec-ref]

# Paso 2: Agregar skins y controles móviles
/spec-impl-game [spec-ref]
```

**Examples:**

```bash
# Después de implementar Snake
/spec-impl 07-add-snake
/spec-impl-game 07-add-snake

# Después de implementar por número
/spec-impl 08
/spec-impl-game 08
```

**Workflow:**

1. Verifica que `/spec-impl` ya corrió (archivos base existen)
2. Extrae game-id del spec automáticamente
3. Invoca agente `skin-designer` → Agrega 3 paletas de colores
4. Invoca agente `mobile-porter` → Adapta controles móviles
5. Reporta resumen unificado con instrucciones de prueba
6. **NO hace commits ni pushes** - Solo implementa y reporta cambios

**Features agregadas:**

- 🎨 Sistema de skins: neon, pastel, retro
- 📱 Controles táctiles: DPad/Joystick según tipo de juego
- 💾 Persistencia: localStorage para preferencias
- 📊 Reporting: Resumen completo con checklist de validación

**Location:** `.claude/skills/spec-impl-game/`

**Nota:** Este skill es un enhancer post-implementación. NO reemplaza a `/spec-impl`,
sino que lo complementa automatizando los pasos posteriores estándar de todos los juegos.
Los archivos quedan modificados sin commit - el usuario decide cuándo commitear.

### Custom Agents

Arcade Vault tiene 4 agentes personalizados que Claude invoca automáticamente
según el contexto. **No son slash commands** - Claude los detecta y ejecuta cuando
son necesarios.

**Location:** `.claude/agents/`

**¿Cuándo usar?** No los invocas directamente. Simplemente pídele a Claude lo que
necesitas en lenguaje natural y él decidirá si debe invocar un agente.

#### `game-jam` - Game Concept Generator

Genera 3 conceptos de juegos arcade basados en un tema específico. Crea specs
completas listas para implementar con `/spec-impl`, mezclando adaptaciones de
clásicos con ideas originales. **Solo genera specs, no implementa código.**

**Claude invoca este agente cuando:**
- Pides "genera conceptos de juegos"
- Mencionas un tema y quieres juegos relacionados
- Preguntas "qué juegos puedo hacer con tema X"

**Ejemplos de prompts:**

```
"Genera 3 conceptos de juegos con tema espacial"
"Quiero ideas de juegos arcade para tema underwater"
"Necesito juegos inspirados en medieval"
```

**Features:**

- Genera 3 conceptos únicos por tema
- Balance de categorías (ARCADE, PUZZLE, SHOOTER, VERSUS)
- Specs completas siguiendo formato SPEC 06/07
- Entidades concretas y constantes reales
- Output: `specs/game-jam/[tema]/[game-id]/spec.md`

**Workflow:**

1. Analiza e interpreta el tema
2. Genera 5-7 candidatos (clásicos adaptados + originales)
3. Puntúa y selecciona top 3
4. Crea estructura de directorios
5. Genera specs completas para cada juego

**Location:** `.claude/agents/game-jam.md`

#### `game-planner` - Game Strategy Advisor

Analiza el catálogo actual de Arcade Vault y sugiere juegos estratégicamente
usando 4 criterios objetivos. Mantiene memoria en `references/game-suggestions.md`.

**Claude invoca este agente cuando:**
- Preguntas "qué juegos debería agregar"
- Pides sugerencias sin tema específico
- Quieres análisis estratégico del catálogo

**Ejemplos de prompts:**

```
"¿Qué juegos me recomiendas agregar?"
"Necesito sugerencias para balancear el catálogo"
"¿Qué categoría está subrepresentada?"
```

**Features:**

- Scoring objetivo (Balance, Complejidad, Popularidad, Referencias)
- Actualiza `references/game-suggestions.md` con estados (🎯 🔍 ✅ ❌)
- Considera gaps en categorías actuales
- Sugiere 3-5 juegos por invocación

**Location:** `.claude/agents/game-planner.md`

#### `skin-designer` - Game Skin System Implementation

Implementa sistema de 3 paletas de colores (neon, pastel, retro) para juegos.
Agrega selector visual al HUD y persistencia en localStorage. **Implementa código
directamente, no genera specs.**

**Claude invoca este agente cuando:**
- Juego nuevo NO tiene paletas de colores
- Pides "agregar skins/temas de color"
- `/spec-impl-game` lo invoca automáticamente

**Ejemplos de prompts:**

```
"Agrega sistema de skins a snake"
"Necesito paletas de colores para el juego nuevo"
```

**Features:**

- 3 paletas por juego: Neon, Pastel, Retro
- Selector en HUD (al lado de botón Pausa)
- Persistencia en localStorage
- Sigue patrón de referencia (Tetris)

**Location:** `.claude/agents/skin-designer.md`

#### `mobile-porter` - Mobile Touch Adaptation

Adapta juegos para funcionalidad móvil táctil. Analiza controles de teclado y
diseña mapeo apropiado (DPad/Joystick/ArcadeJoystick). **Implementa código
directamente, no genera specs.**

**Claude invoca este agente cuando:**
- Juego nuevo NO tiene entrada en `controlMappings.ts`
- Pides "agregar controles móviles/táctiles"
- `/spec-impl-game` lo invoca automáticamente

**Ejemplos de prompts:**

```
"Adapta snake para móvil"
"Necesito controles táctiles para el juego nuevo"
```

**Features:**

- Analiza controles de teclado del juego
- Diseña mapeo móvil apropiado (DPad, Joystick, botones)
- Agrega entrada en `lib/game/controls/controlMappings.ts`
- Soporta casos especiales (control analógico)
- Mantiene compatibilidad con desktop (aditivo, no reemplazo)

**Location:** `.claude/agents/mobile-porter.md`

## Supabase Integration

### Configuration

- **Project URL**: Set in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
- **Anon Key**: Set in `.env.local` as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service Role Key**: Set in `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

See `SUPABASE_SETUP.md` for detailed configuration and troubleshooting.

### Database Schema

#### Table: `profiles`

- `id` (uuid, FK to auth.users)
- `username` (text, unique)
- `avatar_url` (text, nullable)
- `bio` (text, nullable)
- `total_games` (int4, default 0)
- `total_score` (int4, default 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**RLS**: Enabled with policies for read/update

#### Table: `scores`

- `id` (uuid, PK)
- `user_id` (uuid, FK to profiles.id)
- `game_id` (text)
- `score` (int4)
- `created_at` (timestamptz)

**RLS**: Enabled with policies for insert/read

### Authentication

Three auth modes supported:

1. **Sign Up**: Email + password + username
2. **Sign In**: Email + password
3. **Guest Mode**: Anonymous sign-in (must enable Anonymous provider in
   Supabase dashboard)

**Components:**

- `components/auth/AuthForm.tsx` - Main auth form
- `lib/supabase/` - Supabase client utilities
- `middleware.ts` - Session management

## Project Structure

### Routes (`/app`)

- `/` - Landing page
- `/about` - About page
- `/auth` - Authentication page
- `/biblioteca` - Game library (requires auth)
- `/juego/[id]` - Individual game page
- `/perfil` - User profile (requires auth)
- `/salon` - Leaderboard (Hall of Fame)
- `/api/auth/callback` - Auth callback handler
- `/api/contact` - Contact form API

### Components (`/components`)

- `auth/` - Authentication components
- `contact/` - Contact form
- `games/` - Game components (GameCard, GamePlayer, Leaderboard, etc.)
- `home/` - Landing page sections
- `leaderboard/` - Leaderboard components
- `navigation/` - Nav and TopBar
- `profile/` - Profile components
- `providers/` - Context providers
- `ui/` - Reusable UI components

### Games (`/components/games`)

Implemented games are listed in the next file: /references/implemented-games/implemented-games.md
All games integrate with Supabase for score tracking.

### Specifications (`/specs`)

All feature specs are documented in `/specs`:

- `01-mvp-interfaz-visual.md` - Initial UI/UX design
- `02-home-landing-page.md` - Landing page implementation
- `02-pagina-about-contacto.md` - About and contact pages
- `03-implementacion-supabase.md` - Supabase integration
- `04-juego-asteroides.md` - Asteroids game implementation
- `05-leaderboard-tabla-juegos.md` - Leaderboard and games table
- `06-add-arkanoid.md` - Arkanoid game
- `07-add-snake.md` - Snake game

## Next.js 16 Breaking Changes

⚠️ **CRITICAL**: This project uses Next.js 16.3.6 which has breaking changes
from earlier versions.

**Before writing any Next.js code:**

- Read the relevant guide in `node_modules/next/dist/docs/`
- APIs, conventions, and file structure may differ from training data
- Pay attention to deprecation notices

The AGENTS.md file is auto-generated by `next dev` and should not be removed.

## Architecture

### Design System

**Always use `/frontend-design` skill for UI/UX design decisions.**

Design philosophy:

- Retro arcade aesthetic with modern touches
- Dark theme optimized for gaming
- Neon accents and glassmorphism effects
- Responsive design (mobile-first)

### App Router Structure

- Uses Next.js App Router (not Pages Router)
- Main routes defined in `/app` directory
- Root layout: `app/layout.tsx` with Geist fonts configured
- Server Components by default, Client Components marked with `'use client'`

### TypeScript Configuration

- Path alias `@/*` maps to root directory
- Strict mode enabled
- Target: ES2017
- JSX: react-jsx (React 19 automatic runtime)

### Styling

- Tailwind CSS v4 (latest major version - check for breaking changes from v3)
- Global styles in `app/globals.css`
- Dark mode support configured via `dark:` classes
- CSS Modules for component-specific styles

### State Management

- React Context for auth state (`components/providers/AuthProvider.tsx`)
- Supabase Realtime for live score updates
- React hooks for local state

## Game Development Pattern

When adding new games, follow the pattern from SPEC 04 (Asteroids):

1. Create game component in `components/games/[GameName]Game.tsx`
2. Implement game logic with canvas/HTML5
3. Integrate with `GamePlayer` component
4. Add score tracking via Supabase
5. Update game registry in `lib/games.ts` (or relevant config)

### Sistema de Skins

Todos los juegos soportan 3 paletas de colores seleccionables:

- **Neon**: Colores brillantes y vibrantes (ácidos, neón)
- **Pastel**: Colores suaves y claros (pasteles, candy)
- **Retro**: Colores clásicos arcade (primarios saturados)

**Ubicación del selector**: HUD del GamePlayer, al lado del botón de Pausa.

**Persistencia**: Las preferencias se guardan en `localStorage` con clave
`[juego]-color-palette`.

**Implementación**:

- Constantes de paletas en `lib/game/[juego]/constants.ts`
- Props `colorPalette` y `onColorPaletteChange` en cada componente de juego
- Selector unificado en `GamePlayer.tsx`

**Juegos con sistema de skins implementado**:

- Tetris (tetris)
- Asteroides (rocas)
- Arkanoid (arkanoid)
- Snake (snake)

**Game component structure:**

```tsx
'use client';

interface GameProps {
  onGameOver: (score: number) => void;
  isPaused: boolean;
  onScoreChange?: (score: number) => void;
}

export default function MyGame({ onGameOver, isPaused, onScoreChange }: GameProps) {
  // Game logic here
}
```

## Code Quality

### Linting and Formatting

- ESLint with Next.js config
- Prettier for consistent formatting
- Run `npm run lint:fix` and `npm run format` before committing

### Type Safety

- Always use TypeScript
- Avoid `any` types
- Run `npm run typecheck` to verify types

## Important Notes

- **Project language**: Spanish (content, comments, documentation)
- **Next.js 16**: Has API changes - always verify against current docs
- **React 19**: May have behavioral differences from React 18
- **Supabase RLS**: Always respect Row Level Security policies
- **Auth required routes**: `/biblioteca`, `/perfil` require authentication
- **Anonymous users**: Can play games but scores are temporary

## Resources

- **Supabase Setup**: See `SUPABASE_SETUP.md` for detailed configuration
- **Next.js Docs**: `node_modules/next/dist/docs/`
- **Specs**: All features documented in `/specs`
- **Skills**: Custom slash commands in `.claude/skills/`
- **Agents**: Custom agents in `.claude/agents/`
