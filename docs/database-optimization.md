# Database Optimization

## Overview

This document outlines the database optimization strategies implemented in the HPCI-ChMS system, focusing on indexing, query optimization, and performance best practices.

## Indexing Strategy

### Critical Indexes (High Impact)

#### User Table
- `tenantId` - Multi-tenant filtering
- `tenantId, role` - Role-based queries per tenant
- `email, tenantId` - Authentication lookups
- `role` - Admin queries across tenants
- `isNewBeliever` - New believer reports

#### Authentication Tables
- `accounts.userId` - Account lookups during auth
- `accounts.provider` - Provider-specific queries
- `sessions.userId` - Session validation
- `sessions.expires` - Session cleanup

### Application-Specific Indexes

#### Check-in System
- `checkins(serviceId, checkedInAt)` - Service attendance reports
- `services(localChurchId, date)` - Church service queries

#### LifeGroups
- `life_groups(localChurchId, isActive)` - Active group listings
- `life_group_memberships(lifeGroupId, status)` - Active member counts
- `life_group_memberships(userId, status)` - User's active groups

#### Events
- `events(localChurchId, startDateTime)` - Upcoming events
- `events(scope, startDateTime)` - Scoped event queries
- `event_rsvps(eventId, status)` - Event capacity management
- `event_rsvps(status, rsvpAt)` - Waitlist processing

#### Pathways
- `pathways(tenantId, type, isActive)` - Active pathway lookups
- `pathway_enrollments(userId, status)` - User enrollments
- `pathway_progress(userId, completedAt)` - Progress tracking

### Audit and Monitoring
- `audit_logs(localChurchId, createdAt)` - Church activity reports
- `audit_logs(actorId, createdAt)` - User activity tracking
- `audit_logs(createdAt)` - Log retention cleanup

## Query Optimization Patterns

### Multi-Tenant Queries
```sql
-- Always filter by tenantId first
SELECT * FROM users 
WHERE tenantId = ? AND role = ?

-- Index: (tenantId, role)
```

### Date Range Queries
```sql
-- Use compound indexes for date ranges
SELECT * FROM checkins 
WHERE serviceId = ? 
AND checkedInAt BETWEEN ? AND ?

-- Index: (serviceId, checkedInAt)
```

### Status-Based Filtering
```sql
-- Combine foreign keys with status
SELECT * FROM life_group_memberships 
WHERE lifeGroupId = ? AND status = 'ACTIVE'

-- Index: (lifeGroupId, status)
```

## Best Practices

### 1. Index Selection
- Create indexes on foreign keys
- Use compound indexes for common query patterns
- Index discriminator columns (status, type, role)
- Consider covering indexes for read-heavy queries

### 2. Query Patterns
- Filter by indexed columns first
- Use LIMIT for pagination
- Avoid SELECT * in production code
- Use EXISTS instead of COUNT for existence checks

### 3. Monitoring
```typescript
// Log slow queries
import { dbLogger } from '@/lib/logger'

const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE tenantId = ${tenantId}
`
dbLogger.debug('Query executed', { duration: performance.now() - start })
```

### 4. Connection Pooling
```typescript
// Use connection pooling for serverless
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // Pooled connection
    }
  }
})
```

## Performance Metrics

### Expected Improvements
- **Authentication queries**: 50-70% faster with user/account indexes
- **Multi-tenant filtering**: 60-80% faster with tenantId indexes
- **Report generation**: 40-60% faster with date compound indexes
- **Dashboard loading**: 30-50% faster with status indexes

### Monitoring Queries
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
ORDER BY n_distinct DESC;

-- Identify slow queries
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;
```

## Migration Guide

### Applying Index Migration
```bash
# Generate Prisma client with new indexes
npm run db:generate

# Apply migration to database
npx prisma migrate deploy

# Or for development
npx prisma db push
```

### Index Creation Impact
- Indexes are created with `IF NOT EXISTS` clause
- Creation is online and non-blocking for reads
- Initial creation may take time for large tables
- Monitor database CPU during migration

## Future Optimizations

### Planned Improvements
1. **Partial Indexes**: For soft-deleted records
2. **Expression Indexes**: For case-insensitive searches
3. **BRIN Indexes**: For time-series data
4. **Table Partitioning**: For audit logs and historical data

### Query Caching
- Implement Redis for frequently accessed data
- Cache user sessions and permissions
- Cache church and group metadata

### Read Replicas
- Configure read replicas for reporting
- Route analytical queries to replicas
- Implement connection routing logic