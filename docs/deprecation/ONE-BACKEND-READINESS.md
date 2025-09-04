# One Backend Unification - Migration Guide

## Overview

The Drouple platform has been unified to use a single canonical API namespace `/api/v1/` for both Web and Mobile clients. Legacy endpoints are deprecated and will be removed after 60 days.

## What Changed

### Canonical API Namespace
- **New canonical path**: `/api/v1/*`
- **Old mobile paths**: `/api/mobile/v1/*` → DEPRECATED
- **Old web paths**: `/api/web/v1/*` → DEPRECATED

### Unified Response Format
All endpoints now return consistent response format:
```json
{
  "ok": boolean,
  "code": "string",  
  "message": "string",
  "data": any,
  "meta": {
    "traceId": "string"
  }
}
```

### Authentication Changes
- Single JWT format for all clients
- Same claims structure: `{ sub, roles[], tenantId, jti, exp }`
- Unified refresh token rotation
- Shared jti denylist for revocation

## Migration Steps

### For Web Client
1. Update `API_BASE_URL` to point to `/api/v1`
2. Install `@drouple/contracts` package
3. Replace manual API calls with typed client
4. Update error handling for new response format

### For Mobile Client  
1. Update `API_BASE_URL` to point to `/api/v1`
2. Install `@drouple/contracts` package (already done)
3. Replace endpoint paths in existing API calls
4. Offline sync endpoints remain compatible

## Endpoint Mappings

| Legacy Path | Canonical Path | Status |
|-------------|----------------|---------|
| `/api/mobile/v1/auth/login` | `/api/v1/auth/login` | ✅ Adapter |
| `/api/mobile/v1/auth/refresh` | `/api/v1/auth/refresh` | ✅ Adapter |
| `/api/mobile/v1/directory/search` | `/api/v1/members/search` | ✅ Adapter |
| `/api/mobile/v1/events` | `/api/v1/events` | ✅ Adapter |
| `/api/mobile/v1/checkin` | `/api/v1/checkins` | ✅ Adapter |
| `/api/mobile/v1/sync/*` | `/api/v1/sync/*` | ✅ Adapter |

## Deprecation Timeline

- **Day 0**: Canonical endpoints available, adapters active
- **Day 30**: Deprecation warnings added to adapter responses
- **Day 60**: Legacy endpoints removed

## Testing Your Migration

1. Update environment variables:
   ```env
   # Web
   NEXT_PUBLIC_API_URL=https://api.drouple.com/api/v1
   
   # Mobile  
   EXPO_PUBLIC_API_URL=https://api.drouple.com/api/v1
   ```

2. Run contract tests:
   ```bash
   npm run test:contract
   ```

3. Verify adapter responses include deprecation headers:
   ```bash
   curl -I https://api.drouple.com/api/mobile/v1/auth/login
   # Should include: Deprecation: true
   ```

## Safe Removal Checklist (After 60 days)

- [ ] Verify zero traffic to legacy endpoints (check logs)
- [ ] Remove adapter route files: `app/api/mobile/v1/**/adapter-route.ts`
- [ ] Remove adapter middleware: `lib/middleware/adapters.ts`
- [ ] Update CI guards to prevent new legacy routes
- [ ] Archive this migration guide

## Support

- Technical issues: Check unified API documentation
- Migration questions: Review contract tests for examples
- Emergency rollback: Revert API_BASE_URL environment variables