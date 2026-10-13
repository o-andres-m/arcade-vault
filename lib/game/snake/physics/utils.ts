export function wrap(value: number, max: number): number {
  return (value + max) % max;
}

export function random(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
