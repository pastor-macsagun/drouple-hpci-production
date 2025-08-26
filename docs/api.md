# API Documentation

## Overview

HPCI-ChMS uses server actions and route handlers for API functionality. All actions require authentication unless explicitly noted as public.

## Authentication

Authentication is handled via NextAuth with Credentials Provider (email + password). Sessions are JWT-based with bcrypt password hashing.

## Error Handling

All server actions return a standardized response format:

```typescript
interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: ErrorCode
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | User is not authenticated |
| `FORBIDDEN` | User lacks required permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Invalid input data |
| `DUPLICATE_ENTRY` | Resource already exists |
| `TENANT_MISMATCH` | Cross-tenant access attempted |
| `CAPACITY_FULL` | Resource at maximum capacity |
| `RATE_LIMITED` | Too many requests |
| `EMAIL_EXISTS` | Email already registered |
| `SERVER_ERROR` | Internal server error |

## API Endpoints

### Health Check
- **GET** `/api/health` - Application health status
- **GET** `/api/health/db` - Database connectivity check

### Authentication
- **POST** `/api/auth/signin` - Sign in with email
- **POST** `/api/auth/signout` - Sign out
- **GET** `/api/auth/session` - Get current session
- **GET** `/api/auth/providers` - List auth providers

## Entity Schemas

### User

```typescript
interface User {
  id: string
  email: string
  name?: string
  role: UserRole
  tenantId?: string
  isNewBeliever: boolean
  emailVerified?: Date
  createdAt: Date
  updatedAt: Date
}

