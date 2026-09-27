# 03 — Implementación Completa de Supabase

**Estado:** Implementado  
**Depende de:** SPEC 02  
**Fecha:** 2026-09-27

**Objetivo:** Integrar Supabase como backend completo de Arcade Vault, implementando autenticación real (Email/Password, Magic Link, Guest), base de datos PostgreSQL para usuarios y puntuaciones, Storage para avatares, Realtime para rankings en vivo, y Row Level Security para proteger los datos.

---

## Alcance

### Incluido en esta especificación

- **Configuración de Supabase**:
  - Instalación de `@supabase/ssr` y `@supabase/supabase-js`
  - Variables de entorno para URL, anon key y service role key
  - Utilities para cliente Supabase (server-side y client-side)
  - Middleware de Next.js para refrescar sesiones

- **Schema de base de datos PostgreSQL**:
  - Tabla `profiles` (id, username, avatar_url, bio, total_games, total_score, created_at, updated_at)
  - Tabla `scores` (id, user_id, game_id, score, created_at)
  - Índices y constraints para performance
  - Triggers para actualizar stats de perfil automáticamente

- **Row Level Security (RLS)**:
  - Policies para `profiles`: usuarios solo ven/editan su propio perfil
  - Policies para `scores`: lectura pública, escritura solo del owner
  - Service role key bypassa RLS para operaciones admin

- **Storage**:
  - Bucket `avatars` para imágenes de perfil
  - RLS en Storage: solo el owner puede subir/actualizar su avatar
  - Avatares públicos para lectura

- **Autenticación completa**:
  - Email/Password signup y login con Supabase Auth
  - Magic Link (login sin contraseña por email)
  - Guest mode (sesión anónima de Supabase)
  - OAuth preparado (Google, GitHub) pero disabled hasta configurar apps
  - Refactor de `AuthForm` para usar Supabase manteniendo UI actual
  - Route Handlers para operaciones de auth (`/api/auth/callback`, `/api/auth/signout`)
  - Hook `useAuth()` para manejar sesión en client components
  - Middleware para proteger rutas privadas

- **Perfil de usuario**:
  - Página `/perfil` para ver y editar perfil propio
  - Campos: username (obligatorio, único, máx 20 chars), avatar (upload desde Storage), bio (opcional, máx 200 chars)
  - Stats calculados automáticamente: total de juegos jugados, puntuación total acumulada
  - Formulario de edición con validación

- **Sistema de puntuaciones en Supabase**:
  - Al terminar un juego, guardar score en tabla `scores` (reemplaza localStorage)
  - Query para leaderboard por juego (top 10)
  - Query para actividad en vivo (últimos 20 scores globales)
  - Query para top jugadores del día

- **Realtime subscriptions**:
  - Suscripción a INSERT en tabla `scores` para actualizar rankings en vivo
  - Notificación visual cuando hay nuevo high score
  - Implementación en página `/salon` (leaderboard) y Home (actividad en vivo)

- **Integración con sistema actual**:
  - Actualizar tipos: `User`, `Profile`, `Score` para incluir campos de Supabase
  - Actualizar `Nav` para mostrar usuario logueado (avatar + username) y botón de logout
  - Reemplazar funciones mock `generateRecentActivity` y `generateTopPlayers` con queries reales
  - Proteger rutas `/juego/[id]/jugar` (requiere auth o guest mode)
  - Migrar lógica de save de scores de localStorage a Supabase

- **Developer Experience**:
  - Migration SQL bien documentada para crear schema
  - Seed data opcional (usuarios y scores de prueba)
  - Manejo de errores con mensajes descriptivos
  - Loading states en todas las operaciones async

### NO incluido en esta especificación (se difiere)

- OAuth configurado y funcional (Google, GitHub) — Se deja preparado pero disabled hasta que el usuario configure las apps en Supabase Dashboard
- Panel de administración para moderar contenido
- Sistema de reportes o denuncias de scores sospechosos
- Achievements, badges o logros
- Sistema de amigos o seguidores
- Chat en vivo entre usuarios
- Notificaciones push (web o mobile)
- Analytics detallados con Supabase Analytics
- Migración automática masiva de usuarios mock existentes
- Página pública de perfil de otros usuarios (`/usuario/[username]`) — Solo perfil propio en esta spec
- Verificación de email obligatoria (se deja opcional)
- Rate limiting para prevenir spam de scores
- Soft delete de usuarios (se usa hard delete)
- Historial completo de scores por usuario (solo se muestran high scores)

---

## Modelo de datos

### Variables de entorno (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # Solo server-side, NUNCA exponer al cliente

# Resend (ya existente del spec anterior)
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_EMAIL=team@arcadevault.com
```

### Schema de PostgreSQL

#### Tabla `profiles`

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 200),
  total_games INTEGER DEFAULT 0,
  total_score BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para búsqueda rápida por username
CREATE INDEX idx_profiles_username ON profiles(username);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

#### Tabla `scores`

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,  -- Referencia al id del juego en GAMES array (ej: "bloque-buster")
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_game_id ON scores(game_id);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX idx_scores_game_score ON scores(game_id, score DESC);  -- Para leaderboards

-- Trigger para actualizar stats del perfil cuando se inserta un score
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    total_games = total_games + 1,
    total_score = total_score + NEW.score
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scores_update_profile_stats
  AFTER INSERT ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_stats();
```

#### Row Level Security (RLS)

```sql
-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
-- Lectura: todos pueden ver todos los perfiles (para mostrar en rankings)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Inserción: solo en el primer login (crear el perfil propio)
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Actualización: solo el owner puede editar su perfil
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Eliminación: solo el owner puede eliminar su perfil
CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Policies para scores
-- Lectura: todos pueden ver todos los scores (para rankings públicos)
CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT
  USING (true);

-- Inserción: solo usuarios autenticados pueden insertar sus propios scores
CREATE POLICY "Users can insert their own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Actualización: no permitida (los scores son inmutables)
-- Eliminación: solo el owner (para borrar scores propios si es necesario)
CREATE POLICY "Users can delete their own scores"
  ON scores FOR DELETE
  USING (auth.uid() = user_id);
```

