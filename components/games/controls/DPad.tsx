'use client'

import { useState, useCallback, useRef } from 'react'
import { GameControlMapping } from '@/lib/game/controls/controlMappings'

interface DPadProps {
  onDirectionChange: (direction: { up: boolean; down: boolean; left: boolean; right: boolean }) => void
  disabled: boolean
  mapping: GameControlMapping['directional']
  fullWidth?: boolean
}

// El contenedor ocupa el 50% del ancho de la pantalla por defecto
// Si fullWidth=true, ocupa casi todo el ancho (sin botones al lado)
const CONTAINER_SIZE = 'min(45vw, 180px)' // 45vw para dar un poco de margen
const CONTAINER_SIZE_FULL = 'min(90vw, 280px)' // Ancho completo cuando no hay botones
const BUTTON_SIZE = 'clamp(2rem, 10vw, 4rem)'

export function DPad({ onDirectionChange, disabled, mapping, fullWidth = false }: DPadProps) {
  const [pressedDirections, setPressedDirections] = useState({
    up: false,
    down: false,
    left: false,
    right: false
  })

  const touchesRef = useRef<Map<number, string>>(new Map())

  const updateDirections = useCallback(
    (directions: typeof pressedDirections) => {
      setPressedDirections(directions)
      onDirectionChange(directions)
    },
    [onDirectionChange]
  )

  const handleTouchStart = (e: React.TouchEvent<HTMLButtonElement>, direction: 'up' | 'down' | 'left' | 'right') => {
    if (disabled) return

    e.preventDefault()
    const touch = e.touches[0]
    touchesRef.current.set(touch.identifier, direction)

    const newDirections = { ...pressedDirections }
    for (const dir of touchesRef.current.values()) {
      newDirections[dir as keyof typeof pressedDirections] = true
    }
    updateDirections(newDirections)
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const touch = e.changedTouches[0]
    touchesRef.current.delete(touch.identifier)

    const newDirections = { up: false, down: false, left: false, right: false }
    for (const dir of touchesRef.current.values()) {
      newDirections[dir as keyof typeof newDirections] = true
    }
    updateDirections(newDirections)
  }

  const baseButtonClasses = `
    absolute rounded-lg pointer-events-auto opacity-60 transition-all duration-100
    flex items-center justify-center text-white font-bold border-2
    border-cyan-400 bg-cyan-500/30 hover:bg-cyan-500/50
  `.trim()

  const buttonStyle = {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    touchAction: 'none' as const
  }

  return (
    <div
      className="select-none pointer-events-auto"
      style={{
        touchAction: 'none',
        zIndex: 10,
        width: fullWidth ? CONTAINER_SIZE_FULL : CONTAINER_SIZE,
        height: fullWidth ? CONTAINER_SIZE_FULL : CONTAINER_SIZE
      }}
    >
      <div className="relative w-full h-full">
        {/* Up */}
        {mapping.up && (
          <button
            onTouchStart={(e) => handleTouchStart(e, 'up')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            disabled={disabled}
            className={`${baseButtonClasses} top-0 left-1/2 -translate-x-1/2 ${
              pressedDirections.up ? 'opacity-100 scale-95' : 'hover:opacity-80'
            } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
            style={buttonStyle}
          >
            ↑
          </button>
        )}

        {/* Down */}
        {mapping.down && (
          <button
            onTouchStart={(e) => handleTouchStart(e, 'down')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            disabled={disabled}
            className={`${baseButtonClasses} bottom-0 left-1/2 -translate-x-1/2 ${
              pressedDirections.down ? 'opacity-100 scale-95' : 'hover:opacity-80'
            } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
            style={buttonStyle}
          >
            ↓
          </button>
        )}

        {/* Left */}
        {mapping.left && (
          <button
            onTouchStart={(e) => handleTouchStart(e, 'left')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            disabled={disabled}
            className={`${baseButtonClasses} top-1/2 left-0 -translate-y-1/2 ${
              pressedDirections.left ? 'opacity-100 scale-95' : 'hover:opacity-80'
            } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
            style={buttonStyle}
          >
            ←
          </button>
        )}

        {/* Right */}
        {mapping.right && (
          <button
            onTouchStart={(e) => handleTouchStart(e, 'right')}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            disabled={disabled}
            className={`${baseButtonClasses} top-1/2 right-0 -translate-y-1/2 ${
              pressedDirections.right ? 'opacity-100 scale-95' : 'hover:opacity-80'
            } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
            style={buttonStyle}
          >
            →
          </button>
        )}

        {/* Center circle */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-600/40"
          style={{
            width: 'clamp(1.5rem, 5vw, 2rem)',
            height: 'clamp(1.5rem, 5vw, 2rem)'
          }}
        />
      </div>
    </div>
  )
}
