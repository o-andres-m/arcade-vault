# 09 — CONTROLES TÁCTILES PARA MÓVIL

**Estado:** Approved  
**Depende de:** SPEC 04 (Asteroides), SPEC 06 (Arkanoid), SPEC 07 (Snake), SPEC 08 (Tetris)  
**Fecha:** 2026-10-18

**Objetivo:** Implementar un sistema de controles táctiles overlay para todos los juegos de Arcade Vault, detectando automáticamente dispositivos móviles/tablets y ofreciendo D-Pad + Joystick virtual + botonera arcade de 4 botones configurables por juego.

---

## Alcance

### Incluido en esta especificación

- **Detección automática de dispositivos táctiles**
  - Detectar si el dispositivo soporta touch events (`'ontouchstart' in window`)
  - Mostrar controles táctiles solo en móviles/tablets
  - Persistir detección en localStorage para sesiones futuras

- **Sistema de controles HTML overlay**
  - Elementos HTML (divs/buttons) posicionados con `position: absolute` sobre el canvas
  - No interfieren con la lógica del juego (eventos independientes)
  - Z-index alto para estar siempre visibles sobre el canvas

- **Dos modos de control direccional (configurable)**
  - **D-Pad:** 4 botones separados (↑↓←→) estilo clásico
  - **Joystick virtual:** Área circular con drag, detecta dirección en 8 ejes
  - Toggle entre modos guardado en localStorage (`control-mode: 'dpad' | 'joystick'`)

- **Botonera arcade de 4 botones**
  - Botones A, B, X, Y con letras visibles
  - Mapeo diferente por juego (ver sección Modelo de datos)
  - Solo se muestran los botones que el juego usa activamente
  - Posicionados en bottom-right de la pantalla

- **Layout responsivo**
  - Controles direccionales en bottom-left
  - Botones arcade en bottom-right
  - Padding y tamaño ajustados para no tapar elementos críticos del juego
  - Soporte para orientación portrait y landscape

- **Feedback visual al tocar**
  - Cambio de opacidad (0.6 → 1.0) al presionar
  - Opcional: brillo adicional en bordes (glow effect sutil)
  - Transición CSS suave (100ms)

- **Comportamiento en pausa**
  - Controles se deshabilitan visualmente (opacidad reducida a 0.3)
  - Eventos touch no se procesan mientras `isPaused === true`
  - Se reactivan automáticamente al reanudar

- **Persistencia de preferencias**
  - `localStorage.getItem('arcade-vault-mobile-controls')` → true/false
  - `localStorage.getItem('arcade-vault-control-mode')` → 'dpad' | 'joystick'
  - Se aplican automáticamente al cargar cualquier juego

- **Integración con componente GamePlayer**
  - Detectar si debe mostrar controles táctiles
  - Pasar callbacks de input a cada juego
  - Renderizar overlay de controles como children de GamePlayer

- **Implementación por juego**
  - **Snake:** D-Pad/Joystick (4 direcciones) + no usa botones arcade
  - **Tetris:** D-Pad/Joystick (izquierda/derecha/abajo para soft drop) + A (Rotar CW), B (Rotar CCW), X (Hard Drop), Y (Hold - si se implementa)
  - **Asteroides:** D-Pad/Joystick (8 direcciones: 4 cardinales + 4 diagonales para rotar nave) + A (Disparar), B (Hiperespacio)
  - **Arkanoid:** Solo izquierda/derecha (no arriba/abajo) + A (Soltar bola)

### NO incluido en esta especificación (se difiere)

- Vibración háptica (Navigator.vibrate API) — Se puede agregar en spec futura
- Customización de posición de controles (drag and drop) — Usamos layout fijo
- Controles para juegos futuros no listados — Se agregan según sean implementados
- Modo landscape forzado — Respetamos orientación del dispositivo
- Controles para desktop con touchscreen — Solo móviles/tablets por ahora
- Botón de cambio D-Pad/Joystick en UI — Solo se cambia vía settings (futuro)
- Animaciones complejas de transición — Feedback simple por ahora

---

## Modelo de datos

### Control State (en GamePlayer)

