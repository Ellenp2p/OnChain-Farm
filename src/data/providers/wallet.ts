// 轻量 Aptos 钱包适配器（Petra/Fewcha 等）

export type EntryFunctionData = {
  function: string;
  typeArguments?: string[];
  functionArguments?: unknown[];
};

declare global {
  interface Window {
    aptos?: {
      connect: () => Promise<{ address: string } | undefined>;
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      account: () => Promise<{ address: string } | null>;
      // 兼容老/新两种签名形态，这里用 any 以适配钱包差异
      signAndSubmitTransaction: (tx: any) => Promise<{ hash: string }>;
    };
  }
}

export async function ensureWallet(): Promise<void> {
  if (!window.aptos) throw new Error('未检测到 Aptos 钱包（例如 Petra）。请先安装钱包扩展。');
}

export async function connectWallet(): Promise<string> {
  await ensureWallet();
  const res = await window.aptos!.connect();
  if (!res?.address) throw new Error('钱包连接失败');
  return res.address;
}

export async function disconnectWallet(): Promise<void> {
  if (!window.aptos) return;
  await window.aptos.disconnect();
}

export async function getWalletAccount(): Promise<string | null> {
  if (!window.aptos) return null;
  try {
    const a = await window.aptos.account();
    return a?.address ?? null;
  } catch {
    return null;
  }
}

export async function isWalletConnected(): Promise<boolean> {
  if (!window.aptos) return false;
  try { return await window.aptos.isConnected(); } catch { return false; }
}

export async function signAndSubmitEntry(fullFunction: string, args: unknown[], typeArgs: string[] = []): Promise<string> {
  await ensureWallet();
  // 采用与示例一致的负载结构（entry_function_payload）
  const payload = {
    type: 'entry_function_payload',
    function: fullFunction,
    type_arguments: typeArgs,
    arguments: args
  } as const;
  const tx = await window.aptos!.signAndSubmitTransaction(payload as any);
  return tx.hash;
}


