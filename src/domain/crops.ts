import { CropType } from './types';

export const CROPS: Record<string, CropType> = {
  wheat: {
    id: 'wheat',
    displayName: '小麦',
    emoji: '🌾',
    growthSeconds: 30,
    seedBuyPrice: 2,
    produceSellPrice: 4
  },
  carrot: {
    id: 'carrot',
    displayName: '胡萝卜',
    emoji: '🥕',
    growthSeconds: 45,
    seedBuyPrice: 3,
    produceSellPrice: 6
  },
  corn: {
    id: 'corn',
    displayName: '玉米',
    emoji: '🌽',
    growthSeconds: 60,
    seedBuyPrice: 4,
    produceSellPrice: 8
  }
};

export const DEFAULT_GRID = { rows: 6, cols: 8 };


