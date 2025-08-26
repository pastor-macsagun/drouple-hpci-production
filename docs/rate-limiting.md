# Rate Limiting

## Overview

The application implements rate limiting to prevent abuse and ensure fair usage. Rate limiting is applied at both the middleware level and within server actions.

## Implementation

### In-Memory Rate Limiter

We use an in-memory rate limiter with sliding window algorithm for single-instance deployments. For production with multiple instances, consider upgrading to a Redis-backed solution.

### Rate Limit Configuration

| Endpoint Type | Limit | Window | Key |
|--------------|-------|--------|-----|
| Authentication | 3 requests | 1 hour | IP address |
| Registration | 3 requests | 1 hour | IP + Email |
| General API | 100 requests | 15 minutes | IP address |
| Email Sending | 5 requests | 1 hour | Email address |
| Check-in | 10 requests | 5 minutes | User ID |
| CSV Export | 10 requests | 1 hour | User ID |

## Usage

### Middleware Level

Rate limiting is automatically applied in `middleware.ts` for:
- Authentication endpoints (`/auth/*`, `/register`)
- API routes (`/api/*`)

### Server Actions

```typescript
import { rateLimiters } from '@/lib/rate-limit'

export async function myAction() {
  const session = await auth()
  
  // Create a unique key for this user/action
  const rateLimitKey = rateLimiters.api.key(['action', session.user.id])
  const { success, reset } = await rateLimiters.api.check(rateLimitKey)
  
  if (!success) {
    return { 
      error: `Rate limit exceeded. Try again at ${reset.toLocaleTimeString()}` 
    }
  }
  
  // Proceed with action...
}
```

### Custom Rate Limiters

```typescript
import { rateLimiter } from '@/lib/rate-limit'

// Create a custom rate limiter
const customLimiter = rateLimiter({
  requests: 5,
  window: '1h',
  algorithm: 'sliding-window'
})

// Use it in your code
const result = await customLimiter.check('unique-key')
if (!result.success) {
  // Handle rate limit exceeded
}
```

## Headers

When rate limited, the following headers are returned:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: When the rate limit resets (ISO 8601)
- `Retry-After`: Seconds until retry is allowed

## Error Handling

Rate limit errors return:
- HTTP 429 status code
- Clear error message with retry time
- Appropriate headers for client retry logic

## Testing

Rate limiting is disabled in test environments to prevent test failures. In production, ensure `NODE_ENV=production` is set.

## Security Considerations

1. **IP Address Extraction**: We use standard headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP) to identify clients behind proxies
2. **Email Enumeration**: Registration uses both IP and email-based rate limiting to prevent email enumeration attacks
3. **User-specific Limits**: Authenticated endpoints use user ID for rate limiting to prevent single-user abuse

## Future Improvements

1. **Redis Integration**: For multi-instance deployments
2. **Dynamic Limits**: Different limits based on user role/tier
3. **Distributed Rate Limiting**: Using Redis or similar for horizontal scaling
4. **Analytics**: Track rate limit hits for monitoring abuse patterns