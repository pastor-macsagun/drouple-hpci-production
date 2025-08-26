# Replace Magic-Link Auth with Email+Password Credentials

## Summary
- ✅ Completely removed magic-link/email-provider authentication
- ✅ Implemented secure email+password flow using NextAuth Credentials provider  
- ✅ Added rate limiting (5 attempts per 15 minutes per IP+email)
- ✅ Role-based post-login redirects working correctly

## Changes Made

### Authentication System
- **Removed**: Email provider, magic-link routes, verification request pages
- **Added**: Credentials provider with bcryptjs password hashing (12 rounds)
- **Added**: Rate limiting with memory-based tracking (429 response with Retry-After headers)
- **Runtime**: Auth route uses `nodejs` runtime for bcrypt compatibility

### Database
- **Schema**: Added `passwordHash` field to User model
- **Migration**: Created `20250823_add_password_hash/migration.sql`
- **Seeds**: All test users have passwordHash set with default password

### UI Updates  
- **Login**: Email+password form with error handling and rate limit messages
- **Registration**: Password field with confirmation and validation (8+ chars, mixed case, number, symbol)
- **Success flow**: Registration redirects to signin with success message

### Post-Login Redirects
- `SUPER_ADMIN` → `/super`
- All other roles → `/dashboard?lc=<primaryLocalChurchId>`

## Test Accounts

All seeded users use password: `Hpci!Test2025`

| Email | Role | Redirects To |
|-------|------|--------------|
| superadmin@test.com | SUPER_ADMIN | /super |
| admin.manila@test.com | ADMIN | /dashboard?lc=local_manila |
| admin.cebu@test.com | ADMIN | /dashboard?lc=local_cebu |
| leader.manila@test.com | LEADER | /dashboard?lc=local_manila |
| leader.cebu@test.com | LEADER | /dashboard?lc=local_cebu |
| member1-10@test.com | MEMBER | /dashboard |

## Evidence

### Rate Limiting (429 Response)
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2025-08-23T19:30:00.000Z

Too many login attempts. Please try again later.
```

### Build Success
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (46/46)
✓ Collecting build traces
✓ Finalizing page optimization
```

### Test Results
```
✓ Credentials Authentication (10 tests) - Password hashing, rate limiting, redirects
✓ E2E auth.credentials.spec.ts - Login flows for all roles
✓ Registration with password validation
```

## Documentation Updated
- ✅ README.md - Updated auth stack, added test accounts table
- ✅ deployment.md - Removed email provider requirements
- ✅ api-reference.md - Added credentials endpoint documentation  
- ✅ troubleshooting.md - Added password login issues section
- ✅ rbac.md - Added post-login redirect behavior
- ✅ .env.example - Removed magic-link email variables

## Commands Verified
```bash
npx prisma generate           ✅
npm run seed                  ✅  
npm run typecheck            ✅
npm run lint                 ✅ (4 warnings - any types)
npm run test:unit            ✅
npm run build                ✅
```

## Breaking Changes
- Users must now use email+password to login (no more magic links)
- Existing users without passwordHash will need admin assistance or re-registration
- Email provider environment variables no longer needed for auth (keep RESEND_API_KEY if using announcements)

## Security Notes
- Passwords hashed with bcryptjs (12 rounds)
- Rate limiting prevents brute force attacks
- Middleware remains edge-safe
- No passwords in logs or client-side code
- NEXTAUTH_SECRET still required for JWT signing