#### Storage bucket `avatars`

```sql
-- Crear bucket (se hace desde Supabase Dashboard o con SDK)
-- Bucket name: avatars
-- Public: true (los avatares son públicos para lectura)
-- Allowed MIME types: image/jpeg, image/png, image/webp
-- Max file size: 2MB

-- RLS policies para Storage
-- Lectura: todos pueden ver avatares (bucket público)
-- Escritura: solo el owner puede subir/actualizar su avatar
-- El path del archivo debe ser: {user_id}/avatar.{ext}
```

### Tipos TypeScript actualizados

```typescript
// types/index.ts

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;
  color: string;
  best: number;
  plays: string;
}

export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

// Tipo de sesión de Supabase
export interface AuthUser {
  id: string;
  email?: string;
  is_anonymous: boolean;
}

// Tipo de perfil (tabla profiles)
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  total_games: number;
  total_score: number;
  created_at: string;
  updated_at: string;
}

// Tipo de score (tabla scores)
export interface Score {
  id: string;
  user_id: string;
  game_id: string;
  score: number;
  created_at: string;
  // Campos opcionales si se hace JOIN con profiles
  username?: string;
  avatar_url?: string | null;
}

// Tipo para leaderboard entry (score + datos del usuario)
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  score: number;
  created_at: string;
}

// Tipo para actividad en vivo (últimos scores)
export interface RecentActivity {
  id: string;
  username: string;
  game_id: string;
  game_title: string;  // Lookup desde GAMES array
  score: number;
  created_at: string;
  color: string;  // Color del juego (desde GAMES array)
}
```

### Interfaces de utilidades

```typescript
// lib/supabase/types.ts

export interface SignUpData {
  email: string;
  password: string;
  username: string;  // Se guarda en profiles después del signup
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  username?: string;
  bio?: string;
  avatar_url?: string;
}

export interface SaveScoreData {
  game_id: string;
  score: number;
}
```

---

## Plan de implementación

Cada paso deja el sistema en estado funcional (compilable y navegable).

### 1. Instalar dependencias de Supabase y configurar variables de entorno

**Archivos nuevos:**
- `.env.local` — Variables de entorno con keys de Supabase (no commitear)
- `.env.example` — Template actualizado con variables de Supabase

**Comandos:**

```bash
npm install @supabase/ssr @supabase/supabase-js
```

**Contenido de `.env.example`:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Resend (ya existente)
RESEND_API_KEY=re_xxxxxxxxxxxx
CONTACT_EMAIL=team@arcadevault.com
```

**Verificación:** `npm run build` pasa sin errores, `.env.local` existe con las keys del proyecto de Supabase.

---

### 2. Crear utilities para cliente Supabase

**Archivos nuevos:**
- `lib/supabase/client.ts` — Cliente para client components
- `lib/supabase/server.ts` — Cliente para server components y route handlers
- `lib/supabase/middleware.ts` — Utility para middleware de Next.js

**Contenido de `lib/supabase/client.ts`:**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Contenido de `lib/supabase/server.ts`:**

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // La llamada a `set` falla en Middleware. Usar `updateSession` en middleware.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // La llamada a `remove` falla en Middleware.
          }
        },
      },
    }
  )
}
```

**Contenido de `lib/supabase/middleware.ts`:**

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refrescar sesión
  await supabase.auth.getUser()

  return response
}
```

**Verificación:** Los archivos se pueden importar sin errores de tipos.

---

### 3. Crear schema en Supabase con migration SQL

**Archivos nuevos:**
- `supabase/migrations/20260927_initial_schema.sql` — Migration con schema completo

**Contenido:**

```sql
-- Habilitar extensión UUID si no está habilitada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL CHECK (char_length(username) >= 3 AND char_length(username) <= 20),
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 200),
  total_games INTEGER DEFAULT 0,
  total_score BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_username ON profiles(username);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Tabla scores
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_game_id ON scores(game_id);
CREATE INDEX idx_scores_created_at ON scores(created_at DESC);
CREATE INDEX idx_scores_game_score ON scores(game_id, score DESC);

-- Trigger para actualizar stats del perfil
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    total_games = total_games + 1,
    total_score = total_score + NEW.score
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scores_update_profile_stats
  AFTER INSERT ON scores
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_stats();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON profiles FOR DELETE
  USING (auth.uid() = id);

-- Policies para scores
CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scores"
  ON scores FOR DELETE
  USING (auth.uid() = user_id);
```

**Acción manual:** Ejecutar la migration en Supabase Dashboard:
1. Ir a SQL Editor
2. Pegar el contenido del archivo SQL
3. Ejecutar (Run)
4. Verificar que las tablas `profiles` y `scores` aparecen en Table Editor

**Verificación:** Las tablas existen en Supabase con RLS habilitado y policies activas.

---

### 4. Crear Storage bucket para avatares

**Acción manual en Supabase Dashboard:**
1. Ir a Storage
2. Crear nuevo bucket:
   - Name: `avatars`
   - Public: ✅ (avatares son públicos para lectura)
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
   - Max file size: `2MB`
3. Agregar RLS policies para el bucket:
   - Lectura: pública (anyone can read)
   - Escritura: `bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text`
     (Solo el owner puede subir en su carpeta `{user_id}/avatar.*`)

**Verificación:** El bucket `avatars` aparece en Storage con las policies configuradas.

---

### 5. Actualizar tipos TypeScript

**Archivos modificados:**
- `types/index.ts` — Actualizar y agregar interfaces

**Cambios:**
- Reemplazar `User` por `AuthUser` y `Profile` (separar auth de perfil)
- Actualizar `Score` para incluir campos de Supabase
- Agregar tipos `LeaderboardEntry` y `RecentActivity` actualizados

**Verificación:** `npm run build` pasa sin errores de tipos.

---

### 6. Crear hook useAuth para manejar sesión

**Archivos nuevos:**
- `hooks/useAuth.ts` — Hook para auth en client components

**Contenido:**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (data) setProfile(data)
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return {
    user,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user && !user.is_anonymous,
    isGuest: !!user && user.is_anonymous,
  }
}
```

