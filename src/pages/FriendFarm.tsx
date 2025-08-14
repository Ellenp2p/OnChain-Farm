import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFriendsStore } from '@/stores/friendsStore';
import { useUiStore } from '@/stores/uiStore';
import { CROPS } from '@/domain/crops';
import { assessAction, growthProgress, isGrown } from '@/domain/logic';
import { useGameStore } from '@/stores/gameStore';

type FriendTool = 'hand' | 'steal';

export function FriendFarm() {
  const { id } = useParams();
  const { ensureFriendState, friendStates } = useFriendsStore();
  const { gold } = useGameStore();
  React.useEffect(() => { if (id) ensureFriendState(id); }, [id, ensureFriendState]);
  const state = id ? friendStates[id] : undefined;

  const [tool, setTool] = React.useState<FriendTool>('hand');
  // 心跳：让进度条与成熟状态自动刷新
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="layout">
      <div className="topbar">
        <strong>好友农场</strong>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link className="btn" to="/">我的农场</Link>
          <Link className="btn" to="/friends">好友列表</Link>
          <div>💰 {gold}</div>
        </div>
      </div>
      <div className="game">
        <div className="panel">
          <h3>好友工具</h3>
          <div className="toolbar">
            <button className={`tool ${tool==='hand'?'active':''}`} onClick={() => setTool('hand')}>手</button>
            <button className={`tool ${tool==='steal'?'active':''}`} onClick={() => setTool('steal')}>偷菜</button>
          </div>
          <div className="hint">选择“偷菜”，点击成熟且浇过水的作物可获得 1 个产物</div>
        </div>
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          {!state && <div className="hint">加载好友农场中...</div>}
          {state && <FriendField tool={tool} friendId={id!} />}
        </div>
      </div>
      <div className="bottombar">仅好友可偷菜；本页基于 Mock 数据</div>
    </div>
  );
}

function FriendField({ tool, friendId }: { tool: FriendTool; friendId: string }) {
  const { friendStates, stealFromFriend } = useFriendsStore();
  const push = useUiStore(s => s.push);
  const state = friendStates[friendId];
  if (!state) return null;

  return (
    <div>
      <div className="field">
        {state.plots.flat().map(plot => {
          const crop = plot.crop;
          const c = crop ? CROPS[crop.cropTypeId] : undefined;
          const pct = crop ? Math.floor(growthProgress(crop.plantedAt, crop.cropTypeId) * 100) : 0;
          const ready = crop ? isGrown(crop.plantedAt, crop.cropTypeId) && crop.watered : false;
          const label = crop ? `${c?.emoji} ${pct}%${crop.watered ? ' 💧' : ''}${ready ? ' ✅' : ''}` : '空地';

          const onClick = () => {
            if (tool === 'hand') return;
            if (!crop) { push('没有可偷的作物', 'info'); return; }
            if (!ready) { push(crop.watered ? '尚未成熟' : '尚未浇水', 'info'); return; }
            stealFromFriend(friendId, plot.id);
            push('从好友处偷得 +1', 'success');
          };

          return (
            <button key={plot.id} className="tile" onClick={onClick} style={{ background: ready ? '#1a1f0b' : '#0b1220' }}>
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
    </div>
  );
}


