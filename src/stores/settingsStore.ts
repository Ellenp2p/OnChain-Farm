import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
	rpcUrl: string;
	apiKey: string;
}

export interface SettingsActions {
	setRpcUrl: (rpcUrl: string) => void;
	setApiKey: (apiKey: string) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
	persist(
		(set) => ({
			rpcUrl: 'https://fullnode.mainnet.aptoslabs.com',
			apiKey: '',
			setRpcUrl(rpcUrl) { set({ rpcUrl }); },
			setApiKey(apiKey) { set({ apiKey }); }
		}),
		{ name: 'farm_aptos_settings' }
	)
);


