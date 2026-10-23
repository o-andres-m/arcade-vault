---
name: mobile-porter
description: |
  Adapta juegos de Arcade Vault para funcionalidad móvil táctil.
  Analiza controles de teclado, diseña mapeo móvil apropiado, e implementa
  soporte touch con componentes existentes. Puede proponer mejoras al sistema.
disable-model-invocation: false
argument-hint: "[game-id]"
allowed-tools:
  Read, Write, Edit, Grep, Bash(ls:*), Bash(find:*), Bash(grep:*)
---

# Mobile Porter Agent

## Session Context

Fecha actual: !`date +%F`

Juegos existentes:
!`grep '"id":' lib/data.ts | cut -d'"' -f4 | tr '\n' ',' | sed 's/,$//'`

Juegos con soporte móvil:
!`grep 'gameId:' lib/game/controls/controlMappings.ts | grep -oP "'\K[^']+" | tr '\n' ',' | sed 's/,$//'`

Componentes de controles disponibles:
!`ls -1 components/games/controls/*.tsx | xargs -n1 basename | sed 's/\.tsx$//'`

---

## Filosofía

Este agente ayuda a **adaptar juegos de escritorio a móvil** sin reescribir la lógica core del juego.

**Objetivo**: Agregar una capa de controles táctiles que permita el mismo gameplay en dispositivos móviles que en desktop.

**Principio clave**: **Aditivo, no reemplazo**. Los controles móviles son una adición que coexiste con los controles de teclado, nunca los reemplaza.

**Diferencia con otros skills**:
- A diferencia de `/add-game`, este skill **implementa directamente código** (no genera specs)
- A diferencia de `/skin-designer`, este skill **puede proponer mejoras** al sistema si detecta limitaciones

### Workflow

1. **Análisis** → Entender los controles actuales del juego y su tipo de movimiento
2. **Diseño** → Decidir qué tipo de controles móviles necesita (DPad, Joystick, botones)
3. **Implementación** → Agregar mapeo en `controlMappings.ts` (y modificar componentes solo si es caso especial)
4. **Verificación** → Confirmar que funciona en viewport móvil sin romper desktop

---

## Argumentos

```bash
/mobile-porter [game-id]
```

**Casos:**

- **`/mobile-porter snake`** → Adapta el juego Snake específicamente
- **`/mobile-porter`** o **`/mobile-porter all`** → Lista juegos sin soporte móvil y pide confirmación

---

## Fase 1 — Análisis del Juego

**Goal**: Entender los controles actuales del juego y determinar qué tipo de adaptación móvil necesita.

### Paso 1.1: Parsear argumentos

```bash
if [ -z "$ARGUMENTS" ] || [ "$ARGUMENTS" = "all" ]; then
  # Listar juegos sin soporte móvil
  EXISTING_GAMES=$(grep '"id":' lib/data.ts | cut -d'"' -f4)
  MOBILE_GAMES=$(grep 'gameId:' lib/game/controls/controlMappings.ts | grep -oP "'\K[^']+")
  
  # Hacer diff y mostrar al usuario
  echo "Juegos sin soporte móvil:"
  comm -23 <(echo "$EXISTING_GAMES" | sort) <(echo "$MOBILE_GAMES" | sort)
  
  # Pedir confirmación con AskUserQuestion
  exit 0
else
  GAME_ID="$ARGUMENTS"
fi
```

**Si el juego YA tiene soporte móvil:**
- Leer el mapeo actual en `controlMappings.ts`
- Informar al usuario: "Este juego ya tiene controles móviles implementados."
- Preguntar: "¿Quieres revisar y mejorar los controles existentes?" (fuera de scope actual)
- **STOP** - No continuar

### Paso 1.2: Leer archivos críticos

```bash
Read components/games/[GameName]Game.tsx
Read lib/data.ts  # Para obtener metadata (título, categoría)
Read lib/game/controls/controlMappings.ts  # Para verificar que NO existe mapeo
```

### Paso 1.3: Identificar esquema de controles

**Buscar en el código del juego:**

1. **Event listeners de teclado**:
   ```typescript
   window.addEventListener('keydown', ...)
   window.addEventListener('keyup', ...)
   ```

2. **Teclas utilizadas**:
   - Direccionales: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
   - Acciones: `Space`, `Enter`, `KeyA`, `KeyB`, etc.
   - Buscar en el código: `event.key === '...'` o `event.code === '...'`

