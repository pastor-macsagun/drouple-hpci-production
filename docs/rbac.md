# RBAC (Role-Based Access Control) System

## Overview

The HPCI-ChMS implements a hierarchical RBAC system with multi-tenancy support. Each user has a global role and can have church-specific memberships with potentially different roles.

## Role Hierarchy

```
SUPER_ADMIN (6)
    ↓
PASTOR (5)
    ↓
ADMIN (4)
    ↓
VIP (3)
    ↓
LEADER (2)
    ↓
MEMBER (1)
```

Higher-level roles inherit all permissions of lower-level roles.

## Database Models

### Church
- Represents a parent church organization (e.g., HPCI)
- Has multiple LocalChurches

### LocalChurch
- Represents a physical church location
- Belongs to a Church
- Has members through Membership model
- All data is scoped to LocalChurch for multi-tenancy

### Membership
- Links Users to LocalChurches
- Contains church-specific role
- Tracks join/leave dates

### AuditLog
- Records all administrative actions
- Includes actor, action, entity, and metadata
- Scoped by localChurchId when applicable

## RBAC Helper Functions

### `requireRole(role, options?)`
Ensures the current user has the required role or higher.

```typescript
// Require CHURCH_ADMIN globally
const user = await requireRole(UserRole.CHURCH_ADMIN)

// Require LEADER in specific church
const user = await requireRole(UserRole.LEADER, {
  localChurchId: 'church-id'
})
```

### `assertTenant(entity, localChurchId)`
Verifies an entity belongs to the specified church.

```typescript
const event = await prisma.event.findUnique({ where: { id } })
assertTenant(event, user.localChurchId)
```

### `scopeQueryByChurch(query, user)`
Automatically scopes database queries by user's church memberships.

```typescript
const query = { where: { active: true } }
const scopedQuery = await scopeQueryByChurch(query, user)
// Query now includes localChurchId filter
```

### `logAudit(params)`
Records administrative actions for compliance and debugging.

```typescript
await logAudit({
  actorId: user.id,
  action: 'CREATE_EVENT',
  entity: 'Event',
  entityId: event.id,
  localChurchId: event.localChurchId,
  meta: { title: event.title }
})
```

## Implementation Examples

### Server Action with RBAC

```typescript
async function createEvent(data: EventData) {
  'use server'
  
  // Require LEADER role in the target church
  const user = await requireRole(UserRole.LEADER, {
    localChurchId: data.localChurchId
  })
  
  const event = await prisma.event.create({
    data: {
      ...data,
      createdById: user.id
    }
  })
  
  await logAudit({
    actorId: user.id,
    action: 'CREATE_EVENT',
    entity: 'Event',
    entityId: event.id,
    localChurchId: event.localChurchId,
    meta: { title: event.title }
  })
  
  return event
}
```

### Multi-Church Query

```typescript
async function getMembers() {
  const user = await getCurrentUser()
  
  if (user.role === UserRole.SUPER_ADMIN) {
    // Super admin sees all
    return prisma.user.findMany()
  }
  
  // Others see only their church members
  const churchIds = user.memberships.map(m => m.localChurchId)
  return prisma.membership.findMany({
    where: {
      localChurchId: { in: churchIds }
    },
    include: { user: true }
  })
}
```

## Security Considerations

1. **Always verify church membership** before allowing data access
2. **Use assertTenant()** to prevent cross-church data leaks
3. **Log all administrative actions** via AuditLog
4. **Super Admins bypass** church-level checks but actions are still logged
5. **Default to least privilege** - start with MEMBER role

## Path → Role Mapping & Landing Rules

After successful authentication, users are redirected based on their role:

| Role | Landing Page | Description |
|------|--------------|-------------|
| SUPER_ADMIN | `/super` | Access to all churches, system administration |
| ADMIN/PASTOR | `/admin` | Church administration dashboard |
| VIP | `/vip` | VIP team management, first-timer follow-up |
| LEADER | `/leader` | Life group leadership dashboard |
| MEMBER | `/dashboard` | Standard member dashboard |

### Access Control Rules

