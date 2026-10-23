'use client'

import { useState, useCallback, useRef } from 'react'

interface ArcadeJoystickProps {
  onAngleChange: (angle: number | null, distance: number) => void
  disabled: boolean
  fullWidth?: boolean
}

// Joystick tipo arcade para Asteroides
// Devuelve el ángulo exacto hacia donde apunta (0-360°)
const JOYSTICK_RADIUS = 'min(35vw, 160px)' // Más pequeño para caber en la mitad izquierda
const JOYSTICK_RADIUS_FULL = 'min(90vw, 280px)'
const STICK_RADIUS_PERCENT = 0.4
const DEADZONE = 0.2

export function ArcadeJoystick({ onAngleChange, disabled, fullWidth = false }: ArcadeJoystickProps) {
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchIdRef = useRef<number | null>(null)
  const radiusRef = useRef<number>(60)

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return

    e.preventDefault()
    const touch = e.touches[0]
    touchIdRef.current = touch.identifier
    setIsActive(true)

    if (containerRef.current) {
      radiusRef.current = containerRef.current.clientWidth / 2
    }

    handleJoystickMove(touch)
  }

  const handleJoystickMove = useCallback((touch: React.Touch) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const dx = touch.clientX - (rect.left + centerX)
    const dy = touch.clientY - (rect.top + centerY)

    const distance = Math.sqrt(dx * dx + dy * dy) / radiusRef.current
    const clampedDistance = Math.min(distance, 1)

    // Calcular ángulo en radianes, luego convertir a grados
    // atan2 retorna de -PI a PI, necesitamos 0-360
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    // Normalizar a 0-360
    if (angle < 0) angle += 360

    const stickRadius = radiusRef.current * STICK_RADIUS_PERCENT
    const stickX = (clampedDistance * Math.cos(angle * (Math.PI / 180))) * stickRadius
    const stickY = (clampedDistance * Math.sin(angle * (Math.PI / 180))) * stickRadius

    setStickPosition({ x: stickX, y: stickY })

    // Si está en la zona muerta, no enviar ángulo
    if (clampedDistance < DEADZONE) {
      onAngleChange(null, 0)
    } else {
      onAngleChange(angle, clampedDistance)
    }
  }, [onAngleChange])

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || touchIdRef.current === null) return

    e.preventDefault()

    const touches = Array.from(e.touches)
    for (const touch of touches) {
      if (touch.identifier === touchIdRef.current) {
        handleJoystickMove(touch)
        break
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return

    e.preventDefault()

    const changedTouches = Array.from(e.changedTouches)
    for (const touch of changedTouches) {
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null
        setIsActive(false)
        setStickPosition({ x: 0, y: 0 })
        onAngleChange(null, 0)
        break
      }
    }
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`select-none pointer-events-auto
        transition-opacity duration-100 ${disabled ? 'opacity-30 pointer-events-none' : 'opacity-60'}`}
      style={{
        position: 'relative',
        width: fullWidth ? JOYSTICK_RADIUS_FULL : JOYSTICK_RADIUS,
        height: fullWidth ? JOYSTICK_RADIUS_FULL : JOYSTICK_RADIUS,
        touchAction: 'none',
        zIndex: 10
      }}
    >
      {/* Base circle */}
      <div
        className="rounded-full border-2 border-cyan-400 bg-cyan-500/20"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
      />

      {/* Crosshair lines for arcade feel */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: '100%', height: '2px', background: 'rgba(8, 145, 178, 0.3)' }} />
        <div style={{ position: 'absolute', height: '100%', width: '2px', background: 'rgba(8, 145, 178, 0.3)' }} />
      </div>

      {/* Stick */}
      <div
        className="rounded-full border-2 border-cyan-300 bg-cyan-400/60 transition-all duration-75"
        style={{
          position: 'absolute',
          width: `calc(100% * ${STICK_RADIUS_PERCENT} * 2)`,
          height: `calc(100% * ${STICK_RADIUS_PERCENT} * 2)`,
          transform: `translate(calc(-50% + ${stickPosition.x}px), calc(-50% + ${stickPosition.y}px))`,
          top: '50%',
          left: '50%',
          opacity: isActive ? 1 : 0.8,
          boxShadow: isActive ? '0 0 10px rgba(34, 211, 238, 0.5)' : 'none'
        }}
      />
    </div>
  )
}
