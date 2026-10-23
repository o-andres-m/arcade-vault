# 10 — NOMBRE DE JUGADOR EN GAME OVER

**Estado:** Approved
**Depende de:** SPEC 03 (Implementación Supabase)  
**Fecha:** 2026-10-23

**Objetivo:** Mejorar el flujo de guardado de scores en el modal de game over, permitiendo que usuarios invitados ingresen su nombre para guardar en Supabase, mostrando el username readonly para usuarios logueados, y corrigiendo el bug de alineación del botón GUARDAR.

---

## Alcance

### Incluido en esta especificación

- **Campo `display_name` en tabla `scores`**
  - Agregar columna nullable `display_name TEXT` a la tabla `scores` en Supabase
  - Permite almacenar el nombre del jugador (tanto invitados como usuarios logueados)
  - Para usuarios logueados: se copia automáticamente de `profiles.username`
  - Para invitados: se obtiene del input en el modal de game over

- **Modificación de RLS policies**
  - Permitir INSERT de scores sin `user_id` (invitados) si tienen `display_name`
  - Mantener policy existente para usuarios logueados
  - Agregar policy para invitados: `user_id IS NULL AND display_name IS NOT NULL`

- **Input de nombre en modal de game over**
  - **Para invitados:** Mostrar input editable que pide el nombre
  - **Para usuarios logueados:** Mostrar input readonly con el username de `profiles.username`
  - Input siempre visible (no condicional por tipo de juego)
  - Auto-mayúsculas en el input
  - Validación: 1-10 caracteres, solo alfanuméricos
  - Default: 'PLAYER1' si está vacío al guardar

- **Persistencia del nombre de invitado**
  - Guardar en localStorage con key `av_guest_name`
  - Autocompletar el input con el nombre guardado en próximas partidas
  - El invitado puede editar el nombre si quiere cambiarlo

- **Obtención del username para usuarios logueados**
  - Consultar `profiles.username` al montar el modal de game over
  - Si no existe perfil (edge case), usar email del usuario
  - Mostrar en el input con atributo `readOnly` (no editable)

- **Fix de alineación del botón GUARDAR**
  - Agregar `justify-content: center` a la clase `.inputRow` en GamePlayer.module.css
  - Asegura que el botón esté centrado cuando está solo (sin input de nombre antes)

- **Actualización de leaderboard**
  - Invitados con `display_name` aparecen en el leaderboard global de `/salon`
  - Query de leaderboard debe usar `display_name` si existe, si no, username del perfil
  - Formato: `display_name ?? profiles.username ?? 'ANÓNIMO'`

- **Compatibilidad con código existente**
  - Migrar lógica de guardado de scores en `GamePlayer.tsx`
  - Mantener compatibilidad con los 4 juegos implementados (Asteroides, Arkanoid, Snake, Tetris)
  - Todos los juegos usan el mismo modal y flujo de guardado

### NO incluido en esta especificación (se difiere)

- Validación de nombres duplicados (no hay restricción de unicidad)
- Sistema de rankings por usuario (sigue siendo por score individual)
- Edición del display_name desde el perfil de usuario
- Historial de nombres usados por un invitado
- Migración de scores existentes en localStorage a Supabase
- Sincronización de scores de invitados si luego crean cuenta
- Límite de scores guardados por invitado (sin rate limiting)
- Avatar o ícono junto al display_name en leaderboard

---

## Modelo de datos

### Cambios en tabla `scores`

**Nueva columna:**
```sql
ALTER TABLE scores ADD COLUMN display_name TEXT;
```

**Schema actualizado:**
```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Ahora nullable
  game_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0),
  display_name TEXT,  -- Nuevo campo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Constraint: al menos uno de user_id o display_name debe existir
ALTER TABLE scores ADD CONSTRAINT scores_user_or_name_check 
  CHECK (user_id IS NOT NULL OR display_name IS NOT NULL);
```

**Modificación de columna `user_id`:**
```sql
ALTER TABLE scores ALTER COLUMN user_id DROP NOT NULL;
```

### RLS Policies actualizadas

