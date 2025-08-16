import { getChainConfig } from '@/data/providers/chainConfig';
import { getWalletAccount } from '@/data/providers/wallet';

type ViewRequest = {
  function: string;
  type_arguments: string[];
  arguments: unknown[];
};

export function buildFullFunction(functionName: string): string {
  const { packageAddress, moduleName } = getChainConfig();
  return `${packageAddress}::${moduleName}::${functionName}`;
}

function getViewEndpoint(): string {
  const { rpcUrl } = getChainConfig();
  const base = (rpcUrl && rpcUrl.trim().length > 0) ? rpcUrl : 'https://fullnode.mainnet.aptoslabs.com';
  return `${base.replace(/\/$/, '')}/v1/view`;
}

export async function callView<T = unknown>(functionName: string, args: unknown[], typeArgs: string[] = []): Promise<T> {
  const { apiKey } = getChainConfig();
  const endpoint = getViewEndpoint();
  const body: ViewRequest = {
    function: buildFullFunction(functionName),
    type_arguments: typeArgs,
    arguments: args
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey && apiKey.length > 0) headers['X-API-KEY'] = apiKey;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`View 调用失败: ${res.status} ${res.statusText} ${text}`);
  }
  return (await res.json()) as T;
}

// 便捷方法：读取当前账号的农场快照（原样返回合约的 view 结果）
export async function viewGetMyFarm(ownerAddress?: string): Promise<unknown> {
  const owner = ownerAddress ?? (await getWalletAccount());
  if (!owner) throw new Error('未连接钱包：无法读取当前账号农场');
  return callView('get_my_farm', [owner], []);
}


