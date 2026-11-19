# 12 — MEJORAS AL SISTEMA DE AUTENTICACIÓN

**Estado:** Approved  
**Depende de:** SPEC 03 (Implementación Supabase)  
**Fecha:** 2026-11-19

**Objetivo:** Arreglar bug de duplicación de perfiles en Guest Mode y agregar funcionalidad completa de recuperación de contraseña con magic link, validación de nueva contraseña e inicio de sesión automático.

---

## Alcance

### Incluido en esta especificación

- **Fix de Guest Mode: Prevenir duplicación de perfiles**
  - Cambiar `insert()` por `upsert()` en `AuthForm.tsx` método `handleGuest()`
  - Evitar error de violación de constraint unique cuando un usuario guest ya tiene perfil
  - Permitir que usuarios guest existentes puedan volver a iniciar sesión sin crear perfil duplicado

- **Recuperación de contraseña: Flujo completo**
  - Link "Olvidé mi contraseña" en tab "INICIAR SESIÓN" del formulario de auth
  - Posición: Debajo del input de contraseña, alineado a la derecha
  - Página nueva `/auth/reset` para cambiar contraseña
  - Magic link directo vía email (sin copiar/pegar token manualmente)
  - Formulario de reset con dos inputs: nueva contraseña + confirmar contraseña
  - Validación: Mínimo 6 caracteres (consistente con Sign Up)
  - Login automático después de cambiar contraseña con éxito
  - Redirección a `/biblioteca` después del login automático

- **Manejo de errores**
  - Link expirado o inválido: Mostrar error + botón para solicitar nuevo link
  - Email no registrado: Mostrar mensaje de error al solicitar reset
  - Contraseñas no coinciden: Validación en tiempo real antes de enviar
  - Rate limiting: Manejo de error 429 si Supabase bloquea por demasiados intentos

- **UX y estados**
  - Loading states durante solicitud de reset
  - Loading states durante cambio de contraseña
  - Mensajes de éxito claros en cada paso
  - Diseño consistente con `AuthForm.tsx` existente

### NO incluido en esta especificación (se difiere)

- Edición de email del usuario (requiere verificación)
- Cambio de contraseña desde el perfil (sin olvidar contraseña)
- Autenticación de dos factores (2FA)
- Login con magic link sin contraseña
- OAuth (Google/GitHub) ya está marcado como futuro en AuthForm
- Conversión de cuenta guest a cuenta con email/password
- Historial de contraseñas anteriores
- Validación de fortaleza de contraseña (débil/media/fuerte)
- Expiración forzada de sesiones al cambiar contraseña
- Notificación por email de cambio de contraseña exitoso (opcional)

---

## Modelo de datos

### Sin cambios en tablas de Supabase

- No se agregan columnas nuevas a `profiles` ni `scores`
- No se crean tablas nuevas
- Funcionalidad de reset de contraseña usa APIs nativas de Supabase Auth

### Flujo de reset de contraseña (Supabase Auth)

```typescript
// 1. Solicitar reset (desde AuthForm)
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/auth/reset`,
})

// 2. Usuario hace clic en link del email
// → Redirige a /auth/reset con token en URL (automático)

// 3. Actualizar contraseña (desde página /auth/reset)
supabase.auth.updateUser({
  password: newPassword,
})

