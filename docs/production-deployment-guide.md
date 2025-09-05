# Production Deployment Guide

## Overview

This guide covers the complete production deployment process for Drouple Web Application, including environment setup, CI/CD pipeline configuration, monitoring, and troubleshooting procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [CI/CD Pipeline Setup](#cicd-pipeline-setup)
5. [Vercel Analytics & Monitoring](#vercel-analytics--monitoring)
6. [Deployment Process](#deployment-process)
7. [Post-Deployment Validation](#post-deployment-validation)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Services
- **Vercel Account**: For application hosting and monitoring
- **Neon Database**: PostgreSQL database with pooling
- **GitHub Repository**: Source code and automated CI/CD
- **Domain Name**: Custom domain (optional but recommended)

### Integrated Monitoring (Automatic)
- **Vercel Analytics**: User behavior tracking (auto-enabled)
- **Vercel Speed Insights**: Core Web Vitals monitoring (auto-enabled)
- **GitHub Actions**: CI/CD pipeline with quality gates

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/your-org/drouple.git
cd drouple

# Install dependencies
npm ci

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your development values

# Set up database
npm run db:push
npm run seed

# Verify setup
npm run build
npm run test:unit
```

## Environment Setup

### 1. Production Environment Variables

Create `.env.production` from `.env.production.example`:

```bash
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-32-character-secret"

# Email (Resend)
RESEND_API_KEY="re_your_api_key"
RESEND_FROM_EMAIL="noreply@your-domain.com"

# Performance
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="60000"

# Environment
NODE_ENV="production"
APP_ENV="production"
```

### 2. Staging Environment

Create `.env.staging` for staging deployments:
- Use separate Neon database branch
- Relaxed rate limits for testing

### 3. Vercel Configuration

Ensure `vercel.json` is properly configured:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "regions": ["sin1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ],
  "env": {
    "RATE_LIMIT_ENABLED": "true"
  }
}
```

## Database Configuration

### 1. Neon Postgres Setup

1. **Create Neon Project**
   ```bash
   # Install Neon CLI
   npm install -g @neondatabase/cli
   
   # Login and create project
   neon auth
   neon projects create --name hpci-chms-prod
   ```

2. **Configure Connection Pooling**
   - Enable PgBouncer for pooled connections
   - Set `DATABASE_URL` with `?pgbouncer=true`
   - Set `DATABASE_URL_UNPOOLED` for migrations

3. **Set up Branches**
   ```bash
   # Create staging branch
   neon branches create --name staging
   
   # Create development branch  
   neon branches create --name development
   ```

### 2. Database Migration Strategy

1. **Pre-deployment Backup**
   ```bash
   # Create backup before migration
   npm run migrate:backup
   ```

2. **Migration Execution**
   ```bash
   # Dry run first
   npm run migrate:production -- --dry-run
   
   # Apply migrations
   npm run migrate:production
   ```

3. **Post-migration Validation**
   ```bash
   # Verify migration success
   npm run migrate:validate
   ```

## CI/CD Pipeline Setup

### 1. GitHub Secrets

Configure the following secrets in your GitHub repository:

```bash
# Vercel
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Database URLs
STAGING_DATABASE_URL=postgresql://staging_connection
STAGING_DATABASE_URL_UNPOOLED=postgresql://staging_unpooled
PRODUCTION_DATABASE_URL=postgresql://production_connection
PRODUCTION_DATABASE_URL_UNPOOLED=postgresql://production_unpooled

# Monitoring
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Alerts (optional)
ALERT_EMAIL_TO=alerts@yourcompany.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
```

### 2. Pipeline Stages

The CI/CD pipeline includes these stages:

1. **Security Audit** - Dependency vulnerability scanning
2. **Code Quality** - TypeScript compilation and ESLint
3. **Unit Tests** - Test execution with coverage validation
4. **Build Analysis** - Bundle size analysis and optimization checks
5. **E2E Tests** - End-to-end testing with real database
6. **Performance Tests** - Load testing and Lighthouse audits (main branch only)
7. **Deployment** - Automated deployment to staging/production
8. **Smoke Tests** - Post-deployment health checks

### 3. Branch Strategy

- `main` - Production deployments
- `develop` - Staging deployments
- Feature branches - Preview deployments (PRs)

## Vercel Analytics & Monitoring

### 1. Integrated Monitoring (Zero Configuration)

**Vercel Analytics** and **Speed Insights** are automatically enabled when deployed to Vercel:

- **Analytics Component**: `<Analytics />` integrated in `app/layout.tsx`
- **Speed Insights**: `<SpeedInsights />` integrated in `app/layout.tsx`
- **Automatic Activation**: No additional setup required on Vercel deployment

### 2. Analytics Dashboard Access

1. **Vercel Dashboard**
   ```bash
   # Access via web
   https://vercel.com/dashboard
   ```

2. **Key Metrics Available**
   - **Page Views**: Real-time visitor tracking
   - **User Sessions**: Session duration and paths
   - **Conversion Funnels**: User journey analysis
   - **Geographic Data**: Visitor locations and regions
   - **Device Analytics**: Desktop/mobile/tablet breakdown

### 3. Speed Insights Monitoring

**Core Web Vitals Tracking:**
- **LCP** (Largest Contentful Paint): Loading performance
- **FID** (First Input Delay): Interactivity measurement
- **CLS** (Cumulative Layout Shift): Visual stability
- **TTFB** (Time to First Byte): Server response time
- **INP** (Interaction to Next Paint): Response time
- **FCP** (First Contentful Paint): Perceived loading speed

### 4. Real-time Alerts & Notifications

- **Performance Regression Detection**: Automatic alerts for performance drops
- **Error Rate Monitoring**: Spike detection in client-side errors
- **Traffic Anomaly Detection**: Unusual traffic pattern alerts
- **Core Web Vitals Threshold Alerts**: When metrics fall below thresholds

### 5. Health Check Endpoint

The `/api/health` endpoint provides:
- Database connectivity status
- Environment validation
- System uptime
- Response time metrics

### 6. CLI Monitoring Commands

```bash
# Check deployment status
npm run vercel:status

# View deployment logs
npm run vercel:logs

# Manual deployment (if needed)
npm run deploy
```

## Deployment Process

### 1. Pre-deployment Checklist

- [ ] All tests passing
- [ ] Code review completed
- [ ] Environment variables updated
- [ ] Database migration planned
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured

### 2. Staging Deployment

1. **Automatic Trigger**
   ```bash
   # Push to develop branch
   git checkout develop
   git merge feature/new-feature
   git push origin develop
   ```

2. **Manual Verification**
   - Run staging smoke tests
   - Verify functionality
   - Check performance metrics
   - Validate database state

### 3. Production Deployment

**🚀 Fully Automated via Vercel + GitHub Integration**

1. **Automatic Trigger**
   ```bash
   # Push to main branch triggers automatic deployment
   git checkout main
   git merge feature/your-changes
   git push origin main
   ```

2. **Deployment Flow**
   - GitHub Actions runs quality gates (security, tests, build)
   - Vercel automatically deploys on successful pipeline
   - Analytics and Speed Insights activate automatically
   - Production URL: https://www.drouple.app

3. **Manual Deployment (if needed)**
   ```bash
   # Using Vercel CLI for manual deployment
   npm run deploy              # Deploy to production
   npm run deploy:preview      # Deploy preview build
   npm run vercel:status       # Check deployment status
   npm run vercel:logs         # View deployment logs
   ```

4. **Real-time Monitoring**
   - **Vercel Dashboard**: Deployment status and performance
   - **Vercel Analytics**: User behavior and traffic patterns
   - **Speed Insights**: Core Web Vitals and performance metrics
   - **GitHub Actions**: Pipeline status and quality gates

## Post-Deployment Validation

### 1. Automated Checks

- Health endpoint returns 200 OK
- Database connectivity verified
- Critical user flows functional
- Performance within thresholds

### 2. Manual Verification

1. **User Authentication**
   ```bash
   # Test user login
   curl -X POST https://your-domain.com/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "password"}'
   ```

2. **Database Operations**
   - Create test records
   - Verify RBAC enforcement
   - Check tenant isolation

3. **Performance Validation**
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Verify bundle sizes

## Rollback Procedures

### 1. Application Rollback

1. **Vercel Rollback**
   ```bash
   # List recent deployments
   vercel ls
   
   # Rollback to specific deployment
   vercel rollback [deployment-url]
   ```

2. **GitHub Revert**
   ```bash
   # Revert commit
   git revert <commit-hash>
   git push origin main
   ```

### 2. Database Rollback

1. **Migration Rollback**
   ```bash
   # Check migration history
   npx prisma migrate status
   
   # Reset to specific migration
   npx prisma migrate reset --skip-seed
   ```

2. **Backup Restore**
   ```bash
   # List available backups
   npm run backup:list
   
   # Restore from backup
   npm run backup:restore <backup-id>
   ```

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Symptom**: CI/CD pipeline fails during build
**Solution**:
```bash
# Check build locally
npm run build

# Verify environment variables
npm run env:sanity

# Check TypeScript errors
npm run typecheck
```

#### 2. Database Connection Issues

**Symptom**: "Connection terminated unexpectedly"
**Solution**:
```bash
# Check connection strings
echo $DATABASE_URL
echo $DATABASE_URL_UNPOOLED

# Test connection
npx prisma db pull

# Verify Neon dashboard for issues
```

#### 3. High Error Rates

**Symptom**: Sentry alerts for increased errors
**Solution**:
1. Check Sentry dashboard for error patterns
2. Review recent deployments
3. Check database performance
4. Verify rate limiting configuration

#### 4. Performance Issues

**Symptom**: Slow response times or timeouts
**Solution**:
```bash
# Check bundle sizes
npm run analyze

# Run performance tests
npm run test:load

# Check database query performance
```

### Debugging Tools

1. **Logs**
   ```bash
   # Vercel logs
   vercel logs [deployment-url]
   
   # Local debugging
   npm run dev
   ```

2. **Database**
   ```bash
   # Prisma Studio
   npx prisma studio
   
   # Query debugging
   npx prisma db pull
   ```

3. **Monitoring**
   - Sentry dashboard
   - Vercel analytics
   - Custom metrics via `/api/health`

### Emergency Procedures

#### 1. Complete System Failure

1. **Immediate Response**
   - Trigger rollback to last known good state
   - Enable maintenance mode if available
   - Notify stakeholders

2. **Investigation**
   - Check all monitoring systems
   - Review recent changes
   - Coordinate with team

3. **Resolution**
   - Apply fixes
   - Test thoroughly
   - Gradual re-enable features

#### 2. Data Loss Prevention

1. **Regular Backups**
   ```bash
   # Automated daily backups
   0 2 * * * /usr/local/bin/npm run backup:create
   ```

2. **Point-in-time Recovery**
   - Use Neon's PITR feature
   - Maintain backup retention policy
   - Test restore procedures regularly

## Security Considerations

### 1. Environment Variables

- Never commit secrets to version control
- Use GitHub secrets for CI/CD
- Rotate secrets regularly
- Monitor for exposed keys

### 2. Database Security

- Use connection pooling
- Implement row-level security
- Regular security updates
- Monitor for suspicious queries

### 3. Application Security

- Enable all security headers
- Implement proper RBAC
- Regular dependency updates
- Monitor for vulnerabilities

## Performance Optimization

### 1. Bundle Analysis

```bash
# Analyze bundle sizes
npm run analyze

# Check for large dependencies
npx bundle-analyzer .next/static/chunks/*.js
```

### 2. Database Optimization

- Monitor query performance
- Use appropriate indexes
- Implement connection pooling
- Regular maintenance

### 3. CDN and Caching

- Enable Vercel Edge Network
- Implement proper cache headers
- Use Next.js Image optimization
- Monitor cache hit rates

---

## Support and Maintenance

For ongoing support:
- Monitor Sentry for errors
- Review performance metrics weekly
- Update dependencies monthly
- Test rollback procedures quarterly
- Review and update documentation as needed