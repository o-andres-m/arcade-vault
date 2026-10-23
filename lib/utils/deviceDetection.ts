export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false

  return 'ontouchstart' in window && navigator.maxTouchPoints > 0
}

export interface ControlPreferences {
  showControls: boolean
  mode: 'dpad' | 'joystick'
}

const SHOW_CONTROLS_KEY = 'arcade-vault-mobile-controls'
const CONTROL_MODE_KEY = 'arcade-vault-control-mode'

export function loadControlPreferences(): ControlPreferences {
  if (typeof window === 'undefined') {
    return { showControls: false, mode: 'dpad' }
  }

  const showControlsStr = localStorage.getItem(SHOW_CONTROLS_KEY)
  const mode = (localStorage.getItem(CONTROL_MODE_KEY) as 'dpad' | 'joystick' | null) || 'dpad'

  return {
    showControls: showControlsStr === null ? isTouchDevice() : showControlsStr === 'true',
    mode
  }
}

export function saveControlPreferences(prefs: ControlPreferences): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(SHOW_CONTROLS_KEY, String(prefs.showControls))
  localStorage.setItem(CONTROL_MODE_KEY, prefs.mode)
}
