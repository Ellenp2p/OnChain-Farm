import { create } from 'zustand';
import { produce } from 'immer';
import { DEFAULT_GRID } from '@/domain/crops';
import { GameStateSnapshot, PlotTile } from '@/domain/types';
import { CROPS } from '@/domain/crops';
import { useGameStore } from '@/stores/gameStore';
import { providers } from '@/data/registry';

export interface FriendInfo { id: string; name: string; avatar?: string; }

interface FriendsState {
  friends: FriendInfo[];
  friendStates: Record<string, GameStateSnapshot>;
  ensureFriendState: (friendId: string) => void;
  stealFromFriend: (friendId: string, plotId: string) => void;
}

function createEmptyPlots(): PlotTile[][] {
  const plots: PlotTile[][] = [];
  for (let r = 0; r < DEFAULT_GRID.rows; r++) {
    const row: PlotTile[] = [];
    for (let c = 0; c < DEFAULT_GRID.cols; c++) {
      row.push({ id: `${r}-${c}`, crop: null });
    }
    plots.push(row);
  }
  return plots;
}

function seedFriendState(seed: number): GameStateSnapshot {
  const plots = createEmptyPlots();
  const now = Date.now();
  plots[0][3].crop = { cropTypeId: 'wheat', plantedAt: now - CROPS.wheat.growthSeconds * 1000 - 2000, watered: true };
  plots[1][2].crop = { cropTypeId: 'carrot', plantedAt: now - (CROPS.carrot.growthSeconds * 1000) / 2, watered: false };
  plots[2][4].crop = { cropTypeId: 'corn', plantedAt: now - 5000, watered: true };
  return {
    gold: 12 + seed,
    plots,
    inventory: [
      { id: 'seed:wheat', kind: 'seed', cropTypeId: 'wheat', quantity: 1 },
      { id: 'produce:carrot', kind: 'produce', cropTypeId: 'carrot', quantity: 0 }
    ]
  };
}

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  friendStates: {},
  async ensureFriendState(friendId) {
    const states = get().friendStates;
    if (!get().friends.length) {
      const list = await providers.friends.listFriends();
      set({ friends: list });
    }
    if (states[friendId]) return;
    const state = await providers.friends.loadFriendState(friendId);
    set({ friendStates: { ...states, [friendId]: state } });
  },
  stealFromFriend(friendId, plotId) {
    set(
      produce((draft: FriendsState) => {
        const state = draft.friendStates[friendId];
        if (!state) return;
        const plot = state.plots.flat().find(p => p.id === plotId);
        if (!plot || !plot.crop) return;
        const crop = plot.crop;
        const cropType = CROPS[crop.cropTypeId];
        const grown = Date.now() - crop.plantedAt >= cropType.growthSeconds * 1000;
        if (!grown || !crop.watered) return;
        plot.crop = null;
        const game = useGameStore.getState();
        useGameStore.setState(
          produce(game, (draftGame) => {
            const inv = draftGame.inventory.find(i => i.kind === 'produce' && i.cropTypeId === crop.cropTypeId);
            if (inv) inv.quantity += 1; else draftGame.inventory.push({ id: `produce:${crop.cropTypeId}`, kind: 'produce', cropTypeId: crop.cropTypeId, quantity: 1 });
          })
        );
      })
    );
  }
}));


