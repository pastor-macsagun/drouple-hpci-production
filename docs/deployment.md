# Deployment Procedures

## Overview

This document outlines the deployment procedures for the HPCI Church Management System.

## Environments

### Development
- **URL**: http://localhost:3000
- **Database**: Local PostgreSQL or Neon dev branch
- **Purpose**: Local development and testing

### Staging
- **URL**: https://staging.hpci-chms.vercel.app
- **Database**: Neon staging branch
- **Purpose**: Pre-production testing and QA

### Production
- **URL**: https://hpci-chms.vercel.app
- **Database**: Neon production database (pooled connections)
- **Purpose**: Live environment for end users
- **Last Deployment**: Aug 26, 2025
- **Region**: Singapore (sin1)

## Deployment Process

### 1. Pre-Deployment Checklist

- [ ] All tests passing (`npm run test:all`)
- [ ] Linting passing (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] Database migrations ready
- [ ] Environment variables configured
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Navigation audit resolved (see docs/verification/NAVIGATION-AUDIT.md)

### 2. Database Migrations

```bash
# Generate migration from schema changes
npx prisma migrate dev --name <migration_name>

# IMPORTANT: Verify migrations before deployment
npx prisma migrate status

# Apply migrations to staging
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate deploy

# Verify staging deployment
DATABASE_URL=$STAGING_DATABASE_URL npx prisma migrate status

# Apply migrations to production (after backup)
pg_dump $PRODUCTION_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
DATABASE_URL=$PRODUCTION_DATABASE_URL npx prisma migrate deploy
```

#### Required Database Indexes
Ensure these indexes exist in production:
- `users`: tenantId, (tenantId, role), (email, tenantId), role
- `checkins`: (serviceId, userId) UNIQUE
- `event_rsvps`: (eventId, userId) composite index
- `memberships`: localChurchId index

### 3. Staging Deployment

#### Automatic (via GitHub)
1. Push to `develop` branch
2. Vercel automatically deploys to staging
3. Run smoke tests
4. Verify functionality

#### Manual
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel --env preview
```

### 4. Production Deployment

#### Automatic (via GitHub)
1. Create PR from `develop` to `main`
2. Review and approve PR
3. Merge PR
4. Vercel automatically deploys to production

#### Manual
```bash
# Deploy to production
vercel --prod
```

### 5. Post-Deployment

- [ ] Verify deployment at production URL
- [ ] Check health endpoint: `/api/health`
- [ ] Test critical user flows
- [ ] Monitor error rates in Sentry
- [ ] Check performance metrics
- [ ] Notify team of deployment

## Rollback Procedures

### Immediate Rollback
```bash
# Rollback to previous deployment
vercel rollback

# Or use Vercel dashboard to promote previous deployment
```

### Database Rollback
```bash
# Create backup before migration
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Rollback migration
npx prisma migrate resolve --rolled-back <migration_name>

# Restore from backup if needed
psql $DATABASE_URL < backup_file.sql
```

## Environment Variables

### Production Requirements (Aug 26, 2025)

```bash
# Required
DATABASE_URL=postgres://...?sslmode=require&pgbouncer=true  # Pooled connection
DATABASE_URL_UNPOOLED=postgres://...?sslmode=require        # Direct connection
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=<32+ character random string>
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@your-domain.com

# Security & Performance
RATE_LIMIT_ENABLED=true
SENTRY_DSN=https://...@sentry.io/...

# Optional
NODE_ENV=production
```

### Commands Used in Latest Deployment

```bash
# Environment sanity check
npm run env:sanity

# Build verification
npm ci
npm run typecheck
npm run lint
npm run build

# Deployment with Vercel
vercel --prod

# Post-deployment verification
curl https://your-domain.com/api/health
```

### Security Headers (vercel.json)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Strict-Transport-Security: max-age=31536000; includeSubDomains
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Authentication secret
- `RESEND_API_KEY` - Email service API key
- `EMAIL_FROM` - Sender email address

### Optional Variables
- `SENTRY_DSN` - Error tracking
- `ENABLE_RATE_LIMITING` - Rate limiting feature flag
- `ENABLE_MONITORING` - Monitoring feature flag
- `ENABLE_CACHING` - Caching feature flag

## Monitoring

### Health Checks
- **Endpoint**: `/api/health`
- **Frequency**: Every 5 minutes
- **Alerts**: Triggered on 3 consecutive failures

### Metrics to Monitor
- Response time (p50, p95, p99)
- Error rate
- Database connection pool usage
- Memory usage
- CPU usage

### Alert Thresholds
- Error rate > 1%
- Response time p95 > 3s
- Database connections > 80%
- Memory usage > 90%

## Backup Strategy

### Database Backups
- **Frequency**: Daily at 2 AM UTC
- **Retention**: 30 days
- **Location**: Neon automatic backups + S3 bucket

### Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp ${BACKUP_FILE}.gz s3://hpci-backups/db/

# Clean up local file
rm ${BACKUP_FILE}.gz

# Delete old backups (keep 30 days)
aws s3 ls s3://hpci-backups/db/ | while read -r line; do
  createDate=$(echo $line | awk '{print $1" "$2}')
  createDate=$(date -d "$createDate" +%s)
  olderThan=$(date -d "30 days ago" +%s)
  if [[ $createDate -lt $olderThan ]]; then
    fileName=$(echo $line | awk '{print $4}')
    aws s3 rm s3://hpci-backups/db/$fileName
  fi
done
```

## Security Considerations

### Pre-Deployment Security Checks
- [ ] No hardcoded secrets
- [ ] Environment variables properly configured
- [ ] Dependencies updated (`npm audit`)
- [ ] HTTPS enforced
- [ ] Rate limiting enabled
- [ ] Input validation in place

### Production Security
- Enable WAF rules
- Configure DDoS protection
- Regular security audits
- Automated vulnerability scanning
- SSL certificate monitoring

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Reset connection pool
npx prisma generate
```

#### Memory Issues
```bash
# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Support Contacts
- **DevOps Team**: devops@hpci.org
- **Database Admin**: dba@hpci.org
- **On-Call Engineer**: +1-555-0123

## Continuous Improvement

### Post-Deployment Review
- Conduct retrospective after each deployment
- Document lessons learned
- Update procedures based on feedback
- Automate repetitive tasks

### Metrics to Track
- Deployment frequency
- Lead time for changes
- Mean time to recovery (MTTR)
- Change failure rate