// 4. Login automático después de update (Supabase lo hace automáticamente)
```

### Estado de formulario de reset

```typescript
interface ResetFormState {
  email: string;           // Para solicitar reset
  password: string;        // Nueva contraseña
  confirmPassword: string; // Confirmación
  loading: boolean;
  error: string;
  step: 'request' | 'reset' | 'success';
}
```

### LocalStorage keys

No se agregan nuevas keys. Se mantienen las existentes:
- `av_guest_name` (ya existe para nombres de invitados)
- Cookies de sesión de Supabase (manejadas automáticamente)

---

## Plan de implementación

### 1. Fix de Guest Mode: Cambiar insert por upsert

**Archivos modificados:**
- `components/auth/AuthForm.tsx`

**Cambios:**

En método `handleGuest()`, reemplazar:
```typescript
// ❌ ANTES (línea 89-92)
await supabase.from('profiles').insert({
  id: user.id,
  username: `GUEST_${Date.now().toString().slice(-4)}`,
}).select().single()
```

Por:
```typescript
// ✅ DESPUÉS
await supabase.from('profiles').upsert({
  id: user.id,
  username: `GUEST_${Date.now().toString().slice(-4)}`,
}, {
  onConflict: 'id'
}).select().single()
```

**Verificación:**
- Usuario guest puede iniciar sesión múltiples veces sin error de duplicado
- No se crean perfiles duplicados en tabla `profiles`
- Username se mantiene si el perfil ya existía

---

### 2. Agregar link "Olvidé mi contraseña" en AuthForm

**Archivos modificados:**
- `components/auth/AuthForm.tsx`
- `components/auth/AuthForm.module.css`

**Cambios en AuthForm.tsx:**

Agregar estado para modal de solicitud de reset:
```typescript
const [showForgotPassword, setShowForgotPassword] = useState(false)
const [resetEmail, setResetEmail] = useState('')
const [resetLoading, setResetLoading] = useState(false)
const [resetSent, setResetSent] = useState(false)
```

Agregar función para solicitar reset:
```typescript
const handleForgotPassword = async (e: FormEvent) => {
  e.preventDefault()
  setError('')
  setResetLoading(true)

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    
    if (error) throw error
    setResetSent(true)
  } catch (err) {
    let message = 'Error al enviar email de recuperación'
    if (err instanceof Error) {
      if (err.message.includes('rate limit') || err.message.includes('429')) {
        message = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
      } else {
        message = err.message
      }
    }
    setError(message)
  } finally {
    setResetLoading(false)
  }
}
```

Agregar link debajo del input de contraseña (solo en tab 'in'):
```tsx
{tab === 'in' && (
  <div className={styles.forgotPassword}>
    <button
      type="button"
      onClick={() => setShowForgotPassword(true)}
      className={styles.forgotLink}
      disabled={loading}
    >
      ¿Olvidaste tu contraseña?
    </button>
  </div>
)}
```

Agregar modal simple para solicitar reset (después del formulario principal):
```tsx
{showForgotPassword && (
  <div className={styles.forgotModal}>
    <div className={styles.forgotCard}>
      <button
        className={styles.closeModal}
        onClick={() => {
          setShowForgotPassword(false)
          setResetSent(false)
          setResetEmail('')
        }}
      >
        ✕
      </button>
      
      <h3>Recuperar contraseña</h3>
      
      {!resetSent ? (
        <form onSubmit={handleForgotPassword}>
          <p>Ingresa tu email y te enviaremos un link para resetear tu contraseña.</p>
          
          <div className={styles.field}>
            <label htmlFor="resetEmail">Email</label>
            <input
              id="resetEmail"
              type="email"
              placeholder="tu@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={resetLoading}
              required
            />
          </div>
          
          <button
            type="submit"
            className={`btn ${styles.submitBtn}`}
            disabled={resetLoading}
          >
            {resetLoading ? 'ENVIANDO...' : 'ENVIAR LINK'}
          </button>
        </form>
      ) : (
        <div className={styles.resetSuccess}>
          <p>✓ Email enviado</p>
          <p>Revisa tu bandeja de entrada y haz clic en el link para resetear tu contraseña.</p>
          <button
            className="btn ghost"
            onClick={() => {
              setShowForgotPassword(false)
              setResetSent(false)
              setResetEmail('')
            }}
          >
            CERRAR
          </button>
        </div>
      )}
    </div>
  </div>
)}
```

**Cambios en AuthForm.module.css:**

Agregar estilos:
```css
.forgotPassword {
  text-align: right;
  margin-top: 8px;
  margin-bottom: 8px;
}

.forgotLink {
  background: none;
  border: none;
  color: var(--cyan);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  transition: opacity 0.2s;
}

.forgotLink:hover {
  opacity: 0.8;
}

.forgotLink:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.forgotModal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.forgotCard {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.forgotCard h3 {
  font-family: var(--pixel);
  font-size: 16px;
  margin-bottom: 16px;
  text-align: center;
  color: var(--cyan);
}

.forgotCard p {
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.6;
  margin-bottom: 16px;
  color: var(--ink);
}

.closeModal {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--ink-dim);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s;
}

