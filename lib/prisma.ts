import { PrismaClient } from '@prisma/client'
import { dbLogger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client optimized for serverless environments
function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    // Optimized for serverless with connection pooling
    datasources: {
      db: {
        url: process.env.DATABASE_URL // Always use pooled connection
      }
    }
  })
  
  // Connection Pool Configuration:
  // - DATABASE_URL: Uses connection pooling (recommended for serverless) 
  //   Format: postgresql://...?pgbouncer=true for Neon
  // - DATABASE_URL_UNPOOLED: Direct connection for migrations/admin tasks
  // In production (Neon/Vercel), ensure DATABASE_URL uses pooled connection string
  
  // Performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    const isPgBouncer = process.env.DATABASE_URL?.includes('pgbouncer=true')
    dbLogger.info(`Prisma client created - connection pooling: ${isPgBouncer ? 'ENABLED' : 'DISABLED'}`)
    
    if (!isPgBouncer && process.env.DATABASE_URL?.includes('neon.tech')) {
      dbLogger.warn('Consider using pgbouncer=true for Neon connections in production')
    }
  }
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Enhanced connection health monitoring and performance diagnostics
export async function checkDatabaseHealth(): Promise<{ 
  healthy: boolean; 
  latencyMs?: number;
  connectionInfo?: {
    pooled: boolean;
    activeConnections?: number;
    serverVersion?: string;
  }
}> {
  try {
    const start = Date.now()
    
    // Basic health check
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - start
    
    // Get connection info for diagnostics
    const [serverInfo] = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`
    const [connectionInfo] = await prisma.$queryRaw<Array<{ 
      count: bigint;
      application_name: string;
    }>>`
      SELECT count(*) as count, application_name 
      FROM pg_stat_activity 
      WHERE application_name LIKE 'Prisma%'
      GROUP BY application_name
      LIMIT 1
    `
    
    const isPgBouncer = process.env.DATABASE_URL?.includes('pgbouncer=true') || false
    
    return { 
      healthy: true, 
      latencyMs,
      connectionInfo: {
        pooled: isPgBouncer,
        activeConnections: connectionInfo ? Number(connectionInfo.count) : undefined,
        serverVersion: serverInfo?.version
      }
    }
  } catch (error) {
    dbLogger.error('Database health check failed:', error instanceof Error ? error : new Error(String(error)))
    return { healthy: false }
  }
}

// Query performance monitoring utility
export async function measureQueryPerformance<T>(
  queryFn: () => Promise<T>,
  queryName: string
): Promise<{ result: T; executionTime: number; queryName: string }> {
  const start = performance.now()
  try {
    const result = await queryFn()
    const executionTime = performance.now() - start
    
    if (process.env.NODE_ENV === 'development' && executionTime > 100) {
      dbLogger.warn(`Slow query detected: ${queryName} took ${executionTime.toFixed(2)}ms`)
    }
    
    return { result, executionTime, queryName }
  } catch (error) {
    const executionTime = performance.now() - start
    dbLogger.error(`Query failed: ${queryName} after ${executionTime.toFixed(2)}ms`, error instanceof Error ? error : new Error(String(error)))
    throw error
  }
}