# 14 — MEDIDAS DE SEGURIDAD BÁSICAS

**Estado:** Approved  
**Depende de:** SPEC 03 (Implementación Supabase), SPEC 12 (Mejoras Autenticación)  
**Fecha:** 2026-11-20

**Objetivo:** Implementar medidas de seguridad básicas incluyendo RLS en todas las tablas públicas, password length de 8 caracteres, rate limiting de signups, security headers en Next.js, y fixes de funciones con search_path mutable.

---

## Alcance

### Incluido en esta especificación

- **Row Level Security (RLS)**
  - Habilitar RLS en tabla `games` (actualmente deshabilitado - ERROR crítico)
  - Crear políticas de lectura pública y escritura protegida para `games`
  - Verificar y documentar políticas existentes en `profiles` y `scores`
  
- **Password length: 8 caracteres mínimo**
  - Cambiar validación en `AuthForm.tsx` de 6 a 8 caracteres
  - Actualizar configuración en Supabase Auth Dashboard
  - Actualizar mensajes de error y placeholders
  
- **Rate limiting para signups**
  - Configurar rate limiting en Supabase Auth Dashboard
  - Límite por IP para prevenir bots
  - Documentar configuración recomendada
  
- **Security headers en Next.js**
  - Agregar headers en `next.config.ts`:
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: strict-origin-when-cross-origin`
  - Aplicar globalmente a todas las rutas
  
- **Fix: Function Search Path Mutable**
  - Agregar `SET search_path = ''` a función `update_updated_at()`
  - Agregar `SET search_path = ''` a función `update_profile_stats()`
  - Prevenir ataques de SQL injection vía search_path

- **Proteccion de Rutas con Proxy Next.js**
  -  Info: - https://nextjs.org/docs/app/getting-started/proxy
Ejemplo 
```ts
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  // This function can be marked `async` if using `await` inside
  export function proxy(request: NextRequest) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  // Alternatively, you can use a default export:
  // export default function proxy(request: NextRequest) { ... }

  export const config = {
    matcher: '/about/:path*',
  }
```


### NO incluido (se difiere o se documenta como advertencia)

- **Leaked password protection** — Diferido para spec futura (requiere activación manual en dashboard)
- **Revisión de políticas de acceso anónimo** — Las políticas actuales en `profiles` y `scores` permiten acceso anónimo (guest mode), lo cual es intencional. Solo se documenta como advertencia, no se cambia.
- **Storage policies** — Tabla `storage.objects` tiene políticas anónimas, se mantiene como está para avatares públicos
- **2FA / MFA** — Autenticación de dos factores (spec futura)
- **Content Security Policy (CSP)** — Header más complejo, requiere configuración detallada (spec futura)
- **HTTPS Strict Transport Security (HSTS)** — Configuración de infraestructura, no de código
- **Rate limiting en otras rutas** — Solo signup, no endpoints de API o rutas públicas
- **Audit logging** — Logging de eventos de seguridad (spec futura)
- **Password expiration** — Forzar cambio de contraseña periódico (spec futura)

---

## Modelo de datos

### Cambios en tabla `games`

**Antes:**
```sql
-- RLS deshabilitado (cualquiera con anon key puede modificar)
ALTER TABLE "public"."games" DISABLE ROW LEVEL SECURITY;
```

**Después:**
```sql
-- RLS habilitado con políticas
ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura pública (todos pueden ver juegos)
CREATE POLICY "Games are viewable by everyone"
  ON public.games
  FOR SELECT
  TO public
  USING (true);

-- Política 2: Solo service_role puede insertar/actualizar/eliminar
-- (No se crea política para INSERT/UPDATE/DELETE, por lo que solo service_role puede hacerlo)
```

### Sin cambios en esquema de tablas

- No se agregan columnas nuevas
- No se modifican tipos de datos
- Solo se habilita RLS y se crean políticas

### Cambios en funciones SQL

**Función `update_updated_at`:**
```sql
-- ANTES (search_path mutable - WARN)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- DESPUÉS (search_path inmutable - FIX)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

