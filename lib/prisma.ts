import { PrismaClient } from '@prisma/client'
import { dbLogger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with monitoring middleware
function createPrismaClient() {
  const client = new PrismaClient()
  
  // Note: Prisma middleware ($use) has been deprecated in v5+
  // For production monitoring, use Prisma Pulse or custom metrics collection
  // This is a placeholder for slow query logging
  if (process.env.NODE_ENV === 'development') {
    dbLogger.info('Prisma client created with monitoring placeholder')
  }
  
  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma