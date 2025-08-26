# Logging System

## Overview

The application uses a structured logging system for debugging, monitoring, and audit trails. Logs are formatted differently based on environment (development vs production).

## Log Levels

| Level | Use Case | Default Environment |
|-------|----------|-------------------|
| DEBUG | Detailed debugging information | Development only |
| INFO | General informational messages | All environments |
| WARN | Warning messages that need attention | All environments |
| ERROR | Error messages and exceptions | All environments |
| SILENT | Disable all logging | Test environments |

## Usage

### Basic Logging

```typescript
import { logger } from '@/lib/logger'

// Different log levels
logger.debug('Detailed debug info')
logger.info('User logged in', { userId: '123' })
logger.warn('API rate limit approaching', { remaining: 5 })
logger.error('Database connection failed', error)
```

### Specialized Loggers

Pre-configured loggers for different domains:

```typescript
import { authLogger, dbLogger, apiLogger, emailLogger } from '@/lib/logger'

// Authentication events
authLogger.info('User signed in', { email: user.email })

// Database operations
dbLogger.debug('Query executed', { query: 'SELECT * FROM users' })

// API requests
apiLogger.info('API request', { method: 'POST', path: '/api/users' })

// Email operations
emailLogger.info('Email sent', { to: 'user@example.com', subject: 'Welcome' })
```

### Child Loggers

Create context-specific loggers:

```typescript
const serviceLogger = logger.child({ context: 'UserService' })
serviceLogger.info('User created') // Logs: [UserService] User created
```

### Async Operation Logging

Helper for logging async operations with timing:

```typescript
import { logAsync } from '@/lib/logger'

const result = await logAsync('fetchUserData', async () => {
  return await db.user.findMany()
})
// Automatically logs start, completion, duration, and errors
```

### Server Action Decorator

Automatically log server actions:

```typescript
import { logServerAction } from '@/lib/logger'

export const createUser = logServerAction('createUser')(
  async function(data: CreateUserInput) {
    // Your server action logic
    return await db.user.create({ data })
  }
)
```

## Log Format

### Development

Human-readable format with timestamps:
```
2024-01-01T12:00:00.000Z [INFO][Auth] User signed in { userId: '123' }
```

### Production

JSON format for log aggregation:
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "INFO",
  "context": "Auth",
  "message": "User signed in",
  "userId": "123"
}
```

## Integration Points

### Authentication

All authentication events are logged:
- Sign in attempts
- Successful sign ins
- Sign outs
- New user creation
- Account linking

### Server Actions

Critical server actions include logging:
- Registration attempts
- Check-ins
- RBAC violations
- Rate limiting events

### Error Handling

All errors are logged with stack traces and context:
```typescript
try {
  await riskyOperation()
} catch (error) {
  logger.error('Operation failed', {
    error,
    context: { userId, operation: 'riskyOperation' }
  })
  throw error
}
```

## Best Practices

1. **Use appropriate log levels**
   - DEBUG for development debugging
   - INFO for important business events
   - WARN for recoverable issues
   - ERROR for failures and exceptions

2. **Include context**
   ```typescript
   logger.info('User action', {
     userId: user.id,
     action: 'updateProfile',
     changes: { name: 'New Name' }
   })
   ```

3. **Avoid logging sensitive data**
   - Never log passwords, tokens, or API keys
   - Be careful with PII (personally identifiable information)
   - Sanitize data before logging

4. **Use child loggers for modules**
   ```typescript
   const moduleLogger = logger.child({ context: 'PaymentModule' })
   ```

5. **Log at boundaries**
   - API endpoints
   - Database operations
   - External service calls
   - Authentication events

## Performance Considerations

- Logging is synchronous and minimal overhead
- DEBUG logs are automatically disabled in production
- JSON formatting only in production for better performance
- Consider log sampling for high-traffic endpoints

## Future Enhancements

1. **External Integration**: Send logs to external services (Datadog, CloudWatch)
2. **Log Sampling**: Implement sampling for high-volume logs
3. **Structured Queries**: Better support for querying JSON logs
4. **Audit Trail**: Dedicated audit logger for compliance
5. **Performance Metrics**: Automatic performance tracking