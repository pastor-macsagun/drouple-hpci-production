# Release Notes - Auth Rate Limiting Hotfix

**Release Date**: August 26, 2025  
**Version**: 1.1.0-hotfix.1  
**Status**: DEPLOYED TO PRODUCTION ✅

## Summary

Fixed overly aggressive rate limiting that was preventing users from accessing authentication pages. Implemented endpoint-specific rate limiting policies with proper headers and retry guidance.

## Changes Made

### 🔧 Rate Limiting Improvements

1. **Removed Rate Limiting from GET Requests**
   - `/auth/signin` - No longer rate limited on GET ✅
   - `/register` - No longer rate limited on GET ✅
   - `/auth/error` - No longer rate limited on GET ✅
   - Users can always access login and registration pages

2. **Added Granular POST Limits**
   - Login attempts: 5 per minute, 20 per hour (per IP + email)
   - Registration: 3 per hour (per IP + email)
   - Check-in: 1 per 5 minutes (unchanged)
   - General API: 100 per 15 minutes (unchanged)

3. **Implemented Standard Headers**
   - `X-RateLimit-Limit` - Maximum requests allowed
   - `X-RateLimit-Remaining` - Requests remaining
   - `X-RateLimit-Reset` - Unix timestamp when limit resets
   - `Retry-After` - Seconds to wait (only on 429)

### 📝 Documentation Updates

- Updated `/docs/rate-limiting.md` with new policies
- Added troubleshooting guide for common issues
- Updated `/docs/runbook.md` with rate limit testing steps
- Added migration notes for breaking changes

### ✅ Testing

- Added 14 unit tests for rate limit policies
- Added E2E tests for auth flow rate limiting
- Verified headers are properly included
- Tested sliding window algorithm

## Production Validation Results

### ✅ CONFIRMED FIXED
- **Auth pages accessible**: GET /auth/signin returns 200 (tested 10x) ✅
- **Health endpoint**: Operational with database connected ✅
- **Headers present**: X-RateLimit-* headers on API responses ✅
- **Performance**: Sub-second response times maintained ✅

### ⚠️ Known Issues
- `/register` page returning 500 error (unrelated to rate limiting)
  - This appears to be a separate issue with the register page itself
  - Rate limiting is not blocking access (confirmed no 429s)
  - Needs separate investigation

## Deployment Information

- **Production URL**: https://drouple-hpci-prod.vercel.app
- **Deployment Time**: August 26, 2025 03:15 UTC
- **Deployment ID**: CdGrbFWStagZrhqSdzxoHGnsr2bF
- **Vercel Dashboard**: https://vercel.com/pastormacsagun-9316s-projects/drouple-hpci-prod

## Breaking Changes

None for end users. Backend changes only:
- Rate limit header format changed to standard format
- Rate limit keys now include email for auth endpoints
- Separate minute and hour windows for login attempts

## Migration Guide

For API consumers:
1. Parse new `X-RateLimit-*` headers instead of custom headers
2. Respect `Retry-After` header on 429 responses
3. Implement exponential backoff for retries

## Testing Instructions

```bash
# Verify auth pages are NOT rate limited
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://drouple-hpci-prod.vercel.app/auth/signin
done
# Should all return 200, never 429

# Test POST limits (will get 429 after 5 attempts)
for i in {1..6}; do
  curl -X POST https://drouple-hpci-prod.vercel.app/api/auth/callback/credentials \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -i | grep -E "(HTTP|X-RateLimit|Retry-After)"
done
```

## Monitoring

- Monitor 429 response rates in Vercel dashboard
- Check for elevated error rates on auth endpoints
- Track average Retry-After values

## Support

For issues related to this release:
- Check `Retry-After` header for wait time
- Review `/docs/rate-limiting.md` for troubleshooting
- Contact DevOps team if issues persist

## Next Steps

1. Investigate and fix `/register` page 500 error
2. Monitor rate limit metrics for first 24 hours
3. Adjust limits based on usage patterns if needed
4. Consider adding CAPTCHA for repeated failures

## Approval

- **Deployed By**: Production Deployment Pipeline
- **Validated By**: Automated Testing + Manual Verification
- **Status**: GO/MONITOR ✅

---

## Recommendation: **GO WITH MONITORING**

The critical rate limiting issue has been resolved. Users can now access authentication pages without being blocked. The system maintains security with appropriate POST request limits while ensuring accessibility.

The `/register` page 500 error is a separate issue that needs investigation but does not block the rate limiting fix deployment.