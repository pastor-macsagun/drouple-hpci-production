/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-memory caching strategy for Next.js App Router
 * Uses React cache() and unstable_cache for server-side caching
 */

import { unstable_cache } from 'next/cache'
import { cache } from 'react'

// Cache tags for invalidation
export const CACHE_TAGS = {
  USER: 'user',
  CHURCH: 'church',
  SERVICE: 'service',
  LIFEGROUP: 'lifegroup',
  EVENT: 'event',
  PATHWAY: 'pathway',
  ANNOUNCEMENT: 'announcement',
  MESSAGE: 'message',
  REPORT: 'report'
} as const

// Cache durations in seconds
export const CACHE_DURATIONS = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,         // 1 hour
  DAY: 86400,         // 24 hours
  WEEK: 604800        // 7 days
} as const

/**
 * Create a cached function with automatic tagging and revalidation
 */
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    tags: string[]
    revalidate?: number
    keyPrefix?: string
  }
): T {
  return unstable_cache(
    fn,
    options.keyPrefix ? [options.keyPrefix] : undefined,
    {
      tags: options.tags,
      revalidate: options.revalidate || CACHE_DURATIONS.MEDIUM
    }
  ) as T
}

/**
 * React cache for request-level memoization
 */
export const memoize = cache

/**
 * In-memory LRU cache for client-side caching
 */
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>()
  private maxSize: number
  private ttl: number

  constructor(maxSize = 100, ttlSeconds = 300) {
    this.maxSize = maxSize
    this.ttl = ttlSeconds * 1000
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return undefined
    }

    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, item)
    return item.value
  }

  set(key: string, value: T): void {
    // Delete oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }
}

// Global cache instances
export const userCache = new LRUCache(200, CACHE_DURATIONS.LONG)
export const churchCache = new LRUCache(50, CACHE_DURATIONS.DAY)
export const eventCache = new LRUCache(100, CACHE_DURATIONS.MEDIUM)

/**
 * Cache wrapper for async functions with automatic key generation
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  cache: LRUCache<any>,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args)
    
    const cached = cache.get(key)
    if (cached !== undefined) {
      return cached
    }

    const result = await fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

/**
 * Cached database queries
 */
export const cachedQueries = {
  getUser: createCachedFunction(
    async (userId: string) => {
      const { prisma } = await import('@/lib/prisma')
      return prisma.user.findUnique({ where: { id: userId } })
    },
    {
      tags: [CACHE_TAGS.USER],
      revalidate: CACHE_DURATIONS.LONG,
      keyPrefix: 'user'
    }
  ),

  getChurch: createCachedFunction(
    async (churchId: string) => {
      const { prisma } = await import('@/lib/prisma')
      return prisma.church.findUnique({
        where: { id: churchId },
        include: { localChurches: true }
      })
    },
    {
      tags: [CACHE_TAGS.CHURCH],
      revalidate: CACHE_DURATIONS.DAY,
      keyPrefix: 'church'
    }
  ),

  getUpcomingEvents: createCachedFunction(
    async (localChurchId: string) => {
      const { prisma } = await import('@/lib/prisma')
      return prisma.event.findMany({
        where: {
          localChurchId,
          isActive: true,
          startDateTime: { gte: new Date() }
        },
        orderBy: { startDateTime: 'asc' },
        take: 10
      })
    },
    {
      tags: [CACHE_TAGS.EVENT],
      revalidate: CACHE_DURATIONS.MEDIUM,
      keyPrefix: 'upcoming-events'
    }
  ),

  getAnnouncements: createCachedFunction(
    async (localChurchId: string) => {
      const { prisma } = await import('@/lib/prisma')
      return prisma.announcement.findMany({
        where: {
          localChurchId,
          isActive: true,
          OR: [
            { publishedAt: null },
            { publishedAt: { lte: new Date() } }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: 5
      })
    },
    {
      tags: [CACHE_TAGS.ANNOUNCEMENT],
      revalidate: CACHE_DURATIONS.SHORT,
      keyPrefix: 'announcements'
    }
  )
}

/**
 * Edge caching configuration for static assets
 */
export const edgeCacheConfig = {
  images: {
    'Cache-Control': `public, max-age=${CACHE_DURATIONS.WEEK}, s-maxage=${CACHE_DURATIONS.WEEK}, stale-while-revalidate=${CACHE_DURATIONS.DAY}`
  },
  static: {
    'Cache-Control': `public, max-age=${CACHE_DURATIONS.DAY}, s-maxage=${CACHE_DURATIONS.WEEK}, immutable`
  },
  api: {
    'Cache-Control': `private, max-age=0, s-maxage=${CACHE_DURATIONS.SHORT}, stale-while-revalidate=${CACHE_DURATIONS.SHORT}`
  },
  html: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate'
  }
}