import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

export interface ActionResult<T = any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- Generic result type
  success: boolean
  data?: T
  error?: string
  code?: string
  details?: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Error details can be any type
}

export function handleServerError(error: unknown): ActionResult {
  console.error('Server action error:', error)

  // Zod validation errors
  if (error instanceof ZodError) {
    return {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors
    }
  }

  // Prisma unique constraint violations
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'This record already exists',
        code: 'DUPLICATE_ENTRY'
      }
    }
    if (error.code === 'P2025') {
      return {
        success: false,
        error: 'Record not found',
        code: 'NOT_FOUND'
      }
    }
    if (error.code === 'P2003') {
      return {
        success: false,
        error: 'Invalid reference',
        code: 'FOREIGN_KEY_ERROR'
      }
    }
  }

  // Generic database errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      success: false,
      error: 'Database connection failed',
      code: 'DATABASE_ERROR'
    }
  }

  // Rate limiting errors
  if (error instanceof Error && error.message.includes('Rate limit')) {
    return {
      success: false,
      error: error.message,
      code: 'RATE_LIMITED'
    }
  }

  // Authorization errors
  if (error instanceof Error && error.message.includes('Unauthorized')) {
    return {
      success: false,
      error: 'You do not have permission to perform this action',
      code: 'UNAUTHORIZED'
    }
  }

  // Default error
  return {
    success: false,
    error: 'An unexpected error occurred. Please try again.',
    code: 'INTERNAL_ERROR'
  }
}

// Wrapper for server actions with error handling
export async function withErrorHandler<T extends any[], R>( // eslint-disable-line @typescript-eslint/no-explicit-any -- Generic type constraints
  action: (...args: T) => Promise<ActionResult<R>>
): Promise<(...args: T) => Promise<ActionResult<R>>> {
  return async (...args: T) => {
    try {
      return await action(...args)
    } catch (error) {
      return handleServerError(error)
    }
  }
}