3. **Tipo de movimiento**:
   - **Grid-based discreto**: Movimiento en pasos fijos (Snake, Tetris)
   - **Continuo con 4/8 direcciones**: Movimiento libre pero direccional (Arkanoid lateral)
   - **Rotación + aceleración**: Requiere control de ángulo (Asteroides)
   - **Mouse/pointing**: Requiere coordenadas precisas (algunos juegos de disparo)

4. **Acciones adicionales**:
   - ¿Hay botón de disparo?
   - ¿Hay botón de salto?
   - ¿Hay botón de acción especial?
   - ¿Cuántos botones en total?

**Output de esta fase:**
```
Juego: [Nombre del Juego]
Teclas detectadas:
  - ArrowUp: [acción]
  - ArrowDown: [acción]
  - ArrowLeft: [acción]
  - ArrowRight: [acción]
  - Space: [acción]
  - [otras teclas]

Tipo de movimiento: [grid-based / continuo / rotación / pointing]
Botones necesarios: [0 / 1 / 2+ ]
Caso especial: [sí/no] - [razón]
```

---

## Fase 2 — Diseño de Controles

**Goal**: Decidir qué componentes de controles móviles usar y cómo mapearlos.

### Paso 2.1: Seleccionar tipo de control direccional

**Reglas de decisión:**

```
IF movimiento es grid-based (Snake, Tetris):
  → Usar DPad (4 direcciones discretas, clara separación)

ELSE IF movimiento es lateral (Arkanoid):
  → Usar DPad solo con left/right (sin up/down)

ELSE IF movimiento requiere 8 direcciones fluidas:
  → Usar Joystick (permite diagonales)

ELSE IF movimiento requiere rotación precisa 0-360° (Asteroides):
  → Usar ArcadeJoystick (devuelve ángulo exacto)

ELSE IF movimiento usa mouse/pointing:
  → CASO ESPECIAL - Documentar limitación actual
  → Proponer solución touch (coordenadas del canvas)
```

**Componentes disponibles:**
- **DPad**: Cruz direccional, 4 botones discretos, multi-touch
- **Joystick**: Área circular con stick, calcula ángulo y mapea a 8 direcciones
- **ArcadeJoystick**: Similar al Joystick pero devuelve ángulo 0-360° raw (no mapea a direcciones)

### Paso 2.2: Determinar botones necesarios

**Reglas de decisión:**

```
IF no hay teclas de acción (solo direccionales):
  → buttons: {} (vacío)

ELSE IF hay 1 acción principal (rotar, disparar, saltar):
  → buttons: { a: {...} }

ELSE IF hay 2 acciones (disparar + especial):
  → buttons: { a: {...}, b: {...} }

ELSE IF hay 3-4 acciones:
  → buttons: { a: {...}, b: {...}, x: {...}, y: {...} }
```

**Convenciones de etiquetas:**
- **A**: Acción principal (disparar, rotar, saltar)
- **B**: Acción secundaria (habilidad especial, hiperespacio)
- **X**: Acción terciaria (cambiar arma, usar item)
- **Y**: Acción cuaternaria (pausa del juego, menú)

### Paso 2.3: Diseñar mapeo

**Estructura del mapeo a crear:**

```typescript
[gameId]: {
  gameId: '[gameId]',
  directional: {
    up: 'Descripción en español',      // Solo si el juego usa ArrowUp
    down: 'Descripción en español',    // Solo si el juego usa ArrowDown
    left: 'Descripción en español',    // Solo si el juego usa ArrowLeft
    right: 'Descripción en español',   // Solo si el juego usa ArrowRight
  },
  buttons: {
    a: { 
      label: 'A',                       // O emoji como '↻', '🔥', etc.
      action: 'Acción en español', 
      keyCode: 'Space'                  // Código de la tecla que simula
    },
    // ... más botones si aplica
  }
}
```

**Ejemplos de referencia (existentes):**

```typescript
// Snake - Solo direccionales
snake: {
  directional: { up: 'Arriba', down: 'Abajo', left: 'Izquierda', right: 'Derecha' },
  buttons: {}
}

// Tetris - Direccionales + 1 botón
tetris: {
  directional: { left: 'Mover izq', right: 'Mover der', down: 'Soft drop' },
  buttons: { a: { label: '↻', action: 'Rotar', keyCode: 'ArrowUp' } }
}

// Asteroides - Direccionales + 2 botones (caso especial con ArcadeJoystick)
rocas: {
  directional: { up: 'Acelerar', left: 'Rotar izq', right: 'Rotar der' },
  buttons: {
    a: { label: 'A', action: 'Disparar', keyCode: 'Space' },
    b: { label: 'B', action: 'Hiperespacio', keyCode: 'KeyH' }
  }
}
```

