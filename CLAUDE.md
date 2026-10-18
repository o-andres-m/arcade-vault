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

**Location:** `.agents/skills/add-game/`

#### `/game-planner` - Game Strategy Advisor

Analiza, planifica y sugiere juegos que encajan con Arcade Vault. Mantiene
memoria en `references/game-suggestions.md`.

**Location:** `.agents/skills/game-planner/`

#### `/skin-designer` - Game Skin System Implementation

Implementa un sistema de selección de 3 paletas de colores (skins) para todos
los juegos de Arcade Vault. Agrega selector visual al lado del botón de Pausa
en el HUD. **Implementa código directamente, no genera specs.**

**Usage:**

```bash
# Implementar para todos los juegos pendientes
/skin-designer

# Implementar solo para un juego específico
/skin-designer [game-id]
```

**Examples:**

```bash
# Todos los juegos
/skin-designer all

# Solo Asteroides
/skin-designer rocas

# Solo Snake
/skin-designer snake
```

**Features:**

- 3 paletas por juego: Neon, Pastel, Retro
- Selector en el HUD (al lado de botón Pausa)
- Persistencia en localStorage
- Sigue el patrón ya implementado en Tetris

**Location:** `.agents/skills/skin-designer/`

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
- **Skills**: Custom skills in `.agents/skills/`
