import { PlotTile, InventoryItem } from '@/domain/types';

export interface FieldProvider {
  loadField(): Promise<{ plots: PlotTile[][] }>;
  plant(plotId: string, cropTypeId: string): Promise<{ plot: PlotTile; inventory?: InventoryItem[] }>;
  water(plotId: string): Promise<{ plot: PlotTile }>;
  harvest(plotId: string): Promise<{ plot: PlotTile; inventory?: InventoryItem[] }>;
  
}



