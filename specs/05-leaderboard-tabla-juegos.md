# 05 — LEADERBOARD Y TABLA DE JUEGOS

**Estado:** Approved
**Depende de:** SPEC 03, SPEC 04
**Fecha:** 2026-10-11

**Objetivo:** Implementar un leaderboard global de top 10 scores para cada juego en su página de detalle, y una tabla de juegos en la home que muestre el estado actual de cada juego (nombre, última vez jugado, mejor score, botón para jugar).

---

## Alcance

### Incluido en esta especificación

- **Tabla de juegos en la home (`/`)**
  - Renderizar lista de juegos disponibles
  - Cada fila muestra: nombre del juego, última vez jugado (fecha/hora), mejor score personal, botón "Jugar"
  - Datos traídos de tabla `games` en Supabase
  - Datos personalizados traídos de tabla `scores` (último score, mejor score del usuario)
  - Funciona para usuarios autenticados y anónimos
  - Ordenamiento por nombre del juego (ascendente)

- **Leaderboard en cada página de juego (`/juego/[game]`)**
  - Renderizar top 10 scores de ese juego específico
  - Cada fila muestra: puesto (1-10), nombre del jugador, score
  - Datos traídos de tabla `scores` filtrado por `game_id`
  - Actualización en tiempo real via Supabase Realtime subscriptions
  - Si hay menos de 10 scores, mostrar solo los disponibles
  - Funciona para usuarios autenticados y anónimos

- **Integración con Supabase**
  - Usar tabla `scores` existente (fields: `id`, `user_id`, `game_id`, `score`, `created_at`)
  - Usar tabla `games` existente (fields: `id`, `name`, `description`, etc.)
  - Usar tabla `profiles` para obtener nombre del jugador

- **Manejo de datos anónimos**
  - Cuando un usuario no está autenticado, mostrar placeholder o "Anónimo" en leaderboard
  - En tabla de juegos: no mostrar "último jugado" ni "mejor score" si no hay usuario logueado

### NO incluido en esta especificación (se difiere)

- Filtros o búsqueda en tabla de juegos
- Paginación en leaderboard (top 10 es el máximo)
- Histórico de scores personales
- Exportar/descargar datos del leaderboard
- Compartir scores en redes sociales
- Notificaciones si alguien supera tu score
- Modo offline o caché local del leaderboard
- Ranking por período (semanal, mensual) — solo all-time

---

## Modelo de datos

### Estructura de tablas en Supabase (existentes, NO crear nuevas)

```typescript
// Tabla: games
interface Game {
  id: string                 // Ej: 'rocas', 'pacman', 'snake'
  name: string               // Ej: 'ASTEROIDES'
  description: string
  short_description: string
  category: string
  color: string
  created_at: string
  updated_at: string
}

// Tabla: scores
interface Score {
  id: uuid
  user_id: string | null     // null si es anónimo
  game_id: string            // 'rocas', 'pacman', etc.
  score: number
  created_at: string
}

// Tabla: profiles
interface Profile {
  id: uuid
  user_id: string
  username: string           // Nombre mostrado en leaderboard
  total_score: number
  total_games: number
  created_at: string
}
```

### Tipos TypeScript nuevos

```typescript
// components/leaderboard/types.ts
interface LeaderboardEntry {
  rank: number               // 1-10
  playerName: string         // Nombre del jugador o "Anónimo"
  score: number
  timestamp: string          // created_at
}

interface GameTableRow {
  gameId: string
  gameName: string
  lastPlayed: string | null  // ISO timestamp, null si nunca jugó
  bestScore: number | null   // null si nunca jugó
  isPending: boolean         // True si hay una request en progreso
}
```

---

## Plan de implementación

### 1. Crear hook `useLeaderboard` para fetchear y escuchar scores en tiempo real

**Archivos nuevos:**
- `hooks/useLeaderboard.ts`

**Cambios:**
- Hook que recibe `gameId` y retorna array `LeaderboardEntry[]`
- Usar `useEffect` para hacer query inicial a Supabase: `SELECT * FROM scores WHERE game_id = ? ORDER BY score DESC LIMIT 10`
- Usar `useEffect` para subscribirse a cambios en tiempo real via Supabase Realtime
- Retornar estado: `{ entries, isLoading, error }`
- Limpiar subscription al desmontar

