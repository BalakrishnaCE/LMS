// Cache utility for search functionality
interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number; // Time to live in milliseconds
  }
  
  class SearchCache {
    private cache = new Map<string, CacheItem<any>>();
    private defaultTTL = 5 * 60 * 1000; // 5 minutes default
  
    set<T>(key: string, data: T, ttl?: number): void {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTTL
      };
      this.cache.set(key, item);
    }
  
    get<T>(key: string): T | null {
      const item = this.cache.get(key);
      if (!item) return null;
  
      const isExpired = Date.now() - item.timestamp > item.ttl;
      if (isExpired) {
        this.cache.delete(key);
        return null;
      }
  
      return item.data;
    }
  
    has(key: string): boolean {
      return this.get(key) !== null;
    }
  
    delete(key: string): boolean {
      return this.cache.delete(key);
    }
  
    clear(): void {
      this.cache.clear();
    }
  
    // Generate cache key for search queries
    generateKey(prefix: string, params: Record<string, any>): string {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}:${params[key]}`)
        .join('|');
      return `${prefix}:${sortedParams}`;
    }
  
    // Get cache statistics
    getStats() {
      const now = Date.now();
      let validEntries = 0;
      let expiredEntries = 0;
  
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          expiredEntries++;
        } else {
          validEntries++;
        }
      }
  
      return {
        total: this.cache.size,
        valid: validEntries,
        expired: expiredEntries
      };
    }
  }
  
  // Singleton instance
  export const searchCache = new SearchCache();
  
  // React hook for cached search
  import { useState, useCallback, useEffect } from 'react';
  
  export function useCachedSearch<T>(
    searchFunction: (params: any) => Promise<T>,
    params: any,
    cacheKey: string,
    ttl?: number
  ) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    const executeSearch = useCallback(async () => {
      setLoading(true);
      setError(null);
  
      try {
        // Check cache first
        const cachedData = searchCache.get<T>(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }
  
        // Execute search
        const result = await searchFunction(params);
        
        // Cache the result
        searchCache.set(cacheKey, result, ttl);
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    }, [searchFunction, params, cacheKey, ttl]);
  
    useEffect(() => {
      if (params) {
        executeSearch();
      }
    }, [executeSearch]);
  
    const refresh = useCallback(() => {
      searchCache.delete(cacheKey);
      executeSearch();
    }, [cacheKey, executeSearch]);
  
    return { data, loading, error, refresh };
  }
  
  // Utility for debounced search
  export function useDebouncedSearch<T>(
    searchFunction: (params: any) => Promise<T>,
    params: any,
    delay: number = 300
  ) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
  
    useEffect(() => {
      const timeoutId = setTimeout(async () => {
        if (!params) return;
  
        setLoading(true);
        setError(null);
  
        try {
          const result = await searchFunction(params);
          setData(result);
        } catch (err: any) {
          setError(err.message || 'Search failed');
        } finally {
          setLoading(false);
        }
      }, delay);
  
      return () => clearTimeout(timeoutId);
    }, [searchFunction, params, delay]);
  
    return { data, loading, error };
  }  