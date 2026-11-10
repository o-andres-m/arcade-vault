export type ColorPalette = 'neon' | 'pastel' | 'retro';

export interface FroggerColors {
  frog: string;
  riverBg: string;
  roadBg: string;
  safeZone: string;
  log: string;
  logStroke: string;
  turtle: string;
  turtleStroke: string;
  carRed: string;
  carGray: string;
  truck: string;
  goalSlot: string;
  goalStroke: string;
  goalFilled: string;
  timerGood: string;
  timerMid: string;
  timerBad: string;
  hudText: string;
  hudBg: string;
}

export const COLOR_PALETTES: Record<ColorPalette, FroggerColors> = {
  neon: {
    frog: '#00ff66',
    riverBg: '#001a3a',
    roadBg: '#1a0033',
    safeZone: '#0a2a0a',
    log: '#ff6600',
    logStroke: '#ff3300',
    turtle: '#00cc66',
    turtleStroke: '#00aa44',
    carRed: '#ff0066',
    carGray: '#6666ff',
    truck: '#3333ff',
    goalSlot: '#1a3a1a',
    goalStroke: '#ffff00',
    goalFilled: '#00ff66',
    timerGood: '#00ff66',
    timerMid: '#ffff00',
    timerBad: '#ff0066',
    hudText: '#ffffff',
    hudBg: '#000000',
  },
  pastel: {
    frog: '#90ee90',
    riverBg: '#87ceeb',
    roadBg: '#d3d3d3',
    safeZone: '#98fb98',
    log: '#d2b48c',
    logStroke: '#a0826d',
    turtle: '#77dd77',
    turtleStroke: '#55bb55',
    carRed: '#ffb6c1',
    carGray: '#c0c0c0',
    truck: '#a9a9a9',
    goalSlot: '#98fb98',
    goalStroke: '#ffd700',
    goalFilled: '#90ee90',
    timerGood: '#90ee90',
    timerMid: '#ffffe0',
    timerBad: '#ffb6c1',
    hudText: '#ffffff',
    hudBg: '#000000',
  },
  retro: {
    frog: '#00ff00',
    riverBg: '#0000ff',
    roadBg: '#333333',
    safeZone: '#00aa00',
    log: '#ff8800',
    logStroke: '#cc6600',
    turtle: '#00cc00',
    turtleStroke: '#008800',
    carRed: '#ff0000',
    carGray: '#888888',
    truck: '#444444',
    goalSlot: '#00aa00',
    goalStroke: '#ffff00',
    goalFilled: '#00ff00',
    timerGood: '#00ff00',
    timerMid: '#ffff00',
    timerBad: '#ff0000',
    hudText: '#ffffff',
    hudBg: '#000000',
  },
};