**Función `update_profile_stats`:**
```sql
-- ANTES (search_path mutable - WARN)
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- lógica existente
END;
$$;

-- DESPUÉS (search_path inmutable - FIX)
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- lógica existente (sin cambios)
END;
$$;
```

### Configuración de Supabase Auth

**Password policies:**
```json
{
  "password": {
    "min_length": 8,
    "require_uppercase": false,
    "require_lowercase": false,
    "require_numbers": false,
    "require_special": false
  }
}
```

**Rate limiting:**
```json
{
  "rate_limits": {
    "anonymous_sign_ins": {
      "enabled": true,
      "interval": "1h",
      "max_requests": 3
    },
    "email_sign_ups": {
      "enabled": true,
      "interval": "1h",
      "max_requests": 10
    }
  }
}
```

---

## Plan de implementación

### 1. Habilitar RLS en tabla `games` y crear políticas

**Archivos modificados:**
- Ninguno (se ejecuta SQL directo en Supabase)

**SQL a ejecutar:**

```sql
-- 1. Habilitar RLS
ALTER TABLE "public"."games" ENABLE ROW LEVEL SECURITY;

-- 2. Crear política de lectura pública
CREATE POLICY "Games are viewable by everyone"
  ON public.games
  FOR SELECT
  TO public
  USING (true);

-- 3. Verificar que funciona
SELECT * FROM public.games; -- Debe funcionar con anon key

-- 4. Intentar insertar con anon key (debe fallar)
-- INSERT INTO public.games (id, title) VALUES ('test', 'Test'); -- ERROR esperado
```

**Verificación:**
- [ ] RLS habilitado en tabla `games`
- [ ] Lectura pública funciona (usuarios pueden ver juegos)
- [ ] Inserción/actualización/eliminación solo funciona con service_role key
- [ ] `mcp__supabase__get_advisors` no reporta error de RLS en `games`

---

### 2. Cambiar password length a 8 caracteres

**Archivos modificados:**
- `components/auth/AuthForm.tsx`
- `app/auth/reset/page.tsx`

**Cambios en `AuthForm.tsx`:**

Actualizar validaciones (línea ~135):
```typescript
// ❌ ANTES
if (password.length < 6) {
  setError('La contraseña debe tener al menos 6 caracteres.')
  return
}

// ✅ DESPUÉS
if (password.length < 8) {
  setError('La contraseña debe tener al menos 8 caracteres.')
  return
}
```

Actualizar atributos de inputs (línea ~175):
```tsx
{/* ❌ ANTES */}
<input
  type="password"
  minLength={6}
  placeholder="••••••"
/>

{/* ✅ DESPUÉS */}
<input
  type="password"
  minLength={8}
  placeholder="••••••••"
/>
```

**Cambios en `app/auth/reset/page.tsx`:**

Actualizar validación (línea ~415):
```typescript
// ❌ ANTES
if (password.length < 6) {
  setError('La contraseña debe tener al menos 6 caracteres.')
  return
}

// ✅ DESPUÉS
if (password.length < 8) {
  setError('La contraseña debe tener al menos 8 caracteres.')
  return
}
```

Actualizar atributos de inputs (línea ~496):
```tsx
{/* ❌ ANTES */}
<input
  type="password"
  minLength={6}
/>

{/* ✅ DESPUÉS */}
<input
  type="password"
  minLength={8}
/>
```

**Configuración en Supabase Dashboard:**

1. Ir a: **Authentication → Policies**
2. Sección: **Password Requirements**
3. Cambiar **Minimum Password Length** de `6` a `8`
4. Guardar cambios

**Verificación:**
- [ ] Validación en `AuthForm.tsx` requiere 8 caracteres
- [ ] Validación en `app/auth/reset/page.tsx` requiere 8 caracteres
- [ ] Inputs muestran placeholder de 8 caracteres
- [ ] Supabase Dashboard configurado con mínimo 8 caracteres
- [ ] Sign up con contraseña de 7 caracteres falla con mensaje claro
- [ ] Sign up con contraseña de 8+ caracteres funciona
- [ ] Reset de contraseña con < 8 caracteres falla
- [ ] Reset de contraseña con 8+ caracteres funciona

---

### 3. Configurar rate limiting para signups

