# Auth.js v5 Session Persistence Diagnosis

## Executive Summary
The Drouple - Church Management System application is experiencing session persistence failures in production where sessions "work momentarily then expire." Based on comprehensive analysis of the Auth.js v5 configuration, this appears to be a **cookie naming and security attribute mismatch** issue combined with **domain canonicalization problems**.

## Critical Findings

### 1. Package Versions
```json
"next-auth": "5.0.0-beta.25"
```
- **Status**: ✅ Using Auth.js v5 (NextAuth v5 beta)
- **Impact**: Latest beta should have stable cookie handling, but beta versions may have edge cases

### 2. Session Strategy Analysis
```typescript
// From lib/auth.ts line 229
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 24 hours
},
useSecureCookies: process.env.NODE_ENV === "production",
```
- **Strategy**: JWT (correct for credentials provider)
- **Max Age**: 24 hours (reasonable)
- **Secure Cookies**: ✅ Enabled in production

### 3. Cookie Configuration Issues

#### 3.1 Missing Custom Cookies Configuration
**CRITICAL**: The auth configuration lacks explicit `cookies` options. Auth.js v5 uses different default cookie names than v4:

**Expected v5 Cookie Names:**
- `__Secure-authjs.session-token` (production)
- `authjs.session-token` (development)

**Current Cleanup Logic Expects v4 Names:**
```typescript
// lib/auth-session-cleanup.ts line 8-16
const sessionCookies = [
  'next-auth.session-token',           // ❌ v4 name
  '__Secure-next-auth.session-token',  // ❌ v4 name
  // ... other v4 names
]
```

### 4. Domain Configuration Analysis

#### 4.1 Production URL Mismatch
```typescript
// Production config shows:
NEXTAUTH_URL="https://drouple.app"        // Apex domain

// But testing config shows:
baseUrl: 'https://www.drouple.app'        // www subdomain
```

**CRITICAL**: Domain mismatch between Auth.js configuration and actual application URL.

#### 4.2 Missing trustHost Configuration Issues
```typescript
trustHost: true, // Required for NextAuth v5 in production with custom domains
```
- **Status**: ✅ Present but may not handle www/apex redirect properly

### 5. Environment Variable Analysis

#### 5.1 Secret Management
```typescript
// lib/env-utils.ts line 30-32
export function getNextAuthSecret(): string | undefined {
  return getCleanEnvVar('AUTH_SECRET', 'NEXTAUTH_SECRET')
}
```
- **Status**: ✅ Proper fallback handling
- **Cleaning**: ✅ Trims Vercel CLI newlines

#### 5.2 Environment Variables Expected
```env
NEXTAUTH_URL="https://drouple.app"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### 6. Middleware Implementation Analysis

```typescript
// middleware.ts line 4, 12
import { getSession } from "@/lib/edge/session-cookie"
session = await getSession(req)
```

**ISSUE**: Middleware uses `getToken()` from next-auth/jwt which may not properly handle Auth.js v5 cookie names.

## Root Cause Hypothesis

### Primary Issue: Cookie Name Mismatch
Auth.js v5 uses different default cookie names, but the cleanup logic and potentially the middleware are looking for v4 cookie names. This causes:

1. **Initial Login Success**: JWT is created with v5 cookie names
2. **Subsequent Failures**: Middleware/cleanup can't find cookies with v4 names
3. **Session Expiry**: Invalid cookie cleanup triggers, clearing valid v5 sessions

### Secondary Issue: Domain Canonicalization
The mismatch between `drouple.app` (apex) and `www.drouple.app` (www) may cause:

1. **Cookie Domain Issues**: Cookies set for one domain aren't accessible from the other
2. **CORS/Trust Issues**: Auth.js may not trust requests between apex and www

## Immediate Action Items

### 1. Fix Cookie Names for v5 Compatibility
```typescript
// Update lib/auth-session-cleanup.ts
const sessionCookies = [
  'authjs.session-token',                    // v5 development
  '__Secure-authjs.session-token',           // v5 production
  'authjs.csrf-token',                       // v5 csrf
  '__Host-authjs.csrf-token',                // v5 csrf secure
  // Keep v4 names for migration compatibility
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
]
```

### 2. Explicit Cookie Configuration
```typescript
// Add to lib/auth.ts authOptions
cookies: {
  sessionToken: {
    name: process.env.NODE_ENV === 'production' 
      ? '__Secure-authjs.session-token' 
      : 'authjs.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.drouple.app' : undefined
    }
  }
}
```

### 3. Domain Canonicalization Strategy
**Option A**: Redirect www to apex
**Option B**: Configure cookies for both domains
**Recommended**: Use apex domain (`drouple.app`) consistently

### 4. Environment Variable Audit
Ensure production environment has:
```env
NEXTAUTH_URL="https://drouple.app"  # Match actual domain
AUTH_SECRET="[32+ char secret]"
```

## Testing Strategy

### Phase 1: Cookie Name Verification
1. Check browser developer tools for actual cookie names in production
2. Compare with cleanup logic expectations
3. Verify middleware can read the correct cookies

### Phase 2: Domain Resolution
1. Test auth flow on both `drouple.app` and `www.drouple.app`
2. Verify cookie accessibility across subdomains
3. Check redirect behavior

### Phase 3: Session Persistence
1. Login and wait 10+ minutes
2. Perform authenticated actions
3. Verify session doesn't expire prematurely

## Risk Assessment

**HIGH RISK**: Session persistence affects all authenticated users
**MEDIUM COMPLEXITY**: Requires cookie configuration updates and testing
**LOW BREAKING CHANGE RISK**: Changes are backward compatible

## Success Criteria

1. ✅ Sessions persist for full 24-hour duration
2. ✅ No unexpected logouts during normal usage
3. ✅ Proper cookie cleanup only occurs on actual JWT errors
4. ✅ Consistent behavior across all production domains

---

*Generated on: 2025-01-02*  
*Production URL: https://www.drouple.app*  
*Auth.js Version: 5.0.0-beta.25*