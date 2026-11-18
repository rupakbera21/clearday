import { BoundedLruCache } from "../cache";

describe("BoundedLruCache", () => {
  it("stores and retrieves cached items", () => {
    const cache = new BoundedLruCache<string>(5, 10000);
    cache.set("key1", "val1");
    const retrieved = cache.get("key1");

    expect(retrieved).not.toBeNull();
    expect(retrieved?.value).toBe("val1");
    expect(retrieved?.isStale).toBe(false);
  });

  it("evicts oldest items when exceeding max capacity (LRU)", () => {
    const cache = new BoundedLruCache<number>(2, 10000);
    cache.set("a", 1);
    cache.set("b", 2);
    // Access 'a' to make 'b' the oldest
    cache.get("a");
    // Insert 'c', should evict 'b'
    cache.set("c", 3);

    expect(cache.get("b")).toBeNull();
    expect(cache.get("a")?.value).toBe(1);
    expect(cache.get("c")?.value).toBe(3);
  });

  it("marks expired items as stale", async () => {
    const cache = new BoundedLruCache<string>(5, 10); // 10ms TTL
    cache.set("short", "lived");
    await new Promise((r) => setTimeout(r, 20));

    const item = cache.get("short");
    expect(item).not.toBeNull();
    expect(item?.isStale).toBe(true);
  });

  it("coalesces concurrent requests for identical key into a single fetch", async () => {
    const cache = new BoundedLruCache<string>(10, 10000);
    let fetchCount = 0;

    const slowFetcher = async () => {
      fetchCount++;
      await new Promise((r) => setTimeout(r, 50));
      return `result-${fetchCount}`;
    };

    // Fire 5 simultaneous calls
    const results = await Promise.all([
      cache.coalesce("shared-key", slowFetcher),
      cache.coalesce("shared-key", slowFetcher),
      cache.coalesce("shared-key", slowFetcher),
      cache.coalesce("shared-key", slowFetcher),
      cache.coalesce("shared-key", slowFetcher),
    ]);

    // Exactly 1 fetch executed!
    expect(fetchCount).toBe(1);
    expect(results.every((r) => r.value === "result-1")).toBe(true);
    expect(cache.inFlightCount()).toBe(0);
  });

  it("returns stale cache when upstream fetcher fails", async () => {
    const cache = new BoundedLruCache<string>(10, 10);
    cache.set("failover", "stale-data");
    await new Promise((r) => setTimeout(r, 15));

    const failingFetcher = async () => {
      throw new Error("Upstream server dead");
    };

    const res = await cache.coalesce("failover", failingFetcher);
    expect(res.isStale).toBe(true);
    expect(res.source).toBe("stale_cache");
    expect(res.value).toBe("stale-data");
  });
});
