import { GameStateSnapshot } from '@/domain/types';

export interface FriendsProvider {
  listFriends(): Promise<{ id: string; name: string }[]>;
  loadFriendState(friendId: string): Promise<GameStateSnapshot>;
  steal(friendId: string, plotId: string): Promise<{ cropTypeId: string; qty: number }>;
}



