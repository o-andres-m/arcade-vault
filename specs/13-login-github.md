# 13 — LOGIN CON GITHUB

**Estado:** Approved  
**Depende de:** SPEC 03 (Implementación Supabase), SPEC 12 (Mejoras Autenticación)  
**Fecha:** 2026-11-19

**Objetivo:** Implementar autenticación con GitHub OAuth en AuthForm, con creación automática de perfil usando datos de GitHub (username, avatar), manejo de usernames duplicados con sufijo numérico, y vinculación automática de cuentas por email.

---

## Alcance

### Incluido en esta especificación

- **Botón "Continuar con GitHub"**
  - Posición: Antes de los tabs de Email/Guest
  - Método principal de autenticación
  - Redirección a OAuth de GitHub
  
- **Callback OAuth**
  - Usa ruta `/api/auth/callback` existente
  - Manejo automático de sesión por Supabase
  
- **Creación automática de perfil**
  - Username desde `user_metadata.user_name` de GitHub
  - Avatar desde `user_metadata.avatar_url` de GitHub
  - Si username ya existe: agregar sufijo numérico (`username_1`, `username_2`, etc.)
  - Usa `.upsert()` para evitar duplicados (consistente con SPEC 12)
  
- **Vinculación de cuentas**
  - Si email de GitHub coincide con cuenta existente: Supabase vincula automáticamente
  - Usuario puede acceder con ambos métodos
  
- **Limpieza de código**
  - Remover referencias a Google OAuth del formulario
  - Mantener solo: GitHub, Email, Guest

### NO incluido (se difiere)

- Desvinculación de providers desde el perfil
- Cambio de método de autenticación principal
- Login con otros providers (Google, Twitter, etc.)
- Conversión de cuenta Guest a cuenta GitHub
- Edición de username después del registro
- Re-sincronización de avatar de GitHub
- Mostrar provider usado en el perfil de usuario

---

## Modelo de datos

### Sin cambios en tablas de Supabase

- No se agregan columnas nuevas a `profiles`
- No se crean tablas nuevas
- OAuth usa tablas nativas de Supabase Auth

### Flujo de autenticación con GitHub

```typescript
// 1. Iniciar OAuth (desde AuthForm)
supabase.auth.signInWithOAuth({
  provider: 'github',
  options: {
    redirectTo: `${window.location.origin}/api/auth/callback`,
  },
})

// 2. Usuario autoriza en GitHub → GitHub redirige a callback
// 3. Callback procesa token y crea sesión (automático)

// 4. Verificar si perfil existe
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

// 5. Si no existe, crear perfil con datos de GitHub
if (!profile) {
  const username = await getUniqueUsername(user.user_metadata.user_name)
  await supabase.from('profiles').upsert({
    id: user.id,
    username: username,
    avatar_url: user.user_metadata.avatar_url || null,
  }, { onConflict: 'id' })
}
```

### Metadata de usuario GitHub

```typescript
// user.user_metadata contiene:
{
  avatar_url: string,      // URL del avatar de GitHub
  email: string,           // Email público de GitHub
  user_name: string,       // Username de GitHub
  full_name?: string,      // Nombre completo (opcional)
  preferred_username?: string
}
```

### Lógica de username único

```typescript
async function getUniqueUsername(baseUsername: string): Promise<string> {
  // 1. Intentar username original
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', baseUsername)
    .single()
  
  if (!data) return baseUsername
  
  // 2. Si existe, agregar sufijo numérico
  let suffix = 1
  while (true) {
    const candidate = `${baseUsername}_${suffix}`
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', candidate)
      .single()
    
    if (!data) return candidate
    suffix++
  }
}
```

---

## Plan de implementación

### 1. Agregar botón "Continuar con GitHub" en AuthForm

**Archivos modificados:**
- `components/auth/AuthForm.tsx`
- `components/auth/AuthForm.module.css`

**Cambios en AuthForm.tsx:**

Agregar función de OAuth:
```typescript
const handleGitHub = async () => {
  setError('')
  setLoading(true)

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    
    if (error) throw error
  } catch (err) {
    let message = 'Error al conectar con GitHub'
    if (err instanceof Error) {
      message = err.message
    }
    setError(message)
    setLoading(false)
  }
}
```

Agregar botón antes de los tabs:
```tsx
{/* OAuth Providers */}
<div className={styles.oauthSection}>
  <button
    type="button"
    onClick={handleGitHub}
    className={styles.githubBtn}
    disabled={loading}
  >
    <svg /* GitHub icon SVG */ />
    CONTINUAR CON GITHUB
  </button>
  
  <div className={styles.divider}>
    <span>O</span>
  </div>
</div>

{/* Tabs existentes (Email/Guest) */}
<div className={styles.tabs}>
  ...
</div>
```