```typescript
interface MobileControlsState {
  // Detección y visibilidad
  isTouch: boolean                // Detectado touch capability
  showControls: boolean           // Mostrar controles (user setting)
  controlMode: 'dpad' | 'joystick' // Modo de control direccional
  
  // Estado de inputs
  direction: {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
  }
  buttons: {
    a: boolean
    b: boolean
    x: boolean
    y: boolean
  }
  
  // Joystick state (solo si controlMode === 'joystick')
  joystick: {
    active: boolean
    angle: number      // 0-360 grados
    distance: number   // 0-1 normalizado
  }
}
```

### Mapeo de botones por juego

```typescript
interface GameControlMapping {
  gameId: string
  directional: {
    up?: string      // label/acción
    down?: string
    left?: string
    right?: string
  }
  buttons: {
    a?: { label: string; action: string; keyCode: string }
    b?: { label: string; action: string; keyCode: string }
    x?: { label: string; action: string; keyCode: string }
    y?: { label: string; action: string; keyCode: string }
  }
}

// Configuraciones concretas
const GAME_CONTROLS: Record<string, GameControlMapping> = {
  snake: {
    gameId: 'snake',
    directional: {
      up: 'Arriba',
      down: 'Abajo',
      left: 'Izquierda',
      right: 'Derecha'
    },
    buttons: {} // No usa botones arcade
  },
  
  tetris: {
    gameId: 'tetris',
    directional: {
      left: 'Mover izq',
      right: 'Mover der',
      down: 'Soft drop'
    },
    buttons: {
      a: { label: 'A', action: 'Rotar CW', keyCode: 'ArrowUp' },
      b: { label: 'B', action: 'Rotar CCW', keyCode: 'KeyZ' },
      x: { label: 'X', action: 'Hard Drop', keyCode: 'Space' },
      y: { label: 'Y', action: 'Hold', keyCode: 'KeyC' } // Si se implementa hold
    }
  },
  
  rocas: { // Asteroides
    gameId: 'rocas',
    directional: {
      up: 'Acelerar',
      left: 'Rotar izq',
      right: 'Rotar der'
    },
    buttons: {
      a: { label: 'A', action: 'Disparar', keyCode: 'Space' },
      b: { label: 'B', action: 'Hiperespacio', keyCode: 'KeyH' }
    }
  },
  
  arkanoid: {
    gameId: 'arkanoid',
    directional: {
      left: 'Mover izq',
      right: 'Mover der'
    },
    buttons: {
      a: { label: 'A', action: 'Soltar bola', keyCode: 'Space' }
    }
  }
}
```

### LocalStorage keys

```typescript
// Preferencias del usuario
'arcade-vault-mobile-controls': 'true' | 'false'  // Mostrar/ocultar controles
'arcade-vault-control-mode': 'dpad' | 'joystick'  // Modo de control direccional
```

---

## Plan de implementación

### 1. Crear utilidades de detección de dispositivos

**Archivos nuevos:**
- `lib/utils/deviceDetection.ts`

**Cambios:**
- Función `isTouchDevice(): boolean` — Detecta si el device soporta touch
  - Chequea `'ontouchstart' in window`
  - Chequea `navigator.maxTouchPoints > 0`
  - Retorna `true` solo si ambas condiciones se cumplen
- Función `loadControlPreferences(): { showControls: boolean; mode: 'dpad' | 'joystick' }`
  - Lee desde localStorage
  - Defaults: `showControls: true` (si es touch device), `mode: 'dpad'`
- Función `saveControlPreferences(prefs): void`
  - Guarda en localStorage

**Verificación:**
- Detección correcta en móviles reales (no solo dev tools)
- Persistencia funciona entre recargas

---

### 2. Crear constantes de mapeo de controles

**Archivos nuevos:**
- `lib/game/controls/controlMappings.ts`

**Cambios:**
- Exportar constante `GAME_CONTROLS` con todos los mapeos (ver Modelo de datos)
- Función `getGameControls(gameId: string): GameControlMapping | null`
  - Retorna mapeo para el juego especificado
  - Retorna `null` si el juego no tiene controles táctiles configurados

**Verificación:**
- Mapeos accesibles desde cualquier componente
- Tipos TypeScript correctos

---

### 3. Crear componente D-Pad

**Archivos nuevos:**
- `components/games/controls/DPad.tsx`

