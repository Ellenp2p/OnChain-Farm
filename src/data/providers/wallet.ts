// 轻量 Aptos 钱包适配器（Petra/Fewcha 等）
import { EntryFunctionArgumentTypes, SimpleEntryFunctionArgumentTypes } from '@aptos-labs/ts-sdk';
import { walletAdapter} from '@wgb5445/aptos-wallet-connect-kit';
import { ScriptFunctionArgumentTypes } from 'node_modules/@aptos-labs/ts-sdk/dist/common';

export type EntryFunctionData = {
  function: string;
  typeArguments?: string[];
  functionArguments?: unknown[];
};

declare global {
  interface Window {
    aptos?: {
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      account: () => Promise<{ address: string } | null>;
      // 兼容老/新两种签名形态，这里用 any 以适配钱包差异
      signAndSubmitTransaction: (tx: any) => Promise<{ hash: string }>;
    };
  }
}

export async function disconnectWallet(): Promise<void> {
  await walletAdapter.disconnect();
}

export async function getWalletAccount(): Promise<string | null> {
  if (!walletAdapter) return null;
  try {
    const a = await walletAdapter.getAccount();
    return a ?? null;
  } catch {
    return null;
  }
}

export async function isWalletConnected(): Promise<boolean> {
  if (!window.aptos) return false;
  try { return await window.aptos.isConnected(); } catch { return false; }
}

export async function signAndSubmitEntry(fullFunction: `${string}::${string}::${string}`, args: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes> | ScriptFunctionArgumentTypes[], typeArgs: string[] = []): Promise<string | undefined> {
  console.log('Signing and submitting entry:', { fullFunction, args, typeArgs });
  const tx = await walletAdapter.signAndSubmitTransaction({
    payload: {
      typeArguments: typeArgs,
      function: fullFunction,
      functionArguments: args as any[]
    }
  });
  if( tx.status == "Approved" ){
    // 处理成功情况
    return tx.args['hash'] as string;
  }else if( tx.status == "Rejected" ){
    throw new Error('用户拒绝了交易');
  }
  // 如果 tx.status 不是 "Approved" 或 "Rejected"，返回 undefined
  return undefined;
}