**Archivos modificados:**
- Ninguno (configuración en Supabase Dashboard)

**Configuración en Supabase Dashboard:**

1. Ir a: **Authentication → Rate Limits**
2. Configurar **Anonymous Sign-ins:**
   - Habilitar: ✓
   - Intervalo: `1 hour`
   - Máximo de requests: `3`
3. Configurar **Email Sign-ups:**
   - Habilitar: ✓
   - Intervalo: `1 hour`
   - Máximo de requests: `10`
4. Guardar cambios

**Justificación de límites:**
- **Anonymous (Guest): 3/hora** — Usuarios legítimos no crean múltiples cuentas guest por hora. Bots quedan bloqueados.
- **Email: 10/hora** — Permite pruebas y correcciones de typos sin ser demasiado permisivo para bots.

**Manejo de errores en código:**

Agregar manejo de 429 en `AuthForm.tsx` (ya existe para reset password, verificar que también funciona para signup):

```typescript
try {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
} catch (err) {
  let message = 'Error al crear cuenta'
  if (err instanceof Error) {
    if (err.message.includes('rate limit') || err.message.includes('429')) {
      message = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
    } else {
      message = err.message
    }
  }
  setError(message)
}
```

**Verificación:**
- [ ] Rate limit configurado en Supabase Dashboard
- [ ] Intentar crear 4 cuentas guest desde misma IP → cuarta falla
- [ ] Intentar crear 11 cuentas email desde misma IP → undécima falla
- [ ] Error 429 se maneja con mensaje claro
- [ ] Después de 1 hora, rate limit se resetea

---

### 4. Agregar security headers en Next.js

**Archivos modificados:**
- `next.config.ts`

**Cambios:**

Agregar headers en la configuración:

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ... configuración existente ...
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

**Explicación de headers:**

- **`X-Content-Type-Options: nosniff`**
  - Previene MIME type sniffing
  - Browser respeta el Content-Type declarado
  - Mitiga ataques XSS vía file uploads
  
- **`X-Frame-Options: DENY`**
  - Previene clickjacking
  - La página no puede ser embebida en iframes
  - Protege contra ataques de UI redress
  
- **`Referrer-Policy: strict-origin-when-cross-origin`**
  - Envía origin completo en same-origin requests
  - Solo envía origin (sin path) en cross-origin requests
  - Balancea privacidad y funcionalidad

**Verificación:**
- [ ] Headers agregados en `next.config.ts`
- [ ] `npm run dev` inicia sin errores
- [ ] Verificar headers en DevTools Network → Response Headers
- [ ] Header `X-Content-Type-Options: nosniff` presente
- [ ] Header `X-Frame-Options: DENY` presente
- [ ] Header `Referrer-Policy: strict-origin-when-cross-origin` presente
- [ ] Intentar embeber la app en iframe → falla (bloqueado por X-Frame-Options)

---

### 5. Fix: Function Search Path Mutable

**Archivos modificados:**
- Ninguno (se ejecuta SQL directo en Supabase)

**SQL a ejecutar:**

```sql
-- 1. Recrear función update_updated_at con search_path inmutable
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2. Recrear función update_profile_stats con search_path inmutable
-- IMPORTANTE: Primero leer la función actual para preservar su lógica
-- Usar: SELECT pg_get_functiondef('public.update_profile_stats'::regproc);
-- Luego agregar SET search_path = '' a la definición existente

-- Ejemplo (ajustar según lógica real de la función):
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Lógica existente aquí (no modificar lógica, solo agregar SET search_path)
  UPDATE public.profiles
  SET 
    total_games = (SELECT COUNT(*) FROM public.scores WHERE user_id = NEW.user_id),
    total_score = (SELECT COALESCE(SUM(score), 0) FROM public.scores WHERE user_id = NEW.user_id)
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- 3. Verificar que funciona
-- Insertar un score para probar que el trigger funciona correctamente
INSERT INTO public.scores (user_id, game_id, score) 
VALUES ('user-id-existente', 'test-game', 100);
```

