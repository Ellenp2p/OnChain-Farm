import React, { useEffect } from 'react';
import { CROPS, DEFAULT_GRID } from '@/domain/crops';
import { assessAction, growthProgress, isGrown } from '@/domain/logic';
import { useGameStore } from '@/stores/gameStore';
import { useUiStore } from '@/stores/uiStore';

function useHeartbeat(intervalMs: number) {
  const heartbeat = useGameStore(s => s.heartbeat);
  useEffect(() => {
    const id = setInterval(() => heartbeat(), intervalMs);
    return () => clearInterval(id);
  }, [heartbeat, intervalMs]);
}

export function FarmField() {
  const { plots, interactPlot, tick, selectedTool, selectedSeed, inventory } = useGameStore();
  const push = useUiStore(s => s.push);
  const { selectedPlotId, selectPlot } = useUiStore();
  useHeartbeat(1000);
  tick; // re-render on tick changes

  return (
    <div>
      <div className="field">
        {plots.flat().map(plot => {
          const crop = plot.crop;
          const a = assessAction(selectedTool, selectedSeed, inventory, plot);
          const c = crop ? CROPS[crop.cropTypeId] : undefined;
          const pct = crop ? Math.floor(growthProgress(crop.plantedAt, crop.cropTypeId) * 100) : 0;
          const ready = crop ? isGrown(crop.plantedAt, crop.cropTypeId) && crop.watered : false;

          const label = crop
            ? `${c?.emoji} ${pct}%${crop.watered ? ' 💧' : ''}${ready ? ' ✅' : ''}`
            : '空地';

          const onClick = async () => {
            if (selectedTool === 'hand') {
              selectPlot(plot.id);
              return;
            }
            if (!a.canAct) {
              selectPlot(plot.id);
              if (a.reason) push(a.reason, 'info');
              return;
            }
            await interactPlot(plot.id);
            selectPlot(plot.id);
            if (selectedTool === 'plant') push(`${c?.displayName ?? selectedSeed} 已种下`, 'success');
            if (selectedTool === 'water') push('已浇水', 'success');
            if (selectedTool === 'harvest') push('收获 +1', 'success');
          };

          const style: React.CSSProperties = {
            outline: a.canAct ? '1px solid #22c55e' : selectedPlotId === plot.id ? '1px solid #3b82f6' : undefined,
            background: ready ? '#0b1f12' : '#0b1220',
            position: 'relative'
          };

          return (
            <button key={plot.id} className="tile" onClick={onClick} style={style} title={a.reason}>
              <span>{label}</span>
              {crop && (
                <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, height: 4, background: '#111827', borderRadius: 2 }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: ready ? '#22c55e' : '#3b82f6', borderRadius: 2 }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="muted" style={{ marginTop: 8, overflowX: 'auto' }}>
        网格：{DEFAULT_GRID.rows}x{DEFAULT_GRID.cols}
      </div>
      <PlotDetails />
    </div>
  );
}

function PlotDetails() {
  const { selectedPlotId } = useUiStore();
  const { plots } = useGameStore();
  if (!selectedPlotId) return null;
  const plot = plots.flat().find(p => p.id === selectedPlotId);
  if (!plot) return null;
  const crop = plot.crop;
  const c = crop ? CROPS[crop.cropTypeId] : undefined;
  const pct = crop ? Math.floor(growthProgress(crop.plantedAt, crop.cropTypeId) * 100) : 0;
  const ready = crop ? isGrown(crop.plantedAt, crop.cropTypeId) : false;
  let leftSec = 0;
  if (crop && c && typeof c.growthSeconds === 'number') {
    const needed = c.growthSeconds * 1000;
    const left = BigInt(needed) - (BigInt(Date.now()) - crop.plantedAt);
    const leftMs = left > 0n ? left : 0n;
    // safe to convert because leftMs is bounded by needed which is a small number
    leftSec = Math.ceil(Number(leftMs) / 1000);
  }

  return (
    <div className="panel" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>地块详情</strong>
        <span className="muted">编号 {plot.id}</span>
      </div>
      {!crop && <div className="hint">空地：使用“种植”工具从上方选择作物后点击该地块进行种植</div>}
      {crop && (
        <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
          <div>
            作物：{c?.emoji} {c?.displayName}
          </div>
          <div>进度：{pct}%</div>
          <div>状态：{crop.watered ? '已浇水' : '未浇水'}{ready ? '，可收获' : ''}</div>
          {leftSec > 0 && <div>预计剩余：约 {leftSec}s</div>}
          <div style={{ position: 'relative', height: 6, background: '#111827', borderRadius: 3 }}>
            <div style={{ width: `${pct}%`, height: '100%', background: ready ? '#22c55e' : '#3b82f6', borderRadius: 3 }} />
          </div>
        </div>
      )}
    </div>
  );
}


