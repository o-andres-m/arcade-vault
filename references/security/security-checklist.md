# Security Checklist — Arcade Vault

**Base:** SPEC 14 (Medidas de Seguridad Básicas)  
**Última actualización:** 2026-11-20

Este checklist es usado por el agente `security-audit` para validar la seguridad de la aplicación.

---

## 1. Base de Datos (Supabase)

### Row Level Security (RLS)

- [ ] **Tabla `games`**
  - RLS habilitado: `ALTER TABLE public.games ENABLE ROW LEVEL SECURITY`
  - Política de lectura pública: `Games are viewable by everyone`
  - Sin políticas de escritura (solo service_role puede insertar/actualizar/eliminar)
  - **Severidad si falla:** CRITICAL

- [ ] **Tabla `profiles`**
  - RLS habilitado
  - Política de lectura pública: `Profiles are viewable by everyone`
  - Política de actualización: `Users can update their own profile` (auth.uid() = id)
  - Política de eliminación: `Users can delete their own profile` (auth.uid() = id)
  - **Severidad si falla:** CRITICAL

- [ ] **Tabla `scores`**
  - RLS habilitado
  - Política de lectura pública: `Scores are viewable by everyone`
  - Política de inserción: `Users can insert their own scores` (auth.uid() = user_id)
  - Política de eliminación: `Users can delete their own scores` (auth.uid() = user_id)
  - **Severidad si falla:** CRITICAL

- [ ] **Tabla `storage.objects`**
  - Políticas para bucket 'avatars' permiten lectura/escritura pública (intencional)
  - **Nota:** Acceso público es esperado para avatares
  - **Severidad si falla:** LOW

### Funciones SQL

- [ ] **Función `update_updated_at()`**
  - Tiene `SECURITY DEFINER`
  - Tiene `SET search_path = ''`
  - **Severidad si falla:** HIGH (vulnerabilidad SQL injection vía search_path)

- [ ] **Función `update_profile_stats()`**
  - Tiene `SECURITY DEFINER`
  - Tiene `SET search_path = ''`
  - **Severidad si falla:** HIGH (vulnerabilidad SQL injection vía search_path)

### Auth Configuration

- [ ] **Password Policy**
  - Minimum length: 8 caracteres
  - Configurado en: Supabase Dashboard → Authentication → Policies
  - Validado en: `components/auth/AuthForm.tsx` y `app/auth/reset/page.tsx`
  - **Severidad si falla:** MEDIUM

- [ ] **Rate Limiting**
  - Anonymous sign-ins: 3 requests / 1 hora por IP
  - Email sign-ups: 10 requests / 1 hora por IP
  - Configurado en: Supabase Dashboard → Authentication → Rate Limits
  - **Severidad si falla:** MEDIUM (permite ataques de fuerza bruta)

- [ ] **Leaked Password Protection**
  - Configurado en Supabase Dashboard (opcional)
  - Estado: DIFERIDO (SPEC 14, no bloqueante)
  - **Severidad si falla:** LOW (mejora futura)

---

## 2. Aplicación (Next.js)

### Security Headers

- [ ] **X-Content-Type-Options: nosniff**
  - Configurado en: `next.config.ts`
  - Previene: MIME type sniffing attacks
  - **Severidad si falla:** MEDIUM

- [ ] **X-Frame-Options: DENY**
  - Configurado en: `next.config.ts`
  - Previene: Clickjacking attacks
  - **Severidad si falla:** MEDIUM

- [ ] **Referrer-Policy: strict-origin-when-cross-origin**
  - Configurado en: `next.config.ts`
  - Protege: Privacidad del usuario
  - **Severidad si falla:** LOW

### Protección de Rutas

- [ ] **Middleware protege rutas autenticadas**
  - Rutas protegidas: `/biblioteca`, `/perfil`
  - Redirige a `/auth` si no autenticado
  - Archivo: `middleware.ts`
  - **Severidad si falla:** HIGH

- [ ] **API routes validan autenticación**
  - Endpoints protegidos verifican `auth.getUser()`
  - Retornan 401 Unauthorized si falla
  - **Severidad si falla:** HIGH

### Validación de Inputs

- [ ] **AuthForm.tsx**
  - Password mínimo 8 caracteres (línea ~135)
  - Email validation (formato válido)
  - Username validation (no caracteres especiales peligrosos)
  - **Severidad si falla:** MEDIUM

- [ ] **app/auth/reset/page.tsx**
  - Password mínimo 8 caracteres (línea ~415)
  - Confirmación de password match
  - **Severidad si falla:** MEDIUM

- [ ] **app/api/contact/route.ts**
  - Validación de email
  - Sanitización de mensaje (prevenir XSS)
  - Rate limiting en endpoint (futuro)
  - **Severidad si falla:** MEDIUM

### Vulnerabilidades Comunes

- [ ] **No hay SQL Injection**
  - Queries parametrizadas (Supabase client)
  - No concatenación de strings en queries
  - **Severidad si falla:** CRITICAL