**Verificación:**
- [ ] Función `update_updated_at` tiene `SET search_path = ''`
- [ ] Función `update_profile_stats` tiene `SET search_path = ''`
- [ ] Triggers siguen funcionando correctamente
- [ ] Actualizar un perfil actualiza `updated_at` automáticamente
- [ ] Insertar un score actualiza `total_games` y `total_score` en perfil
- [ ] `mcp__supabase__get_advisors` no reporta warning de search_path mutable

---

### 6. Verificar y documentar políticas RLS existentes

**Archivos modificados:**
- Ninguno (solo documentación)

**Tabla `profiles` - Políticas existentes:**

```sql
-- 1. Lectura pública (incluyendo anónimos)
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  TO public
  USING (true);

-- 2. Actualización: solo propio perfil
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 3. Eliminación: solo propio perfil
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
```

**Tabla `scores` - Políticas existentes:**

```sql
-- 1. Lectura pública (incluyendo anónimos)
CREATE POLICY "Scores are viewable by everyone"
  ON public.scores
  FOR SELECT
  TO public
  USING (true);

-- 2. Inserción: usuarios autenticados
CREATE POLICY "Users can insert their own scores"
  ON public.scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Eliminación: solo propios scores
CREATE POLICY "Users can delete their own scores"
  ON public.scores
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

**Advertencias de Supabase sobre acceso anónimo:**

- **Profiles:** Políticas permiten lectura/actualización/eliminación a usuarios anónimos
- **Scores:** Políticas permiten lectura/eliminación a usuarios anónimos

**Decisión:** Mantener como está. El acceso anónimo es intencional para Guest Mode. Los usuarios guest pueden:
- Ver perfiles y scores de otros (lectura pública)
- Ver sus propios scores temporales
- Al cerrar sesión, los scores persisten vinculados a su user_id

**No se requieren cambios.** Solo documentar que este warning es esperado.

**Verificación:**
- [ ] Políticas en `profiles` verificadas
- [ ] Políticas en `scores` verificadas
- [ ] Advertencias de acceso anónimo son esperadas (no críticas)
- [ ] Guest mode funciona correctamente con RLS habilitado

---

### 7. Proteccion de Rutas con Proxy Next

 Implementar la proteccion de rutas con Proxy Next
---
### 8. Testing end-to-end de seguridad

**RLS en tabla `games`:**

1. Obtener anon key de Supabase
2. Crear cliente con anon key
3. Intentar leer juegos → debe funcionar
4. Intentar insertar juego → debe fallar con error de RLS
5. Crear cliente con service_role key
6. Intentar insertar juego → debe funcionar

**Password length:**

1. Ir a `/auth`
2. Crear cuenta con contraseña de 7 caracteres → falla
3. Crear cuenta con contraseña de 8 caracteres → funciona
4. Cerrar sesión
5. Solicitar reset de contraseña
6. Intentar cambiar a contraseña de 7 caracteres → falla
7. Intentar cambiar a contraseña de 8 caracteres → funciona

**Rate limiting:**

1. Abrir ventana de incógnito
2. Ir a `/auth`
3. Crear cuenta guest → funciona
4. Cerrar sesión
5. Crear cuenta guest → funciona
6. Cerrar sesión
7. Crear cuenta guest → funciona
8. Cerrar sesión
9. Intentar crear cuenta guest → falla con error 429

**Security headers:**

1. Abrir DevTools → Network
2. Navegar a cualquier página
3. Inspeccionar Response Headers
4. Verificar que están presentes:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`

**Function search_path fix:**

1. Crear cuenta de prueba
2. Actualizar perfil (bio, username)
3. Verificar que `updated_at` se actualiza automáticamente
4. Jugar un juego y guardar score
5. Verificar que `total_games` y `total_score` se actualizan automáticamente
6. Verificar que `mcp__supabase__get_advisors` no reporta warnings de search_path



---

## Criterios de aceptación

### Row Level Security
- [ ] RLS habilitado en tabla `games`
- [ ] Política de lectura pública funciona en `games`
- [ ] Escritura en `games` solo funciona con service_role key
- [ ] RLS habilitado en `profiles` (ya estaba)
- [ ] RLS habilitado en `scores` (ya estaba)
- [ ] `mcp__supabase__get_advisors` no reporta ERROR de RLS

