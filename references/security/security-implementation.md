# Security Implementation - SPEC 14

Documentación de medidas de seguridad implementadas en Arcade Vault.

## 1. Row Level Security (RLS)

### Tabla `games`
- ✅ RLS habilitado
- ✅ Política de lectura pública: Todos pueden ver juegos
- ✅ Escritura restringida: Solo service_role key puede modificar

### Tabla `profiles`
- ✅ RLS habilitado (desde SPEC 03)
- ✅ Lectura pública: Todos pueden ver perfiles
- ✅ Actualización: Solo propio perfil
- ✅ Eliminación: Solo propio perfil

**Nota:** Las políticas permiten acceso anónimo (guest mode) - esto es **intencional**, no es vulnerabilidad.

### Tabla `scores`
- ✅ RLS habilitado (desde SPEC 03)
- ✅ Lectura pública: Todos pueden ver scores
- ✅ Inserción: Solo usuarios autenticados en sus propios scores
- ✅ Eliminación: Solo propios scores

**Nota:** Las políticas permiten acceso anónimo (guest mode) - esto es **intencional**, no es vulnerabilidad.

---

## 2. Password Length: 8 caracteres mínimo

### Frontend
- ✅ `AuthForm.tsx`: Validación de 8 caracteres en signup
- ✅ `app/auth/reset/page.tsx`: Validación de 8 caracteres en reset password
- ✅ Atributo `minLength={8}` en inputs
- ✅ Placeholders actualizados (8 bullets)
- ✅ Mensajes de error actualizados

### Backend (Supabase Dashboard)
**PENDIENTE - Configurar manualmente:**

1. Ir a: **Authentication → Policies**
2. Sección: **Password Requirements**
3. Cambiar **Minimum Password Length** de `6` a `8`
4. Guardar cambios

**Nota:** Usuarios existentes con contraseñas de 6-7 caracteres pueden seguir usándolas. Solo nuevos signups requieren 8+ caracteres.

---

## 3. Rate Limiting

### Manejo de errores en código
- ✅ Error 429 manejado en `AuthForm.tsx`
- ✅ Mensaje claro: "Demasiados intentos. Espera unos minutos e intenta de nuevo."
- ✅ Aplica a: signup, signin, guest mode, reset password

### Configuración en Supabase Dashboard
**PENDIENTE - Configurar manualmente:**

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

**Justificación:**
- **Guest: 3/hora** — Previene bots, usuarios legítimos no crean múltiples cuentas guest por hora
- **Email: 10/hora** — Permite pruebas y correcciones de typos sin ser demasiado permisivo

---

## 4. Security Headers en Next.js

### Headers implementados en `next.config.ts`
- ✅ `X-Content-Type-Options: nosniff`
  - Previene MIME type sniffing
  - Mitiga ataques XSS vía file uploads
  
- ✅ `X-Frame-Options: DENY`
  - Previene clickjacking
  - La app no puede ser embebida en iframes
  
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
  - Envía origin completo en same-origin requests
  - Solo envía origin (sin path) en cross-origin requests

### Verificación
Para verificar headers en DevTools:
1. Abrir DevTools → Network
2. Recargar cualquier página
3. Inspeccionar Response Headers
4. Verificar presencia de los 3 headers

---

## 5. Function Search Path Fix

### Funciones actualizadas
- ✅ `update_updated_at()` — Agregado `SET search_path = ''` y `SECURITY DEFINER`
- ✅ `update_profile_stats()` — Agregado `SET search_path = ''` y `SECURITY DEFINER`

**Propósito:** Prevenir ataques sofisticados de SQL injection vía search_path manipulation.

### Verificación
Ejecutar en Supabase SQL Editor:
```sql
-- Verificar que las funciones tienen SET search_path = ''
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  proconfig as configuration
FROM pg_proc
WHERE proname IN ('update_updated_at', 'update_profile_stats')
  AND pronamespace = 'public'::regnamespace;
```

**Resultado esperado:** `proconfig` debe contener `{search_path=}` para ambas funciones.

---

## 6. Protección de Rutas con Proxy Next.js

### Middleware implementado
- ✅ Rutas protegidas: `/biblioteca`, `/perfil`
- ✅ Usuarios no autenticados redirigidos a `/auth`
- ✅ Query param `next` preserva ruta destino
- ✅ Después de login, redirect automático a ruta original

