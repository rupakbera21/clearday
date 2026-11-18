/**
 * @file cache.ts
 * @description Bounded LRU cache with TTL, in-flight request coalescing, and stale fallback.
 * Addresses problem-statement: Efficiency, Failure ladder for data, rate limit conservation.
 */

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  expiresAt: number;
}

export class BoundedLruCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private inFlight = new Map<string, Promise<T>>();

  constructor(
    private maxCapacity = 100,
    private defaultTtlMs = 15 * 60 * 1000, // 15 minutes default
  ) {}

  /**
   * Generates a rounded grid cell cache key (2 decimals ~ 1km grid).
   */
  public static makeGridKey(prefix: string, lat: number, lon: number): string {
    const rLat = Math.round(lat * 100) / 100;
    const rLon = Math.round(lon * 100) / 100;
    return `${prefix}:${rLat}:${rLon}`;
  }

  /**
   * Retrieves fresh or stale cache entry.
   */
  public get(key: string): { value: T; isStale: boolean; ageMs: number } | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();
    const isStale = now > entry.expiresAt;
    const ageMs = now - entry.timestamp;

    // Refresh LRU order by re-inserting
    this.store.delete(key);
    this.store.set(key, entry);

    return { value: entry.value, isStale, ageMs };
  }

  /**
   * Sets an entry in the LRU cache, evicting the oldest item if over capacity.
   */
  public set(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const effectiveTtl = ttlMs ?? this.defaultTtlMs;

    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxCapacity) {
      // Evict oldest (first item in Map iterator)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }

    this.store.set(key, {
      value,
      timestamp: now,
      expiresAt: now + effectiveTtl,
    });
  }

  /**
   * Coalesces simultaneous identical in-flight promises to eliminate duplicate upstream calls.
   */
  public async coalesce(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<{ value: T; isStale: boolean; source: "fresh" | "coalesced" | "stale_cache" }> {
    const existing = this.get(key);
    if (existing && !existing.isStale) {
      return { value: existing.value, isStale: false, source: "fresh" };
    }

    // In-flight coalescing
    const activePromise = this.inFlight.get(key);
    if (activePromise) {
      const value = await activePromise;
      return { value, isStale: false, source: "coalesced" };
    }

    // Launch fetcher and store in-flight promise
    const promise = (async () => {
      try {
        const fresh = await fetcher();
        this.set(key, fresh, ttlMs);
        return fresh;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);

    try {
      const result = await promise;
      return { value: result, isStale: false, source: "fresh" };
    } catch (err) {
      // Failure ladder: if fetch fails, return stale cache if present!
      if (existing) {
        return { value: existing.value, isStale: true, source: "stale_cache" };
      }
      throw err;
    }
  }

  public size(): number {
    return this.store.size;
  }

  public inFlightCount(): number {
    return this.inFlight.size;
  }

  public clear(): void {
    this.store.clear();
    this.inFlight.clear();
  }
}
