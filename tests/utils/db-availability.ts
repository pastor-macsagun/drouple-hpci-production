import { PrismaClient } from '@prisma/client'

let availabilityPromise: Promise<boolean> | null = null

export async function isDatabaseAvailable(timeoutMs = 2_000): Promise<boolean> {
  if (!availabilityPromise) {
    availabilityPromise = new Promise<boolean>((resolve) => {
      const prisma = new PrismaClient()
      const timer = setTimeout(() => {
        prisma.$disconnect().catch(() => undefined)
        resolve(false)
      }, timeoutMs)

      prisma.$queryRaw`SELECT 1`
        .then(() => {
          clearTimeout(timer)
          resolve(true)
        })
        .catch(() => {
          clearTimeout(timer)
          resolve(false)
        })
        .finally(() => {
          prisma.$disconnect().catch(() => undefined)
        })
    })
  }

  return availabilityPromise
}
