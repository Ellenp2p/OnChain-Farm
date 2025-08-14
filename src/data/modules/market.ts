import { InventoryItem } from '@/domain/types';
export interface MarketProvider {
  buySeed(cropTypeId: string, qty: number): Promise<{ goldDelta: number; inventory?: InventoryItem[] }>;
  sellProduce(cropTypeId: string, qty: number): Promise<{ goldDelta: number; inventory?: InventoryItem[] }>;
}


