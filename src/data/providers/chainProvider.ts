import { GameProvider, GameStateSnapshot } from '@/domain/types';

// 占位：未来接入 Aptos 链读取与提交交易
export const chainProvider: GameProvider = {
  async load(): Promise<GameStateSnapshot | null> {
    // TODO: 从链上读取游戏快照
    return null;
  },
  async save(_state: GameStateSnapshot): Promise<void> {
    // TODO: 提交链上交易保存游戏状态或由模块化接口承担
  }
};


