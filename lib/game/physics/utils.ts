export const wrap = (v: number, max: number): number => ((v % max) + max) % max

export const distance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => Math.hypot(x1 - x2, y1 - y2)

export const distancePoints = (
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number => Math.hypot(p1.x - p2.x, p1.y - p2.y)

export const random = (min: number, max: number): number =>
  min + Math.random() * (max - min)

export const randomInt = (min: number, max: number): number =>
  Math.floor(random(min, max + 1))

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)