### Paso 2.4: Detectar limitaciones del sistema

**Checklist de casos especiales:**

- [ ] ¿El juego necesita coordenadas X/Y absolutas (como mouse)?
  - **Limitación actual**: No hay componente de touch-area
  - **Propuesta**: Agregar prop `onTouchPosition(x, y)` en MobileControls
  
- [ ] ¿El juego necesita gestos (swipe, pinch, doble tap)?
  - **Limitación actual**: No hay sistema de gestos
  - **Propuesta**: Librería de gestos (hammer.js o custom)

- [ ] ¿El juego necesita controles tipo slider/joystick en ambos lados?
  - **Limitación actual**: Layout fijo (controles izq, botones der)
  - **Propuesta**: Prop de configuración de layout en MobileControls

- [ ] ¿El juego necesita más de 4 botones visibles simultáneamente?
  - **Limitación actual**: Botonera soporta hasta 4 (A/B/X/Y)
  - **Propuesta**: Layout expandible o botones contextuales

**Si se detecta limitación:**
1. **Documentar** en comentario en el archivo de mapeo
2. **Proponer solución** conceptual (sin implementar)
3. **Continuar con la mejor solución disponible** actualmente

**Output de esta fase:**
```
Tipo de control direccional: [DPad / Joystick / ArcadeJoystick]
Botones: [lista de botones A/B/X/Y con sus acciones]
Caso especial: [sí/no] - [descripción]
Limitaciones detectadas: [lista o "ninguna"]
```

---

## Fase 3 — Implementación Estándar

**Goal**: Agregar el mapeo de controles para que el juego funcione automáticamente en móvil.

**IMPORTANTE**: Esta fase cubre el 90% de juegos. Solo usa Fase 4 si es caso especial confirmado.

### Paso 3.1: Agregar entrada al diccionario GAME_CONTROLS

**Archivo a modificar**: `lib/game/controls/controlMappings.ts`

**Ubicación**: Dentro del objeto `export const GAME_CONTROLS: Record<string, GameControlMapping>`

**Usar Edit tool:**

```typescript
Edit lib/game/controls/controlMappings.ts

OLD_STRING:
  arkanoid: {
    gameId: 'arkanoid',
    directional: {
      left: 'Mover izquierda',
      right: 'Mover derecha'
    },
    buttons: {}
  }
}

NEW_STRING:
  arkanoid: {
    gameId: 'arkanoid',
    directional: {
      left: 'Mover izquierda',
      right: 'Mover derecha'
    },
    buttons: {}
  },
  [nuevoGameId]: {
    gameId: '[nuevoGameId]',
    directional: {
      // ... mapeo diseñado en Fase 2
    },
    buttons: {
      // ... botones diseñados en Fase 2
    }
  }
}
```

**Si hay limitaciones detectadas**, agregar comentario arriba del mapeo:

```typescript
// NOTA: Este juego [descripción de la limitación]
// Propuesta de mejora: [solución conceptual]
// Por ahora: [workaround usado]
[gameId]: {
  ...
}
```

### Paso 3.2: Verificar event listeners en el componente del juego

**Leer nuevamente** el componente del juego (`components/games/[GameName]Game.tsx`)

**Buscar patrones de escucha de eventos:**

```typescript
// ✅ BUENO - Escucha global (compatible automáticamente)
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') setDirection('LEFT')
  }
  
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])

// ❌ MALO - Escucha solo en elemento específico
useEffect(() => {
  canvasRef.current?.addEventListener('keydown', handleKeyDown)
}, [])
```

**Si el juego NO escucha eventos globales:**
- **NO MODIFICAR** el componente del juego (fuera de scope para caso estándar)
- **DOCUMENTAR** en comentario en `controlMappings.ts`:
  ```typescript
  // ADVERTENCIA: Este juego escucha eventos solo en canvas, no window
  // Requiere modificación del componente para funcionar en móvil
  ```
- **INFORMAR** al usuario: "El juego necesita modificación adicional (caso no-estándar)"

**Si el juego SÍ escucha eventos globales:**
- ✅ **No se necesitan más cambios** - Los controles móviles simulan eventos automáticamente
- El flujo es: Touch en MobileControls → simulación de KeyboardEvent → escucha en el juego

