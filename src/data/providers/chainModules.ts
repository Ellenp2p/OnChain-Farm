import type { FieldProvider } from '@/data/modules/field';
import type { MarketProvider } from '@/data/modules/market';
import type { FriendsProvider } from '@/data/modules/friends';
import { getChainConfig } from '@/data/providers/chainConfig';
import type { PlotTile, GameStateSnapshot } from '@/domain/types';
import { cacheGetOrSetAsync, cacheSet, cacheDel, cacheGetEntry, cacheSetWithTs } from '@/data/providers/simpleCache';
import { signAndSubmitEntry } from '@/data/providers/wallet';
import { viewGetMyFarm } from '@/data/providers/aptosView';
import { AccountAddress, Bool, Deserializer, MoveOption, MoveVector, Serializable, Serializer, TransactionArgument, U64, U8 } from '@aptos-labs/ts-sdk';
import { Buffer } from 'buffer';

function encodeCropTypeIdBytesHex(cropTypeId: string): string {
  // ABI: vector<u8>，这里使用 UTF-8 编码并返回 0x 前缀十六进制
  const bytes = new TextEncoder().encode(cropTypeId);
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `0x${hex}`;
}

// Use shared simpleCache utilities for caching across modules


function parsePlotId(plotId: string): { x: number; y: number } {
  // 约定前端 plotId 为 `${row}-${col}`，ABI 需要 (x, y)
  const [xs, ys] = plotId.split('-');
  const x = Number(xs);
  const y = Number(ys);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error(`非法地块编号: ${plotId}`);
  return { x, y };
}

async function submitEntry(functionName: string, args: unknown[]): Promise<string | null> {
  const cfg = getChainConfig();
  const fullFn = `${cfg.packageAddress}::${cfg.moduleName}::${functionName}`;
  try {
    const hash = await signAndSubmitEntry(fullFn, args, []);
    return hash ?? null;
  } catch (e) {
    console.warn('[chain] 提交失败，将不阻断前端状态。原因: ', e);
    return null;
  }
}

/*
    struct PlotTile has store, drop {
        id: u64,
        crop: option::Option<CropInstance>,
    }

    struct CropInstance has store, drop {
      // 作物类型ID
      crop_type_id: vector<u8>,
      // 播种时间
      planted_at_sec: u64,
      // 是否浇水
      watered: bool,
    }

*/ 

export class CropInstanceClass extends Serializable implements TransactionArgument {
  crop_type_id: U8[];
  planted_at_sec: bigint;
  watered: boolean;


  constructor(c: U8[], p: bigint, w: boolean){
    super();
    this.crop_type_id = c;
    this.planted_at_sec = p;
    this.watered = w;
  }


  static deserialize(deserializer: Deserializer): CropInstanceClass {
    return new CropInstanceClass(
      deserializer.deserializeVector(U8),
      deserializer.deserializeU64(),
      deserializer.deserializeBool()
    )
  }

  serialize(serializer: Serializer): void {
    serializer.serializeVector(this.crop_type_id);
    serializer.serializeU64(this.planted_at_sec);
    serializer.serializeBool(this.watered);
  }



  serializeForEntryFunction(serializer: Serializer){

  }

  serializeForScriptFunction(serializer: Serializer){

  }
}

export class PlotTileClass extends Serializable implements TransactionArgument{

  id: bigint;
  crop?: CropInstanceClass;

  constructor(id: bigint, crop?: CropInstanceClass){
    super();
    this.id = id;
    this.crop = crop
  }

  static deserialize(deserializer: Deserializer): PlotTileClass {
    return new PlotTileClass(
      deserializer.deserializeU64(),
      deserializer.deserializeOption(CropInstanceClass)
    )
  }

  serialize(serializer: Serializer): void {
     serializer.serializeU64(this.id);
     serializer.serializeOption(this.crop);
  }


  serializeForEntryFunction(serializer: Serializer){

  }

  serializeForScriptFunction(serializer: Serializer){

  }

  
} 