.closeModal:hover {
  color: var(--ink);
}

.resetSuccess {
  text-align: center;
}

.resetSuccess p:first-child {
  font-size: 14px;
  color: var(--green);
  margin-bottom: 12px;
}
```

**Verificación:**
- Link "¿Olvidaste tu contraseña?" aparece solo en tab "INICIAR SESIÓN"
- Al hacer clic, se abre modal con formulario de solicitud
- Usuario puede ingresar email y solicitar reset
- Se muestra mensaje de éxito después de enviar
- Email llega a la bandeja del usuario con link a `/auth/reset`

---

### 3. Crear página de reset de contraseña

**Archivos nuevos:**
- `app/auth/reset/page.tsx`

**Código:**

```typescript
'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from '@/components/auth/AuthForm.module.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState(true)

  useEffect(() => {
    // Verificar si hay una sesión activa (token válido)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setTokenValid(false)
      }
    })
  }, [supabase.auth])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Validación de contraseñas
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      // Login automático y redirección
      router.push('/biblioteca')
    } catch (err) {
      let message = 'Error al actualizar contraseña'
      if (err instanceof Error) {
        if (err.message.includes('rate limit') || err.message.includes('429')) {
          message = 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
        } else {
          message = err.message
        }
      }
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestNewLink = () => {
    router.push('/auth')
  }

  if (!tokenValid) {
    return (
      <main className="av-main">
        <div className="av-auth-wrap">
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.mark} />
              <h2>LINK EXPIRADO</h2>
            </div>

            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', color: 'var(--ink-dim)' }}>
                Este link ha expirado o es inválido. Solicita un nuevo link de recuperación.
              </p>
              <button className="btn" onClick={handleRequestNewLink}>
                SOLICITAR NUEVO LINK
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="av-main">
      <div className="av-auth-wrap">
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.mark} />
            <h2>NUEVA CONTRASEÑA</h2>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label htmlFor="password">Nueva contraseña</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className={`btn ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'ACTUALIZANDO...' : 'CAMBIAR CONTRASEÑA'}
            </button>
          </form>

          <div className={styles.footer}>
            Al cambiar tu contraseña, iniciarás sesión automáticamente
          </div>
        </div>
      </div>
    </main>
  )
}
```

**Verificación:**
- Página `/auth/reset` se renderiza correctamente
- Si no hay token válido, muestra mensaje de link expirado
- Formulario tiene dos inputs: nueva contraseña + confirmar
- Validación funciona: min 6 caracteres, contraseñas deben coincidir
- Después de cambiar contraseña, usuario se loguea automáticamente
- Redirección a `/biblioteca` funciona

---

### 4. Verificar configuración de Supabase Auth

**Checklist de configuración en Supabase Dashboard:**

1. **Email Templates** (Auth → Email Templates):
   - Template "Reset Password" debe estar habilitado
   - Verificar que el link en el template apunta a `{{ .SiteURL }}/auth/reset`
   - Si el template usa otra ruta, actualizarlo

2. **Email Rate Limit** (Auth → Email):
   - Verificar que rate limit no esté demasiado estricto
   - Recomendado: 3-5 emails de reset por hora por usuario

3. **Redirect URLs** (Auth → URL Configuration):
   - Agregar `http://localhost:3000/auth/reset` a la lista de Redirect URLs (dev)
   - Agregar `https://tudominio.com/auth/reset` (production)

**No requiere cambios de código, solo configuración en dashboard.**

---

### 5. Testing end-to-end

**Como usuario registrado:**

1. Ir a `/auth`
2. Tab "INICIAR SESIÓN"
3. Hacer clic en "¿Olvidaste tu contraseña?"
4. Ingresar email registrado
5. Hacer clic en "ENVIAR LINK"
6. Verificar que aparece mensaje de éxito
7. Abrir bandeja de email
8. Hacer clic en link del email
9. Verificar que redirige a `/auth/reset`
10. Ingresar nueva contraseña (mín 6 caracteres)
11. Confirmar contraseña
12. Hacer clic en "CAMBIAR CONTRASEÑA"
13. Verificar que se loguea automáticamente
14. Verificar que redirige a `/biblioteca`
15. Cerrar sesión
16. Volver a `/auth` e iniciar sesión con nueva contraseña
17. Verificar que funciona

**Como usuario guest:**

1. Ir a `/auth`
2. Hacer clic en "JUGAR COMO INVITADO"
3. Verificar que se crea perfil sin error
4. Cerrar sesión
5. Hacer clic en "JUGAR COMO INVITADO" nuevamente
6. Verificar que NO se crea perfil duplicado
7. Verificar que se puede jugar sin problemas

**Manejo de errores:**

1. Solicitar reset con email no registrado → Ver error apropiado
2. Intentar acceder a `/auth/reset` sin token → Ver mensaje de link expirado
3. En formulario de reset, ingresar contraseñas que no coinciden → Ver error
4. En formulario de reset, ingresar contraseña < 6 caracteres → Ver error

---

## Criterios de aceptación

### Guest Mode Fix
- [ ] `handleGuest()` usa `.upsert()` en lugar de `.insert()`
- [ ] Usuario guest puede iniciar sesión múltiples veces sin error
- [ ] No se crean perfiles duplicados en tabla `profiles`
- [ ] Username de guest se mantiene si el perfil ya existía

### Recuperación de contraseña
- [ ] Link "¿Olvidaste tu contraseña?" aparece solo en tab "INICIAR SESIÓN"
- [ ] Link está posicionado debajo del input de contraseña, alineado a la derecha
- [ ] Al hacer clic, se abre modal con formulario de solicitud
- [ ] Modal tiene input para email y botón "ENVIAR LINK"
- [ ] Loading state funciona durante envío de email
- [ ] Si email es válido, se muestra mensaje de éxito
- [ ] Email llega a la bandeja del usuario con magic link
- [ ] Magic link redirige a `/auth/reset`
- [ ] Página `/auth/reset` se renderiza correctamente
- [ ] Si no hay token válido, se muestra mensaje "Link expirado" + botón para solicitar nuevo
- [ ] Formulario de reset tiene dos inputs: nueva contraseña + confirmar
- [ ] Validación funciona: mínimo 6 caracteres
- [ ] Validación funciona: contraseñas deben coincidir
- [ ] Si contraseñas no coinciden, se muestra error antes de enviar
- [ ] Después de cambiar contraseña, usuario se loguea automáticamente
- [ ] Redirección a `/biblioteca` funciona después del reset
- [ ] Usuario puede cerrar sesión y volver a loguearse con nueva contraseña

### Manejo de errores
- [ ] Email no registrado: Se muestra error apropiado
- [ ] Rate limit (429): Se muestra mensaje de "demasiados intentos"
- [ ] Link expirado: Se muestra mensaje + botón para solicitar nuevo
- [ ] Contraseñas no coinciden: Se muestra error en tiempo real
- [ ] Contraseña muy corta: Se muestra error en tiempo real

### General
- [ ] TypeScript compila sin errores
- [ ] No hay warnings en consola del browser
- [ ] Estilos son consistentes con `AuthForm.tsx` existente
- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Funciona en desktop y móvil
- [ ] Modal de solicitud de reset se puede cerrar con botón X
- [ ] Modal de solicitud de reset se cierra al enviar con éxito

---

## Decisiones tomadas

1. **Usar `.upsert()` para Guest Mode** — Solución más simple y directa. Evita error de duplicado sin necesidad de verificar existencia primero. Supabase maneja el upsert eficientemente.

2. **Magic link directo en lugar de token manual** — Mejor UX. Usuario solo hace clic en el link del email y va directo al formulario de reset. No tiene que copiar/pegar tokens.

3. **Login automático después de reset** — Evita que el usuario tenga que recordar y escribir su nueva contraseña inmediatamente después de cambiarla. Supabase mantiene la sesión activa después de `updateUser()`.

4. **Link solo en tab "INICIAR SESIÓN"** — Más intuitivo. Los usuarios que están registrándose no necesitan resetear contraseña. Reduce clutter en el formulario.

5. **Modal para solicitud de reset** — Evita crear página adicional. Mantiene el flujo dentro del mismo contexto. Usuario no pierde estado del formulario.

6. **Ruta `/auth/reset`** — Consistente con `/auth` existente. Agrupa toda la funcionalidad de autenticación bajo el mismo path base.

7. **Confirmar contraseña (dos inputs)** — Estándar en formularios de reset. Previene typos que podrían dejar al usuario sin acceso a su cuenta.

8. **Validación mínima (solo 6 caracteres)** — Consistente con validación de Sign Up. No agregamos complejidad adicional como indicadores de fortaleza.

9. **Incluir ambos fixes en una sola spec** — Son mejoras relacionadas al sistema de auth. Implementarlas juntas tiene sentido lógico y reduce overhead de documentación.

10. **Redirigir a `/biblioteca` después de reset** — Usuario ya está autenticado, mejor llevarlo directo a la app en lugar de dejarlo en una página de éxito.

---

## Decisiones descartadas

1. **Crear spec separada para Guest Mode fix** — Descartado. El fix es pequeño (una línea de código). No justifica una spec completa. Mejor agrupar con password reset.

2. **Token manual en lugar de magic link** — Descartado. Peor UX. Copiar/pegar tokens es propenso a errores. Magic link es estándar en la industria.

3. **Página separada `/forgot-password`** — Descartado. Modal dentro de `/auth` reduce navegación y mantiene contexto. Usuario no se desorienta.

4. **Indicador de fortaleza de contraseña** — Descartado. Agrega complejidad visual y lógica. Validación simple (6 caracteres) es suficiente para MVP.

5. **Validar que nueva contraseña no sea la misma que la anterior** — Descartado. Requiere lógica adicional del lado de Supabase. No es crítico para esta spec.

6. **Notificación por email de cambio exitoso** — Descartado. No es crítico. Usuario ya sabe que cambió su contraseña porque lo hizo manualmente. Se puede agregar en spec futura.

7. **Expirar todas las sesiones activas al cambiar contraseña** — Descartado. Supabase no provee esta funcionalidad out-of-the-box. Requeriría lógica custom compleja. Se puede agregar en spec futura si es necesario.

8. **Permitir reset desde el perfil (sin olvidar contraseña)** — Descartado. Es una funcionalidad diferente. Cambio de contraseña desde perfil requiere validar contraseña actual. Se puede agregar en spec futura.

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| **Email no llega al usuario (spam, filtros)** | Instruir al usuario en el mensaje de éxito que revise carpeta de spam. Supabase usa servicios de email reputados, pero no tenemos control total. |
| **Link expira antes de que usuario lo use** | Supabase tiene timeout por defecto (24 horas). Es suficiente. Si usuario reporta problema, puede solicitar nuevo link fácilmente. |
| **Usuario guest intenta usar "Olvidé mi contraseña"** | Modal no aparece si no hay usuario logueado. Guests no ven el link. No es un problema porque guests no tienen contraseña. |
| **Rate limiting muy agresivo bloquea usuarios legítimos** | Manejo de error 429 con mensaje claro. Configuración de Supabase debe permitir 3-5 intentos por hora, suficiente para uso normal. |
| **Usuario cambia contraseña pero no se loguea automáticamente** | Supabase mantiene la sesión activa después de `updateUser()`. Si falla, el usuario puede ir manualmente a `/auth` y loguearse con nueva contraseña. |
| **Configuración incorrecta de redirect URLs en Supabase** | Verificar en testing que redirect a `/auth/reset` funciona. Si no, actualizar configuración en Supabase Dashboard antes de deploy a producción. |
| **Typo en email al solicitar reset (email incorrecto)** | No podemos validar que el email sea el correcto. Usuario puede solicitar nuevo link si se equivocó. Supabase no revela si el email existe o no por seguridad. |
| **Usuario confundido porque no ve el link en tab "CREAR CUENTA"** | Link solo aparece en "INICIAR SESIÓN". Es estándar en la industria. Si hay confusión, agregar hint en Sign Up: "¿Ya tienes cuenta? Inicia sesión". |

---

**FIN DE SPEC 12**
