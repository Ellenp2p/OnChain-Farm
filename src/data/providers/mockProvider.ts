import { DEFAULT_GRID } from '@/domain/crops';
import { GameProvider, GameStateSnapshot, PlotTile } from '@/domain/types';

const STORAGE_KEY = 'farm_aptos_mock_state_v1'; // 本地 Mock 存储键

function createInitialState(): GameStateSnapshot {
  const plots: PlotTile[] = [];
  for (let r = 0; r < DEFAULT_GRID.rows; r++) {
    for (let c = 0; c < DEFAULT_GRID.cols; c++) {
      plots.push({ id: `${r}-${c}`, crop: null });
    }
  }
  return {
    gold: 20,
    plots,
    inventory: [
      { id: 'seed:wheat', kind: 'seed', cropTypeId: 'wheat', quantity: 5 },
      { id: 'seed:carrot', kind: 'seed', cropTypeId: 'carrot', quantity: 3 }
    ]
  };
}

export const mockProvider: GameProvider = {
  async load() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    try {
      return JSON.parse(raw) as GameStateSnapshot;
    } catch {
      return createInitialState();
    }
  },
  async save(state: GameStateSnapshot) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};