**Cambios en AuthForm.module.css:**

```css
.oauthSection {
  margin-bottom: 24px;
}

.githubBtn {
  width: 100%;
  background: #24292e;
  border: 1px solid #444;
  color: #fff;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  padding: 14px 20px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: background 0.2s, border-color 0.2s;
}

.githubBtn:hover:not(:disabled) {
  background: #2f363d;
  border-color: #555;
}

.githubBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.githubBtn svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border);
}

.divider span {
  position: relative;
  background: var(--bg-card);
  padding: 0 12px;
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ink-dim);
}
```

**Verificación:**
- [ ] Botón "Continuar con GitHub" aparece antes de los tabs
- [ ] Click en botón redirige a página de autorización de GitHub
- [ ] Loading state funciona durante redirección

---

### 2. Crear middleware para creación de perfil post-OAuth

**Archivos modificados:**
- `middleware.ts`

**Cambios:**

Verificar si usuario OAuth necesita perfil:
```typescript
// Después de verificar sesión exitosa
const { data: { user } } = await supabase.auth.getUser()

if (user && user.app_metadata.provider === 'github') {
  // Verificar si tiene perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // Si no existe, crear con datos de GitHub
  if (!profile) {
    const baseUsername = user.user_metadata.user_name || `user_${user.id.slice(0, 8)}`
    const username = await getUniqueUsername(supabase, baseUsername)
    
    await supabase.from('profiles').upsert({
      id: user.id,
      username: username,
      avatar_url: user.user_metadata.avatar_url || null,
    }, { onConflict: 'id' })
  }
}
```

Agregar helper `getUniqueUsername`:
```typescript
async function getUniqueUsername(
  supabase: SupabaseClient,
  baseUsername: string
): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', baseUsername)
    .maybeSingle()
  
  if (!data) return baseUsername
  
  let suffix = 1
  while (suffix < 100) { // límite de seguridad
    const candidate = `${baseUsername}_${suffix}`
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', candidate)
      .maybeSingle()
    
    if (!data) return candidate
    suffix++
  }
  
  // Fallback: usar timestamp
  return `${baseUsername}_${Date.now().toString().slice(-6)}`
}
```

**Verificación:**
- [ ] Usuario OAuth sin perfil se le crea automáticamente
- [ ] Username se toma de `user_metadata.user_name`
- [ ] Si username existe, se agrega sufijo numérico
- [ ] Avatar se guarda desde `user_metadata.avatar_url`

---

### 3. Remover referencias a Google OAuth

**Archivos modificados:**
- `components/auth/AuthForm.tsx`

**Cambios:**
- Buscar comentarios o código relacionado con Google
- Remover cualquier botón, función o referencia a `provider: 'google'`
- Si hay SVG de Google, eliminarlo

**Verificación:**
- [ ] No hay referencias a Google en el código
- [ ] Grep por 'google' no devuelve resultados en AuthForm

---

### 4. Testing end-to-end

**Como nuevo usuario con GitHub:**

1. Ir a `/auth`
2. Hacer clic en "CONTINUAR CON GITHUB"
3. Autorizar app en GitHub
4. Verificar redirección a `/biblioteca`
5. Verificar que perfil se creó con username de GitHub
6. Verificar que avatar de GitHub aparece en TopBar
7. Jugar un juego y verificar que score se guarda
8. Cerrar sesión
9. Volver a loguearse con GitHub
10. Verificar que perfil y scores se mantienen

**Como usuario existente con email:**

1. Crear cuenta con email
2. Cerrar sesión
3. Intentar login con GitHub usando mismo email
4. Verificar que Supabase vincula ambos métodos
5. Verificar que perfil existente se mantiene (no se duplica)
6. Cerrar sesión
7. Login con email → debe funcionar
8. Cerrar sesión
9. Login con GitHub → debe funcionar

**Username duplicado:**

1. Crear cuenta manual con username "testuser"
2. Cerrar sesión
3. Login con GitHub donde `user_name` es "testuser"
4. Verificar que nuevo usuario tiene username "testuser_1"
5. Repetir con otro usuario GitHub "testuser"
6. Verificar que tercero tiene username "testuser_2"

---

## Criterios de aceptación

### Autenticación
- [ ] Botón "CONTINUAR CON GITHUB" aparece antes de tabs
- [ ] Click redirige a página de autorización de GitHub
- [ ] Usuario puede autorizar app en GitHub
- [ ] Redirección post-autorización funciona (callback a `/api/auth/callback`)
- [ ] Sesión se crea automáticamente después de OAuth
- [ ] Usuario redirige a `/biblioteca` después de login exitoso

