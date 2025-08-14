import { useSettingsStore } from '@/stores/settingsStore';

export interface ChainConfig {
	rpcUrl: string;
	apiKey?: string;
}

export function getChainConfig(): ChainConfig {
	const { rpcUrl, apiKey } = useSettingsStore.getState();
	return { rpcUrl, apiKey: apiKey || undefined };
}