**Cambios:**
- Componente funcional con props:
  ```typescript
  interface DPadProps {
    onDirectionChange: (direction: { up: boolean; down: boolean; left: boolean; right: boolean }) => void
    disabled: boolean
    mapping: GameControlMapping['directional']
  }
  ```
- Layout: 4 botones en cruz (↑ arriba, ↓ abajo, ← izquierda, → derecha)
- Eventos `onTouchStart`, `onTouchEnd`, `onTouchCancel`
- Estado interno: qué direcciones están activas
- Callback `onDirectionChange` se llama cuando cambia alguna dirección
- Styling:
  - Botones circulares o cuadrados con bordes redondeados
  - Colores: fondo oscuro con bordes cyan (theme Arcade Vault)
  - Opacidad: 0.6 normal, 1.0 al presionar
  - Tamaño: ~60px cada botón

**Verificación:**
- Responde a touch events
- Múltiples direcciones simultáneas (ej: arriba + izquierda en Asteroides)
- Se deshabilita visualmente cuando `disabled === true`

---

### 4. Crear componente Joystick virtual

**Archivos nuevos:**
- `components/games/controls/Joystick.tsx`

**Cambios:**
- Componente funcional con props:
  ```typescript
  interface JoystickProps {
    onDirectionChange: (direction: { up: boolean; down: boolean; left: boolean; right: boolean }) => void
    disabled: boolean
  }
  ```
- Layout: Área circular (base) + stick móvil (inner circle)
- Eventos:
  - `onTouchStart`: Iniciar drag
  - `onTouchMove`: Calcular ángulo y distancia desde centro
  - `onTouchEnd`: Reset stick a centro
- Lógica:
  - Calcular ángulo: `Math.atan2(dy, dx) * 180 / Math.PI`
  - Normalizar a 0-360 grados
  - Mapear ángulo a direcciones:
    - 315-45°: right
    - 45-135°: down
    - 135-225°: left
    - 225-315°: up
  - Permitir 8 direcciones (cardinales + diagonales)
  - Zona muerta en centro (deadzone: 20% del radio)
- Styling:
  - Base: círculo 120px, fondo oscuro con borde cyan
  - Stick: círculo 50px, se mueve dentro de la base
  - Opacidad: igual que D-Pad

**Verificación:**
- Stick se mueve fluidamente siguiendo el touch
- Direcciones se detectan correctamente
- Reset automático al soltar

---

### 5. Crear componente botonera arcade

**Archivos nuevos:**
- `components/games/controls/ArcadeButtons.tsx`

**Cambios:**
- Componente funcional con props:
  ```typescript
  interface ArcadeButtonsProps {
    onButtonPress: (button: 'a' | 'b' | 'x' | 'y', pressed: boolean) => void
    disabled: boolean
    mapping: GameControlMapping['buttons']
  }
  ```
- Layout: 4 botones dispuestos en diagonal (estilo SNES/Xbox)
  - Orden visual: Y arriba-izq, X arriba-der, B abajo-izq, A abajo-der
- Solo renderiza botones que existen en `mapping`
  - Ejemplo: Snake no muestra ningún botón
  - Arkanoid solo muestra botón A
- Eventos `onTouchStart`, `onTouchEnd` por cada botón
- Label visible: letra (A, B, X, Y) en el centro del botón
- Tooltip/subtitle con la acción (opcional, si hay espacio)
- Styling:
  - Botones circulares ~55px
  - Colores diferenciados: A (cyan), B (yellow), X (magenta), Y (green)
  - Letra blanca centrada, font bold
  - Opacidad: 0.6 normal, 1.0 al presionar

**Verificación:**
- Solo botones mapeados son visibles
- Eventos touch funcionan correctamente
- Feedback visual inmediato al presionar

---

### 6. Crear componente orquestador MobileControls

**Archivos nuevos:**
- `components/games/controls/MobileControls.tsx`

**Cambios:**
- Componente contenedor que renderiza D-Pad o Joystick + ArcadeButtons
- Props:
  ```typescript
  interface MobileControlsProps {
    gameId: string
    onInput: (input: MobileControlsState) => void
    isPaused: boolean
    controlMode: 'dpad' | 'joystick'
  }
  ```
