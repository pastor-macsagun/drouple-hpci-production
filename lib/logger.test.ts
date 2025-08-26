import { describe, it, expect, beforeEach, vi } from 'vitest'
import { logger, LogLevel, createLogger } from './logger'

// Mock console methods
beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'info').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'debug').mockImplementation(() => {})
})

describe('Logger', () => {
  describe('log levels', () => {
    it('should log at different levels', () => {
      logger.debug('Debug message')
      logger.info('Info message')
      logger.warn('Warning message')
      logger.error('Error message')

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]')
      )
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]')
      )
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN]')
      )
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]')
      )
    })

    it('should respect log level filtering', () => {
      const warnLogger = createLogger({ level: LogLevel.WARN })
      
      warnLogger.debug('Debug message')
      warnLogger.info('Info message')
      warnLogger.warn('Warning message')
      warnLogger.error('Error message')

      expect(console.debug).not.toHaveBeenCalled()
      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('context and metadata', () => {
    it('should include context in logs', () => {
      const contextLogger = createLogger({ 
        context: 'UserService' 
      })
      
      contextLogger.info('User created')
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[UserService]')
      )
    })

    it('should log metadata as structured data', () => {
      logger.info('User action', { 
        userId: '123', 
        action: 'login',
        timestamp: new Date('2024-01-01')
      })

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO]'),
        {
          userId: '123',
          action: 'login',
          timestamp: new Date('2024-01-01')
        }
      )
    })
  })

  describe('error logging', () => {
    it('should log error objects with stack traces', () => {
      const error = new Error('Test error')
      logger.error('Operation failed', error)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        error
      )
    })

    it('should handle errors with metadata', () => {
      const error = new Error('Database error')
      logger.error('Query failed', {
        error,
        query: 'SELECT * FROM users',
        userId: '123'
      })

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR]'),
        expect.objectContaining({
          error,
          query: 'SELECT * FROM users',
          userId: '123'
        })
      )
    })
  })

  describe('child loggers', () => {
    it('should create child logger with inherited context', () => {
      const parentLogger = createLogger({ context: 'App' })
      const childLogger = parentLogger.child({ context: 'Database' })
      
      childLogger.info('Connected')
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[App:Database]')
      )
    })

    it('should inherit parent log level', () => {
      const parentLogger = createLogger({ level: LogLevel.WARN })
      const childLogger = parentLogger.child({ context: 'Child' })
      
      childLogger.info('Info message')
      childLogger.warn('Warning message')
      
      expect(console.info).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
    })
  })

  describe('production mode', () => {
    it('should not log debug in production', () => {
      const originalEnv = process.env.NODE_ENV
      // @ts-expect-error NODE_ENV is readonly but we need to test different environments
      process.env.NODE_ENV = 'production'
      
      const prodLogger = createLogger()
      prodLogger.debug('Debug message')
      prodLogger.info('Info message')
      
      expect(console.debug).not.toHaveBeenCalled()
      expect(console.info).toHaveBeenCalled()
      
      // @ts-expect-error NODE_ENV is readonly but we need to test different environments
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('structured logging', () => {
    it('should format logs as JSON in production', () => {
      const originalEnv = process.env.NODE_ENV
      // @ts-expect-error NODE_ENV is readonly but we need to test different environments
      process.env.NODE_ENV = 'production'
      
      const prodLogger = createLogger({ json: true })
      prodLogger.info('User login', { userId: '123' })
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"message":"User login"')
      )
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('"userId":"123"')
      )
      
      // @ts-expect-error NODE_ENV is readonly but we need to test different environments
      process.env.NODE_ENV = originalEnv
    })
  })
})