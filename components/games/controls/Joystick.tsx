'use client'

import { useState, useCallback, useRef } from 'react'

interface JoystickProps {
  onDirectionChange: (direction: { up: boolean; down: boolean; left: boolean; right: boolean }) => void
  disabled: boolean
  fullWidth?: boolean
}

// El joystick ocupa el mismo tamaño que el D-Pad (50% del ancho de pantalla)
const JOYSTICK_RADIUS = 'min(45vw, 180px)'
const JOYSTICK_RADIUS_FULL = 'min(90vw, 280px)' // Ancho completo cuando no hay botones
const STICK_RADIUS_PERCENT = 0.4

const DEADZONE = 0.2

export function Joystick({ onDirectionChange, disabled, fullWidth = false }: JoystickProps) {
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 })
  const [isActive, setIsActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchIdRef = useRef<number | null>(null)
  const radiusRef = useRef<number>(60)

  const calculateDirection = useCallback(
    (distance: number, angle: number): { up: boolean; down: boolean; left: boolean; right: boolean } => {
      if (distance < DEADZONE) {
        return { up: false, down: false, left: false, right: false }
      }

      let normalizedAngle = angle < 0 ? angle + 360 : angle

      return {
        right: normalizedAngle >= 315 || normalizedAngle < 45,
        down: normalizedAngle >= 45 && normalizedAngle < 135,
        left: normalizedAngle >= 135 && normalizedAngle < 225,
        up: normalizedAngle >= 225 && normalizedAngle < 315
      }
    },
    []
  )

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

  const handleJoystickMove = (touch: React.Touch) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const dx = touch.clientX - (rect.left + centerX)
    const dy = touch.clientY - (rect.top + centerY)

    const distance = Math.sqrt(dx * dx + dy * dy) / radiusRef.current
    const clampedDistance = Math.min(distance, 1)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)

    const stickRadius = radiusRef.current * STICK_RADIUS_PERCENT
    const stickX = (clampedDistance * Math.cos(angle * (Math.PI / 180))) * stickRadius
    const stickY = (clampedDistance * Math.sin(angle * (Math.PI / 180))) * stickRadius

    setStickPosition({ x: stickX, y: stickY })

    const direction = calculateDirection(clampedDistance, angle)
    onDirectionChange(direction)
  }

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
        onDirectionChange({ up: false, down: false, left: false, right: false })
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
        width: fullWidth ? JOYSTICK_RADIUS_FULL : JOYSTICK_RADIUS,
        height: fullWidth ? JOYSTICK_RADIUS_FULL : JOYSTICK_RADIUS,
        touchAction: 'none',
        zIndex: 10
      }}
    >
      {/* Base circle */}
      <div
        className="absolute inset-0 rounded-full border-2 border-cyan-400 bg-cyan-500/20"
        style={{
          width: '100%',
          height: '100%'
        }}
      />

      {/* Stick */}
      <div
        className="absolute rounded-full border-2 border-cyan-300 bg-cyan-400/50 transition-all duration-75"
        style={{
          width: `calc(100% * ${STICK_RADIUS_PERCENT} * 2)`,
          height: `calc(100% * ${STICK_RADIUS_PERCENT} * 2)`,
          transform: `translate(calc(-50% + ${stickPosition.x}px), calc(-50% + ${stickPosition.y}px))`,
          top: '50%',
          left: '50%',
          opacity: isActive ? 1 : 0.8
        }}
      />
    </div>
  )
}
