'use client'

import { useState, useRef } from 'react'
import { GameControlMapping } from '@/lib/game/controls/controlMappings'

interface ArcadeButtonsProps {
  onButtonPress: (button: 'a' | 'b' | 'x' | 'y', pressed: boolean) => void
  disabled: boolean
  mapping: GameControlMapping['buttons']
}

// Los botones ocupan el 50% del ancho de la pantalla
const BUTTON_SIZE = 'clamp(2.5rem, 9vw, 4rem)'
const BUTTON_GAP = 'clamp(4px, 2vw, 12px)'
const BUTTON_COLORS = {
  a: 'border-cyan-400 bg-cyan-500/30 hover:bg-cyan-500/50',
  b: 'border-yellow-400 bg-yellow-500/30 hover:bg-yellow-500/50',
  x: 'border-magenta-400 bg-magenta-500/30 hover:bg-magenta-500/50',
  y: 'border-green-400 bg-green-500/30 hover:bg-green-500/50'
}

export function ArcadeButtons({ onButtonPress, disabled, mapping }: ArcadeButtonsProps) {
  const [pressedButtons, setPressedButtons] = useState({
    a: false,
    b: false,
    x: false,
    y: false
  })

  const touchesRef = useRef<Map<number, 'a' | 'b' | 'x' | 'y'>>(new Map())

  const handleTouchStart = (
    e: React.TouchEvent<HTMLButtonElement>,
    button: 'a' | 'b' | 'x' | 'y'
  ) => {
    if (disabled) return

    e.preventDefault()
    const touch = e.touches[0]
    touchesRef.current.set(touch.identifier, button)

    const newPressed = { ...pressedButtons }
    newPressed[button] = true
    setPressedButtons(newPressed)
    onButtonPress(button, true)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>, button: 'a' | 'b' | 'x' | 'y') => {
    e.preventDefault()

    const touch = e.changedTouches[0]
    touchesRef.current.delete(touch.identifier)

    const newPressed = { ...pressedButtons }
    newPressed[button] = false
    setPressedButtons(newPressed)
    onButtonPress(button, false)
  }

  const buttons: Array<{ key: 'a' | 'b' | 'x' | 'y'; label: string }> = [
    { key: 'y', label: 'Y' },
    { key: 'x', label: 'X' },
    { key: 'b', label: 'B' },
    { key: 'a', label: 'A' }
  ]

  const hasButtons = Object.keys(mapping).length > 0

  if (!hasButtons) {
    return null
  }

  const visibleButtons = buttons.filter(({ key }) => mapping[key])

  return (
    <div
      className="select-none pointer-events-auto"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto',
        gap: BUTTON_GAP,
        touchAction: 'none',
        zIndex: 10,
        justifyItems: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: '45vw'
      }}
    >
      {visibleButtons.map(({ key, label }) => (
        <button
          key={key}
          onTouchStart={(e) => handleTouchStart(e, key)}
          onTouchEnd={(e) => handleTouchEnd(e, key)}
          onTouchCancel={(e) => handleTouchEnd(e, key)}
          disabled={disabled}
          className={`rounded-full pointer-events-auto
            opacity-60 transition-all duration-100 flex items-center justify-center
            text-white font-bold border-2
            ${pressedButtons[key] ? 'opacity-100 scale-95' : 'hover:opacity-80'}
            ${disabled ? 'opacity-30 pointer-events-none' : ''}
            ${
              key === 'a'
                ? BUTTON_COLORS.a
                : key === 'b'
                  ? BUTTON_COLORS.b
                  : key === 'x'
                    ? BUTTON_COLORS.x
                    : BUTTON_COLORS.y
            }`}
          style={{
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            touchAction: 'none',
            fontSize: 'clamp(1rem, 3vw, 1.5rem)'
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
