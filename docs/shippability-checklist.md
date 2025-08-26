# Shippability Checklist

## Pre-Release Verification

### ✅ Build & Deploy
- [ ] `next build` - Production build succeeds
- [ ] `npm run typecheck` - TypeScript compilation passes
- [ ] `npm run lint` - ESLint passes with no errors
- [ ] Vercel deployment preview works

### ✅ Testing
- [ ] `npm run test:unit` - All unit tests pass
- [ ] `npm run test:e2e` - All e2e tests pass
- [ ] Coverage ≥80% on critical modules (RBAC, tenancy, events, check-in, pathways)

### ✅ Seed Data & Accounts
Test accounts available after `npm run seed`:
- **Super Admin**: superadmin@test.com
- **Church Admins**: admin.manila@test.com, admin.cebu@test.com  
- **Leaders**: leader.manila@test.com, leader.cebu@test.com
- **Members**: member1@test.com through member10@test.com
- **Local Churches**: Manila (ID: clxtest002), Cebu (ID: clxtest003)

### ✅ Role-Based Access Control
Verify each role's access:
- [ ] **MEMBER**: Can view events, join life groups, check-in, view pathways
- [ ] **LEADER**: Above + manage life groups, create events, mark progress
- [ ] **ADMIN**: Above + manage services, pathways, full church management
- [ ] **PASTOR**: Above + manage local churches
- [ ] **SUPER_ADMIN**: Full system access including multi-church management

### ✅ Cross-Tenant Isolation
- [ ] Manila users cannot see Cebu data
- [ ] Cebu users cannot see Manila data
- [ ] WHOLE_CHURCH events visible to all
- [ ] LOCAL_CHURCH events only visible to same church

### ✅ Data Integrity
- [ ] Check-in prevents duplicates (one per user per service)
- [ ] RSVP prevents duplicates (one per user per event)
- [ ] Unique constraints enforced at DB level
- [ ] Cascade deletes work correctly

### ✅ Rate Limiting
- [ ] Registration: Max 3 attempts per hour
- [ ] Check-in: Max 1 per 5 minutes per service
- [ ] Returns 429 status with Retry-After header
- [ ] Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

### ✅ Security Headers
Verify presence in response headers:
- [ ] Content-Security-Policy
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Referrer-Policy: strict-origin-when-cross-origin

### ✅ Accessibility
- [ ] Skip navigation link present
- [ ] All form inputs have labels
- [ ] Modal focus trap and restore
- [ ] Keyboard navigation works

### ✅ CSV Exports
Verify exports work and contain expected data:
- [ ] Check-in attendance export
- [ ] Life groups roster export
- [ ] Events attendee list export
- [ ] All exports open correctly in Excel/Sheets

### ✅ Environment Variables
Required for production:
```env
DATABASE_URL          # Neon PostgreSQL connection
NEXTAUTH_URL         # Production URL
NEXTAUTH_SECRET      # Generated secret (openssl rand -base64 32)
RESEND_API_KEY       # Email service key
RESEND_FROM_EMAIL    # Sender email address
```

### ✅ Documentation Links
- [Deployment Guide](./deployment.md)
- [API Documentation](./api-reference.md)
- [Troubleshooting](./troubleshooting.md)
- [RBAC Matrix](./rbac.md)

## Go/No-Go Decision Gate

**SHIP IT when:**
- ✅ All builds pass (Next.js, TypeScript, Lint)
- ✅ Test coverage ≥80% on critical modules
- ✅ All role flows tested and working
- ✅ Cross-tenant isolation verified
- ✅ Rate limiting active
- ✅ Security headers present
- ✅ CSV exports functional
- ✅ Required environment variables set

**HOLD if:**
- ❌ Any build failures
- ❌ Test coverage <80% on critical modules
- ❌ Tenant data leakage detected
- ❌ Missing required environment variables
- ❌ Critical security headers absent