**Policy para lectura (sin cambios):**
```sql
CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT
  USING (true);
```

**Policy para INSERT de usuarios logueados (actualizada):**
```sql
CREATE POLICY "Users can insert their own scores"
  ON scores FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id AND user_id IS NOT NULL)
  );
```

**Policy nueva para INSERT de invitados:**
```sql
CREATE POLICY "Guests can insert scores with display_name"
  ON scores FOR INSERT
  WITH CHECK (
    (user_id IS NULL AND display_name IS NOT NULL AND length(display_name) >= 1)
  );
```

### LocalStorage keys

```typescript
'av_guest_name': string  // Nombre del invitado guardado (max 10 chars, uppercase)
```

Nota: La key `av_scores` existente para localStorage queda obsoleta, ya que ahora todos los scores (invitados y usuarios) se guardan en Supabase.

### Tipo TypeScript actualizado

```typescript
interface Score {
  id: string;
  user_id: string | null;  // Ahora nullable
  game_id: string;
  score: number;
  display_name?: string;    // Nuevo campo opcional
  created_at: string;
  
  // Campos para UI (join con profiles)
  username?: string;        // De profiles.username
  avatar_url?: string;      // De profiles.avatar_url
}
```

### Validación del nombre

```typescript
interface NameValidation {
  minLength: 1;
  maxLength: 10;
  pattern: /^[A-Z0-9]+$/;  // Solo mayúsculas y números
  default: 'PLAYER1';       // Si está vacío al guardar
}
```

---

## Plan de implementación

### 1. Crear migración de Supabase

**Archivos nuevos:**
- `supabase/migrations/YYYYMMDD_add_display_name_to_scores.sql`

**Cambios:**
- Agregar columna `display_name TEXT` a la tabla `scores`
- Modificar `user_id` para permitir NULL: `ALTER COLUMN user_id DROP NOT NULL`
- Agregar constraint: `CHECK (user_id IS NOT NULL OR display_name IS NOT NULL)`
- Crear nueva RLS policy para invitados: `Guests can insert scores with display_name`
- Mantener policy existente para usuarios logueados

**Migration SQL:**
```sql
-- Agregar columna display_name
ALTER TABLE scores ADD COLUMN display_name TEXT;

-- Hacer user_id nullable
ALTER TABLE scores ALTER COLUMN user_id DROP NOT NULL;

-- Constraint: al menos uno debe existir
ALTER TABLE scores ADD CONSTRAINT scores_user_or_name_check 
  CHECK (user_id IS NOT NULL OR display_name IS NOT NULL);

-- Nueva policy para invitados
CREATE POLICY "Guests can insert scores with display_name"
  ON scores FOR INSERT
  WITH CHECK (
    (user_id IS NULL AND display_name IS NOT NULL AND length(display_name) >= 1)
  );
```

**Verificación:**
- Ejecutar migración con `supabase db push` (o desde Supabase dashboard)
- Verificar que columna `display_name` existe en tabla `scores`
- Verificar que `user_id` es nullable
- Verificar que policies están activas en RLS

---

### 2. Actualizar tipos TypeScript

**Archivos modificados:**
- `types/index.ts` (o donde esté definido el tipo `Score`)

**Cambios:**
- Modificar interfaz `Score`:
  ```typescript
  export interface Score {
    id: string;
    user_id: string | null;  // Cambiar a nullable
    game_id: string;
    score: number;
    display_name?: string;    // Agregar campo opcional
    created_at: string;
    username?: string;        // Mantener para UI (join)
    avatar_url?: string;      // Mantener para UI (join)
  }
  ```

**Verificación:**
- TypeScript compila sin errores
- No hay warnings sobre tipos de Score en el proyecto

---

### 3. Crear hook para obtener username del perfil

**Archivos nuevos:**
- `hooks/useProfile.ts`

**Cambios:**
- Hook `useProfile(userId: string | null)` que:
  - Consulta `profiles` table para obtener `username` y `avatar_url`
  - Retorna `{ username, avatar_url, loading, error }`
  - Si `userId` es null, retorna null inmediatamente (sin query)
  - Usa Supabase client de `lib/supabase/client.ts`

