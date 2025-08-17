// 轻量 Aptos 钱包适配器（Petra/Fewcha 等）
import { EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes } from '@aptos-labs/ts-sdk';
import { create } from 'zustand';
import {AptosConnectFeature, AptosConnectMethod, AptosConnectNamespace, AptosDisconnectFeature, AptosDisconnectNamespace, AptosSignAndSubmitTransactionFeature, AptosSignAndSubmitTransactionNamespace, getAptosWallets} from "@aptos-labs/wallet-standard";

export interface WalletAdaptorState {
  installed_wallets: readonly Wallet[];
  address?: string;
  publicKey?: string;
  ansName?: string;
  network?: string;
  chainId?: number;
  url?: string;
  wallet?: Wallet;
  isAutoConnectEnabled?: boolean;
  setWallet: (wallet: Wallet | undefined) => void;
  setInstalledWallets: (installed_wallets: readonly Wallet[]) => void;
  reset: () => void;
  setWalletAddress: (address: string) => void;
  setWalletPublicKey: (publicKey: string) => void;
  setWalletAnsName: (ansName: string | undefined) => void;
  setWalletNetwork: (network: string) => void;
  setWalletChainId: (chainId: number) => void;
  setWalletUrl: (url: string) => void;
  setIsAutoConnectEnabled: (isAutoConnectEnabled: boolean) => void;
}

export const walletAdaptorStore = create<WalletAdaptorState>((set) => ({
  wallet: undefined,
  installed_wallets: [],
  address: undefined,
  publicKey: undefined,
  ansName: undefined,
  network: undefined,
  chainId: undefined,
  url: undefined,
  isAutoConnectEnabled: true,
  setWallet: (wallet: Wallet | undefined) => {
    if (wallet == undefined) {
      set((state) => ({
        ...state,
        wallet: undefined,
        address: undefined,
        publicKey: undefined,
        ansName: undefined,
        network: undefined,
        chainId: undefined,
        url: undefined,
      }));
    } else {
      set((state) => ({
        ...state,
        wallet,
      }));
    }
  },
  setInstalledWallets: (installed_wallets: readonly Wallet[]) => {
    set((state) => ({
      ...state,
      installed_wallets,
    }));
  },
  setWalletAddress: (address: string) => {
    set((state) => ({
      ...state,
      address,
    }));
  },
  setWalletPublicKey: (publicKey: string) => {
    set((state) => ({
      ...state,
      publicKey,
    }));
  },
  setWalletAnsName: (ansName: string | undefined) => {
    set((state) => ({
      ...state,
      ansName,
    }));
  },
  setWalletNetwork: (network: string) => {
    set((state) => ({
      ...state,
      network,
    }));
  },
  setWalletChainId: (chainId: number) => {
    set((state) => ({
      ...state,
      chainId,
    }));
  },
  setWalletUrl: (url: string) => {
    set((state) => ({
      ...state,
      url,
    }));
  },
  setIsAutoConnectEnabled: (isAutoConnectEnabled: boolean) => {
    set((state) => ({
      ...state,
      isAutoConnectEnabled,
    }));
  },
  reset: () =>
    set({
      wallet: undefined,
      address: undefined,
      publicKey: undefined,
      ansName: undefined,
      network: undefined,
      chainId: undefined,
      url: undefined,
      isAutoConnectEnabled: true,
    }),
}));

export const getWalletAdaptorStore = () => walletAdaptorStore.getState();
export const setWalletAdaptorStore = walletAdaptorStore.setState;
export const subscribeWalletAdaptorStore = walletAdaptorStore.subscribe;
export const getInitialWalletAdaptorStore = () => ({
  wallet: undefined,
  installed_wallets: [],
  address: undefined,
  publicKey: undefined,
  ansName: undefined,
  network: undefined,
  chainId: undefined,
  url: undefined,
  isAutoConnectEnabled: true,
});

import { Wallet } from '@aptos-labs/wallet-standard';

const { aptosWallets, on } = getAptosWallets();

setWalletAdaptorStore((state) => ({
  ...state,
  installed_wallets: aptosWallets,
}));

on("register", (wallet: Wallet) => {
  setWalletAdaptorStore((state) => ({
    ...state,
    installed_wallets: [...state.installed_wallets, wallet],
  }));
});


export async function disconnectWallet(): Promise<void> {
  const wallet = getWalletAdaptorStore().wallet;
  if (!wallet) throw new Error('No wallet connected');
  await (wallet.features as AptosDisconnectFeature)[AptosDisconnectNamespace].disconnect();
  setWalletAdaptorStore((state) => ({ ...state, wallet: undefined, address: undefined, publicKey: undefined }));
}

export async function connectWallet(walletName: string): Promise<void> {

  let wallet = getWalletAdaptorStore().installed_wallets.find(wallet => wallet.name.toLowerCase() === walletName.toLowerCase());
  if (wallet) {
    let  r  =  await (wallet.features as AptosConnectFeature)[AptosConnectNamespace].connect();
    if ( r.status == "Approved") {
      setWalletAdaptorStore((state) => ({
        ...state,
        wallet,
        address: r.args.address.toString(),
        publicKey: r.args.publicKey.toString(),
      }));
    } else {
      throw new Error('Wallet connection failed');
    }
  } else {
    throw new Error(`Wallet ${walletName} not found`);
  }
}

export async function getWalletAccount(): Promise<string | undefined> {
  if (!getWalletAdaptorStore().wallet) return undefined;
  try {
    const a = getWalletAdaptorStore().wallet?.accounts;
    return a && a[0] ? a[0].address ?? undefined : undefined;
  } catch {
    return undefined;
  }
}

export async function isWalletConnected(): Promise<boolean> {
  const wallet = getWalletAdaptorStore().wallet;
  if (!wallet) return false;
  try {
    // Some wallets may have an isConnected method, otherwise check accounts
    if (typeof (wallet as any).isConnected === 'function') {
      return await (wallet as any).isConnected();
    }
    return !!(wallet.accounts && wallet.accounts.length > 0);
  } catch {
    return false;
  }
}

export async function signAndSubmitEntry(fullFunction: `${string}::${string}::${string}`, args: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes> , typeArgs: string[] = []): Promise<string> {
  console.log('Signing and submitting entry:', { fullFunction, args, typeArgs });
  const tx = await (getWalletAdaptorStore().wallet?.features as AptosSignAndSubmitTransactionFeature)[AptosSignAndSubmitTransactionNamespace].signAndSubmitTransaction({
    payload: {
      typeArguments: typeArgs,
      function: fullFunction,
      functionArguments: args as any[]
    }
  });
  if( tx.status == "Approved" ){
    return tx.args['hash'] as string;
  }else if( tx.status == "Rejected" ){
    throw new Error('用户拒绝了交易');
  }else {
    throw new Error('交易失败');
  }
}


