import { SPRITE_ATLAS, FruitType } from '../sprites';

export function getFruitSprite(fruitType: string) {
  const fruits = SPRITE_ATLAS.fruits;
  const key = fruitType as FruitType;
  return fruits[key] || fruits.apple;
}
