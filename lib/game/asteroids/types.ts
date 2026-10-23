export interface Vector2 {
  x: number
  y: number
}

export type AsteroidSize = 1 | 2 | 3

export interface Bullet extends Vector2 {
  vx: number
  vy: number
  radius: number
  ttl: number
  dead: boolean
  update(dt: number): void
  draw(ctx: CanvasRenderingContext2D, colors?: any): void
}

export interface Asteroid extends Vector2 {
  size: AsteroidSize
  radius: number
  vx: number
  vy: number
  rot: number
  rotSpeed: number
  verts: [number, number][]
  dead: boolean
  update(dt: number): void
  split(): Asteroid[]
  draw(ctx: CanvasRenderingContext2D, colors?: any): void
}

export interface Particle extends Vector2 {
  vx: number
  vy: number
  life: number
  ttl: number
  dead: boolean
  update(dt: number): void
  draw(ctx: CanvasRenderingContext2D, colors?: any): void
}

export interface PowerUp extends Vector2 {
  radius: number
  vx: number
  vy: number
  ttl: number
  dead: boolean
  update(dt: number): void
  draw(ctx: CanvasRenderingContext2D, colors?: any): void
}

export interface Ship extends Vector2 {
  angle: number
  vx: number
  vy: number
  radius: number
  thrusting: boolean
  invincible: number
  shootCooldown: number
  tripleShot: number
  dead: boolean
  reset(): void
  update(dt: number, keys: Record<string, boolean>, inputState?: InputState): void
  tryShoot(spreadAngle: number): Bullet[]
  draw(ctx: CanvasRenderingContext2D, colors?: any): void
}

export type GameStatus = 'playing' | 'dead' | 'gameover'

export interface GameState {
  ship: Ship | null
  bullets: Bullet[]
  asteroids: Asteroid[]
  particles: Particle[]
  powerUps: PowerUp[]
  score: number
  lives: number
  level: number
  state: GameStatus
  deadTimer: number
  powerUpSpawned: boolean
  killsSinceSpawn: number
}

export interface InputState {
  left: boolean
  right: boolean
  up: boolean
  shoot: boolean
  // Joystick arcade (opcional)
  joystick?: {
    angle: number | null
    distance: number
  }
}

export interface ScoreSaveData {
  user_id: string
  game_id: 'rocas'
  score: number
  created_at: string
}

export interface Collision {
  type: 'bullet-asteroid' | 'ship-asteroid'
  bulletIdx?: number
  asteroidIdx: number
}
