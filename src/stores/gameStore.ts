import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { CROPS } from '@/domain/crops';
import { GameStateSnapshot, PlotTile, ToolKind } from '@/domain/types';
import { providers } from '@/data/registry';

export interface GameStoreState extends GameStateSnapshot {
  selectedTool: ToolKind;
  selectedSeed: string | null;
  tick: number;
}

export interface GameStoreActions {
  load: () => Promise<void>;
  save: () => Promise<void>;
  selectTool: (tool: ToolKind) => void;
  selectSeed: (cropTypeId: string | null) => void;
  interactPlot: (plotId: string) => Promise<void>;
  sellProduce: (cropTypeId: string, quantity: number) => Promise<void>;
  buySeed: (cropTypeId: string, quantity: number) => Promise<void>;
  heartbeat: () => void;
}

function isGrown(plantedAt: number, cropTypeId: string) {
  const crop = CROPS[cropTypeId];
  const elapsed = Date.now() - plantedAt;
  return elapsed >= crop.growthSeconds * 1000;
}

export const useGameStore = create<GameStoreState & GameStoreActions>()(
  persist(
    (set, get) => ({
      gold: 0,
      plots: [],
      inventory: [],
      selectedTool: 'hand',
      selectedSeed: null,
      tick: 0,

      async load() {
        // 从模块化 Provider 汇总初始状态
        const field = await providers.field.loadField();
        set(state => ({ ...state, plots: field.plots }));
        // 保留本地金币与背包：若需要，也可改为从 market/provider 读取
        const stored = localStorage.getItem('farm_aptos_mock_state_v2_modules');
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as GameStateSnapshot;
            set({ gold: parsed.gold, inventory: parsed.inventory });
          } catch {}
        }
      },
      async save() {
        const { gold, plots, inventory } = get();
        localStorage.setItem('farm_aptos_mock_state_v2_modules', JSON.stringify({ gold, plots, inventory } satisfies GameStateSnapshot));
      },
      selectTool(tool) {
        set({ selectedTool: tool });
      },
      selectSeed(cropTypeId) {
        set({ selectedSeed: cropTypeId });
      },
      async interactPlot(plotId) {
        const { selectedTool } = get();
        if (selectedTool === 'plant') {
          const seedId = get().selectedSeed;
          if (!seedId) return;
          const res = await providers.field.plant(plotId, seedId);
          set(
            produce((draft: GameStoreState) => {
              const idx = draft.plots.findIndex(p => p.id === plotId);
              if (idx >= 0) draft.plots[idx] = res.plot;
              if (res.inventory) draft.inventory = res.inventory;
            })
          );
          return;
        }
        if (selectedTool === 'water') {
          const res = await providers.field.water(plotId);
          set(
            produce((draft: GameStoreState) => {
              const idx = draft.plots.findIndex(p => p.id === plotId);
              if (idx >= 0) draft.plots[idx] = res.plot;
            })
          );
          return;
        }
        if (selectedTool === 'harvest') {
          const res = await providers.field.harvest(plotId);
          set(
            produce((draft: GameStoreState) => {
              const idx = draft.plots.findIndex(p => p.id === plotId);
              if (idx >= 0) draft.plots[idx] = res.plot;
              if (res.inventory) draft.inventory = res.inventory;
            })
          );
          return;
        }
      },
      async sellProduce(cropTypeId, quantity) {
        const res = await providers.market.sellProduce(cropTypeId, quantity);
        set(
          produce((draft: GameStoreState) => {
            draft.gold += res.goldDelta;
            if (res.inventory) draft.inventory = res.inventory;
          })
        );
      },
      async buySeed(cropTypeId, quantity) {
        const res = await providers.market.buySeed(cropTypeId, quantity);
        set(
          produce((draft: GameStoreState) => {
            draft.gold += res.goldDelta;
            if (res.inventory) draft.inventory = res.inventory;
          })
        );
      },
      heartbeat() {
        set({ tick: Date.now() });
      }
    }),
    { name: 'farm_aptos_zustand_cache' }
  )
);


