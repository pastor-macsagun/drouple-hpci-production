import { PrismaClient } from '@prisma/client'
import { dbLogger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client optimized for serverless environments
function createPrismaClient() {
  const client = new PrismaClient()
  
  // Connection Pool Configuration:
  // - DATABASE_URL: Uses connection pooling (recommended for serverless)
  // - DATABASE_URL_UNPOOLED: Direct connection for migrations/admin tasks
  // In production (Neon/Vercel), ensure DATABASE_URL uses pooled connection string
  
  // Note: Prisma middleware ($use) has been deprecated in v5+
  // For production monitoring, use Prisma Pulse or custom metrics collection
  if (process.env.NODE_ENV === 'development') {
    dbLogger.info('Prisma client created - connection pooling configured for serverless')
  }
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Utility for connection health monitoring in production
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; latencyMs?: number }> {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latencyMs = Date.now() - start
    return { healthy: true, latencyMs }
  } catch (error) {
    dbLogger.error('Database health check failed:', error instanceof Error ? error : new Error(String(error)))
    return { healthy: false }
  }
}