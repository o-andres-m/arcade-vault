# Configuración de Supabase - Problemas y Soluciones

## Problemas Identificados

### 1. ❌ Email Rate Limit Exceeded (Error 429)
**Error**: `"email rate limit exceeded"` cuando intentas registrarte
**Causa**: Supabase Auth está enviando emails de confirmación para cada signup
**Solución**:

1. Ve a: https://supabase.com/dashboard/project/jnbgrcgsedbiznxttzmi
2. **Authentication** → **Email**
3. Busca "**Enable email confirmations**"
4. **Desactívalo** (toggle OFF)

---

### 2. ❌ Anonymous Sign-ins Disabled (Error 429)
**Error**: `"Anonymous sign-ins are disabled"` al hacer click en "JUGAR COMO INVITADO"
**Causa**: El provider de autenticación anónima no está habilitado
**Solución**:

1. Ve a: https://supabase.com/dashboard/project/jnbgrcgsedbiznxttzmi
2. **Authentication** → **Providers**
3. Busca "**Anonymous**"
4. **Actívalo** (toggle ON)

---

## Cambios Realizados en el Código

### `components/auth/AuthForm.tsx`
- ✅ Añadido manejo mejorado de errores con mensajes traducidos
- ✅ Configurado `emailRedirectTo` para magic links
- ✅ Mejor detección de rate limit errors (429)

---

## Esquema de Supabase - Estado Actual

### Tabla `profiles` ✅
- ✅ Creada y funcional
- ✅ RLS habilitado
- ✅ 5 filas de prueba
- Columnas: id, username, avatar_url, bio, total_games, total_score, created_at, updated_at

### Tabla `scores` ✅
- ✅ Creada y funcional
- ✅ RLS habilitado
- ✅ 40 filas de prueba (scores guardados)
- Columnas: id, user_id, game_id, score, created_at

---

## Flujo de Auth Esperado

### Sign Up (Registro)
1. Usuario rellena: username, email, password
2. Click "CREAR Y JUGAR"
3. `supabase.auth.signUp()` crea cuenta en `auth.users`
4. Perfil se inserta automáticamente en `profiles`
5. Redirige a `/biblioteca`

### Sign In (Login)
1. Usuario rellena: email, password
2. Click "ENTRAR AL VAULT"
3. `supabase.auth.signInWithPassword()` inicia sesión
4. Redirige a `/biblioteca`

### Guest Mode (Invitado)
1. Click "JUGAR COMO INVITADO"
2. `supabase.auth.signInAnonymously()` crea sesión anónima
3. Perfil anónimo se inserta en `profiles` con username temporal
4. Redirige a `/biblioteca`
5. Scores guardados como anónimos (se pierden al cerrar sesión)

---

## Checklist de Configuración

- [ ] **Email Confirmations**: DESACTIVADO
- [ ] **Anonymous Provider**: ACTIVADO
- [ ] **Email rate limit**: Configurado apropiadamente
- [ ] **CORS origins**: Incluye `http://localhost:3000`

---

## Prueba Manual Completa

Una vez hayas hecho los cambios en Supabase Dashboard:

1. **Recarga la app** (Ctrl+R o Cmd+R)
2. **Prueba Sign Up**:
   - Nombre: `testuser`
   - Email: `testuser@example.com` (usa distinto cada vez)
   - Contraseña: `Test1234!`
   - Click "CREAR Y JUGAR"
   - ✅ Debe redirigir a `/biblioteca`

3. **Prueba Guest Mode**:
   - Click "INICIAR SESIÓN"
   - Click "JUGAR COMO INVITADO"
   - ✅ Debe redirigir a `/biblioteca`
   - ✅ Nav debe mostrar "INVITADO"

4. **Verifica en Supabase Dashboard**:
   - Ve a **Table Editor**
   - Abre tabla `auth_users`
   - ✅ Debe haber nuevos usuarios creados
   - Abre tabla `profiles`
   - ✅ Debe haber perfiles correspondientes

---

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `email rate limit exceeded` | Email confirmations habilitadas | Desactivar email confirmations |
| `Anonymous sign-ins are disabled` | Provider anónimo deshabilitado | Activar Anonymous provider |
| `User already registered` | Email ya existe | Usar otro email |
| `Invalid email` | Email mal formado | Usar email válido (ej: test@example.com) |
| `Password too weak` | Contraseña < 6 chars | Usar contraseña más fuerte |

---

## URLs Útiles

- **Dashboard**: https://supabase.com/dashboard/project/jnbgrcgsedbiznxttzmi
- **Authentication Settings**: https://supabase.com/dashboard/project/jnbgrcgsedbiznxttzmi/auth/providers
- **Table Editor**: https://supabase.com/dashboard/project/jnbgrcgsedbiznxttzmi/editor

---

## Próximas Tareas

Una vez que el registro y guest mode funcionen:

1. ✅ Probar login con email/password
2. ✅ Probar edición de perfil (`/perfil`)
3. ✅ Probar guardado de scores
4. ✅ Probar leaderboard (`/salon`)
5. ✅ Probar Realtime subscriptions
6. ✅ Probar logout

