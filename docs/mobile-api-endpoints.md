# Mobile API Endpoints Documentation

This document provides comprehensive documentation for all REST API endpoints created for the Drouple mobile app. All endpoints follow consistent patterns for authentication, RBAC enforcement, tenant isolation, and error handling.

## Base URL
All mobile API endpoints are prefixed with `/api/mobile/`

## Authentication
All endpoints require authentication via NextAuth.js sessions. Include session cookies with all requests.

## Response Format
All endpoints return consistent JSON responses:

```json
{
  "success": boolean,
  "data": any,           // On success
  "error": string,       // On error
  "code": string         // Error code for programmatic handling
}
```

## Error Codes
- `UNAUTHORIZED` - Not authenticated (401)
- `FORBIDDEN` - Insufficient permissions (403)
- `NOT_FOUND` - Resource not found (404)
- `VALIDATION_ERROR` - Invalid request data (400)
- `INTERNAL_ERROR` - Server error (500)
- Domain-specific codes as documented per endpoint

---

## 1. Authentication Endpoints

### POST /api/mobile/auth/login
Mobile-specific login endpoint that works with NextAuth.js

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "deviceInfo": {
    "deviceId": "string?",
    "deviceName": "string?",
    "platform": "ios|android|web?",
    "version": "string?"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "message": "Login successful",
    "redirectUrl": "string"
  }
}
```

**Error Codes:** `RATE_LIMIT_EXCEEDED`, `INVALID_CREDENTIALS`, `AUTH_FAILED`

### GET /api/mobile/auth/session
Get current session information formatted for mobile

**Success Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "UserRole",
      "tenantId": "string",
      "isNewBeliever": "boolean",
      "memberStatus": "MemberStatus",
      "mustChangePassword": "boolean",
      "profile": { /* user profile data */ },
      "primaryChurch": { /* church data */ },
      "allMemberships": [ /* membership array */ ]
    },
    "sessionExpires": "datetime"
  }
}
```

### POST /api/mobile/devices/register
Register mobile device for push notifications

**Request Body:**
```json
{
  "deviceId": "string",
  "pushToken": "string",
  "platform": "ios|android",
  "deviceName": "string?",
  "appVersion": "string?",
  "osVersion": "string?"
}
```

### GET /api/mobile/devices/register
Get registered devices for the user

---

## 2. Check-in System APIs

### GET /api/mobile/services
List active services for check-in

**Query Parameters:**
- `date` - Target date (ISO string, optional, defaults to today)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "id": "string",
        "date": "datetime",
        "attendanceCount": "number",
        "church": { /* church info */ },
        "canCheckIn": "boolean"
      }
    ],
    "date": "datetime"
  }
}
```

### POST /api/mobile/checkin
Member check-in to service

**Request Body:**
```json
{
  "serviceId": "string",
  "isNewBeliever": "boolean?",
  "location": {
    "latitude": "number?",
    "longitude": "number?",
    "accuracy": "number?"
  }
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "checkin": { /* checkin data */ },
    "service": { /* service data */ },
    "message": "string"
  }
}
```

**Error Codes:** `SERVICE_NOT_FOUND`, `ALREADY_CHECKED_IN`

### GET /api/mobile/checkin/history
Get user's check-in history

**Query Parameters:**
- `limit` - Number of records (default: 20)
- `offset` - Pagination offset (default: 0)

### POST /api/mobile/checkin/qr/validate
Validate QR code for check-in

**Request Body:**
```json
{
  "qrCode": "string"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "service": { /* service data */ },
    "validation": {
      "isValid": "boolean",
      "canCheckIn": "boolean",
      "alreadyCheckedIn": "boolean",
      "checkedInAt": "datetime?"
    },
    "message": "string"
  }
}
```

**Error Codes:** `INVALID_QR_CODE`, `CHURCH_MISMATCH`, `QR_CODE_EXPIRED`

---

## 3. Events & RSVP APIs

### GET /api/mobile/events
List upcoming events

**Query Parameters:**
- `limit` - Number of records (default: 20)
- `offset` - Pagination offset (default: 0)
- `upcoming` - Filter to upcoming events only (default: false)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "startDateTime": "datetime",
        "endDateTime": "datetime",
        "location": "string",
        "capacity": "number",
        "attendeeCount": "number",
        "spotsLeft": "number",
        "isFull": "boolean",
        "scope": "EventScope",
        "requiresPayment": "boolean",
        "feeAmount": "number?",
        "church": { /* church data */ },
        "userRsvp": { /* user's RSVP status */ },
        "canRsvp": "boolean"
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### GET /api/mobile/events/[id]
Get event details

**Success Response:** Includes full event details with attendee info (for admins) and user's RSVP status.

### POST /api/mobile/events/[id]/rsvp
RSVP to event

**Request Body:**
```json
{
  "isNewBeliever": "boolean?",
  "notes": "string?"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "rsvp": { /* RSVP data */ },
    "event": { /* event data */ },
    "message": "string"
  }
}
```

**Error Codes:** `EVENT_NOT_AVAILABLE`, `ALREADY_REGISTERED`

### DELETE /api/mobile/events/[id]/rsvp
Cancel RSVP

---

## 4. Life Groups APIs

### GET /api/mobile/lifegroups
List life groups

**Query Parameters:**
- `type` - Filter type: 'available', 'my', 'all' (default: 'available')
- `limit` - Number of records (default: 20)
- `offset` - Pagination offset (default: 0)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "lifeGroups": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "capacity": "number",
        "memberCount": "number",
        "spotsLeft": "number",
        "isFull": "boolean",
        "isActive": "boolean",
        "leader": { /* leader info */ },
        "church": { /* church info */ },
        "userStatus": {
          "isMember": "boolean",
          "hasPendingRequest": "boolean",
          "canJoin": "boolean"
        }
      }
    ],
    "pagination": { /* pagination info */ }
  }
}
```