### Password Length
- [ ] Validación en `AuthForm.tsx` requiere 8 caracteres
- [ ] Validación en `app/auth/reset/page.tsx` requiere 8 caracteres
- [ ] Supabase Dashboard configurado con mínimo 8 caracteres
- [ ] Mensajes de error actualizados ("al menos 8 caracteres")
- [ ] Placeholders actualizados (8 bullets)
- [ ] Sign up con < 8 chars falla
- [ ] Sign up con ≥ 8 chars funciona
- [ ] Password reset con < 8 chars falla
- [ ] Password reset con ≥ 8 chars funciona

### Rate Limiting
- [ ] Rate limit configurado en Supabase Dashboard
- [ ] Anonymous sign-ins: 3/hora por IP
- [ ] Email sign-ups: 10/hora por IP
- [ ] Cuarto intento guest desde misma IP falla con 429
- [ ] Undécimo intento email desde misma IP falla con 429
- [ ] Error 429 se maneja con mensaje claro
- [ ] Después de 1 hora, límite se resetea

### Security Headers
- [ ] Headers agregados en `next.config.ts`
- [ ] `npm run dev` inicia sin errores
- [ ] Header `X-Content-Type-Options: nosniff` presente en responses
- [ ] Header `X-Frame-Options: DENY` presente en responses
- [ ] Header `Referrer-Policy: strict-origin-when-cross-origin` presente en responses
- [ ] App no puede ser embebida en iframe

### Function Search Path Fix
- [ ] Función `update_updated_at` tiene `SET search_path = ''`
- [ ] Función `update_profile_stats` tiene `SET search_path = ''`
- [ ] Ambas funciones tienen `SECURITY DEFINER`
- [ ] Trigger `update_updated_at` funciona correctamente
- [ ] Trigger `update_profile_stats` funciona correctamente
- [ ] `mcp__supabase__get_advisors` no reporta WARN de search_path

### Advisors de Supabase
- [ ] `mcp__supabase__get_advisors --type security` no reporta ERRORs críticos
- [ ] Warnings de acceso anónimo son esperados (no se cambian)
- [ ] Leaked password protection se documenta como diferido

### General
- [ ] TypeScript compila sin errores
- [ ] `npm run build` funciona sin errores
- [ ] No hay warnings nuevos en consola del browser
- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Funciona en desktop y móvil
- [ ] Usuarios existentes pueden seguir logueándose (compatibilidad con passwords de 6+ chars existentes)

---

## Decisiones tomadas

1. **RLS en `games` con lectura pública** — Juegos son públicos, cualquiera puede verlos. Solo service_role puede modificar el catálogo. Consistente con modelo de negocio.

2. **Password length: 8 caracteres** — Balance entre seguridad y usabilidad. 8 chars es estándar en la industria. Más corto (6) es inseguro, más largo (10+) frustra usuarios.

3. **No forzar caracteres especiales** — Solo longitud mínima. Evita frustración de usuarios. Un password largo es mejor que uno corto con símbolos.

4. **Rate limiting: 3 guest/hora, 10 email/hora** — Previene bots sin afectar usuarios legítimos. Guest más estricto porque es anónimo y propenso a abuso.

5. **Security headers en `next.config.ts`** — Más simple que middleware. Se aplica globalmente. No necesitamos control por ruta en este momento.

6. **X-Frame-Options: DENY** — App no necesita ser embebida. DENY es más seguro que SAMEORIGIN. Si en el futuro necesitamos iframes, cambiamos a SAMEORIGIN.

7. **Function search_path fix inmediatamente** — Bajo riesgo, alto impacto de seguridad. Previene ataques sofisticados de SQL injection vía search_path manipulation.

8. **Mantener políticas de acceso anónimo** — Guest mode es feature, no bug. Warnings de Supabase son válidos pero intencionales. Se documenta como decisión consciente.

9. **Leaked password protection diferido** — Requiere activación manual en dashboard. No es bloqueante para esta spec. Se puede agregar en 5 minutos cuando sea necesario.

