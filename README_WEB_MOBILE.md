# Mobile API Documentation - Drouple ChMS v1

## 📱 Purpose

The Drouple Mobile API provides secure, multi-tenant access to church management system functionality for mobile applications. It enables iOS and Android apps to integrate with the church management platform while maintaining strict tenant isolation, role-based access controls, and enterprise-grade security.

**Key Features:**
- JWT-based authentication with token rotation
- Multi-tenant data isolation
- Role-based access control (RBAC)
- Idempotency for safe retries
- Rate limiting and security headers
- RESTful design with consistent error handling

## 🔐 Authentication Scheme

### JWT Token Flow

The mobile API uses a dual-token system for enhanced security:

1. **Access Token**: Short-lived (15 minutes) JWT for API requests
2. **Refresh Token**: Longer-lived (30 days) token for obtaining new access tokens

### Authentication Headers

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### Token Structure

Access tokens contain:
```json
{
  "sub": "user-id",
  "userId": "user-id",
  "roles": ["MEMBER", "LEADER", "ADMIN"],
  "tenantId": "church-tenant-id",
  "localChurchId": "local-church-id",
  "iat": 1640995200,
  "exp": 1640996100
}
```

## 🏢 Tenant Isolation Rules

### Multi-Tenant Architecture

Every API request is scoped to the authenticated user's tenant:

1. **User Context**: Extracted from JWT token
2. **Data Filtering**: All queries filtered by `tenantId`
3. **Church Scoping**: Further scoped by `localChurchId` when applicable
4. **Zero Cross-Tenant Access**: No data leakage between organizations

### Tenant Scoping Examples

```sql
-- Events query is automatically scoped
SELECT * FROM events 
WHERE localChurchId IN (user.accessibleChurches)
  AND localChurch.tenantId = user.tenantId

-- Directory search is tenant-isolated
SELECT * FROM users 
WHERE tenantId = user.tenantId 
  AND memberStatus = 'ACTIVE'
```

## 🔄 Idempotency

### Client Request ID

All write operations support idempotency via `clientRequestId`:

```json
{
  "clientRequestId": "mobile-checkin-12345-20240101",
  "memberId": "user-123",
  "serviceId": "service-456"
}
```

### Idempotency Behavior

- **First Request**: Processes normally, stores result
- **Duplicate Request**: Returns cached result without side effects
- **TTL**: Idempotency keys expire after 24 hours

## 🌐 API Endpoints

### Base URL
```
Production: https://www.drouple.app/api/mobile/v1
Development: http://localhost:3000/api/mobile/v1
```

---

## 🔑 Authentication Endpoints

### POST /auth/login
Authenticate user with email and password.

