// Lightweight generic in-memory cache with TTL and async get-or-set helper
export type CacheEntry<T> = { value: T; ts: number };

const store = new Map<string, CacheEntry<any>>();

export function cacheSet<T>(key: string, value: T) {
  store.set(key, { value, ts: Date.now() });
}

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key) as CacheEntry<T> | undefined;
  return e ? e.value : undefined;
}

export function cacheGetEntry<T>(key: string): CacheEntry<T> | undefined {
  return store.get(key) as CacheEntry<T> | undefined;
}

export function cacheDel(key: string) {
  store.delete(key);
}

export function cacheClear() {
  store.clear();
}

export async function cacheGetOrSetAsync<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>
): Promise<T> {
  const e = cacheGetEntry<T>(key);
  if (e && Date.now() - e.ts < ttlMs) return e.value;
  const v = await loader();
  cacheSet(key, v);
  return v;
}

export function cacheSetWithTs<T>(key: string, value: T, ts: number) {
  store.set(key, { value, ts });
}
