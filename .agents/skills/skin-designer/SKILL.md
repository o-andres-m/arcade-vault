---
name: skin-designer
description: |
  Implementa un sistema de selección de 3 paletas de colores (skins) para todos los juegos
  de Arcade Vault. Agrega selector visual al lado del botón de Pausa en el HUD del GamePlayer.
disable-model-invocation: false
argument-hint: "[game-id|all]"
allowed-tools:
  Read, Write, Edit, Grep, Bash(ls:*), Bash(find:*), Bash(grep:*)
---

# Skin Designer Agent

## Misión

Implementar un sistema unificado de **selección de skins** (paletas de colores) para todos los juegos de Arcade Vault, permitiendo que cada juego tenga 3 paletas de colores personalizables que el usuario puede cambiar desde el HUD durante el gameplay.

## Referencia

El sistema ya está implementado en **Tetris** (`components/games/TetrisGame.tsx`). Este agente debe replicar esa funcionalidad para los demás juegos siguiendo el mismo patrón de diseño.

## Alcance

**Juegos a modificar:**
- `AsteroidsGame.tsx` - Asteroides (SHOOTER)
- `ArkanoidGame.tsx` - Arkanoid (ARCADE)
- `SnakeGame.tsx` - Snake (PUZZLE)

**Componente común:**
- `GamePlayer.tsx` - Agregar selector de skin para todos los juegos (ya existe para Tetris)

**Patrón de Tetris:**
- 3 paletas: `neon`, `pastel`, `retro`
- Selector tipo `<select>` con emojis en el HUD
- Estado guardado en `localStorage`
- Props `colorPalette` y `onColorPaletteChange` en el componente del juego

## Argumentos

```bash
/skin-designer [game-id|all]
```

- **Sin argumentos o `all`**: Implementar para TODOS los juegos pendientes (recomendado)
- **`rocas`**: Solo Asteroides
- **`arkanoid`**: Solo Arkanoid
- **`snake`**: Solo Snake

## Fase 1: Análisis

**Goal**: Entender la estructura actual de cada juego y cómo Tetris implementa el sistema de skins.

### Paso 1.1: Leer referencia de Tetris

Leer los siguientes archivos para entender el patrón:

```bash
Read components/games/TetrisGame.tsx
Read lib/game/tetris/constants.ts
Read lib/game/tetris/types.ts
Read components/games/GamePlayer.tsx (líneas 1-50 y 220-235)
```

**Extraer de la referencia:**
- Cómo se define `ColorPalette` type
- Cómo se almacenan las paletas en `constants`
- Cómo se pasa la paleta como prop al componente
- Cómo se renderiza el selector en GamePlayer
- Cómo se guarda la preferencia en localStorage

### Paso 1.2: Analizar estructura de cada juego

Para cada juego objetivo, identificar:

**Asteroides (`AsteroidsGame.tsx`):**
- Variables de color actuales (¿hardcoded?)
- Dónde se usa el canvas
- Función(es) de renderizado
- Elementos coloreables: nave, asteroides, proyectiles, explosiones

**Arkanoid (`ArkanoidGame.tsx`):**
- Variables de color actuales
- Canvas y contexto 2D
- Función(es) de renderizado
- Elementos coloreables: paddle, pelota, ladrillos, power-ups

**Snake (`SnakeGame.tsx`):**
- Variables de color actuales
- Canvas y contexto 2D
- Función(es) de renderizado
- Elementos coloreables: serpiente, comida, grid, obstáculos

**Output de esta fase:**
- Lista de colores actuales por juego
- Lista de elementos coloreables por juego
- Estrategia de integración para cada juego

---

## Fase 2: Diseño de Paletas

**Goal**: Definir 3 paletas de colores coherentes y temáticas para cada juego.

### Paso 2.1: Definir esquema de paletas

Cada juego tendrá 3 paletas con nombres consistentes:

- **`neon`** - Colores brillantes y vibrantes (ácidos, neón)
- **`pastel`** - Colores suaves y claros (pasteles, candy)
- **`retro`** - Colores clásicos arcade (primarios saturados)