### GET /api/mobile/lifegroups/[id]
Get life group details

**Success Response:** Includes full group details, member list (filtered by privacy), and user's relationship status.

### POST /api/mobile/lifegroups/[id]/join
Request to join or directly join life group

**Request Body:**
```json
{
  "message": "string?",
  "autoJoin": "boolean?" // For groups with available spots
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "type": "membership|request",
    "membership": { /* membership data */ }, // If autoJoin successful
    "request": { /* request data */ },      // If request created
    "message": "string"
  }
}
```

**Error Codes:** `GROUP_NOT_FOUND`, `ALREADY_MEMBER`, `REQUEST_PENDING`

### DELETE /api/mobile/lifegroups/[id]/join
Leave life group

**Error Codes:** `NOT_MEMBER`, `LEADER_CANNOT_LEAVE`

---

## 5. Discipleship Pathways APIs

### GET /api/mobile/pathways
List pathways

**Query Parameters:**
- `type` - Filter type: 'all', 'enrolled', 'available' (default: 'all')
- `includeCompleted` - Include completed pathways (default: false)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "enrolled": [ /* enrolled pathways with progress */ ],
    "available": [ /* available pathways */ ],
    "summary": {
      "totalEnrolled": "number",
      "totalAvailable": "number",
      "totalCompleted": "number"
    }
  }
}
```

### GET /api/mobile/pathways/[id]
Get pathway details with progress

**Success Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "description": "string",
    "type": "PathwayType",
    "enrollment": { /* enrollment status */ },
    "progress": {
      "totalSteps": "number",
      "completedSteps": "number",
      "percentage": "number",
      "nextStep": { /* next incomplete step */ }
    },
    "steps": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "orderIndex": "number",
        "isCompleted": "boolean",
        "completedAt": "datetime?",
        "completedBy": "string?",
        "notes": "string?",
        "isNext": "boolean"
      }
    ],
    "userStatus": {
      "isEnrolled": "boolean",
      "canEnroll": "boolean",
      "canComplete": "boolean",
      "isCompleted": "boolean"
    }
  }
}
```

### POST /api/mobile/pathways/[id]/enroll
Enroll in pathway

**Success Response:**
```json
{
  "success": true,
  "data": {
    "enrollment": { /* enrollment data */ },
    "pathway": { /* pathway info */ },
    "nextStep": { /* first step */ },
    "message": "string"
  }
}
```

**Error Codes:** `PATHWAY_INACTIVE`, `AUTO_ENROLLMENT_ONLY`, `ALREADY_ENROLLED`

### DELETE /api/mobile/pathways/[id]/enroll
Drop from pathway

**Error Codes:** `NOT_ENROLLED`, `REQUIRED_PATHWAY`

### POST /api/mobile/pathways/[pathwayId]/steps/[stepId]/complete
Complete pathway step

**Request Body:**
```json
{
  "notes": "string?",
  "completedBy": "string?" // For leader verification
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "progress": { /* progress record */ },
    "step": { /* completed step */ },
    "pathway": {
      "id": "string",
      "name": "string",
      "isCompleted": "boolean",
      "progress": { /* updated progress */ }
    },
    "nextStep": { /* next incomplete step */ },
    "message": "string"
  }
}
```

**Error Codes:** `NOT_ENROLLED`, `STEP_NOT_FOUND`, `ALREADY_COMPLETED`

---