**Código del hook:**
```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

interface Profile {
  username: string;
  avatar_url: string | null;
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    
    supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          setError(error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      })
      .finally(() => setLoading(false));
  }, [userId]);

  return { profile, loading, error };
}
```

**Verificación:**
- Hook se puede importar desde `@/hooks/useProfile`
- Retorna profile correctamente para usuarios logueados
- Retorna null para invitados

---

### 4. Modificar función saveScore en lib/supabase/scores.ts

**Archivos modificados:**
- `lib/supabase/scores.ts`

**Cambios:**
- Agregar parámetro opcional `displayName?: string` a la función `saveScore`
- Si `displayName` está presente, incluirlo en el INSERT
- Si el usuario está logueado, obtener su username de profiles y usarlo como `display_name`
- Signature nueva:
  ```typescript
  export async function saveScore(
    gameId: string, 
    score: number, 
    displayName?: string
  ): Promise<void>
  ```

**Lógica actualizada:**
```typescript
export async function saveScore(
  gameId: string,
  score: number,
  displayName?: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  let finalDisplayName = displayName;
  
  // Si el usuario está logueado, obtener su username
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single();
    
    finalDisplayName = profile?.username || user.email?.split('@')[0] || 'USER';
  }
  
  const { error } = await supabase.from('scores').insert({
    user_id: user?.id || null,
    game_id: gameId,
    score: score,
    display_name: finalDisplayName,
  });

  if (error) {
    console.error('Error saving score:', error);
    throw error;
  }
}
```

**Verificación:**
- Función guarda scores correctamente para usuarios logueados (con username)
- Función guarda scores correctamente para invitados (con displayName pasado)
- Error se lanza correctamente si falla el INSERT

---

### 5. Actualizar componente GamePlayer.tsx

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**

**Imports:**
```typescript
import { useProfile } from '@/hooks/useProfile';
```

**State nuevo/modificado:**
```typescript
const [playerName, setPlayerName] = useState('');  // Renombrar 'name' a 'playerName' para claridad
const { profile } = useProfile(user?.id || null);
```

**useEffect para cargar nombre de invitado desde localStorage:**
```typescript
useEffect(() => {
  // Si es invitado, cargar nombre guardado
  if (!user) {
    const savedName = localStorage.getItem('av_guest_name');
    if (savedName) {
      setPlayerName(savedName);
    }
  }
}, [user]);
```

**useEffect para cargar username de usuario logueado:**
```typescript
useEffect(() => {
  // Si es usuario logueado, cargar su username
  if (user && profile) {
    setPlayerName(profile.username || user.email?.split('@')[0] || 'USER');
  }
}, [user, profile]);
```

**Modificar handleSaveScore:**
```typescript
const handleSaveScore = async () => {
  setIsSaving(true);
  
  // Validar y limpiar nombre
  const cleanName = playerName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const finalName = cleanName.slice(0, 10) || 'PLAYER1';

  try {
    // Guardar en Supabase (tanto para usuarios como invitados)
    if (isAsteroidsGame || isArkanoidGame || isSnakeGame || isTetrisGame) {
      await saveScore(game.id, score, finalName);
      
      // Si es invitado, guardar nombre en localStorage
      if (!user) {
        localStorage.setItem('av_guest_name', finalName);
      }
    }

    setSaved(true);
  } catch (error) {
    console.error('Error saving score:', error);
    alert('No se pudo guardar el score. Por favor, intenta de nuevo.');
  } finally {
    setIsSaving(false);
  }
};
```

**Modificar JSX del modal (líneas 496-510):**
```tsx
{!saved ? (
  <>
    <div className={styles.inputRow}>
      <input
        type="text"
        placeholder="TU NOMBRE"
        value={playerName}
        onChange={(e) => {
          if (!user) {  // Solo editable si es invitado
            setPlayerName(e.target.value.toUpperCase().slice(0, 10));
          }
        }}
        maxLength={10}
        readOnly={!!user}  // Readonly si es usuario logueado
        className={styles.nameInput}
      />
      <button className="btn" onClick={handleSaveScore} disabled={isSaving}>
        {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
      </button>
    </div>
    {user && (
      <div className={styles.nameHint}>
        Usuario logueado (nombre no editable)
      </div>
    )}
  </>
) : (
  <div className={styles.toastSaved}>PUNTUACIÓN GUARDADA_</div>
)}
```