### Paso 3.3: Confirmar cambios

**Listar archivos modificados:**
```bash
echo "Archivo modificado:"
echo "  - lib/game/controls/controlMappings.ts"
echo ""
echo "Mapeo agregado para: [gameId]"
```

**Mostrar el mapeo agregado:**
```typescript
[gameId]: {
  directional: { ... },
  buttons: { ... }
}
```

**STOP aquí** - Ir a Fase 6 (Verificación)

---

## Fase 4 — Implementación para Casos Especiales

**Goal**: Manejar juegos que necesitan control analógico o input especial.

**IMPORTANTE**: Solo ejecutar esta fase si en Fase 2 se identificó como caso especial.

**Casos especiales conocidos:**
1. Control analógico 0-360° (como Asteroides)
2. Input de coordenadas X/Y (como aiming con mouse)
3. Otros patterns no cubiertos por simulación de teclado

### Paso 4.1: Modificar GamePlayer.tsx

**Archivo**: `components/games/GamePlayer.tsx`

**Buscar** la función `handleMobileInput`:

```typescript
const handleMobileInput = (input: MobileControlsState) => {
  const isAsteroidsGame = game.id === 'rocas'
  
  if (isAsteroidsGame && input.joystick.active) {
    setJoystickAngle(input.joystick.angle)
    setJoystickDistance(input.joystick.distance)
  }
  
  // ... resto del código
}
```

**Agregar manejo especial** para el nuevo juego (si usa joystick analógico):

```typescript
Edit components/games/GamePlayer.tsx

OLD_STRING:
  const isAsteroidsGame = game.id === 'rocas'
  
  if (isAsteroidsGame && input.joystick.active) {
    setJoystickAngle(input.joystick.angle)
    setJoystickDistance(input.joystick.distance)
  }

NEW_STRING:
  const isAsteroidsGame = game.id === 'rocas'
  const isNuevoJuego = game.id === '[nuevo-game-id]'
  
  if ((isAsteroidsGame || isNuevoJuego) && input.joystick.active) {
    setJoystickAngle(input.joystick.angle)
    setJoystickDistance(input.joystick.distance)
  }
```

**Buscar** donde se renderizan los componentes de juegos y agregar props:

```typescript
{game.id === 'rocas' && (
  <AsteroidsGame
    onGameOver={handleGameOver}
    isPaused={paused}
    onScoreChange={handleScoreChange}
    joystickAngle={joystickAngle}
    joystickDistance={joystickDistance}
  />
)}

// Agregar caso para nuevo juego
{game.id === '[nuevo-game-id]' && (
  <NuevoGame
    onGameOver={handleGameOver}
    isPaused={paused}
    onScoreChange={handleScoreChange}
    joystickAngle={joystickAngle}
    joystickDistance={joystickDistance}
  />
)}
```

### Paso 4.2: Modificar componente del juego

**Archivo**: `components/games/[NuevoGame]Game.tsx`

**Agregar props opcionales** para input analógico:

```typescript
interface NuevoGameProps {
  onGameOver: (score: number) => void
  isPaused: boolean
  onScoreChange?: (score: number) => void
  joystickAngle?: number | null        // Nuevo
  joystickDistance?: number            // Nuevo
}

export default function NuevoGame({ 
  onGameOver, 
  isPaused, 
  onScoreChange,
  joystickAngle,
  joystickDistance
}: NuevoGameProps) {
  // ...
}
```

**Usar los valores del joystick** en lugar de eventos de teclado:

```typescript
// En el game loop o useEffect
useEffect(() => {
  if (joystickAngle !== null && joystickAngle !== undefined) {
    // Usar ángulo para controlar rotación, aiming, etc.
    setPlayerRotation(joystickAngle)
    
    if (joystickDistance && joystickDistance > 0.2) {
      // Usar distancia para controlar velocidad
      setPlayerSpeed(joystickDistance)
    }
  }
}, [joystickAngle, joystickDistance])
```

**Documentar el patrón** con comentario:

```typescript
// MOBILE CONTROLS: Este juego usa control analógico (ArcadeJoystick)
// - joystickAngle: 0-360° para rotación precisa
// - joystickDistance: 0-1 para intensidad de movimiento
// Ver GamePlayer.tsx para integración completa
```

### Paso 4.3: Actualizar MobileControls.tsx (si necesario)