- Layout:
  - Contenedor absoluto que cubre toda la pantalla (pero transparente)
  - Controles direccionales en `bottom: 20px; left: 20px`
  - Botones arcade en `bottom: 20px; right: 20px`
  - Z-index alto (999)
- Lógica:
  - Cargar mapeo con `getGameControls(gameId)`
  - Agregar estado interno para direcciones + botones
  - Consolidar inputs y llamar `onInput` cada vez que cambia algo
  - Pasar `disabled={isPaused}` a todos los subcomponentes
- Renderizado condicional:
  - Si `controlMode === 'dpad'` → renderiza `<DPad />`
  - Si `controlMode === 'joystick'` → renderiza `<Joystick />`
  - Siempre renderiza `<ArcadeButtons />` (si el juego tiene botones mapeados)

**Verificación:**
- Componente se monta correctamente sobre el canvas
- Inputs se consolidan y se envían al padre
- Cambio entre D-Pad y Joystick funciona (aunque por ahora sin UI de toggle)

---

### 7. Integrar con GamePlayer

**Archivos modificados:**
- `components/games/GamePlayer.tsx`

**Cambios:**
- Importar `isTouchDevice`, `loadControlPreferences`, `MobileControls`
- State nuevo:
  ```typescript
  const [showMobileControls, setShowMobileControls] = useState(false)
  const [controlMode, setControlMode] = useState<'dpad' | 'joystick'>('dpad')
  const [mobileInput, setMobileInput] = useState<MobileControlsState | null>(null)
  ```
- useEffect en mount:
  ```typescript
  useEffect(() => {
    const isTouch = isTouchDevice()
    const prefs = loadControlPreferences()
    setShowMobileControls(isTouch && prefs.showControls)
    setControlMode(prefs.mode)
  }, [])
  ```
- Handler `handleMobileInput(input: MobileControlsState)`:
  - Actualiza `mobileInput` en state
  - Simula eventos de teclado para compatibilidad con juegos existentes (ver paso 8)
- Renderizado:
  ```tsx
  {showMobileControls && (
    <MobileControls
      gameId={game.id}
      onInput={handleMobileInput}
      isPaused={isPaused}
      controlMode={controlMode}
    />
  )}
  ```

**Verificación:**
- Controles aparecen solo en dispositivos táctiles
- Se respeta la preferencia guardada
- Inputs móviles se propagan correctamente

---

### 8. Adaptar cada juego para recibir inputs móviles

**Archivos modificados:**
- `components/games/SnakeGame.tsx`
- `components/games/TetrisGame.tsx`
- `components/games/AsteroidesGame.tsx` (o nombre actual)
- `components/games/ArkanoidGame.tsx`

**Cambios por juego:**
- Agregar prop opcional: `mobileInput?: MobileControlsState`
- En game loop / input handling:
  - Si `mobileInput` existe, priorizar sobre keyboard
  - Ejemplo en Snake:
    ```typescript
    if (mobileInput?.direction.up) {
      // Procesar input arriba
    } else if (keyPressed['ArrowUp']) {
      // Fallback a teclado
    }
    ```
  - Ejemplo en Tetris:
    ```typescript
    if (mobileInput?.buttons.a) {
      // Rotar CW
    } else if (keyPressed['ArrowUp']) {
      // Fallback a teclado
    }
    ```
- Alternativamente, simular eventos de teclado en GamePlayer:
  ```typescript
  // En handleMobileInput
  if (input.direction.left) {
    simulateKeyPress('ArrowLeft', true)
  }
  ```
  **Decisión:** Preferir simulación de eventos desde GamePlayer para no modificar lógica interna de cada juego (menos invasivo).

**Verificación por juego:**
- Snake: Direcciones funcionan, cambio de dirección es responsive
- Tetris: Movimiento lateral + rotación + drops funcionan
- Asteroides: Rotación + aceleración + disparar + hiperespacio funcionan
- Arkanoid: Movimiento lateral + soltar bola funcionan

---

### 9. Crear helper de simulación de eventos de teclado

**Archivos nuevos:**
- `lib/utils/keyboardSimulation.ts`