**Verificación:**
- Input aparece para todos los juegos (no condicional)
- Para invitados: input editable, nombre se guarda en localStorage
- Para usuarios logueados: input readonly con username, no editable
- Botón GUARDAR funciona correctamente para ambos casos
- Score se guarda en Supabase con display_name

---

### 6. Agregar estilos para hint de usuario logueado

**Archivos modificados:**
- `components/games/GamePlayer.module.css`

**Cambios:**

**Agregar justify-content a .inputRow (línea 335):**
```css
.inputRow {
  display: flex;
  gap: 8px;
  margin: 22px 0 12px;
  justify-content: center;  /* Nuevo: centrar contenido */
}
```

**Agregar clase nueva .nameHint:**
```css
.nameHint {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--ink-faint);
  text-align: center;
  margin-top: 4px;
  letter-spacing: 0.08em;
}
```

**Agregar estilo para input readonly:**
```css
.nameInput:read-only {
  background: var(--bg-2);
  cursor: not-allowed;
  opacity: 0.8;
}
```

**Verificación:**
- Botón GUARDAR está centrado cuando no hay input antes
- Hint de "Usuario logueado" se ve debajo del input
- Input readonly tiene estilo diferenciado

---

### 7. Actualizar query de leaderboard

**Archivos modificados:**
- `lib/supabase/scores.ts` (o donde esté la función que obtiene scores para leaderboard)

**Cambios:**
- Modificar query para incluir `display_name` en el SELECT
- Usar `display_name` si existe, si no, `profiles.username`, si no, 'ANÓNIMO'
- Ejemplo con join:
  ```typescript
  const { data, error } = await supabase
    .from('scores')
    .select(`
      *,
      profiles:user_id (username, avatar_url)
    `)
    .eq('game_id', gameId)
    .order('score', { ascending: false })
    .limit(10);
  
  // Mapear para obtener display name
  const formattedScores = data?.map(score => ({
    ...score,
    displayName: score.display_name || score.profiles?.username || 'ANÓNIMO'
  }));
  ```

**Verificación:**
- Leaderboard muestra nombres de invitados correctamente
- Leaderboard muestra usernames de usuarios logueados
- No hay errores si faltan datos (usa 'ANÓNIMO' como fallback)

---

### 8. Actualizar componente de leaderboard

**Archivos modificados:**
- `components/leaderboard/LeaderboardTable.tsx` (o similar)

**Cambios:**
- Usar `displayName` en lugar de `username` para mostrar el nombre del jugador
- Mantener avatar solo si existe (usuarios logueados)
- Formato:
  ```tsx
  <td>{score.displayName || 'ANÓNIMO'}</td>
  ```

**Verificación:**
- Leaderboard muestra correctamente nombres de invitados
- Leaderboard muestra correctamente usernames de usuarios
- No hay avatares para invitados (o mostrar ícono genérico)

---

### 9. Eliminar código obsoleto de localStorage para scores

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**
- Eliminar lógica de guardado en localStorage de scores (líneas 167-181)
- La key `av_scores` en localStorage queda obsoleta
- Solo mantener guardado de `av_guest_name`

**Código a eliminar:**
```typescript
// ELIMINAR ESTE BLOQUE:
else {
  // Guardar en localStorage
  const newScore: Score = {
    id: `local-${Date.now()}`,
    user_id: 'local',
    game_id: game.id,
    score: score,
    created_at: new Date().toISOString(),
    game: game.id,
    name: playerName,
    at: Date.now(),
  };

  const existingScores = localStorage.getItem("av_scores");
  const scores: Score[] = existingScores ? JSON.parse(existingScores) : [];
  scores.push(newScore);
  localStorage.setItem("av_scores", JSON.stringify(scores));
}
```

