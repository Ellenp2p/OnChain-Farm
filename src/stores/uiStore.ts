import { create } from 'zustand';
import { disconnectWallet, getWalletAccount, isWalletConnected, signAndSubmitEntry, connectWallet, walletAdaptorStore } from '@/data/providers/wallet';
import { buildFullFunction } from '@/data/providers/aptosView';
import { useGameStore } from './gameStore';

type Toast = { id: string; message: string; kind?: 'info' | 'error' | 'success' };

export interface UiState {
  toasts: Toast[];
  selectedPlotId: string | null;
  walletAddress: string | null;
  walletConnected: boolean;
  initPromptOpen: boolean;
  initPending: boolean;
}

export interface UiActions {
  push: (message: string, kind?: Toast['kind']) => void;
  remove: (id: string) => void;
  selectPlot: (id: string | null) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  openInitPrompt: () => void;
  closeInitPrompt: () => void;
  initFarm: () => Promise<void>;
}

export const useUiStore = create<UiState & UiActions>((set, get) => {
  // 订阅钱包状态变化，自动刷新和加载
  let lastAddress: string | null = null;
  walletAdaptorStore.subscribe((state) => {
    console.log('Wallet state changed:', state);  
    if (state.address && state.address !== lastAddress) {
      lastAddress = state.address;
      get().refreshWallet();
      useGameStore.getState().load();
    }
  });
  return {
    toasts: [],
    selectedPlotId: null,
    walletAddress: null,
    walletConnected: false,
    initPromptOpen: false,
    initPending: false,

    push(message, kind = 'info') {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      set(state => ({ toasts: [...state.toasts, { id, message, kind }] }));
      setTimeout(() => {
        set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
      }, 2200);
    },
    remove(id) {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    },
    selectPlot(id) {
      set({ selectedPlotId: id });
    },
    async connect() {
      await connectWallet("Petra");
      set({ walletAddress: await getWalletAccount(), walletConnected: true });
    },
    async disconnect() {
      await disconnectWallet();
      set({ walletAddress: null, walletConnected: false });
    },
    async refreshWallet() {
      const connected = await isWalletConnected();
      const addr = connected ? await getWalletAccount() : null;
      set({ walletConnected: connected, walletAddress: addr });
    },
    openInitPrompt() { set({ initPromptOpen: true }); },
    closeInitPrompt() { set({ initPromptOpen: false }); },
    async initFarm() {
      try {
        set({ initPending: true });
        const fn = buildFullFunction('init');
        await signAndSubmitEntry(fn as any, [], []);
        get().push('初始化成功', 'success');
        set({ initPromptOpen: false });
      } catch (e) {
        console.error(e);
        get().push('初始化失败，请重试', 'error');
      } finally {
        set({ initPending: false });
      }
    }
  };
});