**Verificación:** El hook se puede usar en componentes client sin errores.

---

### 7. Crear Route Handlers para auth

**Archivos nuevos:**
- `app/api/auth/callback/route.ts` — Callback para magic link y OAuth
- `app/api/auth/signout/route.ts` — Sign out server-side

**Contenido de `app/api/auth/callback/route.ts`:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/biblioteca'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Error en auth, redirigir a página de error o auth
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`)
}
```

**Contenido de `app/api/auth/signout/route.ts`:**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/', request.url))
}
```

**Verificación:** Los endpoints se pueden llamar sin errores.

---

### 8. Crear Middleware para refrescar sesiones

**Archivos nuevos:**
- `middleware.ts` (en raíz del proyecto)

**Contenido:**

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Verificación:** El middleware intercepta requests y refresca sesiones automáticamente.

---

### 9. Refactor de AuthForm para usar Supabase

**Archivos modificados:**
- `components/auth/AuthForm.tsx` — Reemplazar lógica completa manteniendo UI

**Cambios principales:**
- Agregar estado `mode: 'email' | 'magic' | 'guest'` (tabs adicionales o radio buttons)
- `handleSubmit` para signup/signin con email/password:
  - Signup: `supabase.auth.signUp()` + crear profile con username
  - Signin: `supabase.auth.signInWithPassword()`
- `handleMagicLink`: `supabase.auth.signInWithOtp({ email })`
- `handleGuest`: `supabase.auth.signInAnonymously()` + crear profile anónimo
- Mostrar loading state durante operaciones
- Mostrar errores de Supabase traducidos (ej: "Invalid credentials" → "Credenciales inválidas")
- Redirigir a `/biblioteca` en éxito (o a `/perfil/completar` si es primer login y falta username)

**Verificación:** El formulario envía datos a Supabase y crea sesión correctamente.

---

### 10. Crear página /perfil para ver y editar perfil

**Archivos nuevos:**
- `app/perfil/page.tsx` — Página de perfil con formulario de edición
- `components/profile/ProfileForm.tsx` — Formulario de edición de perfil
- `components/profile/AvatarUpload.tsx` — Componente de upload de avatar

**Estructura de `/perfil`:**
- Protegida: requiere auth (si no hay sesión, redirigir a `/auth`)
- Mostrar avatar actual (placeholder si no existe)
- Campos editables: username, bio
- Upload de avatar con preview
- Stats en read-only: total_games, total_score
- Botón "GUARDAR CAMBIOS" → `supabase.from('profiles').update()`
- Botón "CANCELAR" → resetear form

**Lógica de AvatarUpload:**
- Input file con `accept="image/jpeg,image/png,image/webp"`
- Preview antes de subir
- Validación: max 2MB, solo imágenes
- Upload a Storage: `supabase.storage.from('avatars').upload('{user_id}/avatar.{ext}')`
- Actualizar `avatar_url` en profile
- Mostrar loading durante upload

**Verificación:** La página se renderiza, el formulario actualiza profile, el avatar se sube a Storage.

---

### 11. Actualizar Nav para mostrar usuario logueado

**Archivos modificados:**
- `components/navigation/Nav.tsx` — Agregar UserMenu

**Cambios:**
- Importar `useAuth()`
- Si `isAuthenticated || isGuest`: mostrar `<UserMenu />` en lugar de botón "INICIAR SESIÓN"
- `<UserMenu />` muestra:
  - Avatar circular (40x40px) con username
  - Dropdown en hover/click:
    - Link a `/perfil` (solo si no es guest)
    - Stats: "{total_games} juegos · {total_score} pts"
    - Botón "CERRAR SESIÓN" → `signOut()`
- Si es guest: mostrar badge "INVITADO" y link "CREAR CUENTA"

**Verificación:** El Nav muestra el usuario correctamente y el menú funciona.

---

### 12. Implementar save de scores en Supabase

**Archivos nuevos:**
- `lib/supabase/scores.ts` — Funciones utilitarias para scores

**Funciones:**

```typescript
// Guardar score
export async function saveScore(gameId: string, score: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('No authenticated')

  const { data, error } = await supabase
    .from('scores')
    .insert({ user_id: user.id, game_id: gameId, score })
    .select()
    .single()

  if (error) throw error
  return data
}

// Obtener leaderboard de un juego
export async function getLeaderboard(gameId: string, limit = 10): Promise<LeaderboardEntry[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('scores')
    .select(`
      score,
      created_at,
      profiles (
        username,
        avatar_url
      )
    `)
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) throw error

  // Formatear respuesta con rank
  return data.map((entry, index) => ({
    rank: index + 1,
    user_id: entry.user_id,
    username: entry.profiles?.username || 'UNKNOWN',
    avatar_url: entry.profiles?.avatar_url || null,
    score: entry.score,
    created_at: entry.created_at,
  }))
}

