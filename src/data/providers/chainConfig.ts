import { useSettingsStore } from '@/stores/settingsStore';

export interface ChainConfig {
	rpcUrl: string;
	apiKey?: string;
	packageAddress: string;
	moduleName: string;
}

export function getChainConfig(): ChainConfig {
	const { rpcUrl, apiKey } = useSettingsStore.getState();
	return {
		rpcUrl,
		apiKey: apiKey || undefined,
		// TODO: 部署后填入实际包地址
		packageAddress: import.meta.env.VITE_FARM_PACKAGE_ADDR ?? '0x0',
		moduleName: 'farm_aptos'
	};
}


