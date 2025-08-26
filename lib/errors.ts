export type ErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'DUPLICATE_ENTRY'
  | 'TENANT_MISMATCH'
  | 'CAPACITY_FULL'
  | 'RATE_LIMITED'
  | 'EMAIL_EXISTS'
  | 'INVALID_TOKEN'
  | 'EXPIRED_TOKEN'
  | 'SERVER_ERROR'

export interface AppError {
  code: ErrorCode
  message: string
  details?: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Allow flexible error details
}

export const ErrorMessages: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'You must be signed in to perform this action',
  FORBIDDEN: 'You do not have permission to access this resource',
  NOT_FOUND: 'The requested resource was not found',
  VALIDATION_ERROR: 'The provided data is invalid',
  DUPLICATE_ENTRY: 'This entry already exists',
  TENANT_MISMATCH: 'You cannot access resources from a different church',
  CAPACITY_FULL: 'This item has reached its maximum capacity',
  RATE_LIMITED: 'You are making too many requests. Please try again later',
  EMAIL_EXISTS: 'An account with this email already exists',
  INVALID_TOKEN: 'The provided token is invalid',
  EXPIRED_TOKEN: 'The provided token has expired',
  SERVER_ERROR: 'An unexpected error occurred. Please try again',
}

export class ApplicationError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public details?: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Allow flexible error details
  ) {
    super(message || ErrorMessages[code])
    this.name = 'ApplicationError'
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message?: string, details?: any) { // eslint-disable-line @typescript-eslint/no-explicit-any -- Allow flexible error details
    super('FORBIDDEN', message, details)
    this.name = 'AuthorizationError'
  }
}

export function createError(
  code: ErrorCode,
  message?: string,
  details?: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Allow flexible error details
): AppError {
  return {
    code,
    message: message || ErrorMessages[code],
    details
  }
}

export function isAppError(error: any): error is AppError { // eslint-disable-line @typescript-eslint/no-explicit-any -- Type guard needs any
  return error && typeof error === 'object' && 'code' in error && 'message' in error
}

export function handleActionError(error: unknown): AppError {
  console.error('Action error:', error)

  if (isAppError(error)) {
    return error
  }

  if (error instanceof ApplicationError) {
    return createError(error.code, error.message, error.details)
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('Unique constraint')) {
      return createError('DUPLICATE_ENTRY', 'This item already exists')
    }
    if (error.message.includes('Foreign key constraint')) {
      return createError('VALIDATION_ERROR', 'Invalid reference to related data')
    }
    if (error.message.includes('different tenant')) {
      return createError('TENANT_MISMATCH')
    }
    if (error.message.includes('capacity')) {
      return createError('CAPACITY_FULL')
    }
    if (error.message.includes('not found')) {
      return createError('NOT_FOUND')
    }
    if (error.message.includes('denied') || error.message.includes('permission')) {
      return createError('FORBIDDEN')
    }
  }

  return createError('SERVER_ERROR')
}

export function formatErrorForUser(error: AppError): string {
  // For user-facing messages, we might want to simplify technical errors
  switch (error.code) {
    case 'DUPLICATE_ENTRY':
      return error.details?.field 
        ? `This ${error.details.field} is already in use`
        : error.message
    case 'VALIDATION_ERROR':
      return error.details?.fields
        ? `Please check the following fields: ${error.details.fields.join(', ')}`
        : error.message
    default:
      return error.message
  }
}