**Verificación:**
- Ya no se guardan scores en localStorage (solo en Supabase)
- La key `av_guest_name` sigue funcionando para recordar nombre de invitado

---

### 10. Testing end-to-end

**Checklist:**

**Como invitado:**
- [ ] Al perder una partida, aparece modal de game over
- [ ] Input de nombre aparece vacío la primera vez
- [ ] Puedo escribir un nombre (1-10 caracteres, solo alfanuméricos)
- [ ] Se convierte automáticamente a mayúsculas
- [ ] Al hacer clic en GUARDAR:
  - Score se guarda en Supabase con `display_name`
  - Nombre se guarda en localStorage (`av_guest_name`)
  - Aparece mensaje "PUNTUACIÓN GUARDADA_"
- [ ] En la siguiente partida, el input se autocompleta con el nombre guardado
- [ ] Puedo editar el nombre si quiero cambiarlo
- [ ] Mi score aparece en el leaderboard de `/salon` con mi nombre

**Como usuario logueado:**
- [ ] Al perder una partida, aparece modal de game over
- [ ] Input de nombre muestra mi username de `profiles.username`
- [ ] El input tiene atributo `readOnly` (no puedo editarlo)
- [ ] Se muestra hint "Usuario logueado (nombre no editable)"
- [ ] Al hacer clic en GUARDAR:
  - Score se guarda en Supabase con `display_name` = mi username
  - No se guarda nada en localStorage
  - Aparece mensaje "PUNTUACIÓN GUARDADA_"
- [ ] Mi score aparece en el leaderboard de `/salon` con mi username

**Fix visual:**
- [ ] Botón GUARDAR está centrado horizontalmente en el modal
- [ ] Layout del modal se ve correcto en desktop y móvil

**General:**
- [ ] TypeScript compila sin errores
- [ ] No hay warnings en consola del browser
- [ ] Migración de Supabase se ejecutó correctamente
- [ ] RLS policies permiten INSERT de invitados y usuarios
- [ ] Funciona en los 4 juegos implementados (Asteroides, Arkanoid, Snake, Tetris)

---

## Criterios de aceptación

- [ ] Tabla `scores` tiene columna `display_name TEXT` nullable
- [ ] Columna `user_id` es nullable en tabla `scores`
- [ ] Constraint `scores_user_or_name_check` existe y funciona
- [ ] RLS policy "Guests can insert scores with display_name" está activa
- [ ] Hook `useProfile` retorna username correctamente para usuarios logueados
- [ ] Función `saveScore` acepta parámetro `displayName` opcional
- [ ] GamePlayer muestra input de nombre en modal de game over para todos los juegos
- [ ] Input es editable para invitados (sin usuario logueado)
- [ ] Input es readonly para usuarios logueados (muestra username)
- [ ] Validación de nombre funciona: 1-10 chars, solo alfanuméricos, auto-mayúsculas
- [ ] Default 'PLAYER1' se aplica si nombre está vacío al guardar
- [ ] Nombre de invitado se guarda en localStorage (`av_guest_name`)
- [ ] Nombre de invitado se autocompleta en próximas partidas
- [ ] Score de invitado se guarda en Supabase con `display_name`
- [ ] Score de usuario se guarda en Supabase con `display_name` = username
- [ ] Botón GUARDAR está centrado en el modal (fix de `.inputRow`)
- [ ] Leaderboard muestra `display_name` si existe, si no `username`, si no 'ANÓNIMO'
- [ ] Invitados aparecen en leaderboard global de `/salon` con su nombre
- [ ] No hay errores en consola del browser
- [ ] TypeScript compila sin errores
- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Funciona en desktop y móvil

---

## Decisiones tomadas

1. **Agregar campo `display_name` a tabla `scores`** — Solución más limpia que crear tabla separada. Permite guardar scores de invitados en Supabase junto con usuarios logueados.

2. **Hacer `user_id` nullable** — Necesario para permitir scores de invitados sin cuenta. Constraint `CHECK` asegura que al menos uno de `user_id` o `display_name` existe.