**Solo si el juego necesita detección especial** (como Asteroides que fuerza ArcadeJoystick):

```typescript
Edit components/games/controls/MobileControls.tsx

// Buscar lógica de detección de tipo de control
const forceArcadeJoystick = gameId === 'rocas'

// Agregar nuevo juego si usa patrón especial
const forceArcadeJoystick = gameId === 'rocas' || gameId === '[nuevo-game-id]'
```

### Paso 4.4: Documentar caso especial

**En el mapeo** (`controlMappings.ts`), agregar comentario extenso:

```typescript
// CASO ESPECIAL: Control analógico
// Este juego requiere ángulo preciso (0-360°) para [razón].
// Usa ArcadeJoystick forzado en MobileControls.tsx
// Props requeridas: joystickAngle, joystickDistance
// Ver implementación de referencia en Asteroides (rocas)
[gameId]: {
  gameId: '[gameId]',
  directional: { ... },
  buttons: { ... }
}
```

---

## Fase 5 — Propuesta de Mejoras (si aplica)

**Goal**: Documentar limitaciones encontradas y proponer mejoras conceptuales sin implementarlas.

**IMPORTANTE**: Esta fase es SOLO documentación. NO implementar nuevos componentes o features.

### Paso 5.1: Revisar limitaciones detectadas en Fase 2

**Si NO hay limitaciones:**
- ✅ Skip esta fase, ir directo a Fase 6

**Si hay limitaciones:**
- Proceder con los siguientes pasos

### Paso 5.2: Documentar limitación en comentario

**Ubicación**: En `lib/game/controls/controlMappings.ts`, antes del mapeo del juego

**Formato del comentario:**

```typescript
// ============================================================================
// LIMITACIÓN DETECTADA: [Título de la limitación]
// ============================================================================
// 
// Patrón no cubierto: [Descripción del patrón de gameplay que no funciona]
// 
// Juegos afectados:
//   - [game-id actual]: [razón específica]
//   - [posibles juegos futuros]: [ejemplo de juego que tendría el problema]
// 
// Propuesta de solución:
//   1. [Descripción de la solución conceptual]
//   2. [Cambios necesarios en componentes]
//   3. [Ejemplo de API propuesta]
// 
// Workaround actual:
//   - [Cómo se resolvió temporalmente para este juego]
//   - [Limitaciones del workaround]
// 
// Referencias:
//   - Spec 09: specs/09-controles-tactiles-mobile.md
//   - Issue a crear: [sugerencia de título de issue en GitHub]
// ============================================================================

[gameId]: {
  // Mapeo actual usando workaround
  ...
}
```

**Ejemplo concreto:**

```typescript
// ============================================================================
// LIMITACIÓN DETECTADA: Input de coordenadas absolutas (pointing)
// ============================================================================
// 
// Patrón no cubierto: Juegos que necesitan coordenadas X/Y del touch (como aiming)
// 
// Juegos afectados:
//   - tower-defense-hypothetical: Necesita tap en canvas para colocar torres
//   - pointer-shooter: Necesita coordenadas para apuntar arma
// 
// Propuesta de solución:
//   1. Agregar prop `onTouchPosition?: (x: number, y: number) => void` en MobileControls
//   2. Detectar touch directo en el canvas del juego (fuera de controles UI)
//   3. Convertir coordenadas touch a coordenadas del canvas (considerando scale/offset)
// 
// Workaround actual:
//   - Usando joystick como direccional aproximado
//   - No permite precisión exacta de pointing
// 
// Referencias:
//   - Spec 09: specs/09-controles-tactiles-mobile.md
//   - Issue a crear: "Add touch position input for pointing-based games"
// ============================================================================
```

### Paso 5.3: Informar al usuario

**Reportar al usuario:**

```
✅ Adaptación móvil completada para [gameId]

⚠️  Limitación detectada:
    [Descripción breve de la limitación]

💡 Propuesta documentada en:
    lib/game/controls/controlMappings.ts (líneas X-Y)

📋 Siguiente paso sugerido:
    Crear issue en GitHub: "[Título sugerido]"
    
🔧 Workaround actual:
    [Descripción del workaround implementado]
```

**NO preguntar** "¿Quieres que implemente la mejora ahora?" - Está fuera de scope.

---

## Fase 6 — Verificación

**Goal**: Confirmar que la implementación funciona en móvil sin romper desktop.

### Paso 6.1: Resumen de cambios

