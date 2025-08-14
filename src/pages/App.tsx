import { FarmField } from '@/components/FarmField';
import { InventoryPanel } from '@/components/InventoryPanel';
import { MarketPanel } from '@/components/MarketPanel';
import { Toolbar } from '@/components/Toolbar';
import { Toaster } from '@/components/Toaster';
import { useGameStore } from '@/stores/gameStore';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export function App() {
  const { gold, load } = useGameStore();
  useEffect(() => { void load(); }, [load]);

  return (
    <div className="layout">
      <Toaster />
      <div className="topbar">
        <strong>Farm Aptos</strong>
        <span className="muted">Alpha</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link className="btn" to="/friends">好友列表</Link>
          <Link className="btn" to="/settings">设置</Link>
          <div>💰 {gold}</div>
        </div>
      </div>
      <div className="game">
        <div className="panel">
          <h3>工具</h3>
          <Toolbar />
          <hr />
          <h3>背包</h3>
          <InventoryPanel />
        </div>
        <div className="panel">
          <FarmField />
        </div>
        <div className="panel">
          <h3>市场</h3>
          <MarketPanel />
          <div style={{ marginTop: 12 }}>
            <Link className="btn" to="/friends">前往好友列表 →</Link>
          </div>
        </div>
      </div>
      <div className="bottombar">
        数据来源：Mock（后续切换到链上 Provider）
      </div>
    </div>
  );
}


