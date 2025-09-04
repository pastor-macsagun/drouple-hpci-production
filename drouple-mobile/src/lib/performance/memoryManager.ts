/**
 * Memory Management Service
 * Handles memory optimization, caching, and performance monitoring
 */

import { Alert, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MemoryConfig {
  maxCacheSize: number; // bytes
  maxImageCacheSize: number; // bytes
  gcInterval: number; // milliseconds
  lowMemoryThreshold: number; // percentage
  enableAutoCleanup: boolean;
}

export interface MemoryStats {
  totalMemory: number;
  usedMemory: number;
  availableMemory: number;
  cacheSize: number;
  imageCacheSize: number;
  usagePercentage: number;
}

export interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  size: number;
  lastAccessed: number;
  accessCount: number;
}

export class MemoryManager {
  private static instance: MemoryManager;
  private config: MemoryConfig;
  private cache: Map<string, CacheEntry>;
  private imageCache: Map<string, CacheEntry>;
  private gcTimer: NodeJS.Timeout | null = null;
  private appStateSubscription: any = null;

  private constructor() {
    this.config = {
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      maxImageCacheSize: 100 * 1024 * 1024, // 100MB
      gcInterval: 5 * 60 * 1000, // 5 minutes
      lowMemoryThreshold: 80, // 80%
      enableAutoCleanup: true,
    };

    this.cache = new Map();
    this.imageCache = new Map();

    this.initialize();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  /**
   * Initialize memory manager
   */
  private initialize(): void {
    // Start garbage collection timer
    this.startGarbageCollector();

    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );

    // Load persisted cache if available
    this.loadPersistedCache();
  }

  /**
   * Configure memory manager settings
   */
  configure(config: Partial<MemoryConfig>): void {
    this.config = { ...this.config, ...config };

    // Restart GC timer with new interval
    this.stopGarbageCollector();
    this.startGarbageCollector();
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const cacheSize = this.calculateCacheSize();
    const imageCacheSize = this.calculateImageCacheSize();

    // Note: React Native doesn't provide direct memory APIs
    // These would need to be implemented with native modules
    const totalMemory = 2 * 1024 * 1024 * 1024; // 2GB estimate
    const usedMemory = cacheSize + imageCacheSize;
    const availableMemory = totalMemory - usedMemory;
    const usagePercentage = (usedMemory / totalMemory) * 100;

    return {
      totalMemory,
      usedMemory,
      availableMemory,
      cacheSize,
      imageCacheSize,
      usagePercentage,
    };
  }

