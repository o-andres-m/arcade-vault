import { GameState, InputState, Collision } from '../asteroids/types'
import { Ship } from '../entities/Ship'
import { Asteroid } from '../entities/Asteroid'
import { Particle } from '../entities/Particle'
import { PowerUp } from '../entities/PowerUp'
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ASTEROID_INITIAL_COUNT,
  ASTEROID_POINTS,
  ASTEROID_SAFE_SPAWN_DISTANCE,
  POWERUP_DROP_CHANCE,
  POWERUP_GUARANTEED_KILLS,
  POWERUP_TRIPLE_DURATION,
  DEAD_TIMER_DURATION,
  PARTICLES_PER_EXPLOSION,
  PARTICLES_ON_SHIP_DEATH,
  TRIPLE_SPREAD,
} from '../asteroids/constants'
import { random, distance, distancePoints } from '../physics/utils'
import { detectCollisions } from '../physics/collision'

export const initializeGame = (): GameState => {
  const ship = new Ship()
  const gameState: GameState = {
    ship,
    bullets: [],
    asteroids: [],
    particles: [],
    powerUps: [],
    score: 0,
    lives: 3,
    level: 1,
    state: 'playing',
    deadTimer: 0,
    powerUpSpawned: false,
    killsSinceSpawn: 0,
  }
  spawnAsteroids(gameState, ASTEROID_INITIAL_COUNT)
  return gameState
}

export const spawnAsteroids = (state: GameState, count: number): void => {
  for (let i = 0; i < count; i++) {
    let x: number, y: number
    do {
      x = random(0, CANVAS_WIDTH)
      y = random(0, CANVAS_HEIGHT)
    } while (distance(x, y, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2) < ASTEROID_SAFE_SPAWN_DISTANCE)
    state.asteroids.push(new Asteroid(x, y, 3))
  }
}

export const nextLevel = (state: GameState): void => {
  state.level++
  state.bullets = []
  state.particles = []
  state.powerUps = []
  state.powerUpSpawned = false
  state.killsSinceSpawn = 0
  if (state.ship) state.ship.reset()
  spawnAsteroids(state, 3 + state.level)
}

export const explode = (state: GameState, x: number, y: number, count: number = PARTICLES_PER_EXPLOSION): void => {
  for (let i = 0; i < count; i++) {
    state.particles.push(new Particle(x, y))
  }
}

export const killShip = (state: GameState): void => {
  if (!state.ship) return
  explode(state, state.ship.x, state.ship.y, PARTICLES_ON_SHIP_DEATH)
  state.ship.dead = true
  state.lives--
  if (state.lives <= 0) {
    state.state = 'gameover'
  } else {
    state.state = 'dead'
    state.deadTimer = DEAD_TIMER_DURATION
  }
}

export const handleCollisions = (state: GameState, collisions: Collision[]): void => {
  const bulletsToRemove = new Set<number>()
  const asteroidsToRemove = new Set<number>()
  const newAsteroids: Asteroid[] = []

  for (const collision of collisions) {
    if (collision.type === 'bullet-asteroid' && collision.bulletIdx !== undefined) {
      const bulletIdx = collision.bulletIdx
      const asteroidIdx = collision.asteroidIdx

      if (!bulletsToRemove.has(bulletIdx)) {
        bulletsToRemove.add(bulletIdx)
        const asteroid = state.asteroids[asteroidIdx]
        asteroidsToRemove.add(asteroidIdx)

        state.score += ASTEROID_POINTS[asteroid.size]
        explode(state, asteroid.x, asteroid.y, asteroid.size * 5)
        newAsteroids.push(...asteroid.split())

        if (!state.powerUpSpawned) {
          state.killsSinceSpawn++
          const guaranteed = state.killsSinceSpawn >= POWERUP_GUARANTEED_KILLS
          if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
            state.powerUps.push(new PowerUp(asteroid.x, asteroid.y))
            state.powerUpSpawned = true
          }
        }
      }
    } else if (collision.type === 'ship-asteroid') {
      killShip(state)
      break
    }
  }

  // Remove dead bullets and asteroids
  state.bullets = state.bullets.filter((_, idx) => !bulletsToRemove.has(idx))
  state.asteroids = state.asteroids.filter((_, idx) => !asteroidsToRemove.has(idx))
  state.asteroids.push(...newAsteroids)
}

export const updateGameState = (
  state: GameState,
  dt: number,
  inputState: InputState,
  keys: Record<string, boolean>,
  justPressed: Record<string, boolean>
): void => {
  if (state.state === 'gameover') {
    state.particles.forEach(p => p.update(dt))
    state.particles = state.particles.filter(p => !p.dead)
    return
  }

  if (state.state === 'dead') {
    state.deadTimer -= dt
    state.particles.forEach(p => p.update(dt))
    state.particles = state.particles.filter(p => !p.dead)
    state.asteroids.forEach(a => a.update(dt))
    if (state.deadTimer <= 0) {
      state.state = 'playing'
      if (state.ship) state.ship.reset()
    }
    return
  }

  // Playing state
  if (state.ship) {
    // Handle shooting
    if (justPressed['Space']) {
      const newBullets = state.ship.tryShoot(TRIPLE_SPREAD)
      state.bullets.push(...newBullets)
      justPressed['Space'] = false
    }

    // Update entities
    state.ship.update(dt, keys)
  }

  state.bullets.forEach(b => b.update(dt))
  state.asteroids.forEach(a => a.update(dt))
  state.particles.forEach(p => p.update(dt))
  state.powerUps.forEach(p => p.update(dt))

  // Clean dead entities
  state.bullets = state.bullets.filter(b => !b.dead)
  state.particles = state.particles.filter(p => !p.dead)
  state.powerUps = state.powerUps.filter(p => !p.dead)

  // Power-up collection
  for (const p of state.powerUps) {
    if (!p.dead && state.ship && distancePoints(state.ship, p) < state.ship.radius + p.radius) {
      p.dead = true
      state.ship.tripleShot = POWERUP_TRIPLE_DURATION
    }
  }

  // Detect and handle collisions
  const collisions = detectCollisions(state)
  handleCollisions(state, collisions)

  // Check level up
  if (state.asteroids.length === 0) {
    nextLevel(state)
  }
}
