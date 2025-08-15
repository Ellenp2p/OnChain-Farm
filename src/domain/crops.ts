import { CropType } from './types';

export const CROPS: Record<string, CropType> = {
  apple: {
    id: "apple",
    displayName: "苹果",
    emoji: "🍏",
    growthSeconds: 10,
    yield: 5,
    seedBuyPrice: 1,
    produceSellPrice: 5
  },
  wheat: {
    id: 'wheat',
    displayName: '小麦',
    emoji: '🌾',
    growthSeconds: 30,
    yield: 7,
    seedBuyPrice: 3,
    produceSellPrice: 12
  },
  carrot: {
    id: 'carrot',
    displayName: '胡萝卜',
    emoji: '🥕',
    growthSeconds: 20,
    yield: 5,
    seedBuyPrice: 2,
    produceSellPrice: 8
  },
  tomato: {
    id: 'tomato',
    displayName: '西红柿',
    emoji: '🍅',
    growthSeconds: 15,
    seedBuyPrice: 1,
    produceSellPrice: 6,
    yield: 4
  }
};

export const DEFAULT_GRID = { rows: 6, cols: 8 };


