export const CANVAS_WIDTH = 800
export const CANVAS_HEIGHT = 600

export const ASTEROID_INITIAL_COUNT = 4
export const ASTEROID_SIZES = { LARGE: 3, MEDIUM: 2, SMALL: 1 }
export const ASTEROID_RADII = [0, 16, 30, 50] // indexed by size 1, 2, 3
export const ASTEROID_BASE_SPEEDS = [0, 85, 55, 32] // indexed by size
export const ASTEROID_POINTS = [0, 100, 50, 20] // indexed by size
export const ASTEROID_SPEED_VARIATION = 15
export const ASTEROID_SAFE_SPAWN_DISTANCE = 130

export const SHIP_RADIUS = 12
export const SHIP_SPEED_MAX = 275
export const SHIP_ROTATION_SPEED = 3.5
export const SHIP_ACCELERATION = 260
export const SHIP_FRICTION = 0.987
export const SHIP_INVINCIBILITY_TIME = 3
export const SHIP_NOSE_LENGTH = 21
export const SHIP_COLLISION_RADIUS_MULTIPLIER = 0.82

export const BULLET_RADIUS = 2
export const BULLET_TTL = 1.1
export const BULLET_SPEED = 350
export const BULLET_COOLDOWN = 0.2

export const POWERUP_TTL = 12
export const POWERUP_TRIPLE_DURATION = 5
export const POWERUP_DROP_CHANCE = 0.15
export const POWERUP_GUARANTEED_KILLS = 5
export const POWERUP_RADIUS = 12
export const TRIPLE_SPREAD = 0.18

export const PARTICLE_LIFETIME = 0.5
export const PARTICLES_PER_EXPLOSION = 8
export const PARTICLES_ON_SHIP_DEATH = 14
export const PARTICLE_MIN_SPEED = 30
export const PARTICLE_MAX_SPEED = 130

export const DEAD_TIMER_DURATION = 2
export const MAX_DELTA_TIME = 0.05

export const ASTEROID_VERTEX_MIN = 8
export const ASTEROID_VERTEX_MAX = 13
export const ASTEROID_VERTEX_RADIUS_VARIATION = 0.4
