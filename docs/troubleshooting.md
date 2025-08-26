# Troubleshooting Guide

## Common Issues and Solutions

### Database Connection Errors

#### Error: "Can't reach database server"
**Causes**:
- Invalid database URL
- Database server is down
- Network connectivity issues
- SSL/TLS configuration problems

**Solutions**:
1. Verify DATABASE_URL format:
   ```
   postgresql://user:password@host/database?sslmode=require&pgbouncer=true
   ```
2. For Neon databases, ensure `sslmode=require` is set
3. Check if you're using the pooled connection string for DATABASE_URL
4. Verify network connectivity to database host
5. Try the direct connection URL for debugging (DATABASE_URL_UNPOOLED)

#### Error: "P1010: User was denied access"
**Solutions**:
1. Check database credentials are correct
2. Verify user has necessary permissions
3. For Neon, ensure you're using the correct project endpoint
4. Check if IP is whitelisted (if applicable)

### Authentication Issues

#### Magic Link Not Received
**Causes**:
- Email configuration incorrect
- Email in spam folder
- Rate limiting triggered

**Solutions**:
1. Check Resend API key is valid
2. Verify EMAIL_FROM address is verified in Resend
3. Check spam/junk folder
4. Wait for rate limit to reset (3 attempts per hour)
5. Check application logs for email sending errors

#### Session Expired Errors
**Solutions**:
1. Clear browser cookies
2. Sign in again
3. Check NEXTAUTH_SECRET is consistent across deployments
4. Verify NEXTAUTH_URL matches your domain

### Rate Limiting

#### Error: "Rate limit exceeded"
**Rate Limits**:
- Authentication: 3 requests/hour
- API: 100 requests/15 minutes
- Check-in: 10 requests/5 minutes
- Exports: 10 requests/hour

**Solutions**:
1. Wait for the time specified in error message
2. Check `Retry-After` header for wait time
3. For development, temporarily disable rate limiting:
   ```typescript
   // In development only
   if (process.env.NODE_ENV === 'development') {
     return { success: true, remaining: 999 }
   }
   ```

### Build Errors

#### TypeScript Compilation Errors
**Current Status**: ~143 errors remain

**Common Fixes**:
1. Import path issues:
   ```typescript
   // Wrong
   import { auth } from '@/app/lib/auth'
   // Correct
   import { auth } from '@/lib/auth'
   ```

2. Async headers in Next.js 15:
   ```typescript
   // Add await
   const headersList = await headers()
   ```

3. Enum value mismatches:
   ```typescript
   // Check Prisma schema for correct values
   RsvpStatus.GOING // not CONFIRMED
   RsvpStatus.WAITLIST // not WAITLISTED
   ```

#### Module Not Found Errors
**Solutions**:
1. Run `npm install` to ensure all dependencies are installed
2. Check tsconfig.json path aliases match import statements
3. Clear Next.js cache: `rm -rf .next`
4. Restart development server

### Seed Data Issues

#### Error: "Seed command failed"
**Solutions**:
1. Ensure database is empty or use reset:
   ```bash
   npx prisma migrate reset
   ```
2. Check DATABASE_URL is set correctly
3. Run migrations first:
   ```bash
   npx prisma migrate deploy
   ```
4. For test environment:
   ```bash
   NODE_ENV=test npm run seed
   ```

### Test Failures

#### E2E Tests Failing
**Common Causes**:
- Database not seeded
- Wrong environment variables
- Playwright not installed

**Solutions**:
1. Install Playwright:
   ```bash
   npx playwright install --with-deps
   ```
2. Run seed before tests:
   ```bash
   npm run seed && npm run test:e2e
   ```
3. Check .env.test has valid database URL

#### Unit Tests Failing
**Solutions**:
1. Clear test cache:
   ```bash
   npm run test:unit -- --clearCache
   ```
2. Update snapshots if needed:
   ```bash
   npm run test:unit -- -u
   ```

### Production Issues

#### Security Headers Not Working
**Verification**:
```bash
curl -I https://yourdomain.com | grep -E "X-Frame|Content-Security"
```

**Solutions**:
1. Check next.config.ts headers configuration
2. Verify deployment environment (Vercel may override some headers)
3. For HSTS, ensure APP_ENV or NODE_ENV is set to 'production'

#### Dev Login Appears in Production
**Critical Security Issue!**

**Solutions**:
1. Ensure NODE_ENV is set to 'production'
2. Check for this pattern and ensure it's wrapped:
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     // Dev-only features
   }
   ```
3. Remove any hardcoded test credentials
4. Audit environment variables for sensitive data

### Tenant Isolation Issues

#### Users Seeing Wrong Church Data
**Critical Security Issue!**

**Debugging Steps**:
1. Check user's memberships:
   ```sql
   SELECT * FROM memberships WHERE userId = 'USER_ID';
   ```
2. Verify TenantRepository is being used
3. Check for unscoped queries
4. Test with user having empty localChurchIds array

**Fix Verification**:
- Empty access users should see no data
- Cross-tenant queries should return 403
- SUPER_ADMIN should see all data

### Performance Issues

#### Slow Page Loads
**Solutions**:
1. Check database indexes are applied:
   ```bash
   npx prisma db execute --file prisma/migrations/20250123_indexes_membership_audit/migration.sql
   ```
2. Enable query logging to identify slow queries
3. Check for N+1 query problems
4. Verify CDN/caching is working

#### High Memory Usage
**Solutions**:
1. Check for memory leaks in rate limiter
2. Clear in-memory caches periodically
3. Monitor with:
   ```bash
   node --inspect npm run dev
   ```

## Emergency Procedures

### Rollback Deployment
```bash
# Vercel
vercel rollback

# Manual
git revert HEAD
git push origin main
```

### Disable Rate Limiting (Emergency Only)
```typescript
// lib/rate-limit.ts - TEMPORARY ONLY
export async function check() {
  return { success: true, remaining: 999 }
}
```

### Block All Check-ins
```typescript
// app/checkin/page.tsx
export default function CheckinPage() {
  return <div>Check-in temporarily disabled for maintenance</div>
}
```

## Contact Support

For issues not covered here:
1. Check logs in Vercel dashboard
2. Review error tracking in Sentry (if configured)
3. Contact: security@hpci.org (for security issues)
4. GitHub Issues: https://github.com/your-org/hpci-chms/issues

## Useful Commands

```bash
# Database
npx prisma studio          # Visual database browser
npx prisma migrate status  # Check migration status
npx prisma db push        # Push schema without migration

# Testing
npm run test:unit -- --watch  # Watch mode for unit tests
npm run test:e2e -- --ui      # Playwright UI mode
npm run test:e2e -- --debug   # Debug mode

# Development
npm run dev -- --turbo    # Faster dev server
npm run build             # Production build
npm run analyze           # Bundle analysis

# Debugging
NODE_OPTIONS='--inspect' npm run dev  # Node debugger
DEBUG=* npm run dev                    # Verbose logging
```