**Request:**
```json
{
  "email": "member@church.com",
  "password": "secure_password"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "rt_7d8f9e0a1b2c3d4e5f6g7h8i9j0k1l2m",
  "user": {
    "id": "user-123",
    "email": "member@church.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["MEMBER"],
    "tenantId": "church-tenant-1",
    "churchId": "local-church-manila",
    "isActive": true,
    "profileImage": "https://...",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials, inactive account, or missing password
- `429 Too Many Requests`: Rate limit exceeded (3 attempts per hour)

---

### POST /auth/refresh
Obtain new access token using refresh token.

**Request:**
```json
{
  "refreshToken": "rt_7d8f9e0a1b2c3d4e5f6g7h8i9j0k1l2m"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "rt_new_8e9f0a1b2c3d4e5f6g7h8i9j0k1l2n"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid, expired, or already used refresh token
- `429 Too Many Requests`: Rate limit exceeded

---

## ✅ Check-in Endpoints

### POST /checkins
Check in a member to a church service.

**Request:**
```json
{
  "clientRequestId": "checkin-mobile-20240101-123456",
  "memberId": "user-123",
  "serviceId": "service-456",
  "newBeliever": false
}
```

**Response (200):**
```json
{
  "id": "checkin-789",
  "status": "ok"
}
```

**Duplicate Response (200):**
```json
{
  "id": "checkin-existing-789",
  "status": "duplicate"
}
```

**Features:**
- **Idempotency**: Safe to retry with same `clientRequestId`
- **Auto-enrollment**: New believers automatically enrolled in ROOTS pathway
- **Permission Checks**: Members can check themselves in, leaders can check in others
- **Tenant Isolation**: Only services from user's church are accessible

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions to check in other members
- `404 Not Found`: Service or member not found in accessible churches

---

## 🎉 Events Endpoints

### GET /events
Get list of events with optional filtering.

**Query Parameters:**
- `upcoming=true` (optional): Filter to future events only
- `limit=50` (optional): Limit results (max 100, default 50)

**Request:**
```
GET /events?upcoming=true&limit=20
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "id": "event-123",
    "title": "Youth Night",
    "startsAt": "2024-02-15T19:00:00Z",
    "location": "Main Sanctuary",
    "capacity": 100,
    "spotsLeft": 25
  },
  {
    "id": "event-456",
    "title": "Community Outreach",
    "startsAt": "2024-02-20T14:00:00Z",
    "location": "Community Center",
    "capacity": null,
    "spotsLeft": null
  }
]
```

**Tenant Isolation:**
- Only events from user's accessible churches
- Automatic filtering by `tenantId` and `localChurchId`
- No cross-tenant data leakage

---

## 👥 Directory Endpoints

### GET /directory/search
Search member directory with privacy controls.

**Query Parameters:**
- `q` (required): Search query (name or email)
- `limit=20` (optional): Limit results (max 50, default 20)

**Request:**
```
GET /directory/search?q=john&limit=10
Authorization: Bearer <access_token>
```

**Response (200) - Member Role:**
```json
[
  {
    "id": "user-123",
    "name": "John Doe",
    "roles": ["MEMBER"]
  },
  {
    "id": "user-456", 
    "name": "John Smith",
    "roles": ["LEADER"]
  }
]
```

**Response (200) - Leader Role:**
```json
[
  {
    "id": "user-123",
    "name": "John Doe",
    "roles": ["MEMBER"],
    "phone": "+1-555-0123",
    "email": "john.doe@email.com"
  },
  {
    "id": "user-456",
    "name": "John Smith", 
    "roles": ["LEADER"],
    "phone": "+1-555-0456"
  }
]
```

**Privacy Rules:**
- **Members**: Can only see name and roles
- **Leaders+**: Can see contact details if member allows contact AND profile is not private
- **Private Profiles**: Never show contact details regardless of role
- **Tenant Isolation**: Only members from same organization

---

## 🔧 Environment Variables

Required environment variables for mobile API:

```bash
# Mobile JWT Secret (64+ characters for HS512)
MOBILE_JWT_SECRET="your-secure-jwt-secret-key-at-least-64-characters-long"

# CORS Origins (comma-separated)
MOBILE_CORS_ORIGINS="https://www.drouple.app,https://api.drouple.app,https://mobile.drouple.app"

# Rate Limiting (requests per minute per IP)
RATE_LIMIT_MOBILE="60"
```

### Development Example:
```bash
MOBILE_JWT_SECRET="dev-jwt-secret-key-change-in-production-minimum-64-chars"
MOBILE_CORS_ORIGINS="http://localhost:3000,http://localhost:8081,exp://192.168.1.100:19000"
RATE_LIMIT_MOBILE="60"
```

### Production Example:
```bash
MOBILE_JWT_SECRET="production-jwt-secret-64-chars-minimum-change-this-value"
MOBILE_CORS_ORIGINS="https://www.drouple.app,https://api.drouple.app,https://mobile.drouple.app"
RATE_LIMIT_MOBILE="120"
```

---

## 🛡️ Security Features

### Rate Limiting
- **Auth Endpoints**: 3 requests per hour per IP
- **API Endpoints**: 60 requests per minute per IP (configurable)
- **Gradual Backoff**: Exponential delays for repeated violations

### CORS Configuration
- **Configurable Origins**: Environment-defined allowed origins
- **Credentials Support**: Enabled for authenticated requests
- **Method Restrictions**: Only allowed HTTP methods

### Input Validation
- **Zod Schemas**: All inputs validated with detailed error messages
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding

### Error Handling
- **Consistent Format**: Standardized error response structure
- **No Information Disclosure**: Production errors don't leak sensitive data
- **Proper HTTP Codes**: Semantic status codes for different error types

---

## 📋 Example Request Flows

### Complete Authentication Flow

```javascript
// 1. Login
const loginResponse = await fetch('/api/mobile/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'member@church.com',
    password: 'secure_password'
  })
});

const { accessToken, refreshToken, user } = await loginResponse.json();

// 2. Use access token for API calls
const eventsResponse = await fetch('/api/mobile/v1/events?upcoming=true', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const events = await eventsResponse.json();

// 3. Refresh token when access token expires
const refreshResponse = await fetch('/api/mobile/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

const { accessToken: newAccessToken } = await refreshResponse.json();
```

### Idempotent Check-in Flow

```javascript
// Generate unique client request ID
const clientRequestId = `checkin-${Date.now()}-${Math.random().toString(36)}`;

// Check-in request (safe to retry)
const checkinResponse = await fetch('/api/mobile/v1/checkins', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    clientRequestId,
    memberId: user.id,
    serviceId: 'service-123',
    newBeliever: false
  })
});

const checkin = await checkinResponse.json();
// Returns: { id: "checkin-456", status: "ok" } or { status: "duplicate" }
```

### Directory Search with Role-based Results

```javascript
// Search directory (results depend on user role)
const searchResponse = await fetch('/api/mobile/v1/directory/search?q=john', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

const members = await searchResponse.json();

// Member role sees: [{ id, name, roles }]
// Leader role sees: [{ id, name, roles, phone?, email? }]
```

---

## 🐛 Error Response Format

All endpoints return consistent error responses:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: Missing or invalid authentication
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `TENANT_MISMATCH`: Cross-tenant access attempted
- `VALIDATION_ERROR`: Invalid request data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `DUPLICATE_REQUEST`: Idempotent request already processed

---

## 🔄 API Versioning

The mobile API uses URL-based versioning:

- **Current**: `/api/mobile/v1/*`
- **Future**: `/api/mobile/v2/*`

### Deprecation Policy
- New versions maintain backward compatibility for 6 months
- Deprecated endpoints return `Deprecation` header
- Breaking changes only in major version updates

---

## 🚀 Getting Started

### 1. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Update mobile API variables
MOBILE_JWT_SECRET="your-64-char-secret"
MOBILE_CORS_ORIGINS="your-app-origins"  
RATE_LIMIT_MOBILE="60"
```

### 2. Test Authentication
```bash
# Development
curl -X POST http://localhost:3000/api/mobile/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@church.com","password":"password"}'

# Production
curl -X POST https://www.drouple.app/api/mobile/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@church.com","password":"password"}'
```

### 3. Test Protected Endpoint
```bash
# Development
curl -X GET http://localhost:3000/api/mobile/v1/events \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Production
curl -X GET https://www.drouple.app/api/mobile/v1/events \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📞 Support

For mobile API support:
- **Documentation**: This README
- **Test Suite**: Run `npm run test:unit -- __tests__/api/mobile/v1/`
- **Issues**: GitHub Issues
- **Security**: Report privately to security team

---

*Last Updated: January 2025*
*API Version: v1.0.0*