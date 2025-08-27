# RBAC (Role-Based Access Control) Documentation

## Role Hierarchy
```
SUPER_ADMIN > PASTOR > ADMIN > LEADER > MEMBER
```

## Role Permissions

### MEMBER
- View events and RSVP
- Join life groups (with approval)
- Self check-in to services
- View and enroll in pathways
- View own profile

### LEADER
- All MEMBER permissions
- Manage assigned life groups
- Mark attendance for groups
- Create LOCAL_CHURCH events
- Mark pathway progress for members
- View member profiles

### ADMIN
- All LEADER permissions
- Manage all life groups in church
- Create and manage services
- Manage all events
- Manage pathways and steps
- View attendance reports
- Export CSV data

### PASTOR
- All ADMIN permissions
- Manage local churches
- Cross-church visibility
- Approve church admins

### SUPER_ADMIN
- Full system access
- Multi-church management
- System configuration
- Audit log access

## Tenant Isolation
- Users can only see data from their church
- Exception: WHOLE_CHURCH events visible to all
- SUPER_ADMIN can access all churches

## Post-Login Redirects

Based on user role, after successful login users are redirected to:

- **SUPER_ADMIN**: `/super` - System administration dashboard
- **All other roles**: `/dashboard?lc=<primaryLocalChurchId>` - Church-specific dashboard

The primary local church is determined by the user's most recent active membership.

## Implementation
```typescript
import { hasMinRole, hasAnyRole } from '@/lib/rbac'

// Check minimum role
if (!hasMinRole(user, UserRole.ADMIN)) {
  throw new Error('Unauthorized')
}

// Check specific roles
if (!hasAnyRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN])) {
  throw new Error('Forbidden')
}
```