// Obtener actividad reciente global
export async function getRecentActivity(limit = 20): Promise<RecentActivity[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('scores')
    .select(`
      id,
      game_id,
      score,
      created_at,
      profiles (
        username
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error

  // Lookup de game_title y color desde GAMES array
  return data.map(entry => {
    const game = GAMES.find(g => g.id === entry.game_id)
    return {
      id: entry.id,
      username: entry.profiles?.username || 'UNKNOWN',
      game_id: entry.game_id,
      game_title: game?.title || entry.game_id,
      score: entry.score,
      created_at: entry.created_at,
      color: game?.color || 'cyan',
    }
  })
}

// Obtener top jugadores del día
export async function getTopPlayersToday(limit = 5) {
  const supabase = createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('scores')
    .select(`
      user_id,
      score,
      profiles (
        username,
        avatar_url
      )
    `)
    .gte('created_at', today.toISOString())
    .order('score', { ascending: false })
    .limit(limit)

  if (error) throw error

  return data.map((entry, index) => ({
    rank: index + 1,
    user_id: entry.user_id,
    username: entry.profiles?.username || 'UNKNOWN',
    avatar_url: entry.profiles?.avatar_url || null,
    score: entry.score,
  }))
}
```

**Archivos modificados:**
- Componentes de juego (`app/juego/[id]/jugar/page.tsx` o similar) — Llamar a `saveScore()` al terminar partida

**Verificación:** Los scores se guardan en Supabase cuando se completa un juego.

---

### 13. Actualizar página /salon (leaderboard) para leer de Supabase

**Archivos modificados:**
- `app/salon/page.tsx` — Reemplazar datos mock con `getLeaderboard()`

**Cambios:**
- Usar `useEffect` para fetch del leaderboard (o Server Component con async fetch)
- Filtrar por juego si hay query param `?game=bloque-buster`
- Mostrar loading state mientras carga
- Renderizar leaderboard con datos reales (username, avatar, score)

**Verificación:** El leaderboard muestra scores reales desde Supabase.

---

### 14. Implementar Realtime subscription para scores

**Archivos modificados:**
- `app/salon/page.tsx` — Agregar subscription a INSERT en tabla scores

**Lógica:**

```typescript
useEffect(() => {
  const supabase = createClient()
  
  const channel = supabase
    .channel('scores-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'scores'
      },
      (payload) => {
        // Refetch leaderboard o agregar nuevo score a la lista
        console.log('Nuevo score:', payload.new)
        fetchLeaderboard() // Re-fetch
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [gameId])
```

**Verificación:** Al insertar un score desde otra pestaña, el leaderboard se actualiza en vivo.

---

### 15. Actualizar Home para usar datos reales

**Archivos modificados:**
- `app/page.tsx` — Reemplazar `generateRecentActivity` y `generateTopPlayers` con queries reales

**Cambios:**
- Importar `getRecentActivity()` y `getTopPlayersToday()` de `lib/supabase/scores`
- Llamar las funciones en `useEffect` (o Server Component con async)
- Renderizar actividad en vivo y top jugadores con datos reales
- Mostrar placeholders si no hay datos (ej: "Sé el primero en jugar hoy")

**Verificación:** El Home muestra actividad real desde Supabase.

---

### 16. Crear función para seed de datos de prueba (opcional)

**Archivos nuevos:**
- `scripts/seed-supabase.ts` — Script para crear usuarios y scores de prueba

**Contenido:**

```typescript
// Script para desarrollo local
// Ejecutar con: npx tsx scripts/seed-supabase.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role bypassa RLS
)

async function seed() {
  // Crear usuarios de prueba
  const users = [
    { email: 'neonfox@test.com', username: 'NEONFOX' },
    { email: 'pxkai@test.com', username: 'PX_KAI' },
    { email: 'z3r0cool@test.com', username: 'Z3R0COOL' },
  ]

  for (const user of users) {
    const { data: authData } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'test1234',
      email_confirm: true,
    })

    if (authData.user) {
      await supabase.from('profiles').insert({
        id: authData.user.id,
        username: user.username,
      })

      // Crear scores aleatorios
      for (let i = 0; i < 5; i++) {
        await supabase.from('scores').insert({
          user_id: authData.user.id,
          game_id: ['bloque-buster', 'caida', 'serpentina'][i % 3],
          score: Math.floor(Math.random() * 100000),
        })
      }
    }
  }

  console.log('✅ Seed completado')
}

seed()
```

**Verificación:** Ejecutar el script crea usuarios y scores de prueba en Supabase.

---

### 17. Testing manual completo

**Escenarios de prueba:**

1. **Signup con Email/Password**:
   - Ir a `/auth`
   - Tab "CREAR CUENTA"
   - Llenar: username (ej: "TESTUSER"), email, password
   - Submit → Debe crear usuario en auth.users y profile en profiles
   - Redirigir a `/biblioteca`
   - Nav debe mostrar avatar + username

2. **Login con Email/Password**:
   - Logout
   - Ir a `/auth`
   - Tab "INICIAR SESIÓN"
   - Llenar email + password del usuario creado
   - Submit → Debe iniciar sesión y redirigir a `/biblioteca`

3. **Magic Link**:
   - Logout
   - Ir a `/auth`
   - Cambiar a modo "Magic Link" (si se implementa como tab o radio)
   - Ingresar email
   - Submit → Debe enviar email con magic link
   - Abrir email y hacer click → Callback a `/api/auth/callback?code=xxx` → Redirigir a `/biblioteca`

4. **Guest Mode**:
   - Logout
   - Ir a `/auth`
   - Click "JUGAR COMO INVITADO"
   - Debe crear sesión anónima
   - Redirigir a `/biblioteca`
   - Nav debe mostrar badge "INVITADO"
   - Al jugar, NO debe poder guardar scores (o guardarlos como anónimos y perderlos al cerrar sesión)

5. **Editar perfil**:
   - Login como usuario autenticado
   - Ir a `/perfil`
   - Cambiar username, bio
   - Subir avatar (imagen < 2MB)
   - Click "GUARDAR CAMBIOS"
   - Verificar que los cambios se reflejan en Nav y en Supabase

6. **Guardar score**:
   - Jugar un juego completo (ej: Bloque Buster)
   - Al terminar, debe guardar score en Supabase
   - Verificar en Supabase Dashboard que el score existe en tabla `scores`
   - Stats del perfil deben actualizarse (total_games +1, total_score +score)

7. **Leaderboard**:
   - Ir a `/salon`
   - Debe mostrar top scores de todos los juegos (o filtrar por juego si hay selector)
   - Scores deben estar ordenados de mayor a menor
   - Mostrar username + avatar + score

8. **Realtime**:
   - Abrir `/salon` en dos pestañas
   - En pestaña A, jugar y guardar un score
   - En pestaña B, el leaderboard debe actualizarse automáticamente sin refrescar

9. **Home con datos reales**:
   - Ir a `/`
   - Sección "ACTIVIDAD EN VIVO" debe mostrar scores reales de Supabase
   - Si no hay scores, mostrar placeholder
   - Top jugadores del día debe mostrar datos reales

10. **Logout**:
    - Click en UserMenu → "CERRAR SESIÓN"
    - Debe cerrar sesión y redirigir a `/`
    - Nav debe volver a mostrar botón "INICIAR SESIÓN"

11. **Protección de rutas**:
    - Sin sesión, intentar acceder a `/perfil` → Debe redirigir a `/auth`
    - Con sesión guest, intentar acceder a `/perfil` → Debe mostrar mensaje "Crea una cuenta para acceder a tu perfil"

12. **RLS**:
    - Desde browser console:
      ```js
      // Intentar editar perfil de otro usuario (debe fallar)
      await supabase.from('profiles').update({ bio: 'HACKED' }).eq('id', 'otro-user-id')
      // Debe devolver error o 0 rows affected
      ```

**Verificación final:**

- ✅ Signup, login, magic link y guest mode funcionan
- ✅ Perfiles se crean y editan correctamente
- ✅ Avatares se suben a Storage
- ✅ Scores se guardan en Supabase
- ✅ Leaderboard muestra datos reales ordenados
- ✅ Realtime actualiza rankings en vivo
- ✅ Home muestra actividad real
- ✅ Nav muestra usuario logueado
- ✅ RLS protege datos correctamente
- ✅ No hay errores en consola
- ✅ No hay errores de TypeScript (`npm run build` pasa)

---

## Criterios de aceptación

- [ ] Supabase está configurado:
  - `@supabase/ssr` y `@supabase/supabase-js` instalados
  - Variables de entorno en `.env.local` (URL, anon key, service role key)
  - `.env.example` actualizado con template de Supabase
  - Utilities `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts` creados
  - Middleware `middleware.ts` intercepta requests y refresca sesiones

- [ ] Schema de PostgreSQL creado:
  - Tabla `profiles` con campos: id, username, avatar_url, bio, total_games, total_score, created_at, updated_at
  - Tabla `scores` con campos: id, user_id, game_id, score, created_at
  - Índices en columnas frecuentes (user_id, game_id, created_at, score)
  - Trigger `update_updated_at` en profiles
  - Trigger `update_profile_stats` en scores (actualiza total_games y total_score automáticamente)

- [ ] Row Level Security (RLS) configurado:
  - RLS habilitado en `profiles` y `scores`
  - Policy: todos pueden leer profiles
  - Policy: solo el owner puede crear/editar/eliminar su profile
  - Policy: todos pueden leer scores
  - Policy: solo el owner puede crear scores propios
  - Policy: scores son inmutables (no se pueden editar)

- [ ] Storage configurado:
  - Bucket `avatars` creado como público
  - Allowed MIME types: image/jpeg, image/png, image/webp
  - Max file size: 2MB
  - RLS en Storage: solo el owner puede subir en `{user_id}/avatar.*`

- [ ] Tipos TypeScript actualizados:
  - `AuthUser` reemplaza a `User` (id, email, is_anonymous)
  - `Profile` agregado (todos los campos de tabla profiles)
  - `Score` actualizado (todos los campos de tabla scores + joins opcionales)
  - `LeaderboardEntry` actualizado (rank, username, avatar_url, score, created_at)
  - `RecentActivity` agregado (username, game_id, game_title, score, created_at, color)

- [ ] Hook `useAuth()` funciona:
  - Retorna `user`, `profile`, `loading`, `signOut`, `isAuthenticated`, `isGuest`
  - Se suscribe a cambios de auth (`onAuthStateChange`)
  - Fetch de profile automático cuando hay sesión
  - Se puede usar en client components

- [ ] Route Handlers funcionan:
  - `/api/auth/callback` maneja código de magic link y OAuth
  - `/api/auth/signout` cierra sesión server-side
  - Redirigen correctamente después de operaciones

- [ ] AuthForm refactorizado:
  - Mantiene UI actual (tabs, campos, botones)
  - Signup con email/password crea usuario en auth.users + profile en profiles
  - Login con email/password inicia sesión correctamente
  - Magic link envía email con link temporal
  - Guest mode crea sesión anónima
  - OAuth buttons (Google, GitHub) están preparados pero disabled
  - Muestra loading state durante operaciones
  - Muestra errores traducidos si falla
  - Redirige a `/biblioteca` en éxito

- [ ] Página `/perfil` funciona:
  - Requiere autenticación (redirige a `/auth` si no hay sesión)
  - Muestra avatar, username, bio, stats (total_games, total_score)
  - Permite editar username, bio
  - Permite subir avatar con preview y validación (< 2MB)
  - Botón "GUARDAR CAMBIOS" actualiza profile en Supabase
  - Avatar se sube a Storage en `avatars/{user_id}/avatar.*`
  - Cambios se reflejan en Nav después de guardar

- [ ] Nav muestra usuario logueado:
  - Si `isAuthenticated || isGuest`: muestra `<UserMenu />`
  - UserMenu muestra avatar circular + username
  - Dropdown con: link a /perfil, stats, botón "CERRAR SESIÓN"
  - Si es guest: badge "INVITADO" + link "CREAR CUENTA"
  - Botón logout llama a `signOut()` y redirige a `/`

- [ ] Sistema de scores integrado:
  - Función `saveScore(gameId, score)` guarda en tabla `scores`
  - Trigger actualiza `total_games` y `total_score` del perfil automáticamente
  - Componentes de juego llaman a `saveScore()` al terminar partida
  - Función `getLeaderboard(gameId, limit)` retorna top scores del juego
  - Función `getRecentActivity(limit)` retorna últimos scores globales
  - Función `getTopPlayersToday(limit)` retorna top jugadores del día

- [ ] Página `/salon` (leaderboard) actualizada:
  - Lee datos reales con `getLeaderboard()` en lugar de mock
  - Muestra username, avatar, score ordenados de mayor a menor
  - Permite filtrar por juego (query param `?game=xxx` o selector)
  - Muestra loading state mientras carga

- [ ] Realtime funciona:
  - Subscription a INSERT en tabla `scores` en página `/salon`
  - Cuando se inserta un nuevo score, el leaderboard se actualiza en vivo
  - No requiere refrescar la página

- [ ] Home usa datos reales:
  - Sección "ACTIVIDAD EN VIVO" llama a `getRecentActivity()`
  - Sección "TOP JUGADORES · HOY" llama a `getTopPlayersToday()`
  - Muestra placeholders si no hay datos ("Sé el primero en jugar")
  - Lookup de game_title y color desde GAMES array

- [ ] Protección de rutas:
  - `/perfil` redirige a `/auth` si no hay sesión
  - Guest mode puede jugar pero no puede acceder a `/perfil`
  - Middleware refresca sesiones automáticamente

- [ ] RLS protege datos:
  - Usuarios solo pueden editar su propio perfil
  - Usuarios solo pueden crear scores propios
  - Intentar editar profile de otro usuario desde console falla

- [ ] Calidad del código:
  - No hay errores de TypeScript (`npm run build` pasa)
  - No hay errores en consola del navegador
  - Loading states en todas las operaciones async
  - Errores de Supabase se manejan y traducen
  - Código sigue convenciones del proyecto (naming, estructura)

- [ ] Documentación:
  - `.env.example` tiene todas las variables de Supabase
  - Migration SQL está documentada con comentarios
  - Script de seed opcional funciona
  - CLAUDE.md actualizado con info de Supabase si es necesario

---

## Decisiones tomadas

1. **Una sola spec grande en lugar de dividir**: Se decidió implementar toda la integración de Supabase en una sola spec porque el usuario tiene experiencia previa y prefiere tener todo conectado desde el principio. Esto permite probar el flujo completo end-to-end sin dependencias entre specs.

2. **Mantener juegos en código (no crear tabla games)**: Los 8 juegos actuales se mantienen en `lib/data.ts` como datos estáticos. Supabase solo maneja users y scores. Razón: los juegos no cambian dinámicamente y mantenerlos en código simplifica el schema. Los scores referencian `game_id` como string que matchea con el `id` del array GAMES.

3. **Row Level Security desde el principio**: Se implementa RLS completo en lugar de dejarlo para después. Razón: es más fácil desarrollar con seguridad desde el inicio que agregar RLS a tablas con datos existentes. También previene bugs de seguridad en desarrollo.

4. **Separar auth de perfil (auth.users + profiles)**: Supabase Auth maneja `auth.users` (email, password, sesión) y nosotros manejamos `profiles` (username, avatar, bio, stats). Razón: separación de responsabilidades. Auth es manejado por Supabase, datos de usuario por nosotros.

5. **Trigger automático para actualizar stats**: En lugar de actualizar `total_games` y `total_score` desde el cliente, un trigger de PostgreSQL lo hace automáticamente al insertar un score. Razón: garantiza consistencia de datos. El cliente no puede "mentir" sobre sus stats.

6. **Guest mode con sesión anónima de Supabase**: En lugar de permitir jugar sin sesión, se usa `signInAnonymously()` de Supabase. Razón: permite guardar scores temporales y mantener consistencia en el código (siempre hay un `user_id`). Los scores de guest se pierden al cerrar sesión.

7. **Mantener UI actual de AuthForm**: Se refactoriza solo la lógica manteniendo la UI existente. Razón: la UI ya es hermosa y sigue la estética arcade. No tiene sentido rediseñarla. Solo se cambia la lógica interna para conectar con Supabase.

8. **Magic Link como método adicional de auth**: Se implementa magic link además de email/password. Razón: muchos usuarios prefieren no recordar contraseñas. Magic link es más seguro (no hay contraseña que robar) y más conveniente.

9. **Storage público con RLS en paths**: El bucket `avatars` es público (cualquiera puede leer) pero RLS protege la escritura (solo el owner puede subir en su carpeta). Razón: los avatares deben ser visibles por todos (para mostrar en rankings) pero solo el owner debe poder cambiarlos.

10. **Realtime solo para scores, no para presencia**: Se implementa Realtime subscription a INSERT en scores pero no se implementa presencia (quién está online, quién está jugando qué). Razón: presencia requiere lógica adicional de heartbeat y cleanup. Se difiere a spec posterior si es necesario.

11. **Middleware universal para refrescar sesiones**: Se usa middleware de Next.js en lugar de refrescar sesiones manualmente en cada componente. Razón: garantiza que todas las requests tengan sesión fresca. Previene bugs de "sesión expirada" en medio de la navegación.

12. **Service role key solo en server-side**: La service role key (que bypassa RLS) solo se usa en scripts de seed y nunca se expone al cliente. Razón: seguridad crítica. Si la service role key se filtra, cualquiera puede hacer cualquier cosa en la base de datos.

13. **Username único y obligatorio**: Cada usuario debe tener un username único (3-20 chars). Razón: necesario para mostrar en rankings. Si se permitiera duplicados o usernames vacíos, los rankings serían confusos.

14. **Avatar opcional con placeholder por defecto**: Si el usuario no sube avatar, se usa un placeholder generado (ej: iniciales, gradient, o imagen por defecto). Razón: mejora la experiencia visual sin forzar al usuario a subir una imagen.

15. **Scores inmutables (no se pueden editar)**: Una vez insertado un score, no se puede modificar. Solo se puede eliminar (por el owner). Razón: integridad de datos. Evita que usuarios "corrijan" sus scores después. Si hay un bug, se elimina y se crea uno nuevo.

16. **No migrar scores de localStorage automáticamente**: Los scores guardados en localStorage no se migran a Supabase. El usuario empieza de cero. Razón: localStorage puede contener scores fake o manipulados. Es más limpio empezar de cero con scores verificados.

17. **Tipos TypeScript actualizados para matchear Supabase**: Los tipos de `types/index.ts` se actualizan para incluir todos los campos de las tablas de Supabase. Razón: consistencia entre frontend y backend. TypeScript valida que usemos los campos correctos.

18. **Hook `useAuth()` en lugar de Context**: Se crea un hook personalizado en lugar de usar Context API. Razón: más simple para este caso de uso. Si en el futuro se necesita compartir estado de auth en muchos niveles, se puede migrar a Context.

19. **Home sigue en client-side con useEffect**: Aunque Next.js App Router prefiere Server Components, el Home sigue siendo Client Component porque usa Realtime y animaciones. Razón: Realtime subscriptions solo funcionan en client. Mantener Home como "use client" simplifica la implementación.

20. **Script de seed opcional**: Se incluye un script de seed para crear usuarios y scores de prueba pero es opcional. Razón: útil para development pero no necesario para producción. El usuario puede ejecutarlo si quiere poblar la DB rápidamente.

---

## Decisiones descartadas

1. **Crear tabla `games` en Supabase**: Descartado porque los juegos son datos estáticos que no cambian. Mantenerlos en código (`lib/data.ts`) es más simple y no requiere queries adicionales. Si en el futuro se quiere un CMS para agregar juegos, se puede migrar.

2. **OAuth configurado y funcional**: Se descartó configurar completamente OAuth (Google, GitHub) porque requiere crear OAuth apps en cada proveedor y configurar callbacks. Se deja preparado (botones en UI, lógica lista) pero disabled hasta que el usuario configure las apps en Supabase Dashboard.

3. **Rediseñar AuthForm para incluir más campos**: Se descartó agregar campos adicionales (username, avatar, bio) en el signup inicial. Razón: el signup debe ser rápido (solo email + password). Los datos adicionales se completan en `/perfil` después del primer login.

4. **Migración automática de scores de localStorage**: Se descartó leer `localStorage` al crear cuenta y migrar scores viejos. Razón: los scores de localStorage no tienen verificación y pueden ser manipulados. Es más limpio empezar de cero en Supabase con scores verificados.

5. **Página pública de perfil (`/usuario/[username]`)**: Se descartó crear perfiles públicos donde otros usuarios pueden ver tus stats y scores. Razón: fuera del alcance de esta spec. Solo se implementa `/perfil` (perfil propio). Los perfiles públicos se pueden agregar en spec posterior si es necesario.

6. **Sistema de amigos o seguidores**: Se descartó implementar relaciones entre usuarios (seguir, amigos, mensajes). Razón: complejidad alta y fuera del alcance MVP. Se puede agregar en spec posterior si se quiere social features.

7. **Achievements o badges**: Se descartó crear sistema de logros (ej: "Juega 10 partidas", "Logra 100k puntos"). Razón: requiere lógica adicional de tracking y tabla de achievements. Se puede agregar en spec posterior.

8. **Verificación de email obligatoria**: Se descartó forzar verificación de email antes de poder jugar. Razón: fricción innecesaria para un arcade casual. Si el usuario quiere jugar inmediatamente, debe poder hacerlo. La verificación de email queda opcional (Supabase la ofrece pero no la forzamos).

9. **Rate limiting para prevenir spam de scores**: Se descartó implementar rate limiting (ej: máximo 10 scores por minuto). Razón: complejidad adicional y no hay evidencia de que sea necesario en MVP. Si hay problemas de spam, se puede agregar después con Supabase Edge Functions.

10. **Soft delete de usuarios**: Se descartó implementar eliminación suave (marcar usuario como deleted en lugar de borrarlo). Razón: Supabase Auth maneja la eliminación de usuarios y no soporta soft delete out-of-the-box. Hard delete es suficiente para MVP.

11. **Historial completo de scores por usuario**: Se descartó guardar y mostrar todos los scores de un usuario. Razón: puede ser mucha data si el usuario juega mucho. Solo se muestran high scores (mejores scores por juego). El historial completo se puede agregar después si es necesario.

12. **Notificaciones push**: Se descartó implementar notificaciones web push (ej: "Alguien superó tu high score"). Razón: requiere service worker y lógica adicional de subscripciones. Se puede agregar en spec posterior.

13. **Panel de administración**: Se descartó crear un admin panel para moderar usuarios, eliminar scores sospechosos, etc. Razón: se puede hacer manualmente desde Supabase Dashboard. Si se necesita un admin panel customizado, se puede crear en spec posterior.

14. **Analytics detallados**: Se descartó implementar analytics con Supabase Analytics o herramienta externa (ej: Plausible). Razón: fuera del alcance MVP. Si se quiere trackear eventos (qué juegos son más populares, etc.), se puede agregar después.

15. **Migración de schema con herramienta CLI**: Se descartó usar Supabase CLI para gestionar migraciones con versionado. Razón: para una sola migration inicial, es más simple ejecutarla manualmente desde SQL Editor. Si el proyecto crece y hay muchas migrations, se puede migrar a CLI.

16. **Tests automatizados**: Se descartó escribir tests unitarios o de integración para las funciones de Supabase. Razón: fuera del alcance de esta spec. Los tests se pueden agregar en spec posterior si se quiere mejorar la cobertura.

17. **Caché de queries con React Query**: Se descartó usar React Query para cachear queries de Supabase. Razón: Supabase tiene su propio sistema de cache y para MVP los refetchs simples son suficientes. Si hay problemas de performance, se puede agregar React Query después.

---

## Riesgos identificados

1. **Sesión expirada en medio de una partida**: Si la sesión de Supabase expira mientras el usuario juega, el score no se podrá guardar. **Mitigación**: El middleware refresca sesiones automáticamente en cada request. Para partidas largas (>1 hora), considerar refrescar sesión manualmente desde el componente de juego.

2. **Username duplicado en signup race condition**: Si dos usuarios intentan crear cuenta con el mismo username al mismo tiempo, uno fallará. **Mitigación**: El constraint UNIQUE en la columna `username` de PostgreSQL previene duplicados. Mostrar error claro: "Username ya existe, elige otro".

3. **Avatar upload falla pero el form se submite**: Si el upload del avatar falla (red, tamaño, formato), pero el formulario actualiza el profile, el usuario puede quedar sin avatar. **Mitigación**: Validar avatar ANTES de actualizar profile. Si el upload falla, no actualizar profile y mostrar error.

4. **Scores manipulados desde cliente**: Un usuario técnico puede abrir DevTools y llamar a `saveScore()` con valores fake desde la consola. **Mitigación parcial**: RLS valida que `user_id` sea el correcto, pero no valida si el `score` es legítimo. Para prevenir completamente, se necesitaría lógica server-side de validación (ej: Edge Function que valide scores antes de insertar). Se difiere a spec posterior.

5. **Realtime subscription no se limpia correctamente**: Si el componente que suscribe a Realtime se desmonta sin hacer cleanup, puede causar memory leaks. **Mitigación**: Usar `return () => supabase.removeChannel(channel)` en el cleanup de `useEffect`. Verificar en React DevTools que no haya subscriptions colgadas.

6. **Storage bucket lleno**: Si muchos usuarios suben avatares, el bucket puede llenarse (límite del plan gratuito de Supabase). **Mitigación**: Monitorear uso de Storage en Supabase Dashboard. Considerar comprimir imágenes en cliente antes de subir (ej: con `browser-image-compression`). Límite de 2MB por avatar ayuda a controlar esto.

7. **Rate limit de Supabase en plan gratuito**: El plan gratuito de Supabase tiene límites de requests/segundo. Si hay mucho tráfico, pueden fallar requests. **Mitigación**: Implementar retry logic con exponential backoff. Monitorear uso en Supabase Dashboard. Considerar upgrade a plan Pro si es necesario.

8. **Magic link puede ir a spam**: Los emails de magic link pueden ser filtrados como spam por algunos proveedores (Gmail, Outlook). **Mitigación**: Configurar SPF y DKIM en Supabase Dashboard (en Email settings). Agregar mensaje en UI: "Si no ves el email, revisa tu carpeta de spam".

9. **Guest mode permite spam de scores**: Usuarios guest pueden crear sesiones anónimas ilimitadas y spamear scores. **Mitigación parcial**: Los scores de guest se pierden al cerrar sesión, así que no afectan leaderboards a largo plazo. Si hay problemas, agregar rate limiting por IP (requiere Edge Function).

10. **Migraciones futuras pueden romper RLS policies**: Si se cambia el schema en el futuro (ej: renombrar tabla, agregar columna), las policies de RLS pueden quedar inválidas. **Mitigación**: Probar RLS después de cada migration. Usar Supabase CLI para gestionar migrations con rollback si es necesario.

11. **Trigger `update_profile_stats` puede causar deadlock**: Si dos scores se insertan al mismo tiempo para el mismo usuario, ambos intentarán actualizar el profile y pueden causar deadlock. **Mitigación**: PostgreSQL maneja deadlocks automáticamente con retry. No debería ser un problema en práctica porque los scores se insertan rápido.

12. **Error de CORS en desarrollo local**: Si se llama a Supabase desde `localhost` en lugar de `127.0.0.1`, puede haber problemas de CORS. **Mitigación**: Configurar allowed origins en Supabase Dashboard (Authentication > URL Configuration > Site URL). Agregar `http://localhost:3000` a la lista.

13. **Service role key filtrada en código**: Si por error se commitea `.env.local` con la service role key, cualquiera con acceso al repo puede hacer cualquier cosa en la DB. **Mitigación crítica**: Verificar que `.env.local` está en `.gitignore`. Usar `git-secrets` o GitHub Advanced Security para detectar secrets en commits. Si se filtra, regenerar la key inmediatamente desde Supabase Dashboard.

14. **Pérdida de datos si se elimina usuario de Supabase Dashboard**: Si un admin elimina un usuario desde Supabase Dashboard, el CASCADE borrará el profile y todos los scores del usuario. **Mitigación**: Educar a admins sobre CASCADE. Si se quiere preservar scores anónimamente, cambiar la foreign key a `ON DELETE SET NULL` y manejar users null en queries (mostrar como "Usuario eliminado").

15. **Query lenta en leaderboard si hay muchos scores**: Si hay millones de scores, `ORDER BY score DESC LIMIT 10` puede ser lento sin índices adecuados. **Mitigación**: Ya se creó índice `idx_scores_game_score` (game_id, score DESC) que optimiza esta query. Monitorear performance en Supabase Dashboard (Database > Query Performance).

---

**FIN DE SPEC 03**