10. **No implementar CSP (Content Security Policy)** — Header complejo que requiere análisis detallado de todos los recursos externos. Merece spec propia. Los 3 headers implementados cubren los riesgos más críticos.

11. **Usuarios existentes con passwords < 8 chars** — No se fuerza cambio de contraseña. Supabase permite login con passwords existentes. Solo nuevos signups requieren 8+ chars.

12. **No agregar campo `role` en perfiles** — Solo hay un rol (usuario). Admin operations usan service_role key. No necesitamos RBAC (Role-Based Access Control) en este momento.

---

## Decisiones descartadas

1. **CSP (Content Security Policy)** — Descartado. Requiere análisis de todos los recursos externos (fonts, images, scripts). Spec futura más detallada.

2. **HSTS (Strict Transport Security)** — Descartado. Es configuración de infraestructura (Vercel/Cloudflare), no de código. No aplica para localhost.

3. **Rate limiting en todas las rutas** — Descartado. Solo signup es crítico. Rate limiting en API routes requiere análisis por endpoint. Spec futura.

4. **Forzar cambio de contraseña a usuarios existentes** — Descartado. Mala UX. Los usuarios existentes con passwords de 6-7 chars son pocos y pueden seguir usándolos.

5. **Password strength indicator** — Descartado. Ya se descartó en SPEC 12. No agregamos complejidad visual.

6. **Leaked password protection en esta spec** — Descartado. El usuario confirmó "no implementar" en la clarificación. Se difiere para spec futura.

7. **Audit logging de eventos de seguridad** — Descartado. Requiere tabla nueva, procesamiento de logs, UI para ver eventos. Spec futura.

8. **MFA/2FA** — Descartado. Feature grande que merece spec propia. No es bloqueante para MVP.

9. **Remover acceso anónimo de políticas RLS** — Descartado. Guest mode requiere acceso anónimo. Es feature intencional, no vulnerabilidad.

10. **Implementar rate limiting en middleware custom** — Descartado. Supabase Auth ya tiene rate limiting nativo. No reinventar la rueda.

11. **Agregar `Permissions-Policy` header** — Descartado. Reemplaza `Feature-Policy` pero requiere análisis de qué features deshabilitar. No crítico.

12. **Session timeout forzado** — Descartado. Supabase maneja sesiones. Timeout muy corto frustra usuarios. Spec futura si es necesario.

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| **Usuarios existentes con passwords de 6-7 chars bloqueados** | No se fuerza cambio. Supabase permite login con passwords existentes. Solo nuevos signups requieren 8+ chars. |
| **Rate limiting bloquea usuarios legítimos detrás de NAT** | Límites son generosos (3 guest/hora, 10 email/hora). Si hay reportes, aumentar límites. |
| **Headers rompen funcionalidad existente** | Los 3 headers son conservadores y estándar. No rompen funcionalidad normal. X-Frame-Options puede prevenir embeds pero la app no los necesita. |
| **Function search_path fix rompe lógica existente** | Leer función actual antes de modificar. Solo agregar `SET search_path = ''`, no cambiar lógica. Testing exhaustivo post-deploy. |
| **RLS en `games` rompe inserts desde código** | Verificar que todo código que inserta juegos usa service_role key. Si hay código con anon key, actualizarlo o crear política específica. |
| **Build de Next.js falla después de agregar headers** | Syntax de headers está verificado. Si falla, `npm run build` lo detecta antes de deploy. |
| **Confusión de usuarios: "¿Por qué ahora requiere 8 caracteres?"** | Mensaje de error claro. No hay anuncio porque cambio es transparente para mayoría (passwords típicos son >8 chars). |
| **Rate limit configurado incorrectamente en Supabase** | Documentar pasos exactos con screenshots. Testing manual antes de cerrar spec. |
| **Advisors de Supabase siguen reportando warnings después de fix** | Advisors pueden tener delay (cacheo). Esperar 5-10 minutos y re-verificar. Si persiste, revisar SQL ejecutado. |
| **Headers no aparecen en production (Vercel override)** | Vercel respeta headers de `next.config.ts`. Si hay override, agregar headers también en Vercel Dashboard. |

---

**FIN DE SPEC 14**
