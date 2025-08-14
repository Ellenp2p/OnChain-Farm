export type ToolKind = 'hand' | 'plant' | 'water' | 'harvest';

export type ItemKind = 'seed' | 'produce';

export interface CropType {
  id: string;
  displayName: string;
  emoji: string;
  growthSeconds: number;
  seedBuyPrice: number;
  produceSellPrice: number;
}

export interface CropInstance {
  cropTypeId: string;
  plantedAt: bigint; // epoch ms
  watered: boolean;
}

export interface PlotTile {
  id: string; // `${row}-${col}`
  crop?: CropInstance;
}

export interface InventoryItem {
  id: string; // e.g., `seed:wheat` or `produce:wheat`
  kind: ItemKind;
  cropTypeId: string;
  quantity: number;
}

export interface GameStateSnapshot {
  gold: number;
  plots: PlotTile[][];
  inventory: InventoryItem[];
}

export interface GameProvider {
  load(): Promise<GameStateSnapshot | null>;
  save(state: GameStateSnapshot): Promise<void>;
}