**Pseudocódigo:**
```typescript
function useLeaderboard(gameId: string) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Query inicial
    const fetchScores = async () => {
      const { data } = await supabase
        .from('scores')
        .select('id, user_id, game_id, score, created_at')
        .eq('game_id', gameId)
        .order('score', { ascending: false })
        .limit(10)
      
      // Mapear a LeaderboardEntry con ranks y nombres
      const withRanks = data.map((s, i) => ({...}))
      setEntries(withRanks)
      setIsLoading(false)
    }
    
    fetchScores()
    
    // Subscribe a cambios en tiempo real
    const subscription = supabase
      .channel(`leaderboard-${gameId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'scores', filter: `game_id=eq.${gameId}` },
        (payload) => {
          // Re-fetch top 10 cuando hay insert nuevo
          fetchScores()
        }
      )
      .subscribe()
    
    return () => subscription.unsubscribe()
  }, [gameId])
  
  return { entries, isLoading, error }
}
```

**Verificación:**
```bash
npm run dev
# Navegar a /juego/rocas
# Verificar que carga leaderboard
# Crear un nuevo score en otra pestaña
# Verificar que leaderboard se actualiza automáticamente sin refresh
```

---

### 2. Crear componente `Leaderboard`

**Archivos nuevos:**
- `components/leaderboard/Leaderboard.tsx`

**Cambios:**
- Componente que renderiza tabla HTML con headers: "Puesto", "Jugador", "Score"
- Usar hook `useLeaderboard(gameId)` para obtener datos
- Mostrar skeleton loader si `isLoading`
- Mostrar mensajes vacío si no hay scores
- Estilos con Tailwind CSS
- Props: `gameId: string`

**Pseudocódigo:**
```typescript
export function Leaderboard({ gameId }: { gameId: string }) {
  const { entries, isLoading } = useLeaderboard(gameId)
  
  if (isLoading) return <SkeletonLoader />
  if (entries.length === 0) return <EmptyState />
  
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h2 className="text-lg font-bold mb-4">TOP 10 SCORES</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th>Puesto</th>
            <th>Jugador</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.id}>
              <td>{entry.rank}</td>
              <td>{entry.playerName}</td>
              <td className="font-mono">{entry.score.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Verificación:**
```bash
npm run dev
# Navegar a /juego/rocas
# Verificar que tabla Leaderboard aparece
# Verificar que estilos son consistentes con resto de app
```

---

### 3. Crear hook `useGameStats` para obtener stats personales por juego

**Archivos nuevos:**
- `hooks/useGameStats.ts`

**Cambios:**
- Hook que recibe array de `gameIds` (todos los juegos)
- Retorna map `{ gameId: GameTableRow }`
- Query a Supabase: para cada game, obtener último score (MAX created_at) y mejor score (MAX score)
- Filtrar por `user_id` del usuario logueado
- Si no hay usuario, retornar campos null
- Retornar estado: `{ stats, isLoading, error }`

**Pseudocódigo:**
```typescript
function useGameStats(gameIds: string[]) {
  const { user } = useAuth()
  const [stats, setStats] = useState<Record<string, GameTableRow>>({})
  
  useEffect(() => {
    if (!user) {
      // Anónimo: retornar stats vacíos
      setStats(gameIds.reduce((acc, id) => ({
        ...acc,
        [id]: { lastPlayed: null, bestScore: null, isPending: false }
      }), {}))
      return
    }
    
    const fetchStats = async () => {
      // Query: para cada game, obtener best score y last played
      for (const gameId of gameIds) {
        const { data } = await supabase
          .from('scores')
          .select('score, created_at')
          .eq('user_id', user.id)
          .eq('game_id', gameId)
          .order('score', { ascending: false })
          .limit(1)
        
        const best = data?.[0]?.score ?? null
        const last = data?.[0]?.created_at ?? null
        
        setStats(prev => ({
          ...prev,
          [gameId]: { bestScore: best, lastPlayed: last }
        }))
      }
    }
    
    fetchStats()
  }, [user, gameIds])
  
  return { stats, isLoading, error }
}
```

**Verificación:**
```typescript
// Crear dos scores para mismo usuario/game
// Verificar que useGameStats retorna best (máximo) y last (más reciente)
```

---

### 4. Crear componente `GamesTable`

**Archivos nuevos:**
- `components/games/GamesTable.tsx`

**Cambios:**
- Componente que renderiza tabla de juegos
- Headers: "Juego", "Última vez jugado", "Mejor score", "Acción"
- Usar hook `useGameStats` para obtener stats personales
- Cada fila tiene botón "JUGAR" que linkea a `/juego/[gameId]/jugar`
- Si no hay usuario logueado, mostrar `-` en columnas de stats (o escondidas)
- Estilos con Tailwind CSS
- Props: `games: Game[]`

**Pseudocódigo:**
```typescript
export function GamesTable({ games }: { games: Game[] }) {
  const gameIds = games.map(g => g.id)
  const { stats } = useGameStats(gameIds)
  
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
      <h2 className="text-lg font-bold mb-4">JUEGOS DISPONIBLES</h2>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            <th>Juego</th>
            <th>Última vez jugado</th>
            <th>Mejor score</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => {
            const gameStat = stats[game.id] || {}
            return (
              <tr key={game.id} className="border-b border-slate-800">
                <td>{game.name}</td>
                <td>{gameStat.lastPlayed ? formatDate(gameStat.lastPlayed) : '-'}</td>
                <td className="font-mono">{gameStat.bestScore ? gameStat.bestScore.toLocaleString() : '-'}</td>
                <td>
                  <Link href={`/juego/${game.id}/jugar`}>
                    <button className="btn-primary">JUGAR</button>
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

**Verificación:**
```bash
npm run dev
# Navegar a /
# Verificar que tabla de juegos aparece
# Verificar que botones "JUGAR" funcionan
# Loguearse y verificar que columnas de stats se llenan
```

---

### 5. Integrar `GamesTable` en home (`/page.tsx`)

**Archivos modificados:**
- `app/page.tsx`

**Cambios:**
- Importar componente `GamesTable`
- Fetchear lista de juegos de `lib/data.ts` (o de Supabase si se requiere)
- Pasar `games` a `<GamesTable />`
- Ubicar tabla debajo del hero section o en sección "Mis Juegos"

**Verificación:**
```bash
npm run dev
# Navegar a /
# Verificar que tabla de juegos aparece con todos los juegos
```

---

### 6. Integrar `Leaderboard` en página de juego (`/juego/[game]/page.tsx`)

**Archivos modificados:**
- `app/juego/[game]/page.tsx`

**Cambios:**
- Importar componente `Leaderboard`
- Pasar `gameId` prop al componente
- Ubicar debajo del canvas del juego o en sidebar derecho
- Asegurar que layout es responsivo (stacked en mobile, lado a lado en desktop)

**Verificación:**
```bash
npm run dev
# Navegar a /juego/rocas
# Verificar que Leaderboard aparece debajo/al lado del canvas
# Verificar que se actualiza en tiempo real al jugar
```

---

### 7. Verificación end-to-end

**Acciones a realizar:**

1. **Iniciar app:** `npm run dev`

2. **Verificar tabla de juegos (anónimo):**
   - Navegar a `/` sin loguearse
   - Verificar que aparece tabla de juegos
   - Verificar que columnas de stats están vacías o con `-`
   - Hacer click en "JUGAR" en algún juego

3. **Verificar leaderboard (anónimo):**
   - Navegar a `/juego/rocas`
   - Verificar que aparece leaderboard vacío o con pocos scores
   - Jugar una partida y guardar score
   - Refrescar página (F5)
   - Verificar que nuevo score aparece en leaderboard

4. **Verificar tiempo real:**
   - Abrir `/juego/rocas` en dos pestañas del mismo navegador
   - Jugar en una pestaña hasta game over
   - En otra pestaña, verificar que leaderboard se actualiza sin refresh

5. **Loguearse y verificar stats personales:**
   - Hacer login
   - Navegar a `/`
   - Verificar que tabla de juegos ahora muestra stats (última vez jugado, mejor score)
   - Jugar un juego
   - Volver a `/`
   - Verificar que stats se actualizaron

6. **Verificar consistencia de datos:**
   - Jugar Asteroides hasta game over
   - Verificar que score aparece en Supabase
   - Verificar que aparece en leaderboard
   - Verificar que aparece en tabla de juegos

**Criterio de éxito:** Todos los pasos anteriores funcionan sin errores.

---

## Criterios de aceptación

- [ ] Componente `GamesTable` renderiza en `/` (home)
- [ ] Tabla de juegos muestra: nombre, última vez jugado, mejor score, botón JUGAR
- [ ] Usuarios anónimos ven `-` en columnas de stats
- [ ] Usuarios logueados ven stats personales (last played, best score)
- [ ] Botón "JUGAR" linkea a `/juego/[gameId]/jugar` correctamente
- [ ] Componente `Leaderboard` renderiza en `/juego/[game]`
- [ ] Leaderboard muestra puesto (1-10), jugador, score
- [ ] Leaderboard ordena por score descendente
- [ ] Leaderboard muestra máximo 10 entradas
- [ ] Si hay menos de 10 scores, muestra solo los existentes
- [ ] Leaderboard carga en tiempo real (Realtime subscriptions funcionan)
- [ ] Al crear nuevo score, leaderboard se actualiza sin refresh (en vivo)
- [ ] Nombres de jugadores se muestran correctamente (de tabla `profiles`)
- [ ] Usuarios anónimos muestran como "Anónimo" o placeholder
- [ ] Hook `useLeaderboard` fetches correctamente
- [ ] Hook `useGameStats` fetches correctamente
- [ ] No hay race conditions o errores de sincronización
- [ ] Estilos de tabla son consistentes con diseño actual (Tailwind + dark mode)
- [ ] Componentes son responsivos (mobile, tablet, desktop)
- [ ] TypeScript compila sin errores (`npm run typecheck`)
- [ ] No hay console warnings o errors durante uso normal

---

## Decisiones tomadas

1. **Realtime Supabase para leaderboard**: Se decidió usar Supabase Realtime subscriptions en lugar de polling manual cada X segundos. Razón: Actualizaciones instantáneas, menos carga en servidor, mejor UX.

2. **Hook `useLeaderboard` reutilizable**: Se decidió crear hook separado en lugar de lógica inline en componente. Razón: Permite testeo unitario, reutilización en múltiples páginas, separación de concerns.

3. **Query separado por game en `useGameStats`**: Se decidió hacer query individual por cada `gameId` en lugar de un query de bulk. Razón: Si hay 20 juegos, 20 queries pequeños son más eficientes que 1 query grande con joins complejos. Plus es más fácil de cachear por game.

4. **No guardar leaderboard en caché local**: Se decidió siempre fetchear desde Supabase en lugar de guardar en localStorage. Razón: Leaderboard es información en tiempo real. Cachear lo haría stale rápidamente.

5. **Mostrar placeholder "-" para anónimos**: Se decidió que usuarios sin login ven `-` en columnas de stats en lugar de esconder las columnas. Razón: UX más clara (usuario sabe qué se muestra si se loguea), layout consistente.

6. **Stats personales solo si logueado**: Se decidió que tabla de juegos muestra stats solo para usuarios autenticados. Razón: Datos anónimos no se persisten (no hay `user_id`), así que no hay stats que mostrar.

---

## Decisiones descartadas

1. **Caché de leaderboard en localStorage**: Se descartó porque leaderboard es volatile (cambia constantemente). Mejor siempre fresco desde servidor.

2. **Polling en lugar de Realtime**: Se descartó porque Realtime es más eficiente y da mejor UX.

3. **Paginación de top 10 a top N configurable**: Se descartó para simplicidad. Top 10 es el estándar arcade.

4. **Mostrar ranking por semana/mes**: Se descartó como out-of-scope. Solo all-time rankings.

5. **Crear tabla `game_stats` dedicada en BD**: Se descartó porque query a `scores` es suficiente (INDEX en game_id + user_id hace que sea rápido).

---

## Riesgos identificados

1. **N+1 queries si hay muchos juegos**: Si home tiene 50 juegos y cada uno hace query a `scores`, pueden ser 50 queries. **Mitigación**: Usar batch query de Supabase o cambiar la lógica a un único query con UNION.

2. **Leaderboard sin actualizar si subscriber no se reconecta**: Si conexión Realtime se cae, el leaderboard no se actualiza. **Mitigación**: Agregar mecanismo de "re-check" cada 30 segundos, o botón manual "Refrescar".

3. **Performance de tabla si hay muchos juegos**: Renderizar tabla muy larga puede ser lento. **Mitigación**: Agregar paginación (10 juegos por página) si el número crece.

4. **Nombres de jugadores nulos**: Si `profiles` no tiene entry para cierto `user_id`, el nombre será null. **Mitigación**: Usar `COALESCE(profiles.username, 'Jugador Anónimo')` en query SQL.

5. **Timezone inconsistency en "última vez jugado"**: Si servidor está en UTC y usuario en otra zona, fecha será confusa. **Mitigación**: Siempre mostrar timestamp en UTC con indicación clara, o usar librería como `date-fns` para formateo local.

---

**FIN DE SPEC 05**
