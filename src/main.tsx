import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { App } from './pages/App';
import { FriendsList } from './pages/FriendsList';
import { Settings } from './pages/Settings';
import { FriendFarm } from './pages/FriendFarm';
import './styles/index.css';

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { useSettingsStore } from '@/stores/settingsStore';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/friends', element: <FriendsList /> },
  { path: '/friend/:id', element: <FriendFarm /> },
  { path: '/settings', element: <Settings /> }
], {
  basename: '/OnChain-Farm'
});

function inferNetworkFromRpc(rpcUrl: string | undefined): Network {
  const url = (rpcUrl || '').toLowerCase();
  if (url.includes('devnet')) return Network.DEVNET;
  if (url.includes('testnet')) return Network.TESTNET;
  if (url.includes('mainnet')) return Network.MAINNET;
  if (url.includes('localhost') || url.includes('127.0.0.1')) return Network.LOCAL;
  return Network.MAINNET;
}

function WalletAdapterRoot() {
  const { rpcUrl, apiKey } = useSettingsStore();
  const network = inferNetworkFromRpc(rpcUrl);
  const keys = {
    mainnet: apiKey || undefined,
    testnet: apiKey || undefined,
    devnet: apiKey || undefined,
  } as Record<string, string | undefined>;

  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network,
        aptosApiKeys: keys
      }}
      onError={(error) => {
        console.log('wallet adapter error', error);
      }}
    >
      <RouterProvider  router={router} />
    </AptosWalletAdapterProvider>
  );
}

createRoot(rootElement).render(
  <React.StrictMode>
    <WalletAdapterRoot />
  </React.StrictMode>
);


