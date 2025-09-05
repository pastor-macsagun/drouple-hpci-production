# HPCI-ChMS API Contract

## Overview

This document describes the HPCI Church Management System REST API v2.0, designed as a single, versioned contract for both web and mobile applications. The API follows industry standards for security, caching, pagination, and error handling.

## Base URLs

- **Production**: `https://api.hpci-chms.com/api/v2`
- **Staging**: `https://staging-api.hpci-chms.com/api/v2`
- **Development**: `http://localhost:3000/api/v2`

## Authentication

### Bearer JWT Authentication

All endpoints (except `/healthz` and `/auth/token`) require Bearer JWT authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### JWT Claims

The JWT contains the following claims:
- `sub`: User ID (CUID)
- `tenantId`: Church/Tenant ID (CUID) 
- `roles`: Array of user roles (`["MEMBER"]`, `["LEADER"]`, etc.)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (5-15 minutes TTL)

### Token Lifecycle

1. **Initial Authentication**: `POST /auth/token` with email/password
2. **Token Refresh**: Exchange refresh token for new access token (separate endpoint)
3. **Short TTL**: Access tokens expire in 5-15 minutes
4. **No Long-lived Mobile Tokens**: Mobile apps must refresh tokens regularly

### Example Authentication

```bash
# Get access token
curl -X POST /api/v2/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@church.com",
    "password": "securepassword",
    "deviceId": "mobile-device-123"
  }'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "expiresIn": 900,
  "user": { ... }
}

# Use access token
curl -X GET /api/v2/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Multi-Tenant Isolation

- **Server-Side Scoping**: All requests are automatically scoped to the user's tenant based on JWT claims
- **No Client-Side Tenant IDs**: Clients never send `tenantId` in URLs or request bodies
- **Automatic Filtering**: All data queries are filtered by the authenticated user's tenant

## Pagination

All list endpoints use **cursor-based pagination**:

### Query Parameters

- `cursor` (optional): Pagination cursor for next page
- `limit` (optional): Items per page (1-100, default 25, max 100)

### Response Format

```json
{
  "data": [...],
  "meta": {
    "nextCursor": "eyJpZCI6ImN...", 
    "hasNextPage": true,
    "totalCount": 150
  }
}
```

### Pagination Examples

```bash
# First page
GET /api/v2/members?limit=25

# Next page using cursor
GET /api/v2/members?cursor=eyJpZCI6ImN...&limit=25

# Last page will have nextCursor=null and hasNextPage=false
```

## Caching with ETags

List endpoints support ETags for efficient caching:

### ETag Flow

1. **First Request**: Server returns `ETag` header
2. **Subsequent Requests**: Client sends `If-None-Match` header
3. **Cache Hit**: Server responds with `304 Not Modified` (no body)
4. **Cache Miss**: Server responds with `200 OK` and new data

### ETag Examples

```bash
# First request
GET /api/v2/members
ETag: "abc123"

{
  "data": [...],
  "meta": {...}
}

# Subsequent request with ETag
GET /api/v2/members
If-None-Match: "abc123"

# Response if unchanged
HTTP/1.1 304 Not Modified
ETag: "abc123"

# Response if changed  
HTTP/1.1 200 OK
ETag: "def456"

{
  "data": [...],
  "meta": {...}
}
```

## Idempotency

Write operations require idempotency keys to prevent duplicate requests:

### Idempotency-Key Header

- **Required**: All POST operations that modify data
- **Format**: UUID v4
- **Deduplication Window**: 24 hours
- **Behavior**: Identical responses for duplicate keys within window

### Idempotency Examples

```bash
# RSVP to event (idempotent)
POST /api/v2/events/event123/rsvp
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "response": "going"
}

# Duplicate request returns same response
POST /api/v2/events/event123/rsvp  
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Content-Type: application/json

{
  "response": "going"
}

# Returns 200 OK with same response body (not 409 Conflict)
```

## Rate Limiting

The API implements rate limiting with standard headers:

### Rate Limit Headers

```http
RateLimit-Limit: 1000
RateLimit-Remaining: 999  
RateLimit-Reset: 1640995200
Retry-After: 60
```

### Rate Limit Response

```bash
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1640995260
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMITED", 
    "message": "Rate limit exceeded. Try again later."
  }
}
```

## Error Handling

All errors follow a consistent format:

### Error Response Schema

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message", 
    "details": {
      "fieldErrors": {
        "email": ["must be a valid email address"]
      }
    }
  }
}
```

### Common Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | `VALIDATION_FAILED` | Request validation failed |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict |
| 422 | `UNPROCESSABLE_ENTITY` | Semantic validation failed |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Internal server error |

## API Versioning

### Version Strategy

- **URL Prefix**: All endpoints prefixed with `/api/v2`
- **Breaking Changes**: New major version for breaking changes
- **Backward Compatibility**: N-1 version maintained for 90 days
- **CI Integration**: Automated breaking change detection

### Breaking vs Non-Breaking Changes

**Breaking Changes** (require new major version):
- Removing fields from responses
- Changing field types or formats
- Removing endpoints
- Adding required request fields
- Changing authentication requirements

**Non-Breaking Changes** (allowed in current version):
- Adding optional request fields
- Adding response fields
- Adding new endpoints
- Adding new enum values (with careful design)

## Filtering & Search