export const chainFieldProvider: FieldProvider = {
  async loadField() {
  // Simple in-memory cache to avoid repeated on-chain view calls while UI re-renders.
  // Only re-fetch from chain if the last cached value is older than 2s
  const FIELD_TTL_MS = 2000; // 2s
  const entry = cacheGetEntry<PlotTile[][]>('field:plots');
  if (entry && Date.now() - entry.ts < FIELD_TTL_MS) return { plots: entry.value };
    // 调用 view 读取用户农场。当前合约返回 string 序列化，这里仅返回空网格，
    // 若后续返回结构化数据，可在此解析为 PlotTile[][]。
    let plots: PlotTile[][] = [];
    try {
      const result = await viewGetMyFarm();
      let needInit = false;
      
      if (Array.isArray(result)) {
        if (result.length === 0 || (result.length == 1 && result[0] == "0x")) {
          needInit = true;
        } else {
          const inner = (result as string[])[0];
          let des = new Deserializer(Buffer.from(inner.replace("0x",""), 'hex'));
          let gold = des.deserializeU64();
          cacheSet('field:gold', gold);
          let len = des.deserializeUleb128AsU32();
          let vec = [];
          for ( let i = 0 ; i < len ; i ++ ){
              vec.push(
                des.deserializeVector(PlotTileClass)
              )
          }

          vec.forEach((v: PlotTileClass[]) => {
            plots.push(
              v.map((p) => {
                return {
                  id: p.id.toString(),
                  crop: p.crop
                    ? {
                        cropTypeId: Buffer.from(p.crop.crop_type_id).toString(),
                        plantedAt: p.crop.planted_at_sec,
                        watered: p.crop.watered,
                      }
                    : undefined,
                };
              }
            ));
          })

          let inv_len = des.deserializeUleb128AsU32()

          

          if (Array.isArray(inner) && inner.length === 0) needInit = true;
        }
      }
      if (needInit) {
        const { useUiStore } = await import('@/stores/uiStore');
        useUiStore.getState().openInitPrompt();
      } else {
        console.log('farm', result);
      }
    } catch (e) {
      // view 失败（可能未初始化或未连接钱包），若已连接钱包则提示初始化
      try {
        const { useUiStore } = await import('@/stores/uiStore');
        const ui = useUiStore.getState();
        if (ui.walletConnected) ui.openInitPrompt();
      } catch {}
      console.warn('[chain] view 调用失败: ', e);
    }
  // update cache
  cacheSet('field:plots', plots);
  return { plots };
  },
  async plant(plotId, cropTypeId) {
    const { x, y } = parsePlotId(plotId);
    const cropBytes = encodeCropTypeIdBytesHex(cropTypeId);
    await submitEntry('plant', [x, y, cropBytes]);
    const newPlot = { id: plotId, crop: { cropTypeId, plantedAt: BigInt(Date.now()), watered: false } } as PlotTile;
    // update cache if present
    const f = cacheGetEntry<PlotTile[][]>('field:plots');
    if (f && Array.isArray(f.value)) {
      for (let r = 0; r < f.value.length; r++) {
        for (let c = 0; c < f.value[r].length; c++) {
          if (f.value[r][c].id === newPlot.id) {
            f.value[r][c] = newPlot;
            cacheSetWithTs('field:plots', f.value, Date.now());
            break;
          }
        }
      }
    }
    return { plot: newPlot };
  },
  async water(plotId) {
    const { x, y } = parsePlotId(plotId);
    await submitEntry('water', [x, y]);
    const newPlot = { id: plotId, crop: { cropTypeId: '', plantedAt: BigInt(Date.now()), watered: true } } as PlotTile;
    const f2 = cacheGetEntry<PlotTile[][]>('field:plots');
    if (f2 && Array.isArray(f2.value)) {
      for (let r = 0; r < f2.value.length; r++) {
        for (let c = 0; c < f2.value[r].length; c++) {
          if (f2.value[r][c].id === newPlot.id) {
            f2.value[r][c] = newPlot;
            cacheSetWithTs('field:plots', f2.value, Date.now());
            break;
          }
        }
      }
    }
    return { plot: newPlot };
  },
  async harvest(plotId) {
    const { x, y } = parsePlotId(plotId);
    await submitEntry('harvest', [x, y]);
    // 修复类型：crop 应为 undefined 而不是 null
    // remove from cache if we have it
    const f3 = cacheGetEntry<PlotTile[][]>('field:plots');
    if (f3 && Array.isArray(f3.value)) {
      for (let r = 0; r < f3.value.length; r++) {
        for (let c = 0; c < f3.value[r].length; c++) {
          if (f3.value[r][c].id === plotId) {
            f3.value[r][c].crop = undefined;
            cacheSetWithTs('field:plots', f3.value, Date.now());
            break;
          }
        }
      }
    }
    return { plot: { id: plotId, crop: undefined } };
  }
};

export const chainMarketProvider: MarketProvider = {
  async buySeed(cropTypeId, qty) {
    const cropBytes = encodeCropTypeIdBytesHex(cropTypeId);
    await submitEntry('buy_seed', [cropBytes, qty]);
    return { goldDelta: 0 };
  },
  async sellProduce(cropTypeId, qty) {
    const cropBytes = encodeCropTypeIdBytesHex(cropTypeId);
    await submitEntry('sell_produce', [cropBytes, qty]);
    return { goldDelta: 0 };
  }
};

export const chainFriendsProvider: FriendsProvider = {
  async listFriends() {
    // 预留：后续根据社交/好友模块 ABI 实现
    return [];
  },
  async loadFriendState(friendId) {
  const FRIEND_TTL_MS = 10_000; // cache friend state for 10s
  const e = cacheGetEntry<GameStateSnapshot>(`friend:${friendId}`);
  if (e && Date.now() - e.ts < FRIEND_TTL_MS) return e.value;
  // TODO: implement actual chain view fetch for friend state; return empty for now
  const state = { gold: 0, plots: [] as PlotTile[][], inventory: [] };
  cacheSetWithTs(`friend:${friendId}`, state, Date.now());
  return state;
  },
  async steal(friendId, plotId) {
    // 预留：若后续 ABI 暴露 steal(thief, friend, plot) 则在此对接
    void friendId; void plotId;
  // Invalidate friend cache on steal attempts so subsequent loads refetch from chain
  cacheDel(`friend:${friendId}`);
  return { cropTypeId: '', qty: 0 };
  }
};


