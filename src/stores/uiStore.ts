import { create } from 'zustand';

type Toast = { id: string; message: string; kind?: 'info' | 'error' | 'success' };

interface UiState {
  toasts: Toast[];
  push: (message: string, kind?: Toast['kind']) => void;
  remove: (id: string) => void;
  selectedPlotId: string | null;
  selectPlot: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  push(message, kind = 'info') {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set(state => ({ toasts: [...state.toasts, { id, message, kind }] }));
    setTimeout(() => {
      set(state => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 2200);
  },
  remove(id) { set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })); },
  selectedPlotId: null,
  selectPlot(id) { set({ selectedPlotId: id }); }
}));


