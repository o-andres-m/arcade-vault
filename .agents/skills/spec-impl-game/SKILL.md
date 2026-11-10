---
name: spec-impl-game
description: |
  Post-implementation enhancer para juegos. Después de ejecutar /spec-impl,
  este skill agrega automáticamente skins (3 paletas de colores) y controles
  móviles táctiles. Extrae game-id del spec, verifica la implementación base,
  ejecuta secuencialmente skin-designer y mobile-porter, y reporta resultados.
  NO hace commits ni pushes - solo implementa features.
disable-model-invocation: false
argument-hint: "[spec-reference]"
allowed-tools:
  Read, Grep, Bash(ls:*), Bash(find:*), Bash(grep:*), Bash(cat:*),
  Bash(git status:*), Bash(git log:*), Bash(git diff:*),
  Skill, AskUserQuestion
---

# /spec-impl-game — Post-Implementation Game Enhancer

## Philosophy

Este skill es un **enhancer post-implementación** que automatiza la adición de features estándar a juegos recién implementados:

1. ✅ Usuario ejecuta `/spec-impl [spec]` → Juego base implementado
2. ✅ Usuario ejecuta `/spec-impl-game [spec]` → Agrega skins + móvil automáticamente

**NO reemplaza a spec-impl**, sino que lo complementa automatizando los pasos posteriores que todos los juegos necesitan.

## Session Context

Current repository state: !`git status --short`

Current branch: !`git branch --show-current`

Specs available:
!`ls specs/*.md 2>/dev/null | xargs -n1 basename`

Existing games:
!`grep '"id":' lib/data.ts | cut -d'"' -f4 | tr '\n' ',' | sed 's/,$//'`

Games with mobile support:
!`grep 'gameId:' lib/game/controls/controlMappings.ts | grep -oP "'\K[^']+" | tr '\n' ',' | sed 's/,$//'`

Games with skins:
!`grep -rl "COLOR_PALETTES" lib/game/ 2>/dev/null | grep "constants.ts" | cut -d/ -f3 | sort -u | tr '\n' ',' | sed 's/,$//'`

---

## Arguments

Recibe: `$ARGUMENTS` = spec reference (número, slug, o nombre completo)

Ejemplos:
- `/spec-impl-game 07` → Busca specs/07-*.md
- `/spec-impl-game add-snake` → Busca specs/*-add-snake.md
- `/spec-impl-game 07-add-snake` → Busca specs/07-add-snake.md

---

## FASE 1: Análisis y Verificación

**Goal**: Identificar spec, extraer game-id, verificar que spec-impl ya corrió.

### Paso 1.1: Identificar el spec

El argumento recibido es: `$ARGUMENTS`

Si `$ARGUMENTS` está vacío:
- Listar specs disponibles (ya están en Session Context)
- Preguntar al usuario con `AskUserQuestion`
- STOP y esperar respuesta

Si `$ARGUMENTS` tiene valor, buscar el spec usando tres estrategias:

1. **Por número**: Si es solo dígitos (ej: `07`), buscar `specs/07-*.md`
2. **Por slug**: Si es texto (ej: `add-snake`), buscar `specs/*-add-snake.md`
3. **Por nombre completo**: Si coincide formato `NN-slug`, buscar exacto

```bash
# Ejemplo de búsqueda
ARG="$ARGUMENTS"

# Intentar búsqueda
SPEC_FILE=$(ls specs/ | grep -E "^${ARG}-|^[0-9]+-${ARG}\.md$|^${ARG}\.md$" | head -1)

if [ -z "$SPEC_FILE" ]; then
  # No encontrado - listar y preguntar
  echo "❌ No encontré spec con referencia: $ARG"
  ls specs/*.md
  # AskUserQuestion aquí
fi
```

### Paso 1.2: Leer y validar estado del spec

```bash
Read specs/[spec-encontrado].md
```

Buscar línea de estado cerca del inicio del archivo (primeras 10-20 líneas).

La etiqueta es típicamente `**Estado:**` o `**Status:**`, pero puede variar.

**Solo continuar si el estado significa "Approved"** (cualquier idioma).

Si NO es Approved:
```
❌ El spec no está en estado Approved.

Estado actual: [estado-encontrado]
Spec: specs/[nombre].md

Para usar este skill, el spec debe:
  1. Estar en estado Approved
  2. Ya haber sido implementado con /spec-impl

Si aún no ejecutaste /spec-impl, hazlo primero:
  /spec-impl [spec-reference]

Luego ejecuta este skill para agregar skins y controles móviles.
```

STOP.

### Paso 1.3: Extraer game-id del spec

Usar múltiples estrategias en orden de prioridad:

**Estrategia 1: Buscar `game_id: 'xxx'` o `game_id: "xxx"`**
```bash
GAME_ID=$(grep -oP "game_id:\s*['\"\`]?\K\w+(?=['\"\`]?)" specs/[spec].md | head -1)
```

**Estrategia 2: Buscar `/juego/xxx/jugar`**
```bash
GAME_ID=$(grep -oP '/juego/\K\w+(?=/jugar)' specs/[spec].md | head -1)
```

**Estrategia 3: Buscar `lib/game/xxx/`**
```bash
GAME_ID=$(grep -oP 'lib/game/\K\w+(?=/)' specs/[spec].md | sort | uniq -c | sort -rn | head -1 | awk '{print $2}')
```

**Estrategia 4: Buscar `XxxGame.tsx` y normalizar**
```bash
COMPONENT=$(grep -oP 'components/games/\K\w+(?=Game\.tsx)' specs/[spec].md | head -1)
# Normalizar: SnakeGame → snake, AsteroidsGame → rocas (ver mapeo especial)
```

**Si TODO falla**, preguntar con `AskUserQuestion`:
```
⚠️ No pude extraer game-id automáticamente del spec.

Spec: specs/[nombre].md

Juegos existentes en el sistema:
  [lista de IDs de lib/data.ts]

¿Cuál es el game-id de este juego?
(Debe ser lowercase, sin espacios, como aparece en lib/data.ts)
```

**Mapeo especial de componentes a game-id:**
- `AsteroidsGame` → `rocas`
- Resto: `[Name]Game` → `[name]` (lowercase)

### Paso 1.4: Verificar que spec-impl ya corrió

**CRÍTICO**: Este skill requiere que el juego YA esté implementado por `/spec-impl`.

**Obtener nombre del componente desde game-id:**
```bash
# Mapeo inverso
case "$GAME_ID" in
  rocas)
    COMPONENT_NAME="AsteroidsGame"
    ;;
  *)
    # Default: capitalize + "Game"
    COMPONENT_NAME="$(echo $GAME_ID | sed 's/^./\U&/')Game"
    ;;
esac
```

**Verificar archivos obligatorios:**

```bash
# 1. Componente existe
if [ ! -f "components/games/${COMPONENT_NAME}.tsx" ]; then
  COMPONENTE_OK="❌"
else
  COMPONENTE_OK="✅"
fi

# 2. Librería existe
if [ ! -d "lib/game/${GAME_ID}/" ]; then
  LIBRERIA_OK="❌"
else
  LIBRERIA_OK="✅"
fi

# 3. Registrado en data.ts
if ! grep -q "id: \"${GAME_ID}\"" lib/data.ts; then
  DATA_OK="❌"
else
  DATA_OK="✅"
fi

# 4. Tiene archivos (mínimo 1)
NUM_ARCHIVOS=$(ls lib/game/${GAME_ID}/ 2>/dev/null | wc -l)
if [ "$NUM_ARCHIVOS" -eq 0 ]; then
  ARCHIVOS_OK="❌"
else
  ARCHIVOS_OK="✅"
fi
```

**Si ALGUNO está en ❌:**
```
❌ El juego base NO está implementado todavía.

Verificación de archivos:
  - Componente (components/games/[Name]Game.tsx): [COMPONENTE_OK]
  - Librería (lib/game/[id]/): [LIBRERIA_OK]
  - Registro (lib/data.ts): [DATA_OK]
  - Archivos del juego: [ARCHIVOS_OK]

Este skill requiere que el juego ya esté implementado.

Por favor ejecuta primero:
  /spec-impl [spec-reference]

Luego vuelve a ejecutar:
  /spec-impl-game [spec-reference]
```

STOP.

**Si TODO está en ✅:**
```
✅ Verificación exitosa

Spec: specs/[nombre].md
Game ID: [game-id]
Componente: components/games/[Name]Game.tsx
Librería: lib/game/[id]/ ([NUM_ARCHIVOS] archivos)

El juego base ya está implementado.
Procederé a agregar:
  1. 🎨 Sistema de skins (3 paletas de colores)
  2. 📱 Controles móviles táctiles

¿Continuar? [Y/n]
```

Preguntar confirmación con `AskUserQuestion`. Si usuario responde "n" o "no", STOP.

---

## FASE 2: Sistema de Skins

**Goal**: Invocar `/skin-designer` para agregar 3 paletas de colores.

### Paso 2.1: Ejecutar skin-designer

Mostrar mensaje de progreso:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 2: SISTEMA DE SKINS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Delegando a /skin-designer [game-id]...

Este proceso:
  - Analiza colores actuales del juego
  - Crea 3 paletas: neon, pastel, retro
  - Modifica [Name]Game.tsx para aceptar colorPalette
  - Agrega selector en GamePlayer.tsx

⏳ Esperando a que skin-designer termine...
```

Invocar usando herramienta `Skill`:
```
Skill({
  skill: "skin-designer",
  args: "[game-id]"
})
```

### Paso 2.2: Verificar éxito de skin-designer

Después que `Skill` retorna, verificar archivos creados/modificados:

```bash
# 1. constants.ts existe
if [ -f "lib/game/${GAME_ID}/constants.ts" ]; then
  CONSTANTS_OK="✅"
else
  CONSTANTS_OK="❌"
fi

# 2. Contiene COLOR_PALETTES
if grep -q "COLOR_PALETTES" "lib/game/${GAME_ID}/constants.ts" 2>/dev/null; then
  PALETAS_OK="✅"
else
  PALETAS_OK="❌"
fi

# 3. Componente acepta colorPalette
if grep -q "colorPalette" "components/games/${COMPONENT_NAME}.tsx" 2>/dev/null; then
  PROP_OK="✅"
else
  PROP_OK="❌"
fi

# 4. GamePlayer tiene selector para este juego
if grep -q "game.id === '${GAME_ID}'" "components/games/GamePlayer.tsx" 2>/dev/null; then
  SELECTOR_OK="✅"
else
  SELECTOR_OK="❌"
fi
```

**Si TODO está en ✅:**
```
✅ FASE 2 COMPLETADA: Sistema de skins implementado

Archivos modificados:
  - lib/game/[id]/constants.ts (paletas agregadas)
  - components/games/[Name]Game.tsx (soporte colorPalette)
  - components/games/GamePlayer.tsx (selector agregado)

Paletas disponibles:
  🟢 Neon - Colores brillantes y vibrantes
  🎨 Pastel - Colores suaves y claros
  ✨ Retro - Colores clásicos arcade

Continuando con Fase 3...
```

**Si ALGUNO está en ❌:**
```
⚠️ FASE 2 INCOMPLETA: skin-designer tuvo problemas

Verificación de archivos:
  - constants.ts existe: [CONSTANTS_OK]
  - COLOR_PALETTES definido: [PALETAS_OK]
  - Componente acepta colorPalette: [PROP_OK]
  - GamePlayer tiene selector: [SELECTOR_OK]

El juego es funcional pero el sistema de skins puede estar incompleto.

Opciones:
  1. Continuar sin skins (ir a Fase 3 - controles móviles)
  2. Revisar archivos y ejecutar /skin-designer [game-id] manualmente
  3. STOP aquí y corregir antes de continuar

¿Continuar a Fase 3? [Y/n]
```

Preguntar con `AskUserQuestion`. Si usuario dice "no", reportar estado parcial y STOP.

---

## FASE 3: Controles Móviles

**Goal**: Invocar `/mobile-porter` para agregar controles táctiles.

### Paso 3.1: Ejecutar mobile-porter

Mostrar mensaje de progreso:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FASE 3: CONTROLES MÓVILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Delegando a /mobile-porter [game-id]...

Este proceso:
  - Analiza controles de teclado del juego
  - Determina tipo de control (DPad/Joystick/ArcadeJoystick)
  - Crea mapeo de controles táctiles
  - Agrega entrada en controlMappings.ts

⏳ Esperando a que mobile-porter termine...
```

Invocar usando herramienta `Skill`:
```
Skill({
  skill: "mobile-porter",
  args: "[game-id]"
})
```

### Paso 3.2: Verificar éxito de mobile-porter

```bash
# 1. Mapeo existe
if grep -q "${GAME_ID}:" lib/game/controls/controlMappings.ts 2>/dev/null; then
  MAPEO_OK="✅"
else
  MAPEO_OK="❌"
fi

# 2. Estructura completa del mapeo
if [ "$MAPEO_OK" = "✅" ]; then
  MAPEO=$(sed -n "/${GAME_ID}:/,/^  }/p" lib/game/controls/controlMappings.ts)
  
  if echo "$MAPEO" | grep -q "gameId:"; then
    GAMEID_OK="✅"
  else
    GAMEID_OK="❌"
  fi
  
  if echo "$MAPEO" | grep -q "directional:"; then
    DIRECTIONAL_OK="✅"
  else
    DIRECTIONAL_OK="❌"
  fi
  
  if echo "$MAPEO" | grep -q "buttons:"; then
    BUTTONS_OK="✅"
  else
    BUTTONS_OK="❌"
  fi
fi
```

**Si TODO está en ✅:**
```
✅ FASE 3 COMPLETADA: Controles móviles implementados

Archivo modificado:
  - lib/game/controls/controlMappings.ts

Mapeo creado:
  [extracto del mapeo - primeras 10 líneas]

Compatibilidad:
  - Desktop: ✅ (teclado sin cambios)
  - Móvil: ✅ (controles táctiles agregados)

Continuando con Fase 4...
```

**Si hay problemas:**
```
⚠️ FASE 3 INCOMPLETA: mobile-porter tuvo problemas

Verificación de archivos:
  - Mapeo existe: [MAPEO_OK]
  - gameId definido: [GAMEID_OK]
  - directional definido: [DIRECTIONAL_OK]
  - buttons definido: [BUTTONS_OK]

Posibles causas:
  - Juego usa controles no estándar (ej: solo mouse)
  - Necesita implementación custom (mobile-porter puede haber documentado limitación)

El juego es funcional en desktop pero puede no tener controles móviles completos.

Revisar: lib/game/controls/controlMappings.ts

¿Continuar a Fase 4 (resumen)? [Y/n]
```

Preguntar con `AskUserQuestion`. Si usuario dice "no", STOP.

---

## FASE 4: Resumen Unificado

**Goal**: Consolidar todos los cambios y proporcionar instrucciones finales.

### Paso 4.1: Recopilar estadísticas

```bash
# Branch actual
BRANCH=$(git branch --show-current)

# Archivos modificados en este enhancement
ENHANCED_FILES=$(git status --short | grep -E '(lib/game/.*constants\.ts|lib/game/controls/controlMappings\.ts|components/games/GamePlayer\.tsx|components/games/${COMPONENT_NAME}\.tsx)')

# Total de archivos del juego
GAME_FILES=$(git status --short | grep -E "(components/games/${COMPONENT_NAME}|lib/game/${GAME_ID})")

NUM_ENHANCED=$(echo "$ENHANCED_FILES" | wc -l)
NUM_TOTAL=$(echo "$GAME_FILES" | wc -l)
```

### Paso 4.2: Determinar estado de cada fase

```bash
FASE1_STATUS="✅"  # Siempre OK (si llegamos aquí)

if [ "$CONSTANTS_OK" = "✅" ] && [ "$PALETAS_OK" = "✅" ] && [ "$PROP_OK" = "✅" ] && [ "$SELECTOR_OK" = "✅" ]; then
  FASE2_STATUS="✅"
else
  FASE2_STATUS="⚠️"
fi

if [ "$MAPEO_OK" = "✅" ] && [ "$GAMEID_OK" = "✅" ] && [ "$DIRECTIONAL_OK" = "✅" ] && [ "$BUTTONS_OK" = "✅" ]; then
  FASE3_STATUS="✅"
else
  FASE3_STATUS="⚠️"
fi
```

### Paso 4.3: Generar reporte final

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 ENHANCEMENT COMPLETADO: [GAME TITLE]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 RESUMEN DE FASES

  ✅ Fase 1: Análisis y Verificación
     - Spec: specs/[nombre].md
     - Game ID: [game-id]
     - Juego base: Implementado ✅

  [FASE2_STATUS] Fase 2: Sistema de Skins
     - Paletas: neon, pastel, retro
     - constants.ts: [CONSTANTS_OK]
     - Selector GamePlayer: [SELECTOR_OK]

  [FASE3_STATUS] Fase 3: Controles Móviles
     - Mapeo: controlMappings.ts [MAPEO_OK]
     - Estructura completa: [GAMEID_OK] [DIRECTIONAL_OK] [BUTTONS_OK]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 ESTADÍSTICAS

  - Archivos del juego (total): [NUM_TOTAL]
  - Modificados en enhancement: [NUM_ENHANCED]
  - Branch: [BRANCH]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 ARCHIVOS MODIFICADOS EN ESTE ENHANCEMENT

Sistema de skins:
  [listar archivos si FASE2_STATUS = ✅]
  - lib/game/[id]/constants.ts
  - components/games/[Name]Game.tsx
  - components/games/GamePlayer.tsx

Controles móviles:
  [listar archivos si FASE3_STATUS = ✅]
  - lib/game/controls/controlMappings.ts

[Si hubo archivos adicionales, listarlos]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 INSTRUCCIONES DE PRUEBA

### 1. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 2. Probar en navegador (Desktop)
```
http://localhost:3000/juego/[game-id]/jugar
```

**Checklist de validación - Desktop:**
- [ ] El juego funciona correctamente
[Si FASE2_STATUS = ✅:]
- [ ] Selector de paleta visible en HUD (al lado de Pausa)
- [ ] Cambiar entre neon/pastel/retro funciona en tiempo real
- [ ] Selección persiste al recargar página (localStorage)
- [ ] Controles de teclado siguen funcionando

### 3. Probar en móvil
```
# En DevTools: Ctrl+Shift+M (Toggle device toolbar)
# Seleccionar: iPhone 12 Pro (390x844) o similar
```

**Checklist de validación - Móvil:**
[Si FASE3_STATUS = ✅:]
- [ ] Controles táctiles aparecen automáticamente
- [ ] Direccionales responden correctamente
- [ ] Botones de acción funcionan (si aplica)
- [ ] Multi-touch funciona (mover + acción simultánea)
[Si FASE2_STATUS = ✅:]
- [ ] Selector de paleta también funciona en móvil

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Si alguna fase tuvo status ⚠️:]

⚠️  ATENCIÓN: FEATURES CON ISSUES

[Si FASE2_STATUS = ⚠️:]
  🎨 SKINS: Implementación incompleta
     Verificaciones fallidas:
       - constants.ts existe: [CONSTANTS_OK]
       - COLOR_PALETTES definido: [PALETAS_OK]
       - Componente acepta colorPalette: [PROP_OK]
       - GamePlayer tiene selector: [SELECTOR_OK]
     
     Para corregir manualmente:
       /skin-designer [game-id]

[Si FASE3_STATUS = ⚠️:]
  📱 MÓVIL: Implementación incompleta
     Verificaciones fallidas:
       - Mapeo existe: [MAPEO_OK]
       - gameId definido: [GAMEID_OK]
       - directional definido: [DIRECTIONAL_OK]
       - buttons definido: [BUTTONS_OK]
     
     Para corregir manualmente:
       /mobile-porter [game-id]
     
     Revisar también:
       lib/game/controls/controlMappings.ts
       (puede contener notas sobre limitaciones)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ ¡Enhancement completado!

El juego [GAME TITLE] ahora tiene:
  ✅ Implementación base (de /spec-impl)
  [FASE2_STATUS] 3 paletas de colores seleccionables
  [FASE3_STATUS] Controles táctiles para móvil

📌 NOTA: Los archivos están modificados pero NO se hizo commit.
   Revisa los cambios y commitea cuando estés listo.

¿Necesitas ajustes o correcciones?
```

---

## Hard Rules

### DO ✅

1. **Verificar SIEMPRE que spec-impl ya corrió** - No asumir. Usar archivos del disco.
2. **Usar archivos del disco como fuente de verdad** - No confiar en memoria de conversación.
3. **Reportar estado de CADA fase claramente** - Transparencia total con ✅ y ⚠️.
4. **Permitir continuar con warnings** - Skins y mobile son nice-to-have, no bloqueantes.
5. **Proporcionar instrucciones de prueba claras** - Usuario debe poder validar.
6. **Reportar archivos modificados** - Mostrar qué cambió pero dejar al usuario decidir cuándo commitear.
7. **Extraer game-id con estrategias múltiples** - Robustez ante variaciones de formato.
8. **Preguntar ante ambigüedad** - Mejor preguntar que asumir incorrectamente.

### DON'T ❌

1. **NO ejecutar si spec-impl no corrió primero** - Requirement absoluto.
2. **NO asumir éxito sin verificar archivos** - Siempre verificar con ls/grep.
3. **NO commitear automáticamente** - Usuario decide cuándo y cómo commitear.
4. **NO continuar si Fase 1 falla** - Análisis y verificación es crítico.
5. **NO ocultar errores o warnings** - Reportar todo claramente.
6. **NO deshacer trabajo previo ante fallo parcial** - Juego base es funcional, mantener.
7. **NO ejecutar en specs que no son de juegos** - Verificar que contiene game_id.
8. **NO saltarse confirmación del usuario** - Preguntar antes de empezar Fase 2.

---

## Tone and Style

- **Lenguaje**: Español (código y mensajes al usuario)
- **Visual**: Usar emojis y separadores para claridad (🎮 ✅ ⚠️ ━━━)
- **Transparente**: Reportar qué skill está corriendo y qué está haciendo
- **Accionable**: Errores con soluciones claras ("ejecuta X para corregir")
- **Completo**: Checklist de validación detallados
- **No verboso**: Conciso pero completo (balance entre información y brevedad)

---

## Notes

### Game-ID to Component Mapping

Casos especiales conocidos:
- `rocas` → `AsteroidsGame`

Regla general:
- `[game-id]` → `[GameId]Game` (capitalize first letter + "Game")

Normalización:
```bash
normalize_game_id_to_component() {
  case "$1" in
    rocas) echo "AsteroidsGame" ;;
    *) echo "$(echo $1 | sed 's/^./\U&/')Game" ;;
  esac
}
```

### Troubleshooting Común

**Problema**: "El juego base NO está implementado"
**Causa**: Usuario ejecutó `/spec-impl-game` antes de `/spec-impl`
**Solución**: Ejecutar `/spec-impl [spec-reference]` primero

**Problema**: "No pude extraer game-id"
**Causa**: Spec tiene formato no estándar
**Solución**: Skill preguntará, responder con game-id correcto (lowercase)

**Problema**: "skin-designer falló"
**Causa**: Juego tiene estructura de colores inusual
**Solución**: Continuar sin skins o ejecutar `/skin-designer [game-id]` manualmente después

**Problema**: "mobile-porter falló"
**Causa**: Juego usa controles no estándar (ej: solo mouse)
**Solución**: Revisar `controlMappings.ts`, puede necesitar implementación custom

---

✨ Listo para usar!
