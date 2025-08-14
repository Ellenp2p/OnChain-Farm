import { useUiStore } from '@/stores/uiStore';

export function Toaster() {
  const { toasts, remove } = useUiStore();
  return (
    <div style={{ position: 'fixed', top: 'calc(12px + env(safe-area-inset-top))', left: 0, right: 0, display: 'grid', placeItems: 'center', gap: 8, pointerEvents: 'none', zIndex: 50 }}>
      {toasts.map(t => (
        <div key={t.id}
          onClick={() => remove(t.id)}
          style={{
            pointerEvents: 'auto',
            background: t.kind === 'error' ? '#7f1d1d' : t.kind === 'success' ? '#065f46' : '#1f2937',
            color: '#e5e7eb',
            border: '1px solid #374151',
            borderRadius: 8,
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
          }}
        >{t.message}</div>
      ))}
    </div>
  );
}