### Paso 2.2: Crear estructura de constantes

Para cada juego, crear un archivo `lib/game/[juego]/constants.ts` (si no existe) con:

```typescript
export const COLOR_PALETTES = {
  neon: {
    primary: '#39ff14',    // Color principal del juego
    secondary: '#ff006e',  // Color secundario
    accent: '#00ffff',     // Color de acento
    // ... más colores según necesidad del juego
  },
  pastel: {
    primary: '#a8e6cf',
    secondary: '#ffd3b6',
    accent: '#ffaaa5',
    // ...
  },
  retro: {
    primary: '#00ffff',
    secondary: '#ff00ff',
    accent: '#ffff00',
    // ...
  },
} as const;

export type ColorPalette = 'neon' | 'pastel' | 'retro';
export const DEFAULT_COLOR_PALETTE: ColorPalette = 'retro';
```

**Criterios para elegir colores:**
- **Contraste**: Los colores deben ser distinguibles entre sí
- **Legibilidad**: Deben verse bien sobre fondo negro
- **Coherencia**: La paleta debe sentirse temática (neon = brillante, pastel = suave, retro = clásico)
- **Accesibilidad**: Evitar combinaciones problemáticas para daltónicos

### Paso 2.3: Mapeo de colores por juego

**Asteroides:**
- `ship`: Color de la nave del jugador
- `asteroid`: Color de los asteroides
- `bullet`: Color de los proyectiles
- `explosion`: Color de las explosiones
- `particle`: Color de partículas

**Arkanoid:**
- `paddle`: Color de la paleta
- `ball`: Color de la pelota
- `brick1`, `brick2`, `brick3`: Colores de ladrillos (3 tipos)
- `powerup`: Color de power-ups

**Snake:**
- `snakeHead`: Color de la cabeza de la serpiente
- `snakeBody`: Color del cuerpo
- `food`: Color de la comida
- `grid`: Color de la cuadrícula (opcional)

---

## Fase 3: Implementación por Juego

**Goal**: Modificar cada juego para aceptar y usar paletas de colores dinámicas.

### Paso 3.1: Patrón de implementación

Para cada juego, seguir estos pasos:

**A. Crear/actualizar archivo de constantes**

```typescript
// lib/game/[juego]/constants.ts
export const COLOR_PALETTES = { /* ... */ };
export type ColorPalette = 'neon' | 'pastel' | 'retro';
export const DEFAULT_COLOR_PALETTE: ColorPalette = 'retro';
```

**B. Modificar el componente del juego**

1. **Imports**: Agregar tipos y constantes
   ```typescript
   import { COLOR_PALETTES, ColorPalette, DEFAULT_COLOR_PALETTE } from '@/lib/game/[juego]/constants';
   ```

2. **Props**: Agregar `colorPalette` y `onColorPaletteChange`
   ```typescript
   interface GameProps {
     onGameOver: (score: number) => void;
     isPaused: boolean;
     onScoreChange?: (score: number) => void;
     colorPalette?: ColorPalette;
     onColorPaletteChange?: (palette: ColorPalette) => void;
   }
   ```

3. **State**: Inicializar estado de paleta
   ```typescript
   const [colorPalette, setColorPalette] = useState<ColorPalette>(
     initialColorPalette || DEFAULT_COLOR_PALETTE
   );
   ```

4. **LocalStorage**: Cargar/guardar preferencia
   ```typescript
   useEffect(() => {
     if (!initialColorPalette) {
       const saved = localStorage.getItem('[juego]-color-palette') as ColorPalette | null;
       if (saved && (saved === 'neon' || saved === 'pastel' || saved === 'retro')) {
         setColorPalette(saved);
       }
     }
   }, []);

   const handleColorPaletteChange = (palette: ColorPalette) => {
     setColorPalette(palette);
     localStorage.setItem('[juego]-color-palette', palette);
     if (onColorPaletteChange) {
       onColorPaletteChange(palette);
     }
   };
   ```