### Member Search
```bash
# Search by name or email
GET /api/v2/members?q=john

# Filter by update time
GET /api/v2/members?updatedSince=2023-12-01T00:00:00Z
```

### Event Filtering
```bash
# Events since date
GET /api/v2/events?since=2023-12-01T00:00:00Z

# Search events
GET /api/v2/events?q=christmas
```

## Data Formats

### Timestamps
- **Format**: RFC3339 UTC (`2023-12-01T10:30:00Z`)
- **Timezone**: Always UTC, clients handle local conversion

### IDs  
- **Format**: CUID strings (e.g., `ckl1234567890`)
- **Pattern**: `^[a-z0-9]+$`

### Enums
- **Case**: UPPER_SNAKE_CASE (e.g., `CHURCH_ADMIN`)
- **Values**: Clearly defined in OpenAPI spec

## Real-time Events

While not part of the REST API, the system supports real-time updates via WebSocket/SSE:

### Event Types
- `attendance.created` - New check-in recorded
- `attendance.updated` - Check-in modified  
- `event.created` - New event published
- `event.updated` - Event details changed
- `member.updated` - Member profile changed
- `announcement.published` - New announcement

### Connection
- **Endpoint**: WSS with Bearer JWT authentication
- **Filtering**: Events automatically tenant-scoped
- **Delivery**: At-least-once with client deduplication recommended

## Client Generation

### Generate TypeScript Client

```bash
# Generate types from OpenAPI spec
npm run gen:api

# This creates packages/shared/api-client/types.ts
```

### Using the Generated Client

```typescript
import { createApiClient } from '@hpci-chms/api-client';

const client = createApiClient({
  baseUrl: 'https://api.hpci-chms.com/api/v2',
  getToken: () => localStorage.getItem('accessToken'),
  getETag: (url) => localStorage.getItem(`etag:${url}`),
  setETag: (url, etag) => localStorage.setItem(`etag:${url}`, etag),
  onUnauthorized: () => {
    // Redirect to login
    window.location.href = '/login';
  },
  onRateLimit: (retryAfter) => {
    // Show rate limit warning
    console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
  }
});

// Use the client
const { data, error } = await client.getMembers({
  limit: 50,
  q: 'john'
});

if (error) {
  console.error('API Error:', error.code, error.message);
} else {
  console.log('Members:', data);
}
```

### Client Features

- **Automatic Authentication**: Injects Bearer tokens
- **ETag Support**: Automatic If-None-Match handling
- **Idempotency**: Helper methods for idempotency keys
- **Error Handling**: Normalized error responses
- **Type Safety**: Full TypeScript support
- **Rate Limit Awareness**: Callbacks for rate limit events

## Testing

### Contract Tests

Run contract tests against the API:

```bash
# Test against mock server  
npm run test:contract

# Test against local dev server
./tests/contract/run-mock.sh

# Lint OpenAPI spec
npm run check:api
```

### Mock Server

Start mock server for development:

```bash
# Start Prism mock server on port 4010
npm run mock:api

# Available at http://localhost:4010/api/v2
```

## Development Workflow

1. **Edit Spec**: Modify `docs/api/openapi.yaml`
2. **Validate**: Run `npm run check:api`
3. **Generate Types**: Run `npm run gen:api`
4. **Test Contracts**: Run `npm run test:contract`
5. **Update Docs**: Update this CONTRACT.md if needed

## Examples

### Complete Authentication Flow

```typescript
// 1. Login
const { data: authData } = await client.createToken({
  email: 'user@church.com', 
  password: 'password123',
  deviceId: 'mobile-app-v1.0'
});

// 2. Store tokens
localStorage.setItem('accessToken', authData.accessToken);
localStorage.setItem('refreshToken', authData.refreshToken);

// 3. Get user profile
const { data: user } = await client.getMe();

// 4. List members with caching
const { data: members, isNotModified } = await client.getMembers({
  limit: 25,
  etag: localStorage.getItem('etag:/members')
});

if (isNotModified) {
  // Use cached data
  console.log('Using cached members data');
} else {
  // Use fresh data
  console.log('Got fresh members data:', members);
}
```

### Attendance Check-in Flow

```typescript
// Check in member with idempotency
const { data: checkin } = await client.createAttendanceCheckin({
  memberId: 'member123',
  eventId: 'service456', 
  scannedAt: new Date().toISOString(),
  deviceId: 'scanner-001'
}, 'unique-checkin-key-123');

console.log('Check-in successful:', checkin);
```

### Event RSVP with Error Handling

```typescript
try {
  const { data, error } = await client.createEventRsvp(
    'event123',
    { response: 'going' }
  );
  
  if (error) {
    switch (error.code) {
      case 'VALIDATION_FAILED':
        console.error('Invalid RSVP data:', error.details);
        break;
      case 'FORBIDDEN':
        console.error('Not authorized to RSVP');
        break;
      case 'CONFLICT':
        console.error('Duplicate RSVP detected');
        break;
      default:
        console.error('RSVP failed:', error.message);
    }
  } else {
    console.log('RSVP successful:', data);
  }
} catch (networkError) {
  console.error('Network error:', networkError);
}
```

## Support

For API support and questions:
- **Repository**: https://github.com/hpci-chms/api
- **Issues**: Create issues for bugs or feature requests
- **Documentation**: See `docs/api/` directory for detailed specs