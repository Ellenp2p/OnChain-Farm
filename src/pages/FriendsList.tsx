import { Link } from 'react-router-dom';
import { useFriendsStore } from '@/stores/friendsStore';
import { useGameStore } from '@/stores/gameStore';

export function FriendsList() {
  const { friends } = useFriendsStore();
  const { gold } = useGameStore();
  return (
    <div className="layout">
      <div className="topbar">
        <strong>Farm Aptos</strong>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Link className="btn" to="/">我的农场</Link>
          <div>💰 {gold}</div>
        </div>
      </div>
      <div className="game">
        <div className="panel">
          <h3>好友</h3>
          <div className="list">
            {friends.map(f => (
              <div key={f.id} className="list-item">
                <div>👤 {f.name}</div>
                <Link className="btn" to={`/friend/${f.id}`}>去TA的农场</Link>
              </div>
            ))}
          </div>
        </div>
        <div className="panel" style={{ gridColumn: 'span 2' }}>
          <div className="hint">选择左侧好友进入其农场，可在满足条件时进行“偷菜”。</div>
        </div>
      </div>
      <div className="bottombar">Mock 好友与农场数据</div>
    </div>
  );
}


