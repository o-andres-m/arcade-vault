export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomAngle(minDeg: number, maxDeg: number): number {
  const minRad = (minDeg * Math.PI) / 180;
  const maxRad = (maxDeg * Math.PI) / 180;
  return minRad + Math.random() * (maxRad - minRad);
}
