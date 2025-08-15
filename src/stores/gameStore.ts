import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { produce } from 'immer';
import { CROPS } from '@/domain/crops';
import { GameStateSnapshot, InventoryItem, PlotTile, ToolKind } from '@/domain/types';
import { providers } from '@/data/registry';
import { cacheGetEntry } from '@/data/providers/simpleCache';

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

const replacer = (key: any, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString() + 'n';
  }
  return value;
};

const reviver = (key: any, value: any) => {
  if (typeof value === 'string' && /^\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1));
  }
  return value;
};

// 创建自定义的 storage
const customStorage = createJSONStorage(() => localStorage, {
  replacer,
  reviver,
});

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
        console.log("Loading game state...");
        const field = await providers.field.loadField();
        set(state => ({ ...state, plots: field.plots }));
        // Try to read on-chain gold cached by the field provider
        try {
          const g = cacheGetEntry<number>('field:gold');
          if (g && (typeof g.value === 'number' || typeof g.value === 'bigint')) set(state=> ({...state, gold: g.value }));
        } catch {}

        try {
          const inv = cacheGetEntry<InventoryItem[]>('field:inventory');
          if (inv) set(state => ({ ...state, inventory: inv.value }));
        } catch {}
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
              for (let r = 0; r < draft.plots.length; r++) {
                const cIdx = draft.plots[r].findIndex(p => p.id === plotId);
                if (cIdx >= 0) { draft.plots[r][cIdx] = res.plot; break; }
              }
              if (res.inventory) draft.inventory = res.inventory;
            })
          );
          return;
        }
        if (selectedTool === 'water') {
          const res = await providers.field.water(plotId);
          set(
            produce((draft: GameStoreState) => {
              for (let r = 0; r < draft.plots.length; r++) {
                const cIdx = draft.plots[r].findIndex(p => p.id === plotId);
                if (cIdx >= 0) { draft.plots[r][cIdx] = res.plot; break; }
              }
            })
          );
          return;
        }
        if (selectedTool === 'harvest') {
          const res = await providers.field.harvest(plotId);
          set(
            produce((draft: GameStoreState) => {
              for (let r = 0; r < draft.plots.length; r++) {
                const cIdx = draft.plots[r].findIndex(p => p.id === plotId);
                if (cIdx >= 0) { draft.plots[r][cIdx] = res.plot; break; }
              }
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
            draft.gold = Number((BigInt(draft.gold) + BigInt(res.goldDelta)).toString());
            if (res.inventory) draft.inventory = res.inventory;
          })
        );
      },
      async buySeed(cropTypeId, quantity) {
        const res = await providers.market.buySeed(cropTypeId, quantity);
      },
      heartbeat() {
        set({ tick: Date.now() });
      }
    }),
    { name: 'farm_aptos_zustand_cache', storage: customStorage}
  )
);


