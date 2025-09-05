# Error Handling Documentation

## Overview

Drouple - Church Management System implements a comprehensive error handling system that provides consistent error responses, user-friendly messages, and proper error recovery mechanisms across the application.

## Error Architecture

### Error Types

```typescript
type ErrorCode = 
  | 'UNAUTHORIZED'      // Not authenticated
  | 'FORBIDDEN'         // Lacks permission
  | 'NOT_FOUND'         // Resource doesn't exist
  | 'VALIDATION_ERROR'  // Invalid input
  | 'DUPLICATE_ENTRY'   // Already exists
  | 'TENANT_MISMATCH'   // Cross-tenant access
  | 'CAPACITY_FULL'     // At maximum capacity
  | 'RATE_LIMITED'      // Too many requests
  | 'EMAIL_EXISTS'      // Email already registered
  | 'INVALID_TOKEN'     // Bad token
  | 'EXPIRED_TOKEN'     // Token expired
  | 'SERVER_ERROR'      // Unexpected error
```

### Error Response Format

```typescript
interface AppError {
  code: ErrorCode
  message: string
  details?: any
}

interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: ErrorCode
}
```

## Error Handling Layers

### 1. Server Actions

```typescript
export async function createEvent(data: EventData) {
  try {
    // Validation
    const validated = eventSchema.parse(data)
    
    // Authorization
    const user = await requireRole(UserRole.ADMIN)
    
    // Business logic
    const event = await db.event.create({ data: validated })
    
    return { success: true, data: event }
    
  } catch (error) {
    return { 
      success: false, 
      ...handleActionError(error) 
    }
  }
}
```

### 2. Application Error Class

```typescript
export class ApplicationError extends Error {
  constructor(
    public code: ErrorCode,
    message?: string,
    public details?: any
  ) {
    super(message || ErrorMessages[code])
    this.name = 'ApplicationError'
  }
}

// Usage
throw new ApplicationError(
  'VALIDATION_ERROR',
  'Invalid date range',
  { field: 'startDate' }
)
```

### 3. Error Mapping

```typescript
export function handleActionError(error: unknown): AppError {
  // Application errors
  if (error instanceof ApplicationError) {
    return createError(error.code, error.message, error.details)
  }
  
  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return createError('DUPLICATE_ENTRY', 'This item already exists')
    }
    if (error.code === 'P2025') {
      return createError('NOT_FOUND', 'Record not found')
    }
  }
  
  // Zod validation errors
  if (error instanceof z.ZodError) {
    return createError(
      'VALIDATION_ERROR',
      'Invalid input data',
      { errors: error.errors }
    )
  }
  
  // Default
  return createError('SERVER_ERROR')
}
```

## UI Error Handling

### 1. Global Error Boundary

```typescript
// app/error.tsx
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorCard>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <Button onClick={reset}>Try Again</Button>
    </ErrorCard>
  )
}
```

### 2. Not Found Page

```typescript
// app/not-found.tsx
export default function NotFound() {
  return (
    <ErrorCard>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/dashboard">Go to Dashboard</Link>
    </ErrorCard>
  )
}
```

### 3. Forbidden Page

```typescript
// app/(errors)/forbidden/page.tsx
export default function ForbiddenPage() {
  return (
    <ErrorCard>
      <h2>Access Denied</h2>
      <p>You don't have permission to access this resource.</p>
      <Link href="/dashboard">Back to Dashboard</Link>
    </ErrorCard>
  )
}
```

## Client-Side Error Display

### 1. Toast Notifications

```typescript
import { useToast } from '@/components/ui/use-toast'

function MyComponent() {
  const { toast } = useToast()
  
  async function handleSubmit(data) {
    const result = await createEvent(data)
    
    if (!result.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: formatErrorForUser(result)
      })
      return
    }
    
    toast({
      title: 'Success',
      description: 'Event created successfully'
    })
  }
}
```

### 2. Form Validation Errors

```typescript
function EventForm() {
  const [errors, setErrors] = useState({})
  
  async function onSubmit(data) {
    const result = await createEvent(data)
    
    if (!result.success && result.code === 'VALIDATION_ERROR') {
      setErrors(result.details?.errors || {})
      return
    }
  }
  
  return (
    <form>
      <Input 
        name="name" 
        error={errors.name}
      />
      {errors.name && (
        <p className="text-red-500 text-sm">{errors.name}</p>
      )}
    </form>
  )
}
```

### 3. Loading States with Error Handling

```typescript
function DataList() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    data: null
  })
  
  useEffect(() => {
    fetchData()
      .then(result => {
        if (!result.success) {
          setState({ 
            loading: false, 
            error: result.error, 
            data: null 
          })
        } else {
          setState({ 
            loading: false, 
            error: null, 
            data: result.data 
          })
        }
      })
  }, [])
  
  if (state.loading) return <Spinner />
  if (state.error) return <ErrorMessage error={state.error} />
  return <DataDisplay data={state.data} />
}
```

## Error Recovery Strategies

### 1. Retry Logic

```typescript
async function fetchWithRetry(fn, maxRetries = 3) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn()
      if (result.success) return result
      
      // Don't retry on client errors
      if (['UNAUTHORIZED', 'FORBIDDEN', 'VALIDATION_ERROR'].includes(result.code)) {
        return result
      }
      
      lastError = result
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    } catch (error) {
      lastError = error
    }
  }
  
  return { success: false, error: 'Max retries exceeded', details: lastError }
}
```

### 2. Fallback UI

```typescript
function EventList() {
  const result = use(getEvents())
  
  if (!result.success) {
    return (
      <FallbackUI>
        <p>Unable to load events</p>
        <Button onClick={() => window.location.reload()}>
          Refresh Page
        </Button>
      </FallbackUI>
    )
  }
  
  return <EventGrid events={result.data} />
}
```

### 3. Graceful Degradation

```typescript
function ServiceCheckIn() {
  const [online, setOnline] = useState(navigator.onLine)
  
  useEffect(() => {
    window.addEventListener('online', () => setOnline(true))
    window.addEventListener('offline', () => setOnline(false))
  }, [])
  
  if (!online) {
    return <OfflineMessage />
  }
  
  return <CheckInForm />
}
```

## Logging and Monitoring

### 1. Error Logging

```typescript
export function logError(error: AppError, context?: any) {
  console.error('Application Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    context,
    timestamp: new Date().toISOString(),
    user: getCurrentUser()?.id
  })
  
  // Send to monitoring service (Sentry, etc.)
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context })
  }
}
```

### 2. Audit Trail

```typescript
async function logErrorAudit(error: AppError, action: string) {
  await db.auditLog.create({
    data: {
      actorId: getCurrentUser()?.id || 'system',
      action: 'ERROR',
      entity: action,
      entityId: error.code,
      meta: {
        error: error.message,
        details: error.details,
        stack: error.stack
      }
    }
  })
}
```

## Testing Error Scenarios

### 1. Unit Tests

```typescript
describe('Error Handling', () => {
  it('should return UNAUTHORIZED for unauthenticated requests', async () => {
    const result = await createEvent(data)
    expect(result.success).toBe(false)
    expect(result.code).toBe('UNAUTHORIZED')
  })
  
  it('should return VALIDATION_ERROR for invalid data', async () => {
    const result = await createEvent({ name: '' })
    expect(result.success).toBe(false)
    expect(result.code).toBe('VALIDATION_ERROR')
  })
  
  it('should handle database errors gracefully', async () => {
    jest.spyOn(db.event, 'create').mockRejectedValue(new Error('DB Error'))
    const result = await createEvent(validData)
    expect(result.success).toBe(false)
    expect(result.code).toBe('SERVER_ERROR')
  })
})
```

### 2. E2E Tests

```typescript
test('Shows error message for invalid form submission', async ({ page }) => {
  await page.goto('/events/new')
  await page.click('button[type="submit"]')
  
  await expect(page.getByText('Name is required')).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('validation')
})

test('Redirects to forbidden page for unauthorized access', async ({ page }) => {
  await page.goto('/super/churches')
  await expect(page).toHaveURL('/forbidden')
  await expect(page.getByText('Access Denied')).toBeVisible()
})
```

## Best Practices

1. **Always handle errors explicitly** - No unhandled promises
2. **Provide actionable messages** - Tell users what to do
3. **Log errors with context** - Include user, action, timestamp
4. **Don't expose internals** - Sanitize error messages
5. **Use appropriate HTTP status codes** - Match error types
6. **Implement retry mechanisms** - For transient failures
7. **Test error paths** - Equal attention to happy and error paths
8. **Monitor error rates** - Set up alerting for spikes

## Common Error Patterns

### Authentication Errors
```typescript
if (!session?.user) {
  return createError('UNAUTHORIZED')
}
```

### Authorization Errors
```typescript
if (!hasMinRole(user.role, UserRole.ADMIN)) {
  return createError('FORBIDDEN')
}
```

### Validation Errors
```typescript
try {
  const validated = schema.parse(data)
} catch (error) {
  return createError('VALIDATION_ERROR', 'Invalid input', error.errors)
}
```

### Resource Not Found
```typescript
const resource = await db.resource.findUnique({ where: { id } })
if (!resource) {
  return createError('NOT_FOUND', `Resource ${id} not found`)
}
```

### Capacity Errors
```typescript
if (currentCount >= maxCapacity) {
  return createError('CAPACITY_FULL', 'This event is at capacity')
}
```

### Rate Limiting
```typescript
if (await isRateLimited(userId, action)) {
  return createError('RATE_LIMITED', 'Please wait before trying again')
}
```