### Perfil automático
- [ ] Perfil se crea automáticamente para usuarios GitHub nuevos
- [ ] Username se toma de `user_metadata.user_name`
- [ ] Avatar se guarda desde `user_metadata.avatar_url`
- [ ] Si username ya existe, se agrega sufijo `_1`, `_2`, etc.
- [ ] Usa `.upsert()` para evitar duplicados (no falla si perfil ya existe)
- [ ] Perfil aparece correctamente en `/perfil`

### Vinculación de cuentas
- [ ] Usuario con email existente puede linkear GitHub (mismo email)
- [ ] Puede loguearse con ambos métodos después de vincular
- [ ] No se duplican perfiles al vincular cuentas
- [ ] Scores y datos se mantienen al vincular

### Limpieza
- [ ] No hay referencias a Google OAuth en el código
- [ ] `grep -r "google" components/auth/` no devuelve resultados
- [ ] Solo aparecen métodos: GitHub, Email, Guest

### General
- [ ] TypeScript compila sin errores
- [ ] No hay warnings en consola del browser
- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Funciona en desktop y móvil
- [ ] Loading states funcionan correctamente
- [ ] Errores de OAuth se manejan con mensajes claros

---

## Decisiones tomadas

1. **Botón antes de tabs** — GitHub como método principal, más prominente que Email/Guest. Usuario lo ve primero.

2. **Usar `/api/auth/callback` existente** — Reutilizar infraestructura. No crear nueva ruta de callback específica para GitHub.

3. **Username de GitHub directo** — No agregar prefijo `github_`. Más natural. Sufijo numérico solo si hay colisión.

4. **Sufijo numérico para duplicados** — Simple y predecible. Usuario puede identificar fácilmente su cuenta.

5. **Avatar automático** — Usar `avatar_url` de GitHub directamente. Mejora UX: usuario ve su avatar inmediatamente sin configuración adicional.

6. **Vinculación automática por email** — Supabase lo hace out-of-the-box. No requiere lógica custom.

7. **Middleware para creación de perfil** — Garantiza que perfil existe antes de redirección. Evita race conditions.

8. **Remover Google** — Simplificar opciones. GitHub cubre mayoría de casos de uso para desarrolladores.

9. **Guest mantiene su lugar** — Complementa a GitHub/Email. Para usuarios que quieren jugar sin cuenta.

10. **Límite de 100 intentos de sufijo** — Previene loops infinitos. Fallback a timestamp si se agota.

---

## Decisiones descartadas

1. **Prefijo `github_` en username** — Descartado. Hace usernames menos naturales. Sufijo numérico es más limpio.

2. **Selector de username post-OAuth** — Descartado. Agrega fricción. Usuario puede editar desde perfil si quiere (spec futura).

3. **Modal de confirmación de vinculación** — Descartado. Supabase vincula automáticamente por email. Usuario no necesita confirmación explícita.

4. **Botón dentro de tabs** — Descartado. OAuth debe estar fuera de tabs para ser método principal.

5. **Mantener Google OAuth** — Descartado. Usuario pidió simplicidad. GitHub cubre caso de uso principal.

6. **Mostrar provider en perfil** — Descartado. No es crítico. Usuario sabe con qué método se registró. Se puede agregar en spec futura.

7. **Re-sincronización de avatar** — Descartado. Avatar se guarda una vez. Si usuario cambia avatar en GitHub, no se actualiza automáticamente. Requiere lógica adicional.

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| **Username de GitHub contiene caracteres no permitidos** | Sanitizar username antes de guardar: solo alfanuméricos, guiones bajos y guiones medios. Reemplazar caracteres inválidos por `_`. |
| **Usuario no tiene username público en GitHub** | Usar fallback: `user_${user.id.slice(0, 8)}`. Siempre hay un username válido. |
| **Avatar URL de GitHub expira o se rompe** | Guardar URL tal cual. Si falla al cargar, mostrar avatar por defecto. No es crítico. |
| **Loop infinito en búsqueda de username único** | Límite de 100 intentos. Después, usar timestamp como sufijo. |
| **Callback no funciona en localhost** | Verificar que `http://localhost:3000/api/auth/callback` está en lista de Redirect URLs de Supabase. |
| **Email de GitHub es privado** | GitHub envía `user_metadata.email` con email privado si usuario lo configuró así. Supabase lo acepta normalmente. No hay problema. |
| **Usuario revoca autorización en GitHub después de registrarse** | Usuario pierde acceso vía GitHub pero puede usar método de email si vinculó. Si no, puede solicitar password reset o crear nueva cuenta. |

---

**FIN DE SPEC 13**