5. **Rendering**: Usar colores de la paleta activa
   ```typescript
   const colors = COLOR_PALETTES[colorPalette];
   
   // En funciones de dibujo:
   ctx.fillStyle = colors.primary;
   ctx.strokeStyle = colors.secondary;
   // ...
   ```

**C. Reemplazar colores hardcoded**

Buscar todos los `ctx.fillStyle`, `ctx.strokeStyle`, y valores de color hardcoded, y reemplazarlos por referencias a `colors.[propiedad]`.

### Paso 3.2: Implementar juego por juego

Aplicar el patrón de la Fase 3.1 a cada juego en este orden:

1. **Asteroides** (`AsteroidsGame.tsx`)
2. **Arkanoid** (`ArkanoidGame.tsx`)
3. **Snake** (`SnakeGame.tsx`)

**Para cada juego:**
- Crear/actualizar `lib/game/[juego]/constants.ts`
- Modificar componente `[Juego]Game.tsx`
- Probar que las 3 paletas funcionen correctamente

---

## Fase 4: Integración con GamePlayer

**Goal**: Agregar el selector de skin al HUD para todos los juegos.

### Paso 4.1: Modificar GamePlayer.tsx

**A. Imports y tipos**

Ya existe:
```typescript
import type { ColorPalette } from "@/lib/game/tetris/types";
```

Crear un tipo unificado o importar de cada juego según corresponda.

**B. Estados para cada juego**

Agregar estados similares al de Tetris:
```typescript
const [asteroidsColorPalette, setAsteroidsColorPalette] = useState<ColorPalette>("retro");
const [arkanoidColorPalette, setArkanoidColorPalette] = useState<ColorPalette>("retro");
const [snakeColorPalette, setSnakeColorPalette] = useState<ColorPalette>("retro");
```

**C. Selector en el HUD**

Modificar el bloque `hudActions` para incluir selectores condicionales:

```tsx
<div className={styles.hudActions}>
  {isTetrisGame && (
    <select
      value={tetrisColorPalette}
      onChange={(e) => setTetrisColorPalette(e.target.value as ColorPalette)}
      className={`btn ${styles.colorSelect}`}
      title="Select color palette"
    >
      <option value="neon">🟢 Neon</option>
      <option value="pastel">🎨 Pastel</option>
      <option value="retro">✨ Retro</option>
    </select>
  )}
  {isAsteroidsGame && (
    <select
      value={asteroidsColorPalette}
      onChange={(e) => setAsteroidsColorPalette(e.target.value as ColorPalette)}
      className={`btn ${styles.colorSelect}`}
      title="Select color palette"
    >
      <option value="neon">🟢 Neon</option>
      <option value="pastel">🎨 Pastel</option>
      <option value="retro">✨ Retro</option>
    </select>
  )}
  {/* Similar para Arkanoid y Snake */}
  
  <button className="btn" onClick={...} disabled={over}>
    {paused ? "▶ REANUDAR" : "❚❚ PAUSA"}
  </button>
  {/* resto de botones */}
</div>
```

**D. Pasar props a los componentes de juego**

Modificar los renders condicionales para pasar las props de paleta:

```tsx
{isAsteroidsGame ? (
  <AsteroidsGame
    onGameOver={handleAsteroidsGameOver}
    onScoreChange={handleAsteroidsScoreChange}
    onLivesChange={handleAsteroidsLivesChange}
    onLevelChange={handleAsteroidsLevelChange}
    colorPalette={asteroidsColorPalette}
    onColorPaletteChange={setAsteroidsColorPalette}
  />
) : /* ... */}
```

### Paso 4.2: Estilos del selector

Verificar que existe `.colorSelect` en `GamePlayer.module.css`. Si no existe, agregarlo:

```css
.colorSelect {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid var(--cyan);
  color: var(--cyan);
  border-radius: 4px;
  transition: all 0.2s;
}

.colorSelect:hover {
  background: rgba(0, 255, 255, 0.1);
  border-color: var(--magenta);
}

.colorSelect option {
  background: #000;
  color: #fff;
}
```

