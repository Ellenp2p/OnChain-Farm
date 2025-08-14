import { create } from 'zustand';
import { connectWallet, disconnectWallet, getWalletAccount, isWalletConnected, signAndSubmitEntry } from '@/data/providers/wallet';
import { buildFullFunction } from '@/data/providers/aptosView';

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

export const useUiStore = create<UiState & UiActions>((set, get) => ({
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
    const addr = await connectWallet();
    set({ walletAddress: addr, walletConnected: true });
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
      await signAndSubmitEntry(fn, [], []);
      get().push('初始化成功', 'success');
      set({ initPromptOpen: false });
    } catch (e) {
      console.error(e);
      get().push('初始化失败，请重试', 'error');
    } finally {
      set({ initPending: false });
    }
  }
}));


