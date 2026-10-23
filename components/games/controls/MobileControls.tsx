'use client'

import { useMemo } from 'react'
import { getGameControls } from '@/lib/game/controls/controlMappings'
import { DPad } from './DPad'
import { Joystick } from './Joystick'
import { ArcadeJoystick } from './ArcadeJoystick'
import { ArcadeButtons } from './ArcadeButtons'

export interface MobileControlsState {
  isTouch: boolean
  showControls: boolean
  controlMode: 'dpad' | 'joystick'
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
  joystick: {
    active: boolean
    angle: number
    distance: number
  }
}

interface MobileControlsProps {
  gameId: string
  onInput: (input: MobileControlsState) => void
  isPaused: boolean
  controlMode: 'dpad' | 'joystick'
}

export function MobileControls({ gameId, onInput, isPaused, controlMode }: MobileControlsProps) {
  const mapping = useMemo(() => getGameControls(gameId), [gameId])
  const hasButtons = useMemo(() => mapping && Object.keys(mapping.buttons).length > 0, [mapping])
  const isAsteroids = gameId === 'rocas'

  // Para Asteroides, siempre usar joystick arcade
  const effectiveControlMode = isAsteroids ? 'joystick' : controlMode

  const handleDirectionChange = (direction: { up: boolean; down: boolean; left: boolean; right: boolean }) => {
    if (isPaused) return

    onInput({
      isTouch: true,
      showControls: true,
      controlMode: effectiveControlMode,
      direction,
      buttons: {
        a: false,
        b: false,
        x: false,
        y: false
      },
      joystick: {
        active: false,
        angle: 0,
        distance: 0
      }
    })
  }

  const handleArcadeJoystickChange = (angle: number | null, distance: number) => {
    if (isPaused) return

    onInput({
      isTouch: true,
      showControls: true,
      controlMode: 'joystick',
      direction: {
        up: false,
        down: false,
        left: false,
        right: false
      },
      buttons: {
        a: false,
        b: false,
        x: false,
        y: false
      },
      joystick: {
        active: angle !== null,
        angle: angle || 0,
        distance
      }
    })
  }

  const handleButtonPress = (button: 'a' | 'b' | 'x' | 'y', pressed: boolean) => {
    if (isPaused) return

    onInput({
      isTouch: true,
      showControls: true,
      controlMode: effectiveControlMode,
      direction: {
        up: false,
        down: false,
        left: false,
        right: false
      },
      buttons: {
        a: button === 'a' ? pressed : false,
        b: button === 'b' ? pressed : false,
        x: button === 'x' ? pressed : false,
        y: button === 'y' ? pressed : false
      },
      joystick: {
        active: false,
        angle: 0,
        distance: 0
      }
    })
  }

  if (!mapping) {
    return null
  }

  return (
    <div
      className="w-full pointer-events-none mt-4"
      style={{
        zIndex: 10,
        display: 'grid',
        gridTemplateColumns: hasButtons ? '1fr 1fr' : '1fr',
        gap: '0',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100vw'
      }}
    >
      <div
        className="pointer-events-auto"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        {isAsteroids ? (
          <ArcadeJoystick
            onAngleChange={handleArcadeJoystickChange}
            disabled={isPaused}
          />
        ) : effectiveControlMode === 'dpad' ? (
          <DPad
            onDirectionChange={handleDirectionChange}
            disabled={isPaused}
            mapping={mapping.directional}
            fullWidth={!hasButtons}
          />
        ) : (
          <Joystick
            onDirectionChange={handleDirectionChange}
            disabled={isPaused}
            fullWidth={!hasButtons}
          />
        )}
      </div>

      {hasButtons && (
        <div
          className="pointer-events-auto"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          <ArcadeButtons
            onButtonPress={handleButtonPress}
            disabled={isPaused}
            mapping={mapping.buttons}
          />
        </div>
      )}
    </div>
  )
}
