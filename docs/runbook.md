# HPCI-ChMS Production Deployment Runbook

## Overview
This runbook provides step-by-step instructions for deploying HPCI-ChMS to production.

**Production Environment:**
- **URL**: https://drouple-hpci-prod.vercel.app
- **Database**: Neon Postgres (ep-flat-glade-ad7dfexu)
- **Platform**: Vercel (pastormacsagun-9316s-projects/drouple-hpci-prod)
- **Release**: v1.0.0-hpci

## Pre-Deployment Checklist

### 1. Code Quality Checks
- [ ] All tests passing: `npm run test:all`
- [ ] TypeScript compilation: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`

### 2. Database Readiness
- [ ] All migrations reviewed
- [ ] Backup of production database taken
- [ ] Migration rollback plan documented

### 3. Environment Variables
- [ ] `DATABASE_URL` configured
- [ ] `DATABASE_URL_UNPOOLED` configured
- [ ] `NEXTAUTH_URL` set to production URL
- [ ] `NEXTAUTH_SECRET` generated securely
- [ ] `RESEND_API_KEY` configured
- [ ] `SENTRY_DSN` configured (optional)

## Deployment Steps

### Step 1: Database Migration

```bash
# 1. Take database backup
pg_dump $PRODUCTION_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migrations in production
npx prisma migrate deploy

# 3. Verify migrations
npx prisma migrate status
```

### Step 2: Build and Deploy

#### Option A: Vercel Deployment (Recommended)

```bash
# 1. Install Vercel CLI if not installed
npm i -g vercel

# 2. Deploy to production
vercel --prod

# 3. Verify deployment
vercel ls
```

#### Option B: Docker Deployment

```bash
# 1. Build Docker image
docker build -t hpci-chms:latest .

# 2. Tag for registry
docker tag hpci-chms:latest registry.example.com/hpci-chms:latest

# 3. Push to registry
docker push registry.example.com/hpci-chms:latest

# 4. Deploy to Kubernetes/Docker Swarm
kubectl apply -f k8s/production/
```

### Step 3: Health Checks

```bash
# 1. Check application health
curl https://drouple-hpci-prod.vercel.app

# 2. Verify auth flow
curl https://drouple-hpci-prod.vercel.app/api/auth/providers

# 3. Check sign-in page loads
curl https://drouple-hpci-prod.vercel.app/auth/signin
```

### Step 4: Smoke Tests

1. **Authentication Flow**
   - [ ] Sign in page loads without rate limiting (GET /auth/signin)
   - [ ] Can attempt login 5 times per minute
   - [ ] 6th login attempt returns 429 with Retry-After header
   - [ ] Successfully authenticate with valid credentials

2. **Rate Limiting Verification**
   ```bash
   # Verify auth pages are NOT rate limited on GET
   for i in {1..10}; do
     curl -s -o /dev/null -w "%{http_code}\n" https://drouple-hpci-prod.vercel.app/auth/signin
   done
   # Should all return 200, never 429
   
   # Verify POST login has proper limits
   for i in {1..6}; do
     curl -X POST https://drouple-hpci-prod.vercel.app/api/auth/callback/credentials \
       -H "Content-Type: application/json" \
       -d '{"email":"test@example.com","password":"wrong"}' \
       -i | grep -E "(HTTP|X-RateLimit|Retry-After)"
   done
   # 6th attempt should return 429 with headers
   ```

3. **Role-Based Access**
   - [ ] Super Admin can access /super
   - [ ] Church Admin can access /admin
   - [ ] Member can access /dashboard
   - [ ] Proper redirects for unauthorized access

4. **Core Features**
   - [ ] Sunday Check-in works (1 per 5 minutes limit)
   - [ ] Life Groups display correctly
   - [ ] Events RSVP functional
   - [ ] Pathways enrollment works

### Step 5: Monitoring Setup

```bash
# 1. Verify Sentry integration
curl -X POST https://sentry.io/api/0/projects/YOUR_ORG/YOUR_PROJECT/keys/

# 2. Check application logs
vercel logs --prod

# 3. Set up alerts
# Configure in Vercel/Sentry dashboard
```

## Rollback Procedures

### Application Rollback

```bash
# Vercel
vercel rollback

# Docker
kubectl rollout undo deployment/hpci-chms
```

### Database Rollback

```bash
# 1. Restore from backup
psql $PRODUCTION_DB_URL < backup_YYYYMMDD_HHMMSS.sql

# 2. Or rollback specific migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

## Post-Deployment Verification

### 1. Performance Checks
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 5s

### 2. Security Verification
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] Rate limiting active

### 3. Data Integrity
- [ ] Tenant isolation working
- [ ] RBAC enforcement verified
- [ ] Audit logs recording

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```bash
# Check connection string
echo $DATABASE_URL | sed 's/:[^:]*@/:***@/'

# Test connection
npx prisma db pull --force
```

#### 2. Authentication Issues
```bash
# Verify NextAuth configuration
curl https://drouple-hpci-prod.vercel.app/api/auth/session

# Check email provider
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json"
```

#### 3. Performance Issues
```bash
# Check database indexes
npx prisma db execute --file check-indexes.sql

# Monitor memory usage
vercel logs --prod | grep "Memory"
```

## Emergency Contacts

- **DevOps Lead**: [Contact Info]
- **Database Admin**: [Contact Info]
- **Security Team**: [Contact Info]
- **On-Call Engineer**: [PagerDuty/OpsGenie]

## Maintenance Mode

To enable maintenance mode:

```bash
# Set environment variable
vercel env add MAINTENANCE_MODE production
# Value: true

# Deploy maintenance page
vercel --prod
```

To disable:
```bash
vercel env rm MAINTENANCE_MODE production
vercel --prod
```

## Blue-Green Deployment

For zero-downtime deployments:

1. Deploy to staging slot
```bash
vercel --target=staging
```

2. Run smoke tests on staging URL
3. Switch traffic to new version
```bash
vercel promote [deployment-url]
```

4. Monitor for issues
5. Rollback if needed

## Backup Schedule

- **Database**: Daily at 2 AM UTC
- **Application State**: Before each deployment
- **Retention**: 30 days for daily, 90 days for weekly

## Compliance Checklist

- [ ] GDPR compliance verified
- [ ] Data encryption at rest and in transit
- [ ] Access logs retained per policy
- [ ] PII handling validated
- [ ] Security audit completed

## Version History

| Version | Date | Changes | Deployed By |
|---------|------|---------|-------------|
| v1.0.0-hpci | 2025-08-26 | Initial production release with all validation gaps closed | Claude |

## Notes

- Always deploy during low-traffic periods
- Notify users 24 hours before planned maintenance
- Keep this runbook updated with lessons learned
- Review and update quarterly