// Enhanced Performance Services
export {
  memoryManager,
  type MemoryConfig,
  type MemoryStats,
} from './memoryManager';
export {
  imageOptimizer,
  type ImageOptimizationConfig,
  type OptimizedImageProps,
} from './imageOptimizer';

// Legacy Performance Services (if still needed)
export { PerformanceMonitor } from './performanceMonitor';
export { ImageOptimizer } from './imageOptimizer';
export { CacheManager } from './cacheManager';
export { MemoryManager } from './memoryManager';
export type { PerformanceMetrics, CacheConfig } from './types';

// Re-export all performance utilities
export * from './memoryManager';
export * from './imageOptimizer';
