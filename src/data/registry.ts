import { mockFieldProvider, mockMarketProvider, mockFriendsProvider } from '@/data/providers/mockModules';
import { chainFieldProvider, chainMarketProvider, chainFriendsProvider } from '@/data/providers/chainModules';
import type { FieldProvider } from '@/data/modules/field';
import type { MarketProvider } from '@/data/modules/market';
import type { FriendsProvider } from '@/data/modules/friends';

type Mode = 'mock' | 'chain';
const modeField = (import.meta.env.VITE_PROVIDER_FIELD ?? 'mock') as Mode;
const modeMarket = (import.meta.env.VITE_PROVIDER_MARKET ?? 'mock') as Mode;
const modeFriends = (import.meta.env.VITE_PROVIDER_FRIENDS ?? 'mock') as Mode;

// 预留：可切换为链上实现
export const providers: { field: FieldProvider; market: MarketProvider; friends: FriendsProvider } = {
  field: modeField === 'mock' ? mockFieldProvider : chainFieldProvider,
  market: modeMarket === 'mock' ? mockMarketProvider : chainMarketProvider,
  friends: modeFriends === 'mock' ? mockFriendsProvider : chainFriendsProvider
};



