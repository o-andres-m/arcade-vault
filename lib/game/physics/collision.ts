import { GameState, Collision } from '../asteroids/types'
import { distancePoints } from './utils'
import { SHIP_COLLISION_RADIUS_MULTIPLIER } from '../asteroids/constants'

export const detectCollisions = (state: GameState): Collision[] => {
  const collisions: Collision[] = []

  // Bullet vs Asteroid
  for (let bIdx = 0; bIdx < state.bullets.length; bIdx++) {
    const bullet = state.bullets[bIdx]
    if (bullet.dead) continue

    for (let aIdx = 0; aIdx < state.asteroids.length; aIdx++) {
      const asteroid = state.asteroids[aIdx]
      if (asteroid.dead) continue

      const dist = distancePoints(bullet, asteroid)
      if (dist < asteroid.radius) {
        collisions.push({
          type: 'bullet-asteroid',
          bulletIdx: bIdx,
          asteroidIdx: aIdx,
        })
        break
      }
    }
  }

  // Ship vs Asteroid
  if (state.ship && state.ship.invincible <= 0 && !state.ship.dead) {
    for (let aIdx = 0; aIdx < state.asteroids.length; aIdx++) {
      const asteroid = state.asteroids[aIdx]
      if (asteroid.dead) continue

      const dist = distancePoints(state.ship, asteroid)
      const shipRadius = state.ship.radius
      const asteroidEffectiveRadius = asteroid.radius * SHIP_COLLISION_RADIUS_MULTIPLIER

      if (dist < shipRadius + asteroidEffectiveRadius) {
        collisions.push({
          type: 'ship-asteroid',
          asteroidIdx: aIdx,
        })
        break
      }
    }
  }

  return collisions
}
