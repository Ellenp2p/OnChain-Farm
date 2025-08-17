import { CROPS } from '@/domain/crops';
import { useGameStore } from '@/stores/gameStore';
import { useState } from 'react';

export function MarketPanel() {
  const { buySeed, sellProduce, inventory, gold } = useGameStore();
  const numericGold = typeof gold === 'bigint' ? Number(gold) : gold;
  const [buyQuantities, setBuyQuantities] = useState<Record<string, number>>({});
  const [sellQuantities, setSellQuantities] = useState<Record<string, number>>({});

  function setBuy(cropId: string, v: number, max: number) {
    const val = max === 0 ? 0 : Math.max(1, Math.min(max, Math.floor(v)));
    setBuyQuantities(prev => ({ ...prev, [cropId]: val }));
  }
  function setSell(cropId: string, v: number, max: number) {
    const val = Math.max(1, Math.min(max, Math.floor(v)));
    setSellQuantities(prev => ({ ...prev, [cropId]: val }));
  }

  return (
    <div className="list">
      <div>
        <h4>购买种子</h4>
        {Object.values(CROPS).map(c => {
          const buyMax = Math.max(0, Math.floor(numericGold / Math.max(1, c.seedBuyPrice)));
          const qty = buyQuantities[c.id] ?? (buyMax > 0 ? 1 : 0);
          return (
            <div className="market-item" key={c.id}>
              <div className="market-title" style={{ fontSize: 18, lineHeight: 1 }}>{c.emoji} {c.displayName} — {c.seedBuyPrice}💰/粒</div>

              <div className="market-controls" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min={buyMax > 0 ? 1 : 0}
                  max={buyMax}
                  value={qty}
                  onChange={e => setBuy(c.id, Number(e.target.value || 0), buyMax)}
                  style={{ width: 64, padding: '6px 8px' }}
                  disabled={buyMax === 0}
                />

                <input
                  type="range"
                  min={buyMax > 0 ? 1 : 0}
                  max={buyMax}
                  value={qty}
                  onChange={e => setBuy(c.id, Number(e.target.value), buyMax)}
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 8,
                    appearance: 'none',
                    outline: 'none'
                  }}
                  disabled={buyMax === 0}
                />

                <button
                  className="btn"
                  onClick={() => buySeed(c.id, qty)}
                  disabled={buyMax === 0 || numericGold < c.seedBuyPrice * qty}
                  style={{ whiteSpace: 'nowrap' }}
                >购买</button>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <h4>出售产物</h4>
        {Object.values(CROPS).map(c => {
          const prod = inventory.find(i => i.kind === 'produce' && i.cropTypeId === c.id);
          const available = prod?.quantity ?? 0;
          const sellMax = Math.max(0, available);
          const qty = sellQuantities[c.id] ?? (available > 0 ? 1 : 0);
          return (
            <div className="market-item" key={c.id}>
              <div className="market-title" style={{ fontSize: 18, lineHeight: 1 }}>{c.emoji} {c.displayName} — {c.produceSellPrice}💰/个</div>

              <div className="market-controls" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  min={sellMax > 0 ? 1 : 0}
                  max={sellMax}
                  value={qty}
                  onChange={e => setSell(c.id, Number(e.target.value || 0), sellMax)}
                  style={{ width: 64, padding: '6px 8px' }}
                  disabled={sellMax === 0}
                />

                <input
                  type="range"
                  min={0}
                  max={sellMax}
                  value={qty}
                  onChange={e => setSell(c.id, Number(e.target.value), sellMax)}
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 8,
                    appearance: 'none',
                    outline: 'none'
                  }}
                  disabled={sellMax === 0}
                />

                <button
                  className="btn"
                  onClick={() => sellProduce(c.id, qty)}
                  disabled={sellMax === 0 || available <= 0 || qty <= 0}
                  style={{ whiteSpace: 'nowrap' }}
                >卖出</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