  /**
   * Store data in memory cache
   */
  cacheSet(key: string, data: any, ttl?: number): boolean {
    try {
      const size = this.estimateDataSize(data);
      const currentCacheSize = this.calculateCacheSize();

      // Check if adding this item would exceed cache limit
      if (currentCacheSize + size > this.config.maxCacheSize) {
        this.evictLeastRecentlyUsed(size);
      }

      const entry: CacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        size,
        lastAccessed: Date.now(),
        accessCount: 1,
      };

      this.cache.set(key, entry);
      return true;
    } catch (error) {
      console.error('Failed to cache data:', error);
      return false;
    }
  }

  /**
   * Retrieve data from memory cache
   */
  cacheGet(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Update access statistics
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    return entry.data;
  }

  /**
   * Remove data from memory cache
   */
  cacheDelete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached data
   */
  cacheClear(): void {
    this.cache.clear();
    this.imageCache.clear();
  }

  /**
   * Store image in image cache
   */
  cacheImage(url: string, imageData: string): boolean {
    try {
      const size = imageData.length;
      const currentImageCacheSize = this.calculateImageCacheSize();

      if (currentImageCacheSize + size > this.config.maxImageCacheSize) {
        this.evictLeastRecentlyUsedImages(size);
      }

      const entry: CacheEntry = {
        key: url,
        data: imageData,
        timestamp: Date.now(),
        size,
        lastAccessed: Date.now(),
        accessCount: 1,
      };

      this.imageCache.set(url, entry);
      return true;
    } catch (error) {
      console.error('Failed to cache image:', error);
      return false;
    }
  }

  /**
   * Retrieve image from cache
   */
  getCachedImage(url: string): string | null {
    const entry = this.imageCache.get(url);
    if (!entry) {
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.accessCount++;

    return entry.data;
  }

  /**
   * Perform garbage collection
   */
  performGarbageCollection(): void {
    console.log('Performing memory garbage collection...');

    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutes

    // Clean expired cache entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }

    // Clean expired image cache entries
    for (const [key, entry] of this.imageCache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.imageCache.delete(key);
      }
    }

    // Check memory usage and cleanup if needed
    const stats = this.getMemoryStats();
    if (stats.usagePercentage > this.config.lowMemoryThreshold) {
      this.handleLowMemory();
    }
  }

  /**
   * Handle low memory situation
   */
  private handleLowMemory(): void {
    console.warn('Low memory detected, performing aggressive cleanup...');

    // Remove least recently used items
    this.evictLeastRecentlyUsed(this.config.maxCacheSize * 0.3); // Free 30%
    this.evictLeastRecentlyUsedImages(this.config.maxImageCacheSize * 0.3);

    // Show user notification if critically low
    const stats = this.getMemoryStats();
    if (stats.usagePercentage > 90) {
      Alert.alert(
        'Low Memory',
        'The app is using a lot of memory. Some cached data will be cleared to improve performance.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background') {
      // App is going to background, persist cache
      this.persistCache();

      // Perform cleanup
      if (this.config.enableAutoCleanup) {
        this.performGarbageCollection();
      }
    } else if (nextAppState === 'active') {
      // App is becoming active, load persisted cache
      this.loadPersistedCache();
    }
  }

  /**
   * Persist important cache data
   */
  private async persistCache(): Promise<void> {
    try {
      const importantKeys = Array.from(this.cache.entries())
        .filter(([_, entry]) => entry.accessCount > 5) // Frequently accessed items
        .slice(0, 50) // Limit to 50 items
        .map(([key, entry]) => ({
          key,
          data: entry.data,
          timestamp: entry.timestamp,
        }));

      await AsyncStorage.setItem('memory_cache', JSON.stringify(importantKeys));
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  /**
   * Load persisted cache data
   */
  private async loadPersistedCache(): Promise<void> {
    try {
      const cachedData = await AsyncStorage.getItem('memory_cache');
      if (cachedData) {
        const items = JSON.parse(cachedData);
        items.forEach((item: any) => {
          this.cacheSet(item.key, item.data);
        });
      }
    } catch (error) {
      console.error('Failed to load persisted cache:', error);
    }
  }

  /**
   * Calculate total cache size
   */
  private calculateCacheSize(): number {
    return Array.from(this.cache.values()).reduce(
      (total, entry) => total + entry.size,
      0
    );
  }

  /**
   * Calculate total image cache size
   */
  private calculateImageCacheSize(): number {
    return Array.from(this.imageCache.values()).reduce(
      (total, entry) => total + entry.size,
      0
    );
  }

  /**
   * Evict least recently used items from cache
   */
  private evictLeastRecentlyUsed(targetBytes: number): void {
    const sortedEntries = Array.from(this.cache.entries()).sort(
      ([_a, a], [_b, b]) => a.lastAccessed - b.lastAccessed
    );

    let freedBytes = 0;
    for (const [key, entry] of sortedEntries) {
      this.cache.delete(key);
      freedBytes += entry.size;
      if (freedBytes >= targetBytes) {
        break;
      }
    }
  }

  /**
   * Evict least recently used images from cache
   */
  private evictLeastRecentlyUsedImages(targetBytes: number): void {
    const sortedEntries = Array.from(this.imageCache.entries()).sort(
      ([_a, a], [_b, b]) => a.lastAccessed - b.lastAccessed
    );

    let freedBytes = 0;
    for (const [key, entry] of sortedEntries) {
      this.imageCache.delete(key);
      freedBytes += entry.size;
      if (freedBytes >= targetBytes) {
        break;
      }
    }
  }

  /**
   * Estimate data size in bytes
   */
  private estimateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1024; // Default 1KB if can't estimate
    }
  }

  /**
   * Start garbage collection timer
   */
  private startGarbageCollector(): void {
    if (this.config.enableAutoCleanup) {
      this.gcTimer = setInterval(() => {
        this.performGarbageCollection();
      }, this.config.gcInterval);
    }
  }

  /**
   * Stop garbage collection timer
   */
  private stopGarbageCollector(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }

  /**
   * Cleanup and destroy memory manager
   */
  destroy(): void {
    this.stopGarbageCollector();

    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.cacheClear();
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();