### Ejemplo de flujo
1. Usuario no autenticado intenta acceder `/biblioteca`
2. Middleware detecta falta de sesión
3. Redirige a `/auth?next=/biblioteca`
4. Usuario se loguea
5. Sistema redirige a `/biblioteca`

---

## 7. Advisors de Supabase

### Errores críticos esperados: 0
- ✅ RLS habilitado en todas las tablas públicas
- ✅ Funciones SQL con search_path inmutable

### Warnings esperados (no críticos)
- ⚠️ **Acceso anónimo en `profiles`** — Intencional (guest mode)
- ⚠️ **Acceso anónimo en `scores`** — Intencional (guest mode)
- ⚠️ **Storage policies** — Tabla `storage.objects` con políticas anónimas (avatares públicos)

### Warnings diferidos
- ⚠️ **Leaked password protection** — Requiere activación manual (spec futura)

---

## Testing Checklist

### RLS en tabla `games`
- [ ] Lectura pública funciona (anon key puede leer juegos)
- [ ] Escritura bloqueada (anon key no puede insertar/actualizar/eliminar)
- [ ] Service role key puede escribir

### Password length
- [ ] Signup con < 8 chars falla con mensaje claro
- [ ] Signup con ≥ 8 chars funciona
- [ ] Reset password con < 8 chars falla
- [ ] Reset password con ≥ 8 chars funciona

### Rate limiting
- [ ] 4to intento guest desde misma IP falla con 429
- [ ] 11vo intento email desde misma IP falla con 429
- [ ] Error 429 muestra mensaje claro

### Security headers
- [ ] Header `X-Content-Type-Options: nosniff` presente
- [ ] Header `X-Frame-Options: DENY` presente
- [ ] Header `Referrer-Policy: strict-origin-when-cross-origin` presente
- [ ] App no puede ser embebida en iframe

### Function search_path
- [ ] Actualizar perfil actualiza `updated_at` automáticamente
- [ ] Insertar score actualiza `total_games` y `total_score`
- [ ] Advisors no reportan warning de search_path mutable

### Protección de rutas
- [ ] Acceder `/biblioteca` sin sesión redirige a `/auth?next=/biblioteca`
- [ ] Acceder `/perfil` sin sesión redirige a `/auth?next=/perfil`
- [ ] Después de login, redirect a ruta original funciona
- [ ] Rutas públicas (`/`, `/about`, `/salon`) accesibles sin login

---

## Configuración manual pendiente

### 1. Supabase Dashboard - Password Length
**Ubicación:** Authentication → Policies → Password Requirements  
**Cambio:** Minimum Password Length: `6` → `8`

### 2. Supabase Dashboard - Rate Limiting
**Ubicación:** Authentication → Rate Limits

**Anonymous Sign-ins:**
- Enabled: ✓
- Interval: `1 hour`
- Max requests: `3`

**Email Sign-ups:**
- Enabled: ✓
- Interval: `1 hour`
- Max requests: `10`

---

## Decisiones tomadas

1. **RLS en `games` con lectura pública** — Juegos son públicos, solo service_role modifica catálogo
2. **Password length: 8 caracteres** — Balance seguridad/usabilidad, estándar industria
3. **No forzar caracteres especiales** — Solo longitud mínima, evita frustración
4. **Rate limiting: 3 guest/hora, 10 email/hora** — Previene bots sin afectar usuarios legítimos
5. **Security headers en `next.config.ts`** — Más simple que middleware, aplicación global
6. **X-Frame-Options: DENY** — App no necesita iframes, DENY es más seguro
7. **Mantener políticas de acceso anónimo** — Guest mode es feature, no bug
8. **No CSP en esta spec** — Requiere análisis detallado, merece spec propia

---

## Riesgos mitigados

| Riesgo | Mitigación |
|--------|-----------|
| Modificación no autorizada de tabla `games` | RLS habilitado, solo service_role puede escribir |
| Contraseñas débiles | Mínimo 8 caracteres requerido |
| Bots creando cuentas en masa | Rate limiting (3 guest/hora, 10 email/hora) |
| Clickjacking | Header `X-Frame-Options: DENY` |
| MIME type sniffing | Header `X-Content-Type-Options: nosniff` |
| SQL injection vía search_path | Funciones con `SET search_path = ''` |
| Acceso no autorizado a rutas | Middleware redirige usuarios no autenticados |

---

**Última actualización:** 2026-11-20  
**Spec:** 14-medidas-seguridad.md  
**Estado:** Implementado (pendiente configuración manual en Supabase Dashboard)
