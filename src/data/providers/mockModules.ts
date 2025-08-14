import { FieldProvider } from '@/data/modules/field';
import { MarketProvider } from '@/data/modules/market';
import { FriendsProvider } from '@/data/modules/friends';
import { CROPS, DEFAULT_GRID } from '@/domain/crops';
import { GameStateSnapshot, PlotTile } from '@/domain/types';

const STORAGE_KEY = 'farm_aptos_mock_state_v2_modules';

function loadLocal(): GameStateSnapshot | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as GameStateSnapshot; } catch { return null; }
}
function saveLocal(state: GameStateSnapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function createEmpty(): GameStateSnapshot {
  const plots: PlotTile[][] = [];
  for (let r = 0; r < DEFAULT_GRID.rows; r++) {
    const row: PlotTile[] = [];
    for (let c = 0; c < DEFAULT_GRID.cols; c++) row.push({ id: `${r}-${c}`, crop: undefined });
    plots.push(row);
  }
  return { gold: 20, plots, inventory: [ { id: 'seed:wheat', kind: 'seed', cropTypeId: 'wheat', quantity: 5 } ] };
}

function ensure(): GameStateSnapshot {
  return loadLocal() ?? createEmpty();
}

export const mockFieldProvider: FieldProvider = {
  async loadField() {
    const s = ensure();
    return { plots: s.plots };
  },
  async plant(plotId, cropTypeId) {
    const s = ensure();
    const plot = s.plots.flat().find(p => p.id === plotId);
    if (!plot || plot.crop) return { plot: plot! };
    const inv = s.inventory.find(i => i.kind === 'seed' && i.cropTypeId === cropTypeId);
  if (!inv || inv.quantity <= 0) return { plot };
  inv.quantity -= 1;
  plot.crop = { cropTypeId, plantedAt: BigInt(Date.now()), watered: false };
    saveLocal(s);
    return { plot, inventory: s.inventory };
  },
  async water(plotId) {
    const s = ensure();
    const plot = s.plots.flat().find(p => p.id === plotId);
  if (plot && plot.crop) plot.crop.watered = true;
    saveLocal(s);
    return { plot: plot! };
  },
  async harvest(plotId) {
    const s = ensure();
    const plot = s.plots.flat().find(p => p.id === plotId);
  if (!plot || !plot.crop) return { plot: plot! };
    const cropTypeId = plot.crop.cropTypeId;
    const inv = s.inventory.find(i => i.kind === 'produce' && i.cropTypeId === cropTypeId);
    if (inv) inv.quantity += 1; else s.inventory.push({ id: `produce:${cropTypeId}`, kind: 'produce', cropTypeId, quantity: 1 });
  plot.crop = undefined;
    saveLocal(s);
    return { plot, inventory: s.inventory };
  }
};

export const mockMarketProvider: MarketProvider = {
  async buySeed(cropTypeId, qty) {
    console.log("testestse")
    const s = ensure();
    const cost = qty * CROPS[cropTypeId].seedBuyPrice;
    if (s.gold < cost) return { goldDelta: 0 };
    s.gold -= cost;
    const inv = s.inventory.find(i => i.kind === 'seed' && i.cropTypeId === cropTypeId);
    if (inv) inv.quantity += qty; else s.inventory.push({ id: `seed:${cropTypeId}`, kind: 'seed', cropTypeId, quantity: qty });
    saveLocal(s);
    return { goldDelta: -cost, inventory: s.inventory };
  },
  async sellProduce(cropTypeId, qty) {
    const s = ensure();
    const inv = s.inventory.find(i => i.kind === 'produce' && i.cropTypeId === cropTypeId);
    if (!inv || inv.quantity < qty) return { goldDelta: 0 };
    inv.quantity -= qty;
    const gain = qty * CROPS[cropTypeId].produceSellPrice;
    s.gold += gain;
    saveLocal(s);
    return { goldDelta: gain, inventory: s.inventory };
  }
};

export const mockFriendsProvider: FriendsProvider = {
  async listFriends() {
    return [ { id: 'alice', name: 'Alice' }, { id: 'bob', name: 'Bob' } ];
  },
  async loadFriendState(friendId) {
    // 简化：重用本地生成逻辑
    const now = Date.now();
    const plots: PlotTile[][] = [];
    for (let r = 0; r < DEFAULT_GRID.rows; r++) {
      const row: PlotTile[] = [];
      for (let c = 0; c < DEFAULT_GRID.cols; c++) row.push({ id: `${r}-${c}`, crop: undefined });
      plots.push(row);
    }
    plots[0][3].crop = { cropTypeId: 'wheat', plantedAt: BigInt(now) - BigInt(CROPS.wheat.growthSeconds) * 1000n - 2000n, watered: true };
    plots[1][2].crop = { cropTypeId: 'carrot', plantedAt: BigInt(now) - (BigInt(CROPS.carrot.growthSeconds) * 1000n) / 2n, watered: false };
    return { gold: 10 + friendId.length, plots, inventory: [] };
  },
  async steal(_friendId, _plotId) {
    // 纯客户端 Mock：具体扣对方由页面状态管理完成
    return { cropTypeId: 'wheat', qty: 1 };
  }
};


