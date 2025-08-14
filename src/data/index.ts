import { mockProvider } from '@/data/providers/mockProvider';
import { chainProvider } from '@/data/providers/chainProvider';
import type { GameProvider } from '@/domain/types';

type ProviderMode = 'mock' | 'chain';
const mode = (import.meta.env.VITE_DATA_PROVIDER ?? 'mock') as ProviderMode;

export const dataProvider: GameProvider = mode === 'chain' ? chainProvider : mockProvider;