---

## Fase 5: Testing y Refinamiento

**Goal**: Verificar que todo funciona correctamente y los colores se ven bien.

### Paso 5.1: Checklist de pruebas

Para **cada juego**:

- [ ] El selector de paleta aparece en el HUD
- [ ] Las 3 opciones (neon, pastel, retro) funcionan al seleccionarlas
- [ ] Los colores se aplican correctamente a todos los elementos del juego
- [ ] La selección persiste al recargar (localStorage)
- [ ] Los colores tienen buen contraste sobre fondo negro
- [ ] No hay colores hardcoded residuales
- [ ] El juego funciona igual de bien con cualquier paleta

### Paso 5.2: Ajustes de color

Si alguna paleta se ve mal:
- Ajustar valores en `constants.ts`
- Verificar contraste con herramientas de accesibilidad
- Probar en modo light/dark (si aplica)

### Paso 5.3: Documentación

Actualizar `CLAUDE.md` con una sección sobre el sistema de skins:

```markdown
### Sistema de Skins

Todos los juegos soportan 3 paletas de colores seleccionables:

- **Neon**: Colores brillantes y vibrantes
- **Pastel**: Colores suaves y claros
- **Retro**: Colores clásicos arcade

**Ubicación del selector**: HUD del GamePlayer, al lado del botón de Pausa.

**Persistencia**: Las preferencias se guardan en `localStorage` con clave `[juego]-color-palette`.

**Implementación**:
- Constantes de paletas en `lib/game/[juego]/constants.ts`
- Props `colorPalette` y `onColorPaletteChange` en cada componente de juego
- Selector unificado en `GamePlayer.tsx`
```

---

## Reglas Importantes

### DO ✅

1. **Seguir el patrón de Tetris exactamente** - Consistencia es clave
2. **Usar nombres de paleta idénticos** - `neon`, `pastel`, `retro` (no variaciones)
3. **Guardar en localStorage** - Persistir la elección del usuario
4. **Usar emojis en el selector** - 🟢 Neon, 🎨 Pastel, ✨ Retro
5. **Crear archivos de constantes separados** - No mezclar constantes de juegos
6. **Reemplazar TODOS los colores hardcoded** - Buscar exhaustivamente
7. **Probar cada paleta** - Asegurar que todas se vean bien
8. **Mantener performance** - No agregar cálculos costosos en el game loop

### DON'T ❌

1. **No modificar la lógica del juego** - Solo cambiar colores, no mecánicas
2. **No agregar más de 3 paletas** - Mantener simplicidad
3. **No usar colores que no contrasten** - Evitar combinaciones ilegibles
4. **No hardcodear valores en componentes** - Siempre usar constantes
5. **No olvidar localStorage** - Persistencia es requisito
6. **No implementar specs** - Este agente implementa código directamente
7. **No modificar Tetris** - Ya está completo, es la referencia
8. **No usar nombres diferentes para paletas** - Consistencia entre juegos

---

## Output Esperado

Al finalizar, el usuario debe poder:

1. Abrir cualquier juego en Arcade Vault
2. Ver un selector de paleta al lado del botón de Pausa
3. Cambiar entre 3 paletas de colores en tiempo real
4. Ver el juego actualizado instantáneamente con los nuevos colores
5. Recargar la página y mantener la paleta seleccionada

**Archivos modificados/creados:**
- `lib/game/asteroids/constants.ts` (nuevo)
- `lib/game/arkanoid/constants.ts` (nuevo)
- `lib/game/snake/constants.ts` (nuevo)
- `components/games/AsteroidsGame.tsx` (modificado)
- `components/games/ArkanoidGame.tsx` (modificado)
- `components/games/SnakeGame.tsx` (modificado)
- `components/games/GamePlayer.tsx` (modificado)
- `CLAUDE.md` (actualizado con sección de Skins)

