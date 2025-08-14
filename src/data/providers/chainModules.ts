import type { FieldProvider } from '@/data/modules/field';
import type { MarketProvider } from '@/data/modules/market';
import type { FriendsProvider } from '@/data/modules/friends';
import { getChainConfig } from '@/data/providers/chainConfig';
import type { PlotTile } from '@/domain/types';

export const chainFieldProvider: FieldProvider = {
  async loadField() {
    // TODO: 从链上读取地块网格状态
    const cfg = getChainConfig();
    void cfg; // 预留使用
    return { plots: [] as PlotTile[][] };
  },
  async plant(plotId, cropTypeId) {
    // TODO: 提交链上交易：在指定地块播种指定作物
    return { plot: { id: plotId, crop: null } };
  },
  async water(plotId) {
    // TODO: 提交链上交易：给指定地块浇水
    return { plot: { id: plotId, crop: null } };
  },
  async harvest(plotId) {
    // TODO: 提交链上交易：收获指定地块作物
    return { plot: { id: plotId, crop: null } };
  }
};

export const chainMarketProvider: MarketProvider = {
  async buySeed(cropTypeId, qty) {
    // TODO: 提交链上交易：购买种子
    return { goldDelta: 0 };
  },
  async sellProduce(cropTypeId, qty) {
    // TODO: 提交链上交易：出售农产品
    return { goldDelta: 0 };
  }
};

export const chainFriendsProvider: FriendsProvider = {
  async listFriends() {
    // TODO: 从链上/社交合约查询好友列表
    return [];
  },
  async loadFriendState(friendId) {
    // TODO: 从链上读取好友的农场快照
    return { gold: 0, plots: [] as PlotTile[][], inventory: [] };
  },
  async steal(friendId, plotId) {
    // TODO: 提交链上交易：从好友地块偷取成熟作物
    return { cropTypeId: '', qty: 0 };
  }
};


