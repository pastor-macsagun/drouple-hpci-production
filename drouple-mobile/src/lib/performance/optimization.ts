/**
 * Performance Optimization Utilities
 * Memory management, caching, and performance monitoring tools
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Memory-safe image cache with LRU eviction
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private maxAge: number; // milliseconds

  constructor(maxSize: number = 50, maxAge: number = 5 * 60 * 1000) {
    // 5 minutes default
    this.maxSize = maxSize;
    this.maxAge = maxAge;

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key: string, value: T): void {
    const now = Date.now();

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data: value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    const now = Date.now();

    // Check if entry is expired
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private evictOldest(): void {
    if (this.cache.size === 0) return;

    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length
          : 0,
      averageAge:
        entries.length > 0
          ? entries.reduce((sum, e) => sum + (now - e.timestamp), 0) /
            entries.length
          : 0,
      oldestEntry:
        entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0,
    };
  }
}

// Global caches for different data types
export const imageLRUCache = new LRUCache<string>(50, 10 * 60 * 1000); // 10 minutes for images
export const dataLRUCache = new LRUCache<any>(100, 5 * 60 * 1000); // 5 minutes for data
export const apiLRUCache = new LRUCache<any>(200, 2 * 60 * 1000); // 2 minutes for API responses

/**
 * Persistent storage with compression for large data
 */
export class OptimizedStorage {
  private static instance: OptimizedStorage;
  private cache: LRUCache<any>;

  private constructor() {
    this.cache = new LRUCache<any>(50, 30 * 60 * 1000); // 30 minutes
  }

  static getInstance(): OptimizedStorage {
    if (!OptimizedStorage.instance) {
      OptimizedStorage.instance = new OptimizedStorage();
    }
    return OptimizedStorage.instance;
  }

  async setItem(key: string, value: any, cacheOnly = false): Promise<void> {
    // Store in memory cache
    this.cache.set(key, value);

    // Optionally persist to AsyncStorage
    if (!cacheOnly) {
      try {
        const serialized = JSON.stringify(value);
        await AsyncStorage.setItem(key, serialized);
      } catch (error) {
        console.warn('Failed to persist data to AsyncStorage:', error);
      }
    }
  }

  async getItem(key: string): Promise<any | null> {
    // Try cache first
    const cached = this.cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fall back to AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Store in cache for next time
        this.cache.set(key, parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to retrieve data from AsyncStorage:', error);
    }

    return null;
  }

  async removeItem(key: string): Promise<void> {
    this.cache.delete(key);

    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove data from AsyncStorage:', error);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();

    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.warn('Failed to clear AsyncStorage:', error);
    }
  }

  getCacheStats() {
    return this.cache.getStats();
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();
  private static metrics: Map<string, number[]> = new Map();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  static endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer "${label}" was not started`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);

    // Store metric
    const metrics = this.metrics.get(label) || [];
    metrics.push(duration);

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    this.metrics.set(label, metrics);

    return duration;
  }

  static getMetrics(
    label: string
  ): { avg: number; min: number; max: number; count: number } | null {
    const metrics = this.metrics.get(label);
    if (!metrics || metrics.length === 0) return null;

    const avg = metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
    const min = Math.min(...metrics);
    const max = Math.max(...metrics);

    return { avg, min, max, count: metrics.length };
  }

  static getAllMetrics(): Record<
    string,
    { avg: number; min: number; max: number; count: number }
  > {
    const result: Record<string, any> = {};

    for (const [label] of this.metrics) {
      const metrics = this.getMetrics(label);
      if (metrics) {
        result[label] = metrics;
      }
    }

    return result;
  }

  static clearMetrics(): void {
    this.timers.clear();
    this.metrics.clear();
  }
}

/**
 * React hooks for performance optimization
 */

// Debounced value hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled callback hook
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const throttledCallback = useRef<T>();
  const lastExecuted = useRef<number>(0);

  throttledCallback.current = useMemo(() => {
    const throttled = (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastExecuted.current >= delay) {
        callback(...args);
        lastExecuted.current = now;
      }
    };

    return throttled as T;
  }, [callback, delay]);

  return throttledCallback.current!;
};

// Memoized async operation hook
export const useAsyncMemo = <T>(
  factory: () => Promise<T>,
  deps: React.DependencyList,
  initialValue: T
): { value: T; loading: boolean; error: Error | null } => {
  const [state, setState] = React.useState<{
    value: T;
    loading: boolean;
    error: Error | null;
  }>({
    value: initialValue,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    factory()
      .then(value => {
        if (!cancelled) {
          setState({ value, loading: false, error: null });
        }
      })
      .catch(error => {
        if (!cancelled) {
          setState(prev => ({ ...prev, loading: false, error }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
};

// Optimized FlatList data hook
export const useOptimizedFlatListData = <T>(
  data: T[],
  keyExtractor: (item: T) => string,
  windowSize: number = 20
) => {
  const [visibleRange, setVisibleRange] = React.useState({
    start: 0,
    end: windowSize,
  });

  const visibleData = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end);
  }, [data, visibleRange.start, visibleRange.end]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const firstIndex = viewableItems[0].index || 0;
        const lastIndex = viewableItems[viewableItems.length - 1].index || 0;

        const bufferSize = Math.floor(windowSize / 4);
        const newStart = Math.max(0, firstIndex - bufferSize);
        const newEnd = Math.min(data.length, lastIndex + bufferSize);

        setVisibleRange({ start: newStart, end: newEnd });
      }
    },
    [data.length, windowSize]
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      waitForInteraction: true,
    }),
    []
  );

  return {
    visibleData,
    onViewableItemsChanged,
    viewabilityConfig,
    totalCount: data.length,
  };
};

/**
 * Bundle analyzer utilities
 */
export const getBundleStats = () => {
  if (__DEV__) {
    console.log(
      'Performance Monitor Stats:',
      PerformanceMonitor.getAllMetrics()
    );
    console.log('Image Cache Stats:', imageLRUCache.getStats());
    console.log('Data Cache Stats:', dataLRUCache.getStats());
    console.log('API Cache Stats:', apiLRUCache.getStats());
    console.log(
      'Storage Cache Stats:',
      OptimizedStorage.getInstance().getCacheStats()
    );
  }
};

// Memory usage monitoring (approximate)
export const getMemoryUsage = () => {
  if (__DEV__) {
    const cacheStats = {
      imageCache: imageLRUCache.size(),
      dataCache: dataLRUCache.size(),
      apiCache: apiLRUCache.size(),
      totalCachedItems:
        imageLRUCache.size() + dataLRUCache.size() + apiLRUCache.size(),
    };

    console.log('Memory Usage Estimate:', cacheStats);
    return cacheStats;
  }

  return null;
};

export default {
  LRUCache,
  OptimizedStorage,
  PerformanceMonitor,
  imageLRUCache,
  dataLRUCache,
  apiLRUCache,
  useDebounce,
  useThrottle,
  useAsyncMemo,
  useOptimizedFlatListData,
  getBundleStats,
  getMemoryUsage,
};
