import { CROPS } from '@/domain/crops';
import { useGameStore } from '@/stores/gameStore';

export function MarketPanel() {
  const { buySeed, sellProduce, inventory, gold } = useGameStore();

  return (
    <div className="list">
      <div>
        <h4>购买种子</h4>
        {Object.values(CROPS).map(c => (
          <div className="list-item" key={c.id}>
            <div>{c.emoji} {c.displayName} — {c.seedBuyPrice}💰/粒</div>
            <button className="btn" onClick={() => buySeed(c.id, 1)} disabled={gold < c.seedBuyPrice}>购买</button>
          </div>
        ))}
      </div>
      <div>
        <h4>出售产物</h4>
        {Object.values(CROPS).map(c => {
          const prod = inventory.find(i => i.kind === 'produce' && i.cropTypeId === c.id);
          const qty = prod?.quantity ?? 0;
          return (
            <div className="list-item" key={c.id}>
              <div>{c.emoji} {c.displayName} — {c.produceSellPrice}💰/个</div>
              <button className="btn" onClick={() => sellProduce(c.id, 1)} disabled={qty <= 0}>卖出</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


