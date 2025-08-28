# Sentry Monitoring Configuration for HPCI-ChMS

## Overview

This document describes the complete Sentry monitoring setup for HPCI-ChMS, which has been updated to use the modern Next.js 15 instrumentation approach.

## Configuration Files

### Core Files

1. **`instrumentation.ts`** - Server-side and Edge Runtime initialization
2. **`instrumentation-client.ts`** - Client-side initialization and monitoring
3. **`app/global-error.tsx`** - Global error boundary with Sentry integration
4. **`lib/sentry-integration.ts`** - HPCI-ChMS specific utility functions

### Environment Variables

```bash
# Required for production
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"

# Required for source map uploads
SENTRY_ORG="your-sentry-org"
SENTRY_PROJECT="hpci-chms"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"

# Optional - enable in development
SENTRY_ENABLED="true"
```

## Key Features

### 🔧 Modern Next.js 15 Compatibility

- ✅ Uses `instrumentation.ts` for server-side initialization
- ✅ Uses `instrumentation-client.ts` for client-side setup
- ✅ Includes `onRequestError` hook for React Server Components
- ✅ Includes `onRouterTransitionStart` hook for navigation tracking
- ✅ Removes deprecated `sentry.*.config.ts` files

### 🏢 HPCI-ChMS Integration

- **Multi-tenant context**: Automatically tags errors with `tenant_id`
- **User context**: Captures user ID, email, and role information
- **RBAC integration**: Reports authorization violations and role conflicts
- **Performance monitoring**: Tracks slow database operations and page loads

### 🛡️ Security & Privacy

- **Data filtering**: Removes sensitive headers and query parameters
- **Tenant isolation**: Captures cross-tenant access attempts
- **Error deduplication**: Filters out browser extension and development noise
- **Structured logging**: Consistent tagging for better error organization

## Usage Examples

### Basic Error Reporting

```typescript
import { captureHPCIError } from '@/lib/sentry-integration';

try {
  // Some operation
} catch (error) {
  captureHPCIError(error, {
    action: 'create_member',
    resource: 'members',
    userId: user.id,
    tenantId: user.tenantId,
    userRole: user.role,
    extra: { memberData: { name: 'John Doe' } }
  });
  throw error;
}
```

### Authentication Events

```typescript
import { captureAuthEvent } from '@/lib/sentry-integration';

// Successful login
captureAuthEvent('login_success', {
  email: user.email,
  userId: user.id,
  tenantId: user.tenantId,
  ipAddress: req.ip
});

// Failed login attempt
captureAuthEvent('login_failure', {
  email: credentials.email,
  reason: 'invalid_password',
  ipAddress: req.ip
});
```

### Performance Monitoring

```typescript
import { captureDBPerformance } from '@/lib/sentry-integration';

const startTime = Date.now();
const users = await prisma.user.findMany({
  where: { tenantId },
  include: { memberships: true }
});
const duration = Date.now() - startTime;

captureDBPerformance('user_query', duration, {
  table: 'user',
  tenantId,
  recordCount: users.length,
  query: 'findMany with memberships'
});
```

### Client-side Usage

```typescript
import { captureClientError, captureUserAction } from '@/instrumentation-client';

// Error reporting
try {
  await submitForm(data);
} catch (error) {
  captureClientError(error, {
    id: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId
  }, {
    formData: data,
    component: 'MemberForm'
  });
}

// User action tracking
captureUserAction('form_submit', {
  userId: user.id,
  tenantId: user.tenantId,
  resource: 'members',
  result: 'success',
  extra: { formType: 'create_member' }
});
```

## Monitoring Features

### 🏷️ Automatic Tagging

All errors are automatically tagged with:

- `application: 'hpci-chms'`
- `component: 'client' | 'server' | 'edge'`
- `tenant_id: string` (when available)
- `user_role: UserRole` (when available)
- `runtime: 'browser' | 'nodejs' | 'edge'`

### 📊 Performance Tracking

- **Database operations** > 1 second are flagged
- **Page loads** > 2 seconds are captured
- **API response times** are monitored
- **Bundle size analysis** integrated

### 🚨 Security Monitoring

- **Tenant isolation violations** are captured as errors
- **RBAC authorization failures** are logged as warnings
- **Rate limiting events** are tracked
- **Authentication failures** are monitored

## Deployment Notes

### Production Setup

1. **Configure environment variables** in Vercel/production environment
2. **Set up Sentry project** with appropriate DSN
3. **Generate auth token** for source map uploads
4. **Test error reporting** with a controlled error

### Development Setup

```bash
# Enable Sentry in development (optional)
export SENTRY_ENABLED="true"
export SENTRY_DSN="your-dev-sentry-dsn"
export NEXT_PUBLIC_SENTRY_DSN="your-dev-sentry-dsn"
```

### Source Maps

Source maps are automatically uploaded in production builds when:
- `SENTRY_AUTH_TOKEN` is set
- `SENTRY_ORG` and `SENTRY_PROJECT` are configured
- Build runs with `NODE_ENV=production`

## Troubleshooting

### Common Issues

1. **Build warnings about missing instrumentation**
   - ✅ **Fixed**: Modern `instrumentation.ts` file created

2. **Missing global error handler warnings**
   - ✅ **Fixed**: `app/global-error.tsx` component added

3. **Deprecated config file warnings**
   - ✅ **Fixed**: Migrated to `instrumentation-client.ts`

4. **Missing navigation tracking**
   - ✅ **Fixed**: Added `onRouterTransitionStart` export

### Testing Configuration

```bash
# Build test (should show no Sentry warnings)
npm run build

# Type check
npm run typecheck

# Lint check
npm run lint
```

### Monitoring Dashboard

Access your Sentry dashboard at `https://sentry.io/organizations/{org}/projects/{project}/` to view:

- Error frequency and trends
- Performance metrics
- User impact analysis
- Release tracking
- Custom dashboards

## Migration Notes

### What Changed

- ❌ **Removed**: `sentry.server.config.ts`, `sentry.edge.config.ts`, `sentry.client.config.ts`
- ✅ **Added**: `instrumentation.ts`, `instrumentation-client.ts`
- ✅ **Added**: `app/global-error.tsx`, `lib/sentry-integration.ts`
- ✅ **Enhanced**: HPCI-ChMS specific context and error handling

### Breaking Changes

None. The new configuration is backward compatible and provides enhanced monitoring capabilities.

## Support

For issues related to Sentry configuration:

1. **Check build logs** for any remaining warnings
2. **Verify environment variables** are properly set
3. **Test error reporting** in development with `SENTRY_ENABLED=true`
4. **Review Sentry dashboard** for incoming events

---

**Last Updated**: August 28, 2025  
**Sentry SDK Version**: @sentry/nextjs ^10.6.0  
**Next.js Version**: 15.1.3