import { MobileControlsState } from '@/components/games/controls/MobileControls'
import { GameControlMapping } from '@/lib/game/controls/controlMappings'

const previousStateRef: { [key: string]: any } = {}

export function simulateKeyEvent(code: string, type: 'keydown' | 'keyup'): void {
  const event = new KeyboardEvent(type, {
    key: code,
    code: code,
    bubbles: true,
    cancelable: true
  })
  window.document.dispatchEvent(event)
}

export function processControlInput(
  input: MobileControlsState,
  mapping: GameControlMapping
): void {
  const stateKey = `control_${mapping.gameId}`
  const previousState = previousStateRef[stateKey] || {}
  previousStateRef[stateKey] = input

  // Process directional inputs
  if (input.direction.up && !previousState.direction?.up) {
    simulateKeyEvent('ArrowUp', 'keydown')
  } else if (!input.direction.up && previousState.direction?.up) {
    simulateKeyEvent('ArrowUp', 'keyup')
  }

  if (input.direction.down && !previousState.direction?.down) {
    simulateKeyEvent('ArrowDown', 'keydown')
  } else if (!input.direction.down && previousState.direction?.down) {
    simulateKeyEvent('ArrowDown', 'keyup')
  }

  if (input.direction.left && !previousState.direction?.left) {
    simulateKeyEvent('ArrowLeft', 'keydown')
  } else if (!input.direction.left && previousState.direction?.left) {
    simulateKeyEvent('ArrowLeft', 'keyup')
  }

  if (input.direction.right && !previousState.direction?.right) {
    simulateKeyEvent('ArrowRight', 'keydown')
  } else if (!input.direction.right && previousState.direction?.right) {
    simulateKeyEvent('ArrowRight', 'keyup')
  }

  // Process button inputs
  const buttonMappings: { [key: string]: string } = {
    a: mapping.buttons.a?.keyCode || 'Space',
    b: mapping.buttons.b?.keyCode || 'KeyH',
    x: mapping.buttons.x?.keyCode || 'KeyX',
    y: mapping.buttons.y?.keyCode || 'KeyZ'
  }

  for (const [button, keyCode] of Object.entries(buttonMappings)) {
    const isPressed = input.buttons[button as keyof typeof input.buttons]
    const wasPressed = previousState.buttons?.[button as keyof typeof previousState.buttons]

    if (isPressed && !wasPressed) {
      simulateKeyEvent(keyCode, 'keydown')
    } else if (!isPressed && wasPressed) {
      simulateKeyEvent(keyCode, 'keyup')
    }
  }
}
