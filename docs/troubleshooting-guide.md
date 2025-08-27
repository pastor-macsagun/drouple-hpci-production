# Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting procedures for common issues in HPCI-ChMS production and development environments.

## Table of Contents

1. [Quick Diagnosis](#quick-diagnosis)
2. [Application Issues](#application-issues)
3. [Database Issues](#database-issues)
4. [Authentication Problems](#authentication-problems)
5. [Performance Issues](#performance-issues)
6. [Deployment Issues](#deployment-issues)
7. [Monitoring and Alerts](#monitoring-and-alerts)
8. [Recovery Procedures](#recovery-procedures)

## Quick Diagnosis

### Health Check Commands

```bash
# Check application health
curl https://your-domain.com/api/health

# Check database connectivity
npm run db:status

# Run full system check
npm run ship:verify
```

### Common Issue Patterns

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| 500 errors | Database connection | Check DATABASE_URL |
| 401 errors | Authentication issue | Verify NEXTAUTH_SECRET |
| Slow responses | Database queries | Check connection pooling |
| Build failures | TypeScript errors | Run `npm run typecheck` |
| Test failures | Environment setup | Check test database |

## Application Issues

### 1. Application Won't Start

**Symptoms:**
- Server fails to start
- Build process hangs
- Module not found errors

**Diagnosis:**
```bash
# Check for missing dependencies
npm ls

# Verify environment variables
npm run env:sanity

# Check for TypeScript errors
npm run typecheck

# Check for syntax errors
npm run lint
```

**Solutions:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm ci

# Reset Next.js cache
rm -rf .next

# Check Node.js version
node --version  # Should be >= 18
```

### 2. 500 Internal Server Error

**Symptoms:**
- Generic 500 error pages
- Server crashes
- Database connection errors

**Diagnosis:**
```bash
# Check server logs
vercel logs [deployment-url]

# Check Sentry for errors
# Review /api/health endpoint

# Test database connection
npx prisma db pull
```

**Common Causes & Solutions:**

1. **Database Connection Issues**
   ```bash
   # Verify connection strings
   echo $DATABASE_URL
   echo $DATABASE_URL_UNPOOLED
   
   # Test connection
   npx prisma studio
   ```

2. **Environment Variables Missing**
   ```bash
   # Check required variables
   npm run env:sanity
   
   # Update Vercel environment variables
   vercel env ls
   vercel env add MISSING_VAR
   ```

3. **Memory Limits Exceeded**
   ```bash
   # Check memory usage in Vercel dashboard
   # Optimize bundle sizes
   npm run analyze
   ```

### 3. Authentication Errors

**Symptoms:**
- Users can't log in
- Session expires immediately
- Redirect loops

**Diagnosis:**
```bash
# Check NextAuth configuration
curl -X GET https://your-domain.com/api/auth/session

# Verify JWT secret
echo $NEXTAUTH_SECRET | wc -c  # Should be >= 32

# Check database user table
npx prisma studio
```

**Solutions:**

1. **Invalid JWT Secret**
   ```bash
   # Generate new secret
   openssl rand -base64 32
   
   # Update environment variable
   vercel env add NEXTAUTH_SECRET "new-secret-here"
   ```

2. **Database Schema Issues**
   ```bash
   # Check User model
   npx prisma db pull
   
   # Run migrations
   npm run db:migrate
   ```

3. **Session Cookie Issues**
   ```bash
   # Check domain configuration
   echo $NEXTAUTH_URL
   
   # Verify secure cookie settings in production
   ```

### 4. Rate Limiting Issues

**Symptoms:**
- 429 Too Many Requests errors
- Legitimate users blocked
- Inconsistent rate limiting

**Diagnosis:**
```bash
# Check rate limit configuration
echo $RATE_LIMIT_ENABLED
echo $RATE_LIMIT_MAX_REQUESTS
echo $RATE_LIMIT_WINDOW_MS

# Test rate limiting
curl -X POST https://your-domain.com/api/test-endpoint
```

**Solutions:**

1. **Adjust Rate Limits**
   ```bash
   # Update environment variables
   vercel env add RATE_LIMIT_MAX_REQUESTS "200"
   vercel env add RATE_LIMIT_WINDOW_MS "60000"
   ```

2. **Clear Rate Limit Cache**
   ```bash
   # Restart application to clear in-memory cache
   vercel --prod
   ```

## Database Issues

### 1. Connection Pool Exhaustion

**Symptoms:**
- "Too many clients already" errors
- Intermittent database timeouts
- Slow response times

**Diagnosis:**
```bash
# Check active connections in Neon dashboard
# Monitor connection pool metrics
# Review database query patterns
```

**Solutions:**

1. **Optimize Connection Usage**
   ```bash
   # Check for unclosed connections
   grep -r "new PrismaClient" app/
   
   # Use global Prisma instance
   # Implement proper connection cleanup
   ```

2. **Adjust Pool Settings**
   ```bash
   # Update DATABASE_URL with pool settings
   DATABASE_URL="postgresql://user:pass@host/db?pgbouncer=true&connect_timeout=60"
   ```

### 2. Migration Failures

**Symptoms:**
- Migration hangs or fails
- Schema drift warnings
- Data inconsistencies

**Diagnosis:**
```bash
# Check migration status
npx prisma migrate status

# Compare schema
npx prisma db pull
git diff prisma/schema.prisma

# Check migration history
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma
```

**Solutions:**

1. **Reset Development Database**
   ```bash
   # Development only - DO NOT run in production
   npx prisma migrate reset --skip-seed
   npm run seed
   ```

2. **Manual Migration Fix**
   ```bash
   # Create manual migration
   npx prisma migrate dev --name fix-issue --create-only
   
   # Edit migration file manually
   # Apply migration
   npx prisma migrate dev
   ```

3. **Production Migration Recovery**
   ```bash
   # Backup first
   npm run backup:create
   
   # Apply migrations carefully
   npm run migrate:production -- --dry-run
   npm run migrate:production
   ```

### 3. Query Performance Issues

**Symptoms:**
- Slow page loads
- Database timeouts
- High CPU usage

**Diagnosis:**
```bash
# Enable query logging
DATABASE_URL="${DATABASE_URL}&log=query"

# Check slow queries in Neon dashboard
# Use Prisma query analyzer
```

**Solutions:**

1. **Add Database Indexes**
   ```prisma
   // Add to schema.prisma
   model User {
     @@index([tenantId])
     @@index([email, tenantId])
   }
   ```

2. **Optimize Queries**
   ```typescript
   // Use select to limit fields
   const users = await prisma.user.findMany({
     select: { id: true, email: true },
     where: { tenantId }
   });
   
   // Use include for relations
   const user = await prisma.user.findUnique({
     where: { id },
     include: { membership: true }
   });
   ```

## Authentication Problems

### 1. NextAuth Configuration Issues

**Common Problems:**

1. **Missing Environment Variables**
   ```bash
   # Required variables
   NEXTAUTH_URL="https://your-domain.com"
   NEXTAUTH_SECRET="your-secret-key"
   
   # Email provider
   EMAIL_SERVER_HOST="smtp.resend.com"
   EMAIL_SERVER_PORT="587"
   RESEND_API_KEY="re_your_key"
   ```

2. **Database Adapter Issues**
   ```typescript
   // Check adapter configuration in auth.ts
   import { PrismaAdapter } from "@auth/prisma-adapter"
   import { prisma } from "@/lib/prisma"
   
   export const authOptions = {
     adapter: PrismaAdapter(prisma),
     // ... rest of config
   }
   ```

3. **Session Strategy Problems**
   ```typescript
   // Ensure correct session strategy
   session: {
     strategy: "jwt", // Use JWT for serverless
     maxAge: 24 * 60 * 60, // 24 hours
   }
   ```

### 2. RBAC Issues

**Symptoms:**
- Users see wrong content
- Permission errors
- Tenant isolation failures

**Diagnosis:**
```bash
# Check user roles in database
npx prisma studio

# Test RBAC functions
npm run test -- rbac.test.ts

# Check tenant isolation
npm run test -- tenancy.test.ts
```

**Solutions:**

1. **Fix Role Assignment**
   ```typescript
   // Ensure roles are properly assigned
   const user = await prisma.user.update({
     where: { id: userId },
     data: { role: 'CHURCH_ADMIN' }
   });
   ```

2. **Debug Tenant Isolation**
   ```typescript
   // Check tenant ID in all queries
   const members = await prisma.membership.findMany({
     where: {
       tenantId: user.tenantId, // Always include tenantId
     }
   });
   ```

## Performance Issues

### 1. Slow Page Loads

**Diagnosis Steps:**

1. **Run Lighthouse Audit**
   ```bash
   # Install Lighthouse
   npm install -g @lhci/cli
   
   # Run audit
   lhci autorun --upload.target=temporary-public-storage
   ```

2. **Analyze Bundle Sizes**
   ```bash
   # Analyze bundles
   npm run analyze
   
   # Check for large dependencies
   npx bundle-phobia [package-name]
   ```

3. **Profile Database Queries**
   ```bash
   # Enable query logging
   DATABASE_URL="${DATABASE_URL}&log=query,info,warn"
   ```

**Solutions:**

1. **Code Splitting**
   ```typescript
   // Use dynamic imports
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <div>Loading...</div>
   });
   ```

2. **Image Optimization**
   ```typescript
   // Use Next.js Image component
   import Image from 'next/image';
   
   <Image
     src="/logo.png"
     alt="Logo"
     width={200}
     height={100}
     priority
   />
   ```

3. **Database Query Optimization**
   ```typescript
   // Use pagination
   const members = await prisma.membership.findMany({
     take: 20,
     skip: page * 20,
     orderBy: { createdAt: 'desc' }
   });
   
   // Use cursor-based pagination for large datasets
   const members = await prisma.membership.findMany({
     take: 20,
     cursor: lastId ? { id: lastId } : undefined,
     orderBy: { id: 'asc' }
   });
   ```

### 2. Memory Issues

**Symptoms:**
- Application crashes
- Out of memory errors
- Slow garbage collection

**Diagnosis:**
```bash
# Check memory usage
node --inspect app.js
# Use Chrome DevTools Memory tab

# Monitor in production
# Check Vercel dashboard for memory metrics
```

**Solutions:**

1. **Reduce Memory Usage**
   ```typescript
   // Implement pagination
   // Use streaming for large datasets
   // Clear unused variables
   
   // Example: Stream large CSV exports
   import { Transform } from 'stream';
   
   const transform = new Transform({
     transform(chunk, encoding, callback) {
       // Process chunk
       callback(null, processedChunk);
     }
   });
   ```

2. **Optimize Data Structures**
   ```typescript
   // Use Map instead of Object for frequent lookups
   const userMap = new Map();
   
   // Clear large arrays when done
   largeArray.length = 0;
   ```

## Deployment Issues

### 1. Build Failures

**Common Causes:**

1. **TypeScript Errors**
   ```bash
   # Fix TypeScript issues
   npm run typecheck
   
   # Ignore build errors (not recommended)
   // next.config.ts
   typescript: {
     ignoreBuildErrors: true,
   }
   ```

2. **ESLint Errors**
   ```bash
   # Fix linting issues
   npm run lint -- --fix
   
   # Ignore during build (not recommended)
   // next.config.ts
   eslint: {
     ignoreDuringBuilds: true,
   }
   ```

3. **Environment Variables**
   ```bash
   # Check all required variables are set
   vercel env ls
   
   # Add missing variables
   vercel env add VARIABLE_NAME value
   ```

### 2. Deployment Timeouts

**Solutions:**

1. **Increase Build Timeout**
   ```json
   // vercel.json
   {
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/node",
         "config": {
           "maxLambdaSize": "50mb"
         }
       }
     ]
   }
   ```

2. **Optimize Build Process**
   ```bash
   # Use npm ci instead of npm install
   # Remove unnecessary dependencies
   # Enable build caching
   ```

### 3. Post-Deployment Issues

**Symptoms:**
- Site works locally but not in production
- Missing assets
- API endpoints returning 404

**Solutions:**

1. **Check Environment Parity**
   ```bash
   # Compare local and production environments
   npm run env:sanity
   
   # Test with production environment locally
   cp .env.production .env.local
   npm run build
   npm run start
   ```

2. **Verify Asset Paths**
   ```bash
   # Check public folder structure
   # Verify import paths are correct
   # Check next.config.ts assetPrefix
   ```

## Monitoring and Alerts

### 1. Sentry Issues

**Common Problems:**

1. **High Error Volume**
   ```bash
   # Check error patterns in Sentry
   # Filter by environment and release
   # Set up proper error grouping
   ```

2. **Missing Error Context**
   ```typescript
   // Add more context to errors
   import * as Sentry from '@sentry/nextjs';
   
   Sentry.withScope((scope) => {
     scope.setUser({ id: userId });
     scope.setTag('component', 'checkout');
     scope.setLevel('error');
     Sentry.captureException(error);
   });
   ```

3. **Performance Monitoring**
   ```typescript
   // Add custom performance tracking
   const transaction = Sentry.startTransaction({
     name: 'Database Query',
     op: 'db.query'
   });
   
   try {
     const result = await query();
     return result;
   } finally {
     transaction.finish();
   }
   ```

### 2. Alert Fatigue

**Solutions:**

1. **Tune Alert Thresholds**
   ```typescript
   // lib/alerts.ts
   const alertRules = [
     {
       name: 'High Error Rate',
       condition: (metrics) => metrics.errorRate > 0.05, // 5%
       cooldownMinutes: 15,
     }
   ];
   ```

2. **Group Related Alerts**
   ```typescript
   // Implement alert grouping
   const groupedAlerts = alerts.reduce((groups, alert) => {
     const key = `${alert.category}-${alert.severity}`;
     groups[key] = groups[key] || [];
     groups[key].push(alert);
     return groups;
   }, {});
   ```

## Recovery Procedures

### 1. Database Recovery

**Point-in-Time Recovery:**
```bash
# List available recovery points (Neon)
neon branches list

# Create new branch from recovery point
neon branches create --name recovery-$(date +%s) --parent main --timestamp "2024-01-01T12:00:00Z"

# Update connection string to recovery branch
DATABASE_URL="postgresql://user:pass@recovery-branch.neon.tech/db"
```

**Backup Restoration:**
```bash
# List available backups
npm run backup:list

# Restore from backup (dry run first)
npm run backup:restore backup-id --dry-run
npm run backup:restore backup-id
```

### 2. Application Recovery

**Quick Recovery Steps:**
```bash
# 1. Rollback deployment
vercel rollback [previous-deployment-url]

# 2. Revert code changes
git revert [problematic-commit]
git push origin main

# 3. Emergency maintenance mode
# Update Vercel environment variable
vercel env add MAINTENANCE_MODE "true"
```

### 3. Data Loss Prevention

**Regular Backups:**
```bash
# Set up automated backups
# Daily at 2 AM UTC
0 2 * * * /usr/local/bin/npm run backup:create

# Weekly full system backup
0 1 * * 0 /usr/local/bin/npm run backup:full
```

**Testing Recovery:**
```bash
# Monthly recovery testing
npm run backup:test-restore

# Validate data integrity
npm run test:integration:database
```

---

## Emergency Contacts

For critical issues:

- **Database**: Neon support (support@neon.tech)
- **Hosting**: Vercel support (support@vercel.com)
- **Monitoring**: Sentry support (support@sentry.io)
- **Development Team**: [Your team's contact information]

## Escalation Procedures

1. **Level 1**: Development team member investigation
2. **Level 2**: Senior developer + infrastructure review
3. **Level 3**: Full team mobilization + vendor support
4. **Level 4**: Emergency rollback + incident response

---

Remember to update this guide as new issues are discovered and resolved!