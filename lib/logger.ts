/**
 * Logging utility for structured logging
 * Supports different log levels, context, and metadata
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

interface LoggerOptions {
  level?: LogLevel
  context?: string
  json?: boolean
}

interface LogMetadata {
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any -- Flexible metadata
}

class Logger {
  private level: LogLevel
  private context: string
  private json: boolean

  constructor(options: LoggerOptions = {}) {
    // Default to INFO in production, DEBUG in development
    this.level = options.level ?? (
      process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
    )
    this.context = options.context || ''
    this.json = options.json ?? process.env.NODE_ENV === 'production'
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  private formatMessage(level: string, message: string, metadata?: any): string | object { // eslint-disable-line @typescript-eslint/no-explicit-any -- Flexible metadata
    const timestamp = new Date().toISOString()
    const contextStr = this.context ? `[${this.context}]` : ''
    
    if (this.json && process.env.NODE_ENV === 'production') {
      return JSON.stringify({
        timestamp,
        level,
        context: this.context,
        message,
        ...metadata
      })
    }
    
    return `${timestamp} [${level}]${contextStr} ${message}`
  }

  debug(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return
    
    const formatted = this.formatMessage('DEBUG', message, metadata)
    if (metadata && !this.json) {
      console.debug(formatted, metadata)
    } else {
      console.debug(formatted)
    }
  }

  info(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.INFO)) return
    
    const formatted = this.formatMessage('INFO', message, metadata)
    if (metadata && !this.json) {
      console.info(formatted, metadata)
    } else {
      console.info(formatted)
    }
  }

  warn(message: string, metadata?: LogMetadata): void {
    if (!this.shouldLog(LogLevel.WARN)) return
    
    const formatted = this.formatMessage('WARN', message, metadata)
    if (metadata && !this.json) {
      console.warn(formatted, metadata)
    } else {
      console.warn(formatted)
    }
  }

  error(message: string, error?: Error | LogMetadata): void {
    if (!this.shouldLog(LogLevel.ERROR)) return
    
    const formatted = this.formatMessage('ERROR', message, error)
    if (error && !this.json) {
      console.error(formatted, error)
    } else {
      console.error(formatted)
    }
  }

  child(options: Partial<LoggerOptions>): Logger {
    const childContext = options.context 
      ? `${this.context}:${options.context}`.replace(/^:/, '')
      : this.context
    
    return new Logger({
      level: options.level ?? this.level,
      context: childContext,
      json: options.json ?? this.json
    })
  }
}

// Create default logger instance
export const logger = new Logger()

// Factory function for creating custom loggers
export function createLogger(options?: LoggerOptions): Logger {
  return new Logger(options)
}

// Specialized loggers for different parts of the application
export const authLogger = logger.child({ context: 'Auth' })
export const dbLogger = logger.child({ context: 'Database' })
export const apiLogger = logger.child({ context: 'API' })
export const emailLogger = logger.child({ context: 'Email' })

// Helper for logging async operations
export async function logAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  logger: Logger = apiLogger
): Promise<T> {
  const startTime = Date.now()
  logger.debug(`Starting ${operation}`)
  
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    logger.info(`Completed ${operation}`, { duration })
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`Failed ${operation}`, { error, duration })
    throw error
  }
}

// Helper for logging server actions
export function logServerAction(actionName: string) {
  return function decorator<T extends (...args: any[]) => Promise<any>>( // eslint-disable-line @typescript-eslint/no-explicit-any -- Decorator needs flexible types
    target: T
  ): T {
    return (async (...args: Parameters<T>) => {
      const logger = apiLogger.child({ context: actionName })
      const startTime = Date.now()
      
      logger.debug('Starting server action')
      
      try {
        const result = await target(...args)
        const duration = Date.now() - startTime
        logger.info('Server action completed', { duration })
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        logger.error('Server action failed', { error, duration })
        throw error
      }
    }) as T
  }
}