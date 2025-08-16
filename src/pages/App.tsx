import { FarmField } from '@/components/FarmField';
import { InventoryPanel } from '@/components/InventoryPanel';
import { MarketPanel } from '@/components/MarketPanel';
import { Toolbar } from '@/components/Toolbar';
import { Toaster } from '@/components/Toaster';
import { useGameStore } from '@/stores/gameStore';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUiStore } from '@/stores/uiStore';
  import { useState } from 'react';

export function App() {
  const { gold, load } = useGameStore();
  const { walletConnected, walletAddress, connect, disconnect, refreshWallet, initPromptOpen, openInitPrompt, closeInitPrompt, initPending, initFarm } = useUiStore();

  const [countdown, setCountdown] = useState(4);
  useEffect(() => {
    void refreshWallet();
    void load();
  }, [load]);
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          void load();
          return 2;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [load]);
  
  return (
    <div className="layout">
      
      <Toaster />
      <div className="topbar">
        <strong>Farm Aptos</strong>
        <span className="muted">Alpha</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: '4px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'}}>
            刷新倒计时：{countdown}s
          </div>
          <Link className="btn" to="/friends">好友列表</Link>
          <Link className="btn" to="/settings">设置</Link>
          <div>💰 {gold}</div>
          {walletConnected ? (
            <button className="btn" onClick={() => void disconnect()} title={walletAddress ?? ''}>
              已连接 {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </button>
          ) : (
            <button className="btn" onClick={() => void connect()}>连接钱包</button>
          )}
        </div>
      </div>
      <div className="game main">
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
      {initPromptOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', padding: '16px', paddingTop: 'calc(16px + env(safe-area-inset-top))', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <div className="panel" style={{ minWidth: 280, width: 'min(520px, 100%)' }}>
            <h3>初始化农场</h3>
            <div className="muted" style={{ marginTop: 6 }}>检测到你尚未初始化农场。点击“初始化”将提交一笔交易以创建你的农场。</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button className="btn" onClick={closeInitPrompt} disabled={initPending}>稍后</button>
              <button className="btn" onClick={() => void initFarm()} disabled={initPending}>{initPending ? '初始化中...' : '初始化'}</button>
            </div>
          </div>
        </div>
      )}
      <div className="bottombar">数据来源：可在环境变量中切换 Mock/链上 Provider</div>
    </div>
  );
}