---

## Flujo de Ejecución

```
/skin-designer [game-id|all]
  ↓
┌─────────────────────────────────────────┐
│ FASE 1: Análisis                        │
│ - Leer Tetris (referencia)              │
│ - Analizar juegos objetivo              │
│ - Identificar colores actuales          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ FASE 2: Diseño de Paletas               │
│ - Definir 3 paletas por juego           │
│ - Crear estructura de constants.ts      │
│ - Mapear elementos coloreables          │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ FASE 3: Implementación por Juego        │
│ - Crear constants.ts                    │
│ - Modificar componente del juego        │
│ - Reemplazar colores hardcoded          │
│ - Repetir para cada juego               │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ FASE 4: Integración con GamePlayer      │
│ - Agregar estados de paleta             │
│ - Agregar selectores al HUD             │
│ - Pasar props a componentes             │
│ - Verificar estilos CSS                 │
└─────────────────────────────────────────┘
  ↓
┌─────────────────────────────────────────┐
│ FASE 5: Testing y Refinamiento          │
│ - Probar cada juego                     │
│ - Ajustar colores si es necesario       │
│ - Actualizar documentación              │
│ - Confirmar persistencia funciona       │
└─────────────────────────────────────────┘
  ↓
✅ DONE: Sistema de skins implementado
```

---

## Tone and Style

- **Lenguaje**: Español (código en inglés, comentarios en español)
- **Implementación directa**: No generar specs, modificar código inmediatamente
- **Iterativo**: Implementar un juego a la vez, probar, continuar
- **Consistente**: Seguir exactamente el patrón de Tetris
- **Visual**: Los colores son la parte más importante, priorizar contraste y estética

---

## Success Criteria

✅ **Éxito completo cuando:**

1. Cada juego tiene 3 paletas de colores funcionando
2. El selector aparece en el HUD de cada juego
3. Los colores se aplican correctamente en tiempo real
4. La selección persiste en localStorage
5. No hay colores hardcoded residuales
6. Las paletas tienen buen contraste y se ven bien
7. La documentación está actualizada
8. Todos los juegos (Asteroides, Arkanoid, Snake) tienen el sistema implementado

❌ **Fallo si:**

- Algún juego no tiene selector de paleta
- Los colores no cambian al seleccionar otra paleta
- Hay colores hardcoded que no respetan la paleta
- La selección no persiste al recargar
- Las paletas tienen mal contraste o son ilegibles
- Se rompe la funcionalidad existente del juego

---

## Ejemplos de Uso

### Ejemplo 1: Implementar para todos los juegos

```bash
/skin-designer
```

o

```bash
/skin-designer all
```

**Comportamiento**: Implementa el sistema de skins para Asteroides, Arkanoid y Snake en secuencia.

### Ejemplo 2: Solo un juego específico

```bash
/skin-designer rocas
```

**Comportamiento**: Implementa el sistema de skins solo para Asteroides.

### Ejemplo 3: Probar con Arkanoid

```bash
/skin-designer arkanoid
```

**Comportamiento**: Implementa el sistema de skins solo para Arkanoid.

---

## Notas Técnicas

### Estructura de tipos recomendada

Si quieres crear un tipo global para `ColorPalette` (opcional):

```typescript
// types/skins.ts
export type ColorPalette = 'neon' | 'pastel' | 'retro';
export const COLOR_PALETTE_OPTIONS: ColorPalette[] = ['neon', 'pastel', 'retro'];
export const DEFAULT_COLOR_PALETTE: ColorPalette = 'retro';
```

### LocalStorage keys

Formato consistente:
- `tetris-color-palette`
- `asteroids-color-palette` (no `rocas-color-palette`)
- `arkanoid-color-palette`
- `snake-color-palette`

### Performance considerations

- No recalcular colores en cada frame
- Cachear referencia a la paleta activa fuera del game loop
- Usar variables CSS si es posible (para juegos con HTML/CSS)

---

¡Listo para implementar! 🎨✨