**Cambios:**
- Función `simulateKeyEvent(keyCode: string, type: 'keydown' | 'keyup'): void`
  - Crea evento personalizado: `new KeyboardEvent(type, { key: keyCode, code: keyCode })`
  - Dispatch en `window.document`
- Función `processControlInput(input: MobileControlsState, mapping: GameControlMapping): void`
  - Compara input actual vs anterior (guardar en ref)
  - Emitir eventos keydown/keyup según cambios
  - Ejemplo: si `input.buttons.a` cambió de false a true, emitir keydown con el keyCode mapeado

**Verificación:**
- Eventos simulados son capturados por listeners de juegos
- No hay conflictos con keyboard real (en desktop con touchscreen)

---

### 10. Agregar estilos Tailwind para controles

**Archivos modificados:**
- `app/globals.css` (o crear `components/games/controls/styles.css`)

**Cambios:**
- Clases CSS para controles móviles:
  ```css
  .mobile-controls-container {
    position: absolute;
    inset: 0;
    pointer-events: none; /* Solo los botones reciben eventos */
    z-index: 999;
  }
  
  .mobile-control-btn {
    pointer-events: auto;
    opacity: 0.6;
    transition: opacity 0.1s ease, transform 0.1s ease;
  }
  
  .mobile-control-btn:active {
    opacity: 1;
    transform: scale(0.95);
  }
  
  .mobile-control-btn:disabled {
    opacity: 0.3;
    pointer-events: none;
  }
  ```
- Colores de botones arcade:
  ```css
  .btn-a { background: rgba(34, 211, 238, 0.8); } /* cyan */
  .btn-b { background: rgba(250, 204, 21, 0.8); } /* yellow */
  .btn-x { background: rgba(217, 70, 239, 0.8); } /* magenta */
  .btn-y { background: rgba(74, 222, 128, 0.8); } /* green */
  ```

**Verificación:**
- Estilos se aplican correctamente
- Transiciones son suaves
- Colores respetan tema de Arcade Vault

---

### 11. Testing end-to-end en dispositivos reales

**Checklist:**
- [ ] Controles aparecen solo en móviles/tablets (no en desktop sin touch)
- [ ] D-Pad y Joystick funcionan en cada juego
- [ ] Botones arcade responden correctamente
- [ ] Feedback visual al presionar es claro
- [ ] Controles se deshabilitan al pausar
- [ ] Preferencias persisten entre sesiones
- [ ] No hay lag perceptible entre touch y acción en juego
- [ ] Layout responsive funciona en portrait y landscape
- [ ] No tapa elementos críticos del HUD
- [ ] Funciona en navegadores móviles (Chrome Android, Safari iOS)

---

## Criterios de aceptación

- [ ] Controles táctiles se detectan y muestran automáticamente en móviles/tablets
- [ ] No se muestran en desktop (excepto si forzamos touch en dev tools)
- [ ] D-Pad renderiza 4 botones direccionales funcionales
- [ ] Joystick virtual renderiza área drag con stick móvil funcional
- [ ] Botonera arcade renderiza 4 botones (A, B, X, Y) con letras visibles
- [ ] Solo se muestran botones mapeados para cada juego (ej: Snake no muestra botones)
- [ ] Layout: direccionales bottom-left, botones bottom-right
- [ ] Feedback visual: opacidad cambia al presionar (0.6 → 1.0)
- [ ] Controles se deshabilitan visualmente cuando `isPaused === true`
- [ ] Preferencias de modo (dpad/joystick) persisten en localStorage
- [ ] Inputs móviles se procesan correctamente en cada juego:
  - Snake: Direcciones funcionan
  - Tetris: Movimiento + rotación + drops funcionan
  - Asteroides: Rotación + aceleración + disparar + hiperespacio funcionan
  - Arkanoid: Movimiento lateral + soltar bola funcionan
- [ ] No hay lag perceptible entre touch y respuesta del juego
- [ ] TypeScript compila sin errores
- [ ] No hay warnings en consola del browser
- [ ] Funciona en Chrome Android y Safari iOS
- [ ] Funciona en orientación portrait y landscape

---

## Decisiones tomadas

1. **HTML overlay vs canvas** — HTML separado (divs absolutos) es más flexible para eventos, estilos y accesibilidad que dibujar en el mismo canvas del juego.

