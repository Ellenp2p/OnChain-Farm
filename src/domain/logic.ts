import { CROPS } from './crops';
import { InventoryItem, PlotTile, ToolKind } from './types';

export function isGrown(plantedAt: number, cropTypeId: string): boolean {
  const crop = CROPS[cropTypeId];
  const elapsed = Date.now() - plantedAt;
  return elapsed >= crop.growthSeconds * 1000;
}

export function growthProgress(plantedAt: number, cropTypeId: string): number {
  const crop = CROPS[cropTypeId];
  const elapsed = Date.now() - plantedAt;
  const pct = Math.min(1, elapsed / (crop.growthSeconds * 1000));
  return pct;
}

export type PlotAssessment = {
  canAct: boolean;
  reason?: string;
  progress?: number; // 0..1
  isReady?: boolean;
  needsWater?: boolean;
};

export function assessAction(
  tool: ToolKind,
  selectedSeed: string | null,
  inventory: InventoryItem[],
  plot: PlotTile
): PlotAssessment {
  const crop = plot.crop;

  if (tool === 'plant') {
    if (crop) return { canAct: false, reason: '地块已被占用' };
    if (!selectedSeed) return { canAct: false, reason: '请先选择要种植的种子' };
    const inv = inventory.find(i => i.kind === 'seed' && i.cropTypeId === selectedSeed);
    if (!inv || inv.quantity <= 0) return { canAct: false, reason: '该种子库存不足' };
    return { canAct: true };
  }

  if (tool === 'water') {
    if (!crop) return { canAct: false, reason: '没有作物可浇水' };
    if (crop.watered) return { canAct: false, reason: '已经浇过水' };
    return { canAct: true, progress: growthProgress(crop.plantedAt, crop.cropTypeId) };
  }

  if (tool === 'harvest') {
    if (!crop) return { canAct: false, reason: '没有作物可收获' };
    const ready = isGrown(crop.plantedAt, crop.cropTypeId);
    if (!crop.watered) return { canAct: false, reason: '收获前需要浇水', progress: growthProgress(crop.plantedAt, crop.cropTypeId), needsWater: true };
    if (!ready) return { canAct: false, reason: '尚未成熟', progress: growthProgress(crop.plantedAt, crop.cropTypeId) };
    return { canAct: true, isReady: true, progress: 1 };
  }

  // hand
  if (crop) {
    return { canAct: false, progress: growthProgress(crop.plantedAt, crop.cropTypeId), isReady: isGrown(crop.plantedAt, crop.cropTypeId), needsWater: !crop.watered };
  }
  return { canAct: false };
}