- [ ] **No hay XSS (Cross-Site Scripting)**
  - No uso de `dangerouslySetInnerHTML` sin sanitización
  - Inputs sanitizados antes de render
  - React escapa automáticamente JSX (built-in protection)
  - **Severidad si falla:** HIGH

- [ ] **No hay secrets hardcoded**
  - API keys en `.env.local` (no commiteado)
  - No secrets en código fuente
  - `.gitignore` incluye `.env.local`
  - **Severidad si falla:** CRITICAL

- [ ] **No hay eval() o Function()**
  - No uso de `eval()` (code injection risk)
  - No uso de `new Function()` (code injection risk)
  - **Severidad si falla:** CRITICAL

- [ ] **Error handling no expone información sensible**
  - Mensajes de error genéricos al usuario
  - Stack traces solo en dev mode
  - No expone estructura de base de datos
  - **Severidad si falla:** MEDIUM

---

## 3. Dependencias

### NPM Audit

- [ ] **No hay vulnerabilidades críticas**
  - Ejecutar: `npm audit --audit-level=critical`
  - Vulnerabilidades críticas: 0
  - **Severidad si falla:** HIGH

- [ ] **No hay vulnerabilidades altas**
  - Ejecutar: `npm audit --audit-level=high`
  - Vulnerabilidades altas: 0
  - **Severidad si falla:** MEDIUM

- [ ] **Packages actualizados**
  - Ejecutar: `npm outdated`
  - Major versions con CVEs conocidos actualizados
  - **Severidad si falla:** LOW

---

## 4. Configuración de Entorno

### Environment Variables

- [ ] **`.env.local` no está en git**
  - Verificar: `git ls-files .env.local` (debe estar vacío)
  - `.gitignore` incluye `.env.local`
  - **Severidad si falla:** CRITICAL

- [ ] **Variables requeridas están configuradas**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - **Severidad si falla:** HIGH (app no funciona)

- [ ] **Service role key no se usa en cliente**
  - Solo en API routes (server-side)
  - No en componentes con 'use client'
  - **Severidad si falla:** CRITICAL

---

## 5. Build & Deploy

### Production Build

- [ ] **Build exitoso sin errores**
  - Ejecutar: `npm run build`
  - Exit code: 0
  - **Severidad si falla:** HIGH (no se puede deployear)

- [ ] **TypeScript sin errores**
  - Ejecutar: `npm run typecheck`
  - No type errors
  - **Severidad si falla:** MEDIUM

- [ ] **Linter sin errores**
  - Ejecutar: `npm run lint`
  - No linting errors (warnings OK)
  - **Severidad si falla:** LOW

---

## 6. Advertencias Esperadas (NO son vulnerabilidades)

### Supabase Advisors

Estas advertencias de `mcp__supabase__get_advisors --type security` son **ESPERADAS**:

- ⚠️ **Anonymous access in `profiles` policies** → Intencional para guest mode
- ⚠️ **Anonymous access in `scores` policies** → Intencional para guest mode
- ⚠️ **Public storage policies in `avatars` bucket** → Intencional para avatares públicos

### Auth Configuration

- ⚠️ **Usuarios con passwords < 8 chars pueden loguearse** → Intencional, solo nuevos signups requieren 8+ chars
- ⚠️ **No MFA/2FA habilitado** → Diferido para spec futura
- ⚠️ **Leaked password protection no configurado** → Diferido para spec futura

---

## 7. Futuras Mejoras (No bloqueantes)

### Corto Plazo

- [ ] Leaked password protection (Supabase Dashboard)
- [ ] MFA/2FA para cuentas de email
- [ ] Content Security Policy (CSP) header

### Mediano Plazo

- [ ] Rate limiting en API routes
- [ ] Audit logging de eventos de seguridad
- [ ] Session timeout configurado

### Largo Plazo

- [ ] Penetration testing profesional
- [ ] Security headers avanzados (HSTS, Permissions-Policy)
- [ ] Password expiration policy
- [ ] CAPTCHA en signup form

---

## Uso del Checklist

### Para Security Audit Agent

```bash
# 1. Leer este checklist
Read references/security/security-checklist.md

# 2. Ejecutar queries de auditoría
# Ver: references/security/audit-queries.sql

# 3. Verificar cada item del checklist

# 4. Generar reporte con findings clasificados por severidad
```

### Para Desarrolladores

```bash
# Auditoría manual rápida
npm audit
npm run typecheck
npm run lint

# Verificar headers en dev
curl -I http://localhost:3000 | grep -E "X-Content-Type-Options|X-Frame-Options|Referrer-Policy"

# Buscar secrets hardcoded
grep -rE "(sk-|pk-|password|secret|api_key)" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules .
```

---

## Referencias

- **SPEC 14:** `/specs/14-medidas-seguridad.md`
- **Audit Queries:** `/references/security/audit-queries.sql`
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **Supabase Security:** https://supabase.com/docs/guides/database/securing-your-database
- **Next.js Security:** https://nextjs.org/docs/app/building-your-application/security