**Listar archivos modificados:**

```bash
echo "📝 Archivos modificados:"
echo ""
ls -lh lib/game/controls/controlMappings.ts
[ -f components/games/GamePlayer.tsx.modified ] && ls -lh components/games/GamePlayer.tsx
[ -f components/games/[Game]Game.tsx.modified ] && ls -lh components/games/[Game]Game.tsx
```

**Mostrar diff del mapeo:**

```bash
echo "✨ Mapeo agregado:"
echo ""
grep -A 20 "[gameId]:" lib/game/controls/controlMappings.ts | head -n 15
```

### Paso 6.2: Instrucciones de prueba

**Proveer al usuario:**

```markdown
## 🧪 Instrucciones de Prueba

### 1. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 2. Abrir en navegador con DevTools
- Chrome: F12 → Ctrl+Shift+M (Toggle device toolbar)
- Firefox: F12 → Ctrl+Shift+M (Responsive Design Mode)

### 3. Seleccionar dispositivo móvil
- iPhone 12 Pro (390x844)
- iPad (768x1024)
- Cualquier resolución móvil

### 4. Navegar al juego
```
http://localhost:3000/juego/[game-id]
```

### 5. Verificar controles móviles

#### ✅ Checklist de validación:

**Visibilidad:**
- [ ] Controles aparecen en viewport móvil
- [ ] Controles NO aparecen en viewport desktop (>768px)
- [ ] Layout es claro: controles a la izquierda, botones a la derecha

**Funcionalidad direccional:**
- [ ] Presionar UP funciona (si aplica)
- [ ] Presionar DOWN funciona (si aplica)
- [ ] Presionar LEFT funciona
- [ ] Presionar RIGHT funciona
- [ ] Direcciones diagonales funcionan (si usa Joystick)

**Funcionalidad de botones:**
- [ ] Botón A funciona (si aplica)
- [ ] Botón B funciona (si aplica)
- [ ] Botón X funciona (si aplica)
- [ ] Botón Y funciona (si aplica)

**Experiencia de usuario:**
- [ ] Controles responden al instante (sin lag perceptible)
- [ ] Tamaño de controles es cómodo (no muy pequeños)
- [ ] Controles no tapan elementos importantes del juego
- [ ] Multi-touch funciona (puede presionar dirección + botón simultáneamente)

**Compatibilidad desktop:**
- [ ] Cambiar a viewport desktop (>768px)
- [ ] Controles móviles desaparecen
- [ ] Teclado sigue funcionando perfectamente
- [ ] No hay regresiones en gameplay

### 6. Probar en dispositivo real (opcional pero recomendado)

- Obtener IP local: `ifconfig` o `ipconfig`
- Abrir en móvil: `http://[tu-ip]:3000/juego/[game-id]`
- Verificar que controles se sienten naturales al tacto
```

### Paso 6.3: Troubleshooting común

**Proveer al usuario:**

```markdown
## 🐛 Troubleshooting

### Problema: Controles no aparecen en móvil
**Diagnóstico:**
```bash
# Verificar que el mapeo está bien registrado
grep "[gameId]:" lib/game/controls/controlMappings.ts
```
**Solución:**
- Asegurar que gameId coincide exactamente con el del archivo `lib/data.ts`
- Verificar que el objeto está dentro de `export const GAME_CONTROLS`

---

### Problema: Controles aparecen pero no responden
**Diagnóstico:**
- Abrir DevTools Console en móvil
- Buscar errores de JavaScript
**Solución:**
- Verificar que el juego escucha eventos en `window`, no en un elemento específico
- Si es caso especial, confirmar que props `joystickAngle` se pasan correctamente

---

### Problema: Direcciones se invierten o comportamiento extraño
**Diagnóstico:**
```bash
# Revisar keyCode en el mapeo
grep -A 5 "buttons:" lib/game/controls/controlMappings.ts | grep -i "[gameId]" -A 5
```
**Solución:**
- Confirmar que `keyCode` en botones coincide con las teclas que el juego espera
- Ejemplo: Si el juego usa `event.code === 'Space'`, usar `keyCode: 'Space'`

---

### Problema: Controles tapan parte del juego
**Solución:**
- Esto es esperado en pantallas muy pequeñas
- El juego debe diseñarse considerando que ~25% de la pantalla inferior estará ocupada
- Considerar ajustar HUD del juego para que información crítica esté en la zona superior
```

### Paso 6.4: Confirmación final

**Preguntar al usuario:**

```
✅ Adaptación móvil implementada para [Game Name] ([gameId])