- **SUPER_ADMIN**: Can access all role pages (`/super`, `/admin`, `/vip`, `/leader`, `/dashboard`)
- **ADMIN/PASTOR**: Can access `/admin` and `/dashboard` only
- **VIP**: Can access `/vip` and `/dashboard` only  
- **LEADER**: Can access `/leader` and `/dashboard` only
- **MEMBER**: Can access `/dashboard` only

### Implementation

Role-based redirects are handled in two places:
1. **Root page** (`app/page.tsx`): Redirects authenticated users to their role-specific page
2. **Middleware** (`middleware.ts`): Enforces access control and redirects unauthorized access to `/dashboard`

**Sign-in Flow**:
1. User submits credentials on `/auth/signin`
2. NextAuth redirect callback routes to `/` (root)
3. Root page checks user role and redirects to appropriate dashboard
4. Middleware enforces ongoing access control

## Admin Member Management

### Permissions

- **SUPER_ADMIN**: Full access to all members across all churches
  - Can create, edit, activate/deactivate any member
  - Can assign any role including SUPER_ADMIN
  - Can transfer members between churches
  - Can perform bulk operations on any members
  - **Can create admin accounts** using password generation system (see [Admin Account Creation](./admin-invitation-workflow.md))

- **PASTOR**: Full access to members within their church
  - Can create, edit, activate/deactivate members in their church
  - Can assign roles up to PASTOR level
  - Can perform bulk operations on church members
  - Cannot transfer members to other churches

- **ADMIN**: Full access to members within their church  
  - Can create, edit, activate/deactivate members in their church
  - Can assign roles up to ADMIN level
  - Can perform bulk operations on church members
  - Cannot transfer members to other churches

- **VIP**: Read-only access to member list
  - Can view member information for follow-up purposes
  - Cannot create, edit, or deactivate members
  - Can filter and search members

### Features

1. **Member CRUD Operations**
   - Create new member accounts manually
   - Edit member details (name, email, role)
   - Activate/deactivate member accounts
   - Assign and update member roles

2. **Bulk Operations**
   - Select multiple members for bulk actions
   - Bulk activate/deactivate members
   - Respects role and tenant permissions

3. **Search and Filter**
   - Search by name or email
   - Filter by church (SUPER_ADMIN only)
   - Server-side pagination for performance

4. **Export Functionality**
   - Export member list to CSV format
   - Includes name, email, role, status, church, contact info
   - Respects tenant isolation rules

### Security Considerations

- All operations respect multi-tenant isolation
- Role hierarchy enforced at action level
- Email uniqueness validated across system
- Audit logging for all administrative actions
- Prevention of self-role elevation

## Admin Account Creation System

### Overview
Super Admins can create admin accounts for local churches using a secure password generation system. This replaces the previous email-based invitation flow.

### Access Control
- **Only SUPER_ADMIN** can create admin accounts
- Can assign **ADMIN** or **PASTOR** roles only
- Cannot create additional SUPER_ADMIN accounts through this system

### Security Features
- Generated temporary passwords (format: `Swift-Mountain-847`)
- `mustChangePassword: true` flag forces immediate password change
- Middleware enforces password change before system access
- Credentials displayed only once in secure modal
- Complete audit trail of account creation

### Workflow
1. Super Admin navigates to `/super/local-churches/[id]/admins`
2. Fills form with email, name (optional), and role
3. System generates secure temporary password
4. Creates user account with `mustChangePassword` flag
5. Creates membership linking user to local church
6. Displays credentials in modal for secure distribution
7. Admin logs in and is forced to change password
8. Role-based redirect to appropriate dashboard

### RBAC Enforcement
```typescript
// Server action example
export async function inviteAdmin(localChurchId: string, formData: FormData) {
  // RBAC check - only SUPER_ADMIN allowed
  await requireRole(UserRole.SUPER_ADMIN)
  
  // Role validation - can only assign ADMIN or PASTOR
  if (![UserRole.ADMIN, UserRole.PASTOR].includes(validated.role)) {
    return { success: false, error: "Invalid role assignment" }
  }
  
  // Account creation logic...
  // Audit logging...
}
```

For complete implementation details, see [Admin Account Creation Workflow](./admin-invitation-workflow.md).

## Testing

Run RBAC tests:
```bash
npm run test lib/rbac.test.ts
```

Test coverage includes:
- Role hierarchy validation
- Cross-tenant write prevention
- Membership verification
- Audit logging
- Member management operations