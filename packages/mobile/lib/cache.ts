/**
 * Lightweight in-memory cache for Supabase query results.
 *
 * Prevents redundant network requests when switching tabs —
 * data is served from cache if it's still fresh.
 *
 * Usage:
 *   const cached = queryCache.get<MyType>("resources:child:abc");
 *   if (cached) return cached;
 *   const fresh = await fetchFromSupabase();
 *   queryCache.set("resources:child:abc", fresh, 5 * 60 * 1000);
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class QueryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /** Get cached data if still fresh, or null if stale/missing. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /** Cache data with a TTL in milliseconds (default: 5 minutes). */
  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /** Invalidate a specific cache entry. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all entries matching a prefix (e.g., "resources:" clears all resource caches). */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Clear everything. Useful on sign-out. */
  clear(): void {
    this.store.clear();
  }
}

export const queryCache = new QueryCache();