## 6. Member Directory APIs

### GET /api/mobile/members
List members with RBAC filtering

**Query Parameters:**
- `limit` - Number of records (default: 20)
- `offset` - Pagination offset (default: 0)
- `role` - Filter by role
- `activeOnly` - Show only active members (default: true)

**Success Response:**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "string",
        "name": "string",
        "role": "UserRole",
        "isNewBeliever": "boolean",
        "memberStatus": "MemberStatus",
        "joinedAt": "datetime",
        "isYou": "boolean",
        "church": { /* church info */ },
        "contact": { /* contact info based on privacy */ },
        "profile": { /* profile info based on privacy */ },
        "privacyLevel": "full|limited"
      }
    ],
    "pagination": { /* pagination info */ },
    "filters": {
      "roleCounts": { /* role distribution */ }
    },
    "userPermissions": {
      "isLeader": "boolean",
      "isAdmin": "boolean",
      "canViewAllProfiles": "boolean"
    }
  }
}
```

### GET /api/mobile/members/search
Search members by name or email

**Query Parameters:**
- `q` - Search query (minimum 2 characters)
- `limit` - Number of records (default: 10)
- `offset` - Pagination offset (default: 0)
- `role` - Filter by role
- `activeOnly` - Show only active members (default: true)

**Success Response:** Similar to members list but includes highlighted search terms and relevance scoring.

**Error Codes:** `INVALID_QUERY`

---

## 7. Notifications APIs

### GET /api/mobile/notifications
List user notifications

**Query Parameters:**
- `limit` - Number of records (default: 20)
- `offset` - Pagination offset (default: 0)
- `unreadOnly` - Show only unread notifications (default: false)
- `category` - Filter by category

**Success Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "string",
        "title": "string",
        "message": "string",
        "type": "info|warning|success|error",
        "category": "general|event|lifegroup|pathway|checkin|admin",
        "isRead": "boolean",
        "readAt": "datetime?",
        "actionUrl": "string?",
        "actionText": "string?",
        "createdAt": "datetime",
        "expiresAt": "datetime?"
      }
    ],
    "pagination": { /* pagination info */ },
    "summary": {
      "totalCount": "number",
      "unreadCount": "number",
      "categoryCounts": { /* counts by category */ }
    }
  }
}
```

### POST /api/mobile/notifications
Create notification (system use)

**Request Body:**
```json
{
  "title": "string",
  "message": "string",
  "type": "info|warning|success|error?",
  "category": "general|event|lifegroup|pathway|checkin|admin?",
  "actionUrl": "string?",
  "actionText": "string?",
  "expiresAt": "datetime?"
}
```

### POST /api/mobile/notifications/[id]/read
Mark notification as read

### DELETE /api/mobile/notifications/[id]/read
Mark notification as unread

### POST /api/mobile/notifications/push/register
Register for push notifications

**Request Body:**
```json
{
  "pushToken": "string",
  "platform": "ios|android",
  "deviceId": "string",
  "preferences": {
    "events": "boolean?",
    "lifegroups": "boolean?",
    "pathways": "boolean?",
    "checkins": "boolean?",
    "announcements": "boolean?",
    "general": "boolean?"
  }
}
```

### GET /api/mobile/notifications/push/register
Get push registration settings

### PUT /api/mobile/notifications/push/register
Update push notification preferences

**Request Body:**
```json
{
  "deviceId": "string",
  "preferences": { /* partial preferences object */ }
}
```

---

## Security Features

1. **Authentication**: All endpoints require valid NextAuth.js sessions
2. **RBAC Enforcement**: Role-based access control with proper hierarchy
3. **Tenant Isolation**: Multi-church data isolation using `createTenantWhereClause()`
4. **Rate Limiting**: Login endpoint includes rate limiting
5. **Input Validation**: All inputs validated with Zod schemas
6. **Privacy Controls**: Profile visibility and contact preferences respected
7. **Error Handling**: Consistent error responses with appropriate HTTP status codes

## Data Models

The APIs work with the existing Prisma database models:
- User, Church, LocalChurch, Membership
- Service, Checkin
- Event, EventRsvp
- LifeGroup, LifeGroupMembership, LifeGroupMemberRequest
- Pathway, PathwayStep, PathwayEnrollment, PathwayProgress
- KeyValue (for notifications and device registrations)

## Mobile App Integration

These endpoints are designed specifically for mobile app consumption with:
- Optimized response formats
- Proper pagination support
- Mobile-specific fields (device info, location data, etc.)
- Privacy-aware data filtering
- Push notification support
- Offline-friendly data structures

All endpoints follow RESTful conventions and include comprehensive error handling for robust mobile app integration.