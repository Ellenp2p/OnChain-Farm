import { useGameStore } from '@/stores/gameStore';
import { CROPS } from '@/domain/crops';

export function InventoryPanel() {
  const { inventory } = useGameStore();

  const seeds = inventory.filter(i => i.kind === 'seed');
  const produces = inventory.filter(i => i.kind === 'produce');

  return (
    <div className="list">
      <div>
        <div className="muted">种子</div>
        {seeds.length === 0 && <div className="muted">无</div>}
          {seeds.map(s => {
            const crop = CROPS[s.cropTypeId];
            return (
              <div className="list-item" key={s.id}>
                <div>
                  {crop ? `${crop.emoji} ${crop.displayName}` : s.cropTypeId}
                </div>
                <div>x{s.quantity}</div>
              </div>
            );
          })}
      </div>
      <div>
        <div className="muted">产物</div>
        {produces.length === 0 && <div className="muted">无</div>}
          {produces.map(p => {
            const crop = CROPS[p.cropTypeId];
            return (
              <div className="list-item" key={p.id}>
                <div>
                  {crop ? `${crop.emoji} ${crop.displayName}` : p.cropTypeId}
                </div>
                <div>x{p.quantity}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}