enum UserRole {
  SUPER_ADMIN
  PASTOR
  ADMIN
  LEADER
  MEMBER
}
```

### Church & LocalChurch

```typescript
interface Church {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

interface LocalChurch {
  id: string
  name: string
  churchId: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
  createdAt: Date
  updatedAt: Date
}
```

### Membership

```typescript
interface Membership {
  id: string
  userId: string
  localChurchId: string
  role: UserRole
  isNewBeliever: boolean
  joinedAt: Date
  leftAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### LifeGroup

```typescript
interface LifeGroup {
  id: string
  name: string
  description?: string
  capacity: number
  leaderId: string
  localChurchId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface LifeGroupMembership {
  id: string
  lifeGroupId: string
  userId: string
  status: MembershipStatus
  joinedAt: Date
  leftAt?: Date
}

enum MembershipStatus {
  ACTIVE
  INACTIVE
  LEFT
}
```

### Event

```typescript
interface Event {
  id: string
  name: string
  description?: string
  startDateTime: Date
  endDateTime: Date
  location?: string
  capacity: number
  scope: EventScope
  localChurchId?: string
  requiresPayment: boolean
  feeAmount?: number
  visibleToRoles: UserRole[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

enum EventScope {
  LOCAL_CHURCH
  WHOLE_CHURCH
}

interface EventRsvp {
  id: string
  eventId: string
  userId: string
  status: RsvpStatus
  hasPaid: boolean
  rsvpAt: Date
  cancelledAt?: Date
}

enum RsvpStatus {
  GOING
  WAITLIST
  CANCELLED
}
```

### Pathway

```typescript
interface Pathway {
  id: string
  name: string
  description?: string
  type: PathwayType
  tenantId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

enum PathwayType {
  ROOTS    // Auto-enroll for new believers
  VINES    // Opt-in discipleship
  RETREAT  // Event-based
}

interface PathwayEnrollment {
  id: string
  pathwayId: string
  userId: string
  status: EnrollmentStatus
  enrolledAt: Date
  completedAt?: Date
  droppedAt?: Date
}

enum EnrollmentStatus {
  ENROLLED
  COMPLETED
  DROPPED
}
```

## Server Actions

### Authentication Actions

#### Register Member (Public)
```typescript
registerMember(data: {
  email: string
  name: string
  localChurchId: string
  isNewBeliever?: boolean
}): Promise<ActionResponse>
```
- Creates new user account
- Creates membership for selected local church
- Auto-enrolls in ROOTS pathway if new believer
- Creates account with hashed password

### Church Management (SUPER_ADMIN only)

#### Create Church
```typescript
createChurch(data: {
  name: string
  description?: string
}): Promise<ActionResponse<Church>>
```

#### Update Church
```typescript
updateChurch(
  churchId: string,
  data: Partial<Church>
): Promise<ActionResponse<Church>>
```

#### Create Local Church
```typescript
createLocalChurch(data: {
  name: string
  churchId: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  phone?: string
  email?: string
}): Promise<ActionResponse<LocalChurch>>
```

#### Invite Admin
```typescript
inviteAdmin(
  localChurchId: string,
  data: {
    email: string
    name?: string
    role: 'PASTOR' | 'ADMIN'
  }
): Promise<ActionResponse>
```
- Creates user if doesn't exist
- Sends invitation email
- Creates membership with specified role

### LifeGroup Actions

#### Create LifeGroup (ADMIN+)
```typescript
createLifeGroup(data: {
  name: string
  description?: string
  capacity: number
  leaderId: string
  localChurchId: string
}): Promise<ActionResponse<LifeGroup>>
```

#### Request to Join (MEMBER+)
```typescript
requestToJoinLifeGroup(
  lifeGroupId: string
): Promise<ActionResponse>
```

#### Approve Member Request (LEADER+)
```typescript
approveMemberRequest(
  requestId: string
): Promise<ActionResponse>
```

#### Mark Attendance (LEADER+)
```typescript
markAttendance(
  sessionId: string,
  attendances: Array<{
    userId: string
    present: boolean
  }>
): Promise<ActionResponse>
```

### Event Actions

#### Create Event (ADMIN+)
```typescript
createEvent(data: {
  name: string
  description?: string
  startDateTime: Date
  endDateTime: Date
  location?: string
  capacity: number
  scope: EventScope
  localChurchId?: string
  requiresPayment?: boolean
  feeAmount?: number
  visibleToRoles?: UserRole[]
}): Promise<ActionResponse<Event>>
```

#### RSVP to Event (MEMBER+)
```typescript
rsvpToEvent(
  eventId: string
): Promise<ActionResponse<EventRsvp>>
```
- Automatically adds to waitlist if at capacity
- Checks role-based visibility

#### Cancel RSVP (MEMBER+)
```typescript
cancelRsvp(
  eventId: string
): Promise<ActionResponse>
```
- Promotes next waitlist member if space opens

#### Mark as Paid (ADMIN+)
```typescript
markAsPaid(
  rsvpId: string
): Promise<ActionResponse>
```

### Pathway Actions

#### Create Pathway (ADMIN+)
```typescript
createPathway(data: {
  name: string
  description?: string
  type: PathwayType
  tenantId: string
}): Promise<ActionResponse<Pathway>>
```

#### Enroll in Pathway (MEMBER+)
```typescript
enrollInPathway(
  pathwayId: string
): Promise<ActionResponse<PathwayEnrollment>>
```

#### Complete Step (LEADER+)
```typescript
completePathwayStep(data: {
  stepId: string
  userId: string
  notes?: string
}): Promise<ActionResponse>
```
- Automatically marks pathway complete when all steps done

### Check-In Actions

#### Self Check-In (Public with rate limiting)
```typescript
selfCheckIn(data: {
  email: string
  localChurchId: string
  isNewBeliever?: boolean
}): Promise<ActionResponse>
```
- Rate limited to prevent duplicates
- Auto-enrolls new believers in ROOTS

## RBAC Permissions

### Role Hierarchy
1. SUPER_ADMIN - Full system access
2. PASTOR - Church-wide management
3. ADMIN - Local church management
4. LEADER - LifeGroup/team management
5. MEMBER - Self-service only

### Entity Permissions Matrix

| Entity | SUPER_ADMIN | PASTOR | ADMIN | LEADER | MEMBER |
|--------|-------------|---------|--------|---------|---------|
| Church | CRUD | R | R | - | - |
| LocalChurch | CRUD | RU | R | R | R |
| User | CRUD | CRU | CRU | R | R |
| LifeGroup | CRUD | CRUD | CRUD | RU* | R |
| Event | CRUD | CRUD | CRUD | R | R |
| Pathway | CRUD | CRUD | CRUD | RU** | R |

\* Leaders can only update their own LifeGroups
\** Leaders can update pathway progress

## Tenant Scoping

All queries are automatically filtered by `localChurchId` based on user's membership(s), except:

1. SUPER_ADMIN - Access to all tenants
2. WHOLE_CHURCH events - Visible across all local churches
3. Church-level entities (pathways) - Scoped by church, not local church

### Example Scoped Query
```typescript
// Automatically filtered by user's localChurchId(s)
const services = await tenantRepo.findServices({
  date: { gte: startOfWeek }
})

// For SUPER_ADMIN, returns all services
// For ADMIN in Manila, returns only Manila services
// For MEMBER in Cebu, returns only Cebu services
```

## Rate Limiting

The following endpoints have rate limiting:

- `/checkin` - 1 check-in per email per service
- `/register` - 3 attempts per email per hour
- Login attempts - 5 per email per 15 minutes

## CSV Export

The following entities support CSV export:

- Event attendees (with payment status)
- LifeGroup roster
- LifeGroup attendance history
- Service check-ins

Example export format:
```csv
Name,Email,Status,Payment,RSVP Date
John Doe,john@example.com,GOING,Paid,2024-01-15
Jane Smith,jane@example.com,WAITLIST,Pending,2024-01-16
```