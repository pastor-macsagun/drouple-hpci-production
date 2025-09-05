# Rate Limiting Documentation

## Overview

Drouple - Church Management System implements endpoint-specific rate limiting to protect against abuse while maintaining a good user experience. The system uses a sliding window algorithm with different policies for different endpoints.

## Key Features

- **No rate limiting** on GET requests to auth pages (signin, register)
- **Granular limits** on POST requests based on endpoint sensitivity
- **Standard headers** (X-RateLimit-*, Retry-After) on all responses
- **IP + Email based** tracking for auth endpoints
- **Sliding window** algorithm for accurate rate tracking

## Endpoint-Specific Policies

### Authentication Pages (GET) - NO RATE LIMITING
- `/auth/signin` - Unlimited GET requests
- `/auth/error` - Unlimited GET requests  
- `/register` - Unlimited GET requests

Users can always access login and registration pages without rate limiting.

### Login Endpoints (POST)
- `/api/auth/callback/credentials`
- `/api/auth/signin`

**Limits:**
- 5 attempts per minute (per IP + email)
- 20 attempts per hour (per IP + email)

**Key:** Combination of IP address and email prevents attackers from locking out specific accounts.

### Registration Endpoint (POST)
- `/api/register`

**Limit:** 3 registrations per hour (per IP + email)

### Check-in Endpoint (POST)
- `/api/checkin`

**Limit:** 1 check-in per 5 minutes (per IP)

### Export Endpoints (GET)
- `/api/export/*`

**Limit:** 10 exports per hour (per IP)

### General API Endpoints
- All other `/api/*` endpoints

**Limit:** 100 requests per 15 minutes (per IP)

## Response Headers

### Successful Requests
All rate-limited endpoints include these headers:
```
X-RateLimit-Limit: 5        # Maximum requests allowed
X-RateLimit-Remaining: 3    # Requests remaining in window
X-RateLimit-Reset: 1234567890 # Unix timestamp when window resets
```

### Rate Limited Requests (429)
When rate limited, responses include:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890
Retry-After: 45              # Seconds until next request allowed

Rate limit exceeded. Please try again in 45 seconds.
```

## Implementation Details

### In-Memory Rate Limiter
We use an in-memory rate limiter with sliding window algorithm for single-instance deployments. For production with multiple instances, consider upgrading to a Redis-backed solution.

### Key Generation Strategy

Different endpoints use different key strategies:

1. **ip** - Based on IP address only
2. **ip-email** - Based on IP + email combination
3. **ip-path** - Based on IP + specific path

### IP Address Extraction

The system extracts client IP from headers in this order:
1. `X-Forwarded-For` (first IP in chain)
2. `X-Real-IP`
3. `CF-Connecting-IP` (Cloudflare)
4. Fallback to 'unknown'

### Algorithm

Uses sliding window algorithm for accurate rate limiting:
- Tracks exact timestamps of requests
- Removes expired timestamps outside window
- More accurate than fixed window approach

## Usage

### Middleware Level

Rate limiting is automatically applied in `middleware.ts` with the new policy system:
```typescript
import { checkRateLimitWithHeaders } from '@/lib/rate-limit-policies'

const { allowed, headers, message } = await checkRateLimitWithHeaders(
  pathname,
  method,
  ip,
  email
)
```

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

## Testing

### Development Environment
Rate limiting is disabled by default in development. To enable:
```bash
RATE_LIMIT_ENABLED=true npm run dev
```

### Unit Tests
```bash
npm test lib/rate-limit-policies.test.ts
```

### E2E Tests
```bash
npm run test:e2e -- auth-rate-limit.spec.ts
```

### Test Commands
```bash
# Test login rate limit (should fail after 5 attempts)
for i in {1..6}; do
  curl -X POST https://localhost:3000/api/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -i
done

# Check headers
curl -I -X POST https://localhost:3000/api/auth/signin
```

## Troubleshooting

### Common Issues

#### 429 Too Many Requests on Login
**Symptom:** Users see "Rate limit exceeded" when trying to login.

**Solution:** Wait for the time specified in `Retry-After` header. The limit resets after:
- 1 minute for minute-based limits
- 1 hour for hour-based limits

**Prevention:** 
- Implement exponential backoff in clients
- Cache successful authentication tokens
- Use proper session management

#### Registration Blocked
**Symptom:** Cannot register new accounts.

**Solution:** Registration is limited to 3 per hour per IP. Wait up to 1 hour or use a different network.

#### Check-in Rate Limited
**Symptom:** "Already checked in" or rate limit error.

**Solution:** Check-ins are limited to once per 5 minutes per service. This prevents duplicate check-ins.

## Monitoring

### Metrics to Track
- **429 Response Rate** - Percentage of requests being rate limited
- **Retry-After Values** - Average wait time for rate limited users
- **Unique IPs Blocked** - Number of IPs hitting rate limits

### Alerts
Set up alerts for:
- > 5% of requests returning 429
- Single IP generating > 100 failed login attempts/hour
- Sudden spike in registration attempts

## Security Considerations

1. **IP Address Extraction**: We use standard headers (X-Forwarded-For, X-Real-IP, CF-Connecting-IP) to identify clients behind proxies
2. **Email Enumeration**: Registration uses both IP and email-based rate limiting to prevent email enumeration attacks
3. **User-specific Limits**: Authenticated endpoints use user ID for rate limiting to prevent single-user abuse
4. **No GET Limiting**: Auth pages are never rate limited on GET to ensure accessibility

## Configuration

### Environment Variables
```bash
# Enable rate limiting in development
RATE_LIMIT_ENABLED=true

# Rate limiting is always enabled in production
NODE_ENV=production
```

### Adjusting Limits

To modify rate limits, edit `/lib/rate-limit-policies.ts`:

```typescript
const limiters = {
  authLoginMinute: rateLimiter({
    requests: 5,  // Change this value
    window: '1m'
  }),
  // ... other limiters
}
```

## Migration Notes

### From v1 (Old System)
The old system rate limited all auth pages including GET requests. The new system:
- Removes rate limiting from GET requests to auth pages
- Adds granular per-endpoint policies
- Includes standard rate limit headers
- Uses sliding window instead of fixed window

### Breaking Changes
- Rate limit headers format changed to standard format
- Different rate limit keys (now includes email for auth)
- Separate minute and hour limits for login

## Future Improvements

1. **Redis Integration**: For multi-instance deployments
2. **Dynamic Limits**: Different limits based on user role/tier
3. **Distributed Rate Limiting**: Using Redis or similar for horizontal scaling
4. **Analytics**: Track rate limit hits for monitoring abuse patterns
5. **CAPTCHA Integration**: Add CAPTCHA after N failed attempts