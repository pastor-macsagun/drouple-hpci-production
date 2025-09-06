/**
 * Advanced caching strategies optimized for mobile PWA performance
 */

interface CacheConfig {
  maxAge: number; // milliseconds
  maxSize: number; // number of entries
  compression?: boolean;
  encryption?: boolean;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  hits: number;
  lastAccess: number;
  size: number;
}

class MobileCacheManager {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private storageKey = 'drouple-mobile-cache';

  constructor(config: CacheConfig) {
    this.config = config;
    this.loadFromStorage();
    
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 5 * 60 * 1000); // Every 5 minutes
  }

  async set<T>(key: string, data: T, customMaxAge?: number): Promise<void> {
    const now = Date.now();
    const size = this.estimateSize(data);
    
    // Compress if enabled and data is large
    let processedData = data;
    if (this.config.compression && size > 1024) {
      processedData = await this.compress(data);
    }
    
    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: now,
      hits: 0,
      lastAccess: now,
      size,
    };

    this.cache.set(key, entry);
    
    // Enforce size limits
    if (this.cache.size > this.config.maxSize) {
      this.evictLRU();
    }
    
    this.persistToStorage();
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Check if expired
    if (age > this.config.maxAge) {
      this.cache.delete(key);
      this.persistToStorage();
      return null;
    }
    
    // Update access statistics
    entry.hits++;
    entry.lastAccess = now;
    
    // Decompress if needed
    let data = entry.data;
    if (this.isCompressed(data)) {
      data = await this.decompress(data);
    }
    
    return data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const age = Date.now() - entry.timestamp;
    return age <= this.config.maxAge;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.persistToStorage();
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.persistToStorage();
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalDataSize: totalSize,
      averageHits: totalHits / Math.max(entries.length, 1),
      oldestEntry: Math.min(...entries.map(e => e.timestamp)),
      hitRate: this.calculateHitRate(),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.config.maxAge) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      this.persistToStorage();
    }
  }

  private evictLRU(): void {
    // Find least recently used entry
    let lruKey = '';
    let oldestAccess = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  private estimateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1024; // Default size estimate
    }
  }

  private async compress<T>(data: T): Promise<any> {
    if (!('CompressionStream' in window)) {
      return { _compressed: false, data };
    }
    
    try {
      const json = JSON.stringify(data);
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new TextEncoder().encode(json));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      
      chunks.forEach(chunk => {
        compressed.set(chunk, offset);
        offset += chunk.length;
      });
      
      return {
        _compressed: true,
        data: Array.from(compressed),
      };
    } catch {
      return { _compressed: false, data };
    }
  }

  private async decompress(compressedData: any): Promise<any> {
    if (!compressedData._compressed) {
      return compressedData.data;
    }
    
    if (!('DecompressionStream' in window)) {
      return compressedData.data;
    }
    
    try {
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();
      
      writer.write(new Uint8Array(compressedData.data));
      writer.close();
      
      const chunks: Uint8Array[] = [];
      let done = false;
      
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }
      
      const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      
      chunks.forEach(chunk => {
        decompressed.set(chunk, offset);
        offset += chunk.length;
      });
      
      const json = new TextDecoder().decode(decompressed);
      return JSON.parse(json);
    } catch {
      return compressedData.data;
    }
  }

  private isCompressed(data: any): boolean {
    return data && typeof data === 'object' && '_compressed' in data;
  }

  private calculateHitRate(): number {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, entry) => sum + Math.max(entry.hits, 1), 0);
    const hitCount = entries.reduce((sum, entry) => sum + entry.hits, 0);
    
    return totalAccess > 0 ? hitCount / totalAccess : 0;
  }

  private persistToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const serialized = JSON.stringify({
        entries: Array.from(this.cache.entries()),
        timestamp: Date.now(),
      });
      
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.warn('Failed to persist cache to storage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;
      
      const parsed = JSON.parse(stored);
      const now = Date.now();
      
      // Only restore if stored within the last hour
      if (now - parsed.timestamp > 60 * 60 * 1000) {
        localStorage.removeItem(this.storageKey);
        return;
      }
      
      parsed.entries.forEach(([key, entry]: [string, CacheEntry]) => {
        // Only restore non-expired entries
        if (now - entry.timestamp <= this.config.maxAge) {
          this.cache.set(key, entry);
        }
      });
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      localStorage.removeItem(this.storageKey);
    }
  }
}

// Cache instances for different data types
export const quickCache = new MobileCacheManager({
  maxAge: 5 * 60 * 1000, // 5 minutes
  maxSize: 50,
  compression: false,
});

export const dataCache = new MobileCacheManager({
  maxAge: 30 * 60 * 1000, // 30 minutes
  maxSize: 100,
  compression: true,
});

export const imageCache = new MobileCacheManager({
  maxAge: 60 * 60 * 1000, // 1 hour
  maxSize: 200,
  compression: false,
});

// Utility functions for mobile-specific caching patterns
export async function cacheWithFallback<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    cache?: typeof quickCache;
    maxAge?: number;
    fallbackData?: T;
  } = {}
): Promise<T> {
  const cache = options.cache || dataCache;
  
  // Try cache first
  const cached = await cache.get<T>(key);
  if (cached) return cached;
  
  try {
    // Fetch fresh data
    const data = await fetchFn();
    await cache.set(key, data, options.maxAge);
    return data;
  } catch (error) {
    // Return fallback if available
    if (options.fallbackData) {
      return options.fallbackData;
    }
    throw error;
  }
}

export async function prefetchData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  cache: MobileCacheManager = dataCache
): Promise<void> {
  // Only prefetch if not already cached
  if (cache.has(key)) return;
  
  try {
    const data = await fetchFn();
    await cache.set(key, data);
  } catch (error) {
    // Ignore prefetch errors
    console.debug('Prefetch failed for', key, error);
  }
}

// Smart caching based on user patterns
export class SmartMobileCache {
  private userPatterns = new Map<string, number>();
  private lastVisit = new Map<string, number>();

  recordVisit(route: string): void {
    const now = Date.now();
    this.userPatterns.set(route, (this.userPatterns.get(route) || 0) + 1);
    this.lastVisit.set(route, now);
  }

  getPredictiveRoutes(limit: number = 3): string[] {
    // Get most frequently visited routes
    return Array.from(this.userPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([route]) => route);
  }

  shouldPrefetch(route: string): boolean {
    const visits = this.userPatterns.get(route) || 0;
    const lastVisit = this.lastVisit.get(route) || 0;
    const timeSinceVisit = Date.now() - lastVisit;
    
    // Prefetch if visited frequently and recently
    return visits > 2 && timeSinceVisit < 24 * 60 * 60 * 1000; // 24 hours
  }
}

export const smartCache = new SmartMobileCache();