3. **Guardar nombre de invitado en localStorage** — Mejora UX al recordar el nombre entre partidas. No requiere backend adicional.

4. **Input readonly para usuarios logueados** — Evita confusión. El username viene del perfil y no debe ser editable desde aquí. Si el usuario quiere cambiar su username, lo hace desde `/perfil`.

5. **Validación estricta de nombre** — Solo alfanuméricos, 1-10 chars. Evita caracteres especiales que puedan causar problemas de encoding o XSS. Auto-mayúsculas mantiene estética arcade.

6. **Default 'PLAYER1'** — Nombre clásico arcade si el input está vacío. Mejor que 'GUEST' o 'ANÓNIMO' para mantener el tema retro.

7. **Eliminar guardado de scores en localStorage** — Ya no es necesario. Todos los scores (invitados y usuarios) se guardan en Supabase. Simplifica lógica y reduce duplicación.

8. **Invitados en leaderboard global** — Permitir que invitados compitan en el leaderboard incentiva el juego sin forzar registro. Scores son verificables porque están en Supabase.

9. **Obtener username en saveScore** — Más confiable que pasarlo como parámetro. Asegura que siempre usamos el username actualizado del perfil.

10. **Hint "Usuario logueado"** — Feedback claro de por qué el input no es editable. Evita que usuarios logueados piensen que es un bug.

---

## Decisiones descartadas

1. **Crear tabla separada `guest_scores`** — Descartado. Complica queries del leaderboard. Mejor unificar en la misma tabla `scores` con `display_name`.

2. **Permitir editar username desde modal de game over** — Descartado. Edición de username es una acción de perfil, no debe estar en un modal de juego. Mantiene separación de concerns.

3. **Validar unicidad de display_name** — Descartado. No hay razón para restringir nombres duplicados. Múltiples jugadores pueden usar 'PLAYER1' o 'AAA'.

4. **Sincronizar scores de localStorage a Supabase** — Descartado. Migraciones de datos antiguas son complejas y propensas a errores. Los scores viejos quedan en localStorage (no se muestran en leaderboard global).

5. **Rate limiting para invitados** — Descartado. Agregar complejidad innecesaria. Si se detecta abuso, se puede agregar en spec futura.

6. **Usar email como fallback en lugar de 'USER'** — Descartado. Emails largos rompen el layout del leaderboard. Mejor usar un username genérico corto.

7. **Mostrar avatar genérico para invitados** — Descartado. Requiere agregar assets o generar avatares dinámicos. Se puede agregar en spec futura si se desea.

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| **Migración de DB falla si hay scores sin user_id ni display_name** | Verificar que todos los scores existentes tienen `user_id` antes de migrar. Agregar data migration que setea `display_name = 'LEGACY'` para scores sin user_id existentes. |
| **RLS policy muy permisiva permite spam de scores de invitados** | Policy actual no tiene rate limiting. Si se detecta abuso, agregar trigger que limite inserts por IP/device (spec futura). |
| **Username de usuario puede cambiar después de guardar score** | Score guarda el `display_name` en el momento del guardado, no hay relación dinámica. Si el usuario cambia su username, scores viejos mantienen el nombre antiguo. Aceptable. |
| **Usuarios logueados sin perfil (edge case)** | Usar fallback a `user.email.split('@')[0]` o 'USER'. Poco probable porque auth flow crea perfil automáticamente, pero cubrimos el caso. |
| **Input readonly puede ser confuso sin hint visible** | Agregar texto "Usuario logueado (nombre no editable)" debajo del input. Color faint para que no distraiga. |
| **localStorage del nombre de invitado se puede perder** | Esperado. Si el invitado borra cookies/localStorage, pierde el nombre guardado. Tendrá que ingresarlo de nuevo. No es crítico. |
| **Leaderboard query más compleja con join a profiles** | Query hace LEFT JOIN porque no todos los scores tienen user_id. Performance debe ser aceptable con índices existentes. Monitorear en producción. |

---

**FIN DE SPEC 10**
