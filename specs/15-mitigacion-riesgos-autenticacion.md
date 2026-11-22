# 15 — MITIGACIÓN DE RIESGOS DE AUTENTICACIÓN

**Estado:** Approved  
**Depende de:** SPEC 14 (Medidas de Seguridad Básicas)  
**Fecha:** 2026-11-22

**Objetivo:** Mitigar 4 riesgos específicos de autenticación: guest scores no persistentes, username sin validación, CSRF en callback handler, y scopes del anon key sin documentación.

---

## Alcance

### Incluido

1. **Guest scores persistentes en localStorage** — Scores de usuarios no autenticados se guardan localmente con prefijo `guest-` y se vinculan al auth cuando el usuario se registra después.

2. **Validación de username** — Regex simple (alfanuméricos + guiones/underscores) en frontend + backend para prevenir inyecciones.

3. **Verificación CSRF en `/api/auth/callback`** — Agregar validación de `state` token antes de procesar callback de OAuth.

4. **Documentación de scopes del anon key** — Crear referencia clara de qué puede y no puede hacer una solicitud con anon key.

### NO incluido

- Cambios en políticas RLS (ya cubierto en SPEC 14)
- 2FA/MFA (spec futura)
- CSP headers (spec futura)

---

## Modelo de datos

### localStorage para guest scores

```typescript
// Clave: guest-{game-id}
localStorage.setItem('guest-tetris-scores', JSON.stringify({
  scores: [
    { id: 'uuid', score: 1500, timestamp: 1700000000 },
  ],
  synced: false, // Flag para vinculación post-signup
}))
```

### Validación username

```typescript
// Formato: 3-20 caracteres, solo alfanuméricos + guiones/underscores
// Regex: ^[a-zA-Z0-9_-]{3,20}$
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/
```

---

## Plan de implementación

### 1. Persistencia de guest scores en localStorage

**Archivos modificados:**
- `lib/supabase/scores.ts` (crear si no existe)
- `components/games/GamePlayer.tsx`

**Cambios:**

Crear `lib/supabase/scores.ts`:
```typescript
export function saveGuestScore(gameId: string, score: number) {
  const key = `guest-${gameId}-scores`
  const existing = JSON.parse(localStorage.getItem(key) || '{"scores":[]}')
  existing.scores.push({ id: crypto.randomUUID(), score, timestamp: Date.now() })
  localStorage.setItem(key, JSON.stringify(existing))
}

export function getGuestScores(gameId: string) {
  const key = `guest-${gameId}-scores`
  return JSON.parse(localStorage.getItem(key) || '{"scores":[]}').scores
}
```

En `GamePlayer.tsx`, cuando se termina juego sin auth:
```typescript
if (!session?.user) {
  saveGuestScore(gameId, finalScore)
}
```

**Verificación:**
- [ ] Guest score se guarda en localStorage
- [ ] Nombre clave es consistente: `guest-{game-id}-scores`
- [ ] Logout no borra guest scores
- [ ] Login posterior puede sincronizar scores

---

### 2. Validación de username

**Archivos modificados:**
- `components/auth/AuthForm.tsx`
- `app/api/auth/validate-username/route.ts` (crear)

**Cambios:**

Actualizar `AuthForm.tsx` en signup:
```typescript
const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

if (!USERNAME_REGEX.test(username)) {
  setError('Username: 3-20 caracteres, solo letras, números, guiones y underscores')
  return
}
```

Crear endpoint `app/api/auth/validate-username/route.ts`:
```typescript
import { supabase } from '@/lib/supabase/client'

export async function POST(req: Request) {
  const { username } = await req.json()
  const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/

  if (!USERNAME_REGEX.test(username)) {
    return Response.json({ valid: false, error: 'Formato inválido' }, { status: 400 })
  }

  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single()

  return Response.json({ valid: !data })
}
```

**Verificación:**
- [ ] Username con caracteres especiales (!, @, #) rechazado
- [ ] Username con 2 caracteres rechazado
- [ ] Username con 21 caracteres rechazado
- [ ] Username con 3-20 alfanuméricos/guiones/underscores aceptado
- [ ] Endpoint `/api/auth/validate-username` rechaza formato inválido
- [ ] Endpoint rechaza username ya existente

---

### 3. Validación CSRF en callback handler

**Archivos modificados:**
- `app/api/auth/callback/route.ts`

**Cambios:**

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // Validar que state no es vacío (CSRF check básico)
  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 })
  }

  const supabase = createRouteHandlerClient({ cookies: () => cookies() })

  try {
    await supabase.auth.exchangeCodeForSession(code)
    return NextResponse.redirect(new URL('/biblioteca', request.url))
  } catch (error) {
    return new Response('Auth error', { status: 500 })
  }
}
```

**Verificación:**
- [ ] Callback sin `code` parameter rechazado
- [ ] Callback sin `state` parameter rechazado
- [ ] Callback válido funciona
- [ ] User redirigido a `/biblioteca` post-auth

---

### 4. Documentación de scopes del anon key

**Archivos nuevos:**
- `references/supabase-anon-key-permissions.md`

**Contenido:**

```markdown
# Anon Key Permissions

El `NEXT_PUBLIC_SUPABASE_ANON_KEY` tiene permisos limitados por RLS.

## Permitido (público)
- Lectura de `games` (SELECT)
- Lectura de `profiles` (SELECT)
- Lectura de `scores` (SELECT)
- Inserción de scores propios (INSERT en `scores` con guest user_id)

## NO permitido
- Insertar/actualizar/eliminar en `games`
- Actualizar perfiles ajenos
- Eliminar scores ajenos
- Acceder a tablas de admin

## Verificación en Supabase
1. Auth → Policies
2. Verificar que cada tabla tiene RLS enabled
3. Verificar que políticas solo permiten operaciones anunciadas
```

**Verificación:**
- [ ] Documento creado y legible
- [ ] Listadas permisos permitidos
- [ ] Listadas operaciones bloqueadas
- [ ] Pasos de verificación claros

---

## Criterios de aceptación

- [ ] Guest scores persisten en localStorage con clave `guest-{game-id}-scores`
- [ ] Username rechaza caracteres especiales en frontend + backend
- [ ] Username rechaza longitud < 3 o > 20
- [ ] Endpoint `/api/auth/validate-username` verifica formato y existencia
- [ ] Callback `/api/auth/callback` rechaza requests sin `code` o `state`
- [ ] Documento `supabase-anon-key-permissions.md` existe y es completo
- [ ] TypeScript compila sin errores
- [ ] Sign up con username inválido falla con mensaje claro
- [ ] Sign up con username válido funciona

---

## Decisiones tomadas

1. **localStorage para guest scores** — Simple y no requiere backend. Sincronización post-signup es futura.

2. **Regex simple para username** — Alfanuméricos + guiones/underscores. Cubre 95% de casos sin frustrar usuarios.

3. **Validación en frontend + backend** — Frontend para UX rápido, backend para seguridad.

4. **CSRF check mínimo en callback** — Verificar presencia de `state`. Supabase valida internamente.

5. **Documentación en reference** — No es código, no es spec, es guía de arquitectura.

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| **localStorage limitado (5-10MB)** | Límite de scores por juego. Si se alcanza, borrar más antiguos. |
| **Username regex bloquea nombres válidos** | Regex es conservadora. Usuarios pueden usar guiones/underscores. |
| **CSRF check insuficiente** | Supabase ya valida `state` internamente. Este es un check adicional. |
| **Anon key leaks en localStorage** | Inevitable. Mitigado con RLS. Anon key tiene permisos limitados. |

---

**FIN DE SPEC 15**
