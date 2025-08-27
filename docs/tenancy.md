# Multi-Tenancy Documentation

## Overview

HPCI-ChMS implements a multi-tenant architecture where each local church operates as an isolated tenant within the larger church network. This ensures data privacy and operational independence while maintaining network-wide coordination capabilities.

## Architecture

### Entity Hierarchy

```
Church (Network Level)
  └── LocalChurch (Tenant Level)
      ├── Memberships
      ├── Services
      ├── LifeGroups
      ├── Events (LOCAL_CHURCH scope)
      └── Other tenant-specific data

Shared Resources (Church Level)
  ├── Pathways
  ├── Events (WHOLE_CHURCH scope)
  └── System configurations
```

### Database Schema

#### Tenant Identification
Every tenant-scoped entity includes a `localChurchId` field:

```prisma
model Service {
  id            String       @id
  localChurchId String       // Tenant identifier
  date          DateTime
  // ...
  
  localChurch   LocalChurch  @relation(...)
  
  @@index([localChurchId])
}
```

#### Composite Indexes
For efficient tenant-scoped queries:

```prisma
@@index([localChurchId, date])
@@index([localChurchId, role])
```

## Tenant Isolation Strategy

### Repository Guards with Empty-Access Behavior

The system uses centralized tenant scoping functions in `lib/rbac.ts`:

```typescript
/**
 * Get accessible church IDs for the current user
 * Returns:
 * - undefined/null → throws explicit error  
 * - [] (empty array) → return empty array (caller must handle zero results)
 * - [churchIds] → return array of accessible church IDs
 */
export async function getAccessibleChurchIds(user): Promise<string[]> {
  if (!user) {
    throw new Error('No user provided for tenant scoping')
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    // For super admin without specific church filter, return all church IDs
    const churches = await db.localChurch.findMany({
      select: { id: true }
    })
    return churches.map(c => c.id)
  }

  // All other roles can only access their own church - if no tenantId, return empty
  if (!user.tenantId) {
    return [] // Empty array = zero results (critical for tenant isolation)
  }

  return [user.tenantId]
}

/**
 * Create tenant-scoped WHERE clause for Prisma queries
 * Supports both tenantId and localChurchId field names
 */
export async function createTenantWhereClause(
  user,
  additionalWhere = {},
  churchIdOverride?,
  fieldName: 'tenantId' | 'localChurchId' = 'tenantId'
): Promise<Record<string, unknown>> {
  const accessibleChurchIds = await getAccessibleChurchIds(user)
  
  // Empty access = zero results (critical for tenant isolation)
  if (accessibleChurchIds.length === 0) {
    return {
      ...additionalWhere,
      [fieldName]: { in: [] } // This will return zero results
    }
  }

  // Single church access
  if (accessibleChurchIds.length === 1) {
    return {
      ...additionalWhere,
      [fieldName]: accessibleChurchIds[0]
    }
  }

  // Multiple church access (super admin)
  return {
    ...additionalWhere,
    [fieldName]: { in: accessibleChurchIds }
  }
}
```

### Defense in Depth: Middleware Guard

The system includes Prisma middleware for additional protection (currently disabled but ready for deployment):

```typescript
// Defense in depth: Prisma middleware to enforce tenant scoping
client.$use(async (params, next) => {
  // Models that have tenant fields and need scoping
  const TENANT_MODELS = {
    User: 'tenantId',
    Service: 'localChurchId', 
    LifeGroup: 'localChurchId',
    Event: 'localChurchId'
  }

  if (!TENANT_MODELS[params.model] || user.role === 'SUPER_ADMIN') {
    return next(params)
  }

  const tenantField = TENANT_MODELS[params.model]
  
  // For read operations, inject tenant filter
  if (['findFirst', 'findMany', 'findUnique'].includes(params.action)) {
    if (!params.args) params.args = {}
    if (!params.args.where) params.args.where = {}
    
    if (!params.args.where[tenantField]) {
      const userTenantId = session.user.tenantId
      if (userTenantId) {
        params.args.where[tenantField] = userTenantId
      } else {
        // No tenant access - return zero results
        params.args.where[tenantField] = { in: [] }
      }
    }
  }

  return next(params)
})
```

### SUPER_ADMIN Bypass

Super administrators can bypass tenant restrictions but still follow security patterns:

```typescript
if (user.role === UserRole.SUPER_ADMIN) {
  // Access all churches
  const churches = await db.localChurch.findMany({
    select: { id: true }
  })
  return churches.map(c => c.id)
}
```

### 2. Application-Level Enforcement

Server actions validate tenant context:

```typescript
export async function updateService(serviceId: string, data: any) {
  const user = await getCurrentUser()
  const service = await db.service.findFirst({
    where: {
      id: serviceId,
      localChurchId: { in: user.localChurchIds }
    }
  })
  
  if (!service) {
    throw new ApplicationError('NOT_FOUND')
  }
  
  // Proceed with update
}
```

### 3. Middleware Protection

The TenantRepository pattern enforces isolation:

```typescript
class TenantRepository {
  constructor(
    private db: PrismaClient,
    private userLocalChurchIds: string[]
  ) {}
  
  private addTenantFilter(where: any = {}) {
    return {
      ...where,
      localChurchId: { in: this.userLocalChurchIds }
    }
  }
}
```

## User-Tenant Relationships

### Single Tenant Users
Most users belong to one local church:

```typescript
user.memberships = [{
  localChurchId: 'church_manila',
  role: UserRole.MEMBER
}]
```

### Multi-Tenant Users
Pastors and administrators may oversee multiple locations:

```typescript
pastor.memberships = [
  { localChurchId: 'church_manila', role: UserRole.PASTOR },
  { localChurchId: 'church_cebu', role: UserRole.PASTOR }
]
```

### System-Wide Access
Super administrators bypass tenant isolation:

```typescript
if (user.role === UserRole.SUPER_ADMIN) {
  // Access all tenants
  return new TenantRepository(db, allLocalChurchIds)
}
```

## Scoping Rules

### Strictly Tenant-Scoped Entities

These entities are always filtered by localChurchId:

- Services
- LifeGroups
- LOCAL_CHURCH Events
- Memberships
- Check-ins
- Attendance records

### Church-Scoped Entities

These entities are scoped at the church level:

- Pathways (shared across all local churches)
- WHOLE_CHURCH Events
- Church-wide announcements

### Global Entities

These entities are not tenant-scoped:

- Churches
- System configurations
- User accounts (but memberships are scoped)

## Event Scoping

Events have special scoping rules:

```typescript
enum EventScope {
  LOCAL_CHURCH  // Visible only to specific local church
  WHOLE_CHURCH  // Visible to all local churches
}

// Query logic
if (event.scope === EventScope.LOCAL_CHURCH) {
  // Must match user's localChurchId
} else {
  // WHOLE_CHURCH - visible to all
}
```

## Implementation Patterns

### Creating Tenant-Scoped Data

```typescript
export async function createLifeGroup(data: CreateLifeGroupData) {
  const user = await getCurrentUser()
  
  // Verify user can create in this tenant
  if (!user.localChurchIds.includes(data.localChurchId)) {
    throw new ApplicationError('TENANT_MISMATCH')
  }
  
  return db.lifeGroup.create({
    data: {
      ...data,
      localChurchId: data.localChurchId // Explicitly set tenant
    }
  })
}
```

### Reading Tenant-Scoped Data

```typescript
export async function getLifeGroups() {
  const repo = await createTenantRepository(db, session.user.email)
  return repo.findLifeGroups({ isActive: true })
}
```

### Updating Tenant-Scoped Data

```typescript
export async function updateLifeGroup(id: string, data: any) {
  const repo = await createTenantRepository(db, session.user.email)
  
  // This will throw if life group doesn't exist in user's tenant
  return repo.updateLifeGroup(id, data)
}
```

### Cross-Tenant Operations

Only SUPER_ADMIN can perform cross-tenant operations:

```typescript
export async function transferMember(
  userId: string,
  fromChurchId: string,
  toChurchId: string
) {
  const actor = await requireRole(UserRole.SUPER_ADMIN)
  
  // Update membership
  await db.membership.update({
    where: {
      userId_localChurchId: {
        userId,
        localChurchId: fromChurchId
      }
    },
    data: {
      localChurchId: toChurchId,
      leftAt: new Date()
    }
  })
  
  // Create new membership
  await db.membership.create({
    data: {
      userId,
      localChurchId: toChurchId,
      role: UserRole.MEMBER
    }
  })
}
```

## Testing Tenant Isolation

### Unit Tests

```typescript
describe('Tenant Isolation', () => {
  it('should filter queries by tenant', async () => {
    const repo = new TenantRepository(db, ['church1'])
    await repo.findServices()
    
    expect(db.service.findMany).toHaveBeenCalledWith({
      where: { localChurchId: { in: ['church1'] } }
    })
  })
  
  it('should prevent cross-tenant writes', async () => {
    const repo = new TenantRepository(db, ['church1'])
    
    await expect(
      repo.createService({ localChurchId: 'church2', date: new Date() })
    ).rejects.toThrow('Cannot create service for different tenant')
  })
})
```

### E2E Tests

```typescript
test('Admin cannot access other church data', async ({ page, adminAuth }) => {
  // Admin for Manila church
  await page.goto('/admin/services')
  
  // Should not see Cebu services
  await expect(page.getByText('Cebu Service')).not.toBeVisible()
  
  // Direct URL access should be blocked
  await page.goto('/admin/services/cebu-service-id')
  await expect(page).toHaveURL('/forbidden')
})
```

## Common Pitfalls

### 1. Forgetting Tenant Filter
❌ Wrong:
```typescript
const services = await db.service.findMany()
```

✅ Correct:
```typescript
const repo = await createTenantRepository(db, user.email)
const services = await repo.findServices()
```

### 2. Hardcoding Tenant IDs
❌ Wrong:
```typescript
data.localChurchId = 'church_manila'
```

✅ Correct:
```typescript
data.localChurchId = user.memberships[0].localChurchId
```

### 3. Mixing Scoping Levels
❌ Wrong:
```typescript
// Pathway is church-scoped, not localChurch-scoped
const pathway = await db.pathway.findFirst({
  where: { localChurchId: user.localChurchId }
})
```

✅ Correct:
```typescript
const pathway = await db.pathway.findFirst({
  where: { tenantId: user.tenantId }
})
```

## Migration Considerations

When adding tenancy to existing entities:

1. Add `localChurchId` field with migration
2. Backfill existing data with default tenant
3. Add indexes for performance
4. Update all queries to include tenant filter
5. Add validation in server actions
6. Update tests to verify isolation

## Performance Optimization

### Indexes
Always index the tenant identifier:

```prisma
@@index([localChurchId])
@@index([localChurchId, createdAt])
@@index([localChurchId, status])
```

### Query Optimization
Tenant filter should be the first WHERE condition:

```typescript
WHERE localChurchId = $1 AND date >= $2  // Good
WHERE date >= $1 AND localChurchId = $2  // Less optimal
```

### Caching
Cache tenant-specific data separately:

```typescript
const cacheKey = `services:${localChurchId}:${date}`
```