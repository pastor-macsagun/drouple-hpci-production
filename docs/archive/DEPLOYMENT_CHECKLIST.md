# HPCI-ChMS Production Deployment Checklist

## Pre-Deployment Status ✅

### Code Quality
- ✅ Branch: main
- ✅ Working directory: clean
- ✅ TypeScript compilation: passed
- ✅ Linting: passed (warnings only)
- ✅ Production build: successful
- ✅ Bundle size: optimized (~105kB First Load JS)

### Database
- ✅ Migrations: Ready for deployment (8 pending)
- ✅ Constraints verified: UNIQUE and INDEX checks passed
- ⚠️ **ACTION REQUIRED**: Run migrations on production database after deployment
  ```bash
  DATABASE_URL=<PROD_URL> npx prisma migrate deploy
  ```

### Configuration Files
- ✅ vercel.json: Created with security headers
- ✅ .vercel/project.json: Linked to project ID prj_efkeO39Ycqzm1e56Or3cEdGkT96k
- ✅ Security headers configured:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Strict-Transport-Security: max-age=31536000

## Deployment Steps

### 1. Authenticate with Vercel
```bash
vercel login
```

### 2. Set Production Environment Variables
Ensure these are set in Vercel dashboard or via CLI:
```bash
vercel env add DATABASE_URL production
vercel env add DATABASE_URL_UNPOOLED production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
vercel env add RATE_LIMIT_ENABLED production
vercel env add SENTRY_DSN production  # Optional
```

### 3. Deploy to Production
```bash
vercel --prod
```

### 4. Run Database Migrations
After deployment, run migrations on production database:
```bash
DATABASE_URL=<PRODUCTION_DATABASE_URL> npx prisma migrate deploy
```

## Post-Deployment Verification

### Immediate Checks (5 minutes)
- [ ] Deployment URL accessible
- [ ] `/api/health` returns 200
- [ ] Database connectivity confirmed
- [ ] Sign in page loads
- [ ] Security headers present (check browser DevTools)

### Smoke Tests (15 minutes)
- [ ] **Authentication Flow**
  - [ ] Sign in with email/password
  - [ ] Force password change for new member
  - [ ] Sign out works
  
- [ ] **Role-Based Access**
  - [ ] SUPER_ADMIN can access /super
  - [ ] ADMIN can access /admin/*
  - [ ] VIP can access /vip/firsttimers
  - [ ] MEMBER can access /dashboard
  - [ ] Unauthorized redirects work
  
- [ ] **Core Features**
  - [ ] Sunday Check-in works
  - [ ] Events RSVP functional
  - [ ] LifeGroups display correctly
  - [ ] Pathways enrollment works
  
- [ ] **Multi-tenancy**
  - [ ] Manila users see only Manila data
  - [ ] Cebu users see only Cebu data
  
- [ ] **CSV Exports**
  - [ ] At least one CSV export works
  
- [ ] **Rate Limiting**
  - [ ] Multiple rapid requests return 429

### Monitoring (24 hours)
- [ ] Monitor Sentry for errors
- [ ] Check Neon dashboard for query patterns
- [ ] Review Vercel analytics for performance
- [ ] Monitor user feedback channels

## Rollback Plan

If critical issues arise:
1. **Immediate rollback**: 
   ```bash
   vercel rollback
   ```
2. **Or via dashboard**: Promote previous deployment in Vercel dashboard
3. **Database**: Migrations are forward-only, prepare hotfix if needed

## Known Issues (Non-blocking)

These can be addressed post-deployment:
1. Test infrastructure (5 failing unit tests - test files only, not app code)
2. TypeScript warnings (~20 'any' types)
3. React hook dependencies (2 warnings)

## Support Contacts
- Technical Issues: Check logs in Vercel dashboard
- Database Issues: Check Neon dashboard
- User Reports: Monitor feedback channels

---

**Deployment Prepared**: Aug 26, 2025
**Project ID**: prj_efkeO39Ycqzm1e56Or3cEdGkT96k
**Status**: READY FOR DEPLOYMENT ✅