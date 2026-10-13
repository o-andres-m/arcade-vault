export const SPRITE_ATLAS = {
  fruits: {
    banana: { x: 34, y: 136, width: 110, height: 160 },
    orange: { x: 186, y: 136, width: 150, height: 160 },
    grape: { x: 378, y: 136, width: 110, height: 160 },
    garlic: { x: 540, y: 136, width: 130, height: 160 },
    eggplant: { x: 712, y: 136, width: 130, height: 160 },
    strawberry: { x: 894, y: 136, width: 110, height: 160 },
    cherry: { x: 1066, y: 136, width: 110, height: 160 },
    carrot: { x: 1228, y: 136, width: 130, height: 160 },
    mushroom: { x: 1400, y: 136, width: 130, height: 160 },
    broccoli: { x: 1582, y: 136, width: 110, height: 160 },
    watermelon: { x: 1734, y: 136, width: 150, height: 160 },
    pepper: { x: 1906, y: 136, width: 150, height: 160 },
    kiwi: { x: 2068, y: 136, width: 170, height: 160 },
    lemon: { x: 2250, y: 136, width: 140, height: 160 },
    peach: { x: 2432, y: 136, width: 130, height: 160 },
    peanut: { x: 2604, y: 136, width: 130, height: 160 },
    apple: { x: 2786, y: 136, width: 110, height: 160 },
    tomato: { x: 2948, y: 136, width: 130, height: 160 },
    berries: { x: 3110, y: 136, width: 150, height: 160 },
    grapes2: { x: 3302, y: 136, width: 110, height: 160 },
    pineapple: { x: 3454, y: 136, width: 150, height: 160 },
    melon: { x: 3637, y: 136, width: 130, height: 160 },
  },
};

export type FruitType = keyof typeof SPRITE_ATLAS.fruits;