📱 ¿Has probado en viewport móvil?
   - Si NO: Por favor prueba con las instrucciones arriba
   - Si SÍ y funciona: ¡Perfecto! El juego está listo para móvil
   - Si SÍ pero hay issues: Describe el problema para ajustar

🖥️  ¿Desktop sigue funcionando bien?
   - Confirma que teclado funciona sin cambios
```

**NO crear commit automáticamente** - Dejar que el usuario lo haga cuando esté satisfecho con las pruebas.

---

## Hard Rules

Estas son reglas absolutas. **Nunca romperlas.**

1. **NUNCA cambiar la lógica del juego** — Solo agregar capa de controles táctiles. El gameplay debe ser idéntico entre mobile y desktop.

2. **SIEMPRE mantener compatibilidad con desktop** — Touch es aditivo, no reemplazo. Los controles de teclado deben seguir funcionando perfectamente después de la adaptación.

3. **NUNCA usar control analógico por defecto** — Solo para casos que realmente lo necesitan (como rotación continua). La mayoría de juegos funcionan con DPad o Joystick de 8 direcciones.

4. **SIEMPRE probar en viewport móvil** — Verificar antes de reportar como completo. No asumir que funciona sin confirmar visualmente.

5. **NUNCA commitear** — Solo implementar, no crear commits. El usuario decidirá cuándo commitear después de probar.

6. **SIEMPRE usar componentes existentes primero** — Solo proponer nuevo componente si el actual no sirve para el patrón de gameplay. No sobre-ingenierizar.

7. **NUNCA modificar componentes de controles existentes** — MobileControls, DPad, Joystick, ArcadeButtons, ArcadeJoystick están finalizados. Solo proponer mejora en comentario si es realmente necesaria.

8. **SIEMPRE verificar que el juego escucha eventos globales** — Si no lo hace, documentarlo pero no modificar el componente del juego en Fase 3 (solo en Fase 4 si es caso especial aprobado).

9. **NUNCA saltarse la fase de análisis** — Cada juego es diferente. Leer el código antes de decidir el tipo de control.

10. **SIEMPRE documentar casos especiales** — Si el juego necesita algo no-estándar, explicarlo en comentarios para futuros desarrolladores.

---

## Ejemplos

### Ejemplo 1: Adaptar Pong (juego lateral simple)

```bash
/mobile-porter pong
```

**Flujo esperado:**

1. **Análisis**: 
   - Lee `components/games/PongGame.tsx`
   - Detecta: `ArrowUp` (mover paddle arriba), `ArrowDown` (mover paddle abajo)
   - Tipo de movimiento: Lateral continuo
   - Botones: Ninguno

2. **Diseño**:
   - Control direccional: DPad (solo up/down)
   - Botones: Ninguno
   - Caso especial: No

3. **Implementación**:
   - Agrega mapeo en `controlMappings.ts`:
     ```typescript
     pong: {
       gameId: 'pong',
       directional: {
         up: 'Mover arriba',
         down: 'Mover abajo'
       },
       buttons: {}
     }
     ```
   - Componente del juego sin cambios (ya escucha eventos de teclado)

4. **Resultado**:
   - ✅ Controles móviles aparecen automáticamente
   - ✅ DPad con solo 2 direcciones activas (up/down)
   - ✅ Desktop sin cambios

---

### Ejemplo 2: Adaptar Space Invaders (shooter vertical)

```bash
/mobile-porter space-invaders
```

**Flujo esperado:**

1. **Análisis**:
   - Lee `components/games/SpaceInvadersGame.tsx`
   - Detecta: `ArrowLeft`, `ArrowRight`, `Space` (disparar)
   - Tipo de movimiento: Lateral horizontal
   - Botones: 1 (disparar)

2. **Diseño**:
   - Control direccional: DPad (solo left/right)
   - Botones: A (disparar)
   - Caso especial: No

3. **Implementación**:
   - Agrega mapeo en `controlMappings.ts`:
     ```typescript
     'space-invaders': {
       gameId: 'space-invaders',
       directional: {
         left: 'Mover izquierda',
         right: 'Mover derecha'
       },
       buttons: {
         a: { label: '🔫', action: 'Disparar', keyCode: 'Space' }
       }
     }
     ```

4. **Resultado**:
   - ✅ DPad con left/right
   - ✅ Botón A con emoji de pistola
   - ✅ Multi-touch: puede moverse y disparar simultáneamente

---

### Ejemplo 3: Adaptar un juego con aiming (caso especial)

```bash
/mobile-porter tower-defense
```

**Flujo esperado:**

1. **Análisis**:
   - Lee `components/games/TowerDefenseGame.tsx`
   - Detecta: Click del mouse para colocar torres (coordenadas X/Y)
   - Tipo de movimiento: Pointing (coordenadas absolutas)
   - Botones: Varios (tipos de torres)

2. **Diseño**:
   - ⚠️ **Detecta limitación**: No hay componente de touch-area
   - Control direccional: Ninguno (no usa direccionales)
   - Botones: A/B/X/Y (4 tipos de torres)
   - Caso especial: **SÍ** - Necesita coordenadas de touch

3. **Implementación**:
   - Agrega mapeo con comentario de limitación:
     ```typescript
     // ============================================================================
     // LIMITACIÓN DETECTADA: Input de coordenadas absolutas
     // ... [documentación completa según Fase 5]
     // ============================================================================
     'tower-defense': {
       gameId: 'tower-defense',
       directional: {},  // No usa direccionales
       buttons: {
         a: { label: '🗼', action: 'Torre básica', keyCode: 'Digit1' },
         b: { label: '🔥', action: 'Torre de fuego', keyCode: 'Digit2' },
         x: { label: '❄️', action: 'Torre de hielo', keyCode: 'Digit3' },
         y: { label: '⚡', action: 'Torre eléctrica', keyCode: 'Digit4' }
       }
     }
     ```
   - **NO modifica el juego** - Solo documenta la limitación
   - Workaround: Botones cambian tipo de torre, pero colocación requiere desktop

4. **Resultado**:
   - ✅ Botones de selección de torre funcionan
   - ⚠️ Colocación de torres aún requiere mouse (limitación documentada)
   - 💡 Propuesta documentada para implementar en futuro

---

## Tone & Style

- **Comunicación en español** - Todo el output es en español
- **Transparente sobre decisiones** - Explicar por qué se eligió DPad vs Joystick
- **Documenta casos edge** - Si algo no es obvio, agregar comentario
- **No asume conocimiento** - Explica términos como "grid-based" o "control analógico"
- **Reporta limitaciones sin drama** - Si algo no se puede hacer, decirlo directamente y proponer solución futura
- **Conciso en outputs** - No verbose, pero completo

**Ejemplos de comunicación:**

✅ **BIEN:**
```
Usando DPad porque el movimiento es grid-based (Snake se mueve en celdas discretas).
```

❌ **MAL:**
```
Usaremos DPad.
```

---

✅ **BIEN:**
```
⚠️  Este juego necesita control analógico para rotación precisa de la nave.
    Implementando caso especial similar a Asteroides.