2. **Simulación de eventos de teclado** — En lugar de modificar la lógica interna de cada juego para soportar inputs móviles, simulamos eventos KeyboardEvent desde GamePlayer. Menos invasivo y mantiene retrocompatibilidad.

3. **Ambos modos (D-Pad + Joystick)** — Ofrecer ambos y guardar preferencia da flexibilidad al usuario sin complicar demasiado la implementación. Default: D-Pad (más familiar para juegos arcade clásicos).

4. **Iconografía con letras (A, B, X, Y)** — Estilo gamepad moderno, universalmente reconocible. Más claro que iconos customizados por acción.

5. **Persistencia en localStorage** — No requiere backend, rápido de implementar, suficiente para preferencias de UI.

6. **Detección automática de touch** — No agregamos toggle manual en UI por ahora. Si el device soporta touch, los controles aparecen. Simplifica UX.

7. **Layout fijo (bottom-left + bottom-right)** — Evita complejidad de drag and drop de controles. Posiciones probadas en diseño móvil de juegos.

8. **Deshabilitar en pausa (no ocultar)** — Mantener controles visibles pero deshabilitados da feedback claro de que están ahí, solo inactivos temporalmente.

9. **Zona muerta en joystick (20% deadzone)** — Evita inputs accidentales al tocar ligeramente el centro. Standard en juegos móviles.

10. **Z-index 999** — Controles siempre visibles sobre el canvas, pero no interfieren con modals o UI de mayor prioridad (game over modal puede usar z-index 1000+).

---

## Decisiones descartadas

1. **Vibración háptica** — Descartado por ahora. Navigator.vibrate tiene soporte limitado y puede molestar a algunos usuarios. Se puede agregar en spec futura como opción.

2. **Customización de posición** — Descartado. Drag and drop de controles es complejo y la mayoría de usuarios no lo ajustarían. Layout fijo es suficiente para MVP.

3. **Controles para desktop touchscreen** — Descartado. Edge case poco común, no vale la pena la complejidad. Si el usuario está en desktop, asumimos que tiene teclado disponible.

4. **Botón UI para cambiar D-Pad/Joystick** — Descartado. Agregar un toggle en el HUD satura la interfaz. Se puede agregar en settings del perfil en el futuro.

5. **8 direcciones en D-Pad** — Descartado. D-Pad es tradicionalmente 4 direcciones (cardinales). Para 8 direcciones (diagonales), el usuario puede usar Joystick.

6. **Animaciones complejas** — Descartado. Glow effects sutiles son suficientes. Animaciones tipo ripple o particle effects son overkill para controles funcionales.

7. **Controles diferentes en portrait vs landscape** — Descartado. Mismo layout funciona en ambas orientaciones con media queries simples.

---

## Riesgos identificados

| Riesgo | Mitigación |
|--------|-----------|
| **Lag entre touch y respuesta del juego** | Usar eventos touch nativos (no click), evitar debounce, simular keyboard events síncronamente. Testear en dispositivos de gama baja. |
| **Controles tapan elementos del HUD** | Ajustar padding y tamaño de controles. Testear en múltiples resoluciones móviles. Considerar hacer HUD más compacto en móvil si es necesario. |
| **Múltiples touches simultáneos (ej: presionar A + mover)** | Asegurar que `touch-action: none` está configurado en controles para evitar scroll/zoom del browser. Testear gestos multi-touch. |
| **Simulación de keyboard events no capturada por juegos** | Verificar que los juegos usan event listeners estándar (`addEventListener('keydown')`). Si algún juego usa polling de `pressed keys state`, adaptar ese juego específicamente. |
| **Preferencias de localStorage no sincronizan entre devices** | Esperado, localStorage es por device. Si en el futuro queremos sincronizar, mover a Supabase (tabla user_settings). Por ahora es aceptable. |
| **Joystick puede ser confuso para usuarios acostumbrados a D-Pad** | Default es D-Pad. En el futuro, agregar tutorial corto la primera vez que se carga un juego en móvil. |
| **Performance del Joystick con touchmove frecuente** | Throttle del callback `onDirectionChange` a 60fps (16ms). No recalcular si el cambio de dirección es menor a un threshold. |

---

**FIN DE SPEC 09**
