import { CROPS } from '@/domain/crops';
import { ToolKind } from '@/domain/types';
import { useGameStore } from '@/stores/gameStore';

const TOOLS: { key: ToolKind; label: string; hint: string }[] = [
  { key: 'hand', label: '手', hint: '查看信息：悬停/点击地块以查看状态' },
  { key: 'plant', label: '种植', hint: '选择作物后，点击空地进行种植' },
  { key: 'water', label: '浇水', hint: '给已种的作物浇水，提高收获条件' },
  { key: 'harvest', label: '收获', hint: '作物成熟且浇过水后可收获' }
];

export function Toolbar() {
  const { selectedTool, selectTool, selectedSeed, selectSeed, inventory } = useGameStore();
  const selected = TOOLS.find(t => t.key === selectedTool);

  // 仅展示“可种”的作物（库存 > 0）
  const plantable = Object.values(CROPS).filter(c => {
    const inv = inventory.find(i => i.kind === 'seed' && i.cropTypeId === c.id);
    return (inv?.quantity ?? 0) > 0;
  });

  return (
    <div className="toolbar">
      {TOOLS.map(t => (
        <button key={t.key} className={`tool ${selectedTool === t.key ? 'active' : ''}`} onClick={() => selectTool(t.key)}>
          {t.label}
        </button>
      ))}

      {selected && <div className="hint" style={{ width: '100%' }}>{selected.hint}</div>}

      {selectedTool === 'plant' && (
        <div className="subbar">
          <div className="subbar-title">选择作物（仅显示可种）</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {plantable.length === 0 && (
              <div className="hint">暂无可种作物，请前往右侧“市场”购买种子</div>
            )}
            {plantable.map(c => {
              const inv = inventory.find(i => i.kind === 'seed' && i.cropTypeId === c.id);
              const qty = inv?.quantity ?? 0;
              return (
                <button
                  key={c.id}
                  className={`tool seed ${selectedSeed === c.id ? 'active' : ''}`}
                  onClick={() => selectSeed(c.id)}
                  title={`库存: ${qty}`}
                >
                  {c.emoji} {c.displayName}
                  <span className="qty">x{qty}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}