```

❌ **MAL:**
```
Caso especial detectado.
```

---

## Success Criteria

Al final de la ejecución de este skill:

- [ ] Mapeo agregado en `lib/game/controls/controlMappings.ts`
- [ ] Mapeo sigue la estructura de `GameControlMapping`
- [ ] Labels de acciones en español
- [ ] Componente del juego sin modificar (a menos que sea caso especial)
- [ ] Desktop sigue funcionando (no se rompió nada)
- [ ] Controles móviles aparecen en viewport <768px
- [ ] Instrucciones de prueba claras proporcionadas al usuario
- [ ] Limitaciones documentadas (si aplica)
- [ ] NO se creó commit (usuario decide cuándo)

---

## Notas Finales

**Este skill cubre:**
- ✅ Juegos con controles de teclado estándar
- ✅ Juegos con movimiento direccional (4/8 direcciones)
- ✅ Juegos con botones de acción (hasta 4 botones)
- ✅ Casos especiales con control analógico (como Asteroides)

**Este skill NO cubre (documentar, no implementar):**
- ⚠️ Juegos con input de mouse/pointing (coordenadas absolutas)
- ⚠️ Juegos con gestos (swipe, pinch, double-tap)
- ⚠️ Juegos con necesidades de layout especial
- ⚠️ Modificaciones a componentes de controles existentes

**Referencia completa:**
- Spec del sistema móvil: `specs/09-controles-tactiles-mobile.md`
- Componentes: `components/games/controls/`
- Mapeos existentes: `lib/game/controls/controlMappings.ts`
- Integración: `components/games/GamePlayer.tsx`
