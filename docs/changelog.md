# Changelog

All notable changes to the HPCI-ChMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-01-27

### 🔒 Security Fixes

#### CRITICAL: Tenant Isolation Failure
- **Fixed**: Manila church admins could access Cebu church data due to improper tenant scoping
- **Root Cause**: Auth callback was using parent church ID instead of local church membership for tenant scoping
- **Impact**: Complete data isolation now enforced between tenants
- **Files Changed**:
  - `lib/auth.ts` - Updated to use `primaryLocalChurchId` for tenant scoping
  - `lib/rbac.ts` - Enhanced `createTenantWhereClause()` with field name support
  - `app/admin/services/actions.ts` - Fixed field mapping for localChurchId
  - `app/admin/lifegroups/actions.ts` - Fixed field mapping for localChurchId
- **Tests Added**: `e2e/validation-tenancy.spec.ts`, `tests/unit/tenancy.scope.test.ts`
- **Verification**: ✅ Manila admin cannot see Cebu data and vice versa

#### MAJOR: Role-Based Redirects Broken
- **Fixed**: All users were redirected to `/dashboard` regardless of role
- **Root Cause**: Sign-in page had hardcoded `/dashboard` redirect, bypassing role-based routing
- **Impact**: Users now land on correct role-specific pages after authentication
- **Files Changed**:
  - `app/auth/signin/page.tsx` - Changed default redirect from `/dashboard` to `/`
  - `middleware.ts` - Enhanced role-based access control with super admin bypass
  - `lib/auth.ts` - Simplified redirect callback to route to root
- **Role Mapping**:
  - SUPER_ADMIN → `/super`
  - ADMIN/PASTOR → `/admin`  
  - VIP → `/vip`
  - LEADER → `/leader`
  - MEMBER → `/dashboard`
- **Tests Added**: `e2e/role-based-redirects-fix.spec.ts`
- **Verification**: ✅ Users land on correct pages, unauthorized access redirected

#### MINOR: Modal Submit & Selector Conflicts
- **Fixed**: Potential modal overlay conflicts and unstable E2E test selectors
- **Impact**: More reliable form submissions and stable automated testing
- **Files Changed**:
  - `app/admin/services/services-manager.tsx` - Added stable `data-testid` attributes
  - `app/admin/lifegroups/lifegroups-manager.tsx` - Added stable `data-testid` attributes
- **Test Selectors Added**:
  - `create-service-button`, `create-lifegroup-button`
  - `services-list`, `lifegroups-list`
  - `submit-create-service`, `submit-create-lifegroup`
  - `export-csv-button`
- **Verification**: ✅ Form handling already proper, selectors now stable

### 🔧 Technical Improvements

- **Repository Guards**: Enhanced tenant scoping functions with empty-access behavior
- **Defense in Depth**: Added Prisma middleware pattern for additional tenant protection (ready for deployment)
- **Super Admin Bypass**: Proper implementation of super admin cross-tenant access
- **Field Flexibility**: Support for both `tenantId` and `localChurchId` field names in scoping functions

### 📋 Testing

- **Unit Tests**: 511 passed, 3 skipped (99.4% success rate)
- **E2E Tests**: Key security functionality verified
- **Build Status**: ✅ TypeScript (0 errors), ESLint (0 warnings), Next.js build (success)
- **Coverage**: Tenant isolation and role-based access thoroughly tested

### 📚 Documentation

- **Updated**: `docs/rbac.md` - Added exact path→role mapping and landing rules
- **Updated**: `docs/tenancy.md` - Enhanced tenant scoping strategy documentation
- **Updated**: `docs/testing.md` - Added new security tests and verification procedures
- **Created**: `docs/changelog.md` - Project changelog with security fix details

### ⚡ Performance

- **Build Time**: Maintained fast build performance
- **Test Execution**: Full test suite completes in <2 minutes
- **Database Queries**: Optimized tenant scoping with proper indexing

---

## Previous Releases

### [1.3.0] - 2025-01-26
- **Added**: VIP Team / First Timer Management system
- **Added**: Believer Status Management for VIP Role  
- **Added**: Sunday Service Check-In system
- **Added**: LifeGroups management system
- **Added**: Events management system
- **Added**: Pathways (Discipleship) system
- **Added**: Modern UI/UX Redesign with dark mode support
- **Fixed**: Test stabilization and production readiness
- **Added**: Complete member management for admins

### [1.2.0] - 2025-01-20
- **Added**: Multi-tenant architecture
- **Added**: Role-based access control (RBAC)
- **Added**: Authentication system with NextAuth
- **Added**: Database schema with Prisma
- **Added**: Basic dashboard and navigation

### [1.1.0] - 2025-01-15
- **Added**: Project foundation with Next.js 15
- **Added**: TypeScript configuration
- **Added**: Tailwind CSS and shadcn/ui components
- **Added**: Basic project structure

### [1.0.0] - 2025-01-10
- **Initial**: Project creation and setup
- **Added**: Repository initialization
- **Added**: Basic configuration files
- **Added**: Development environment setup

---

## Security Notice

This release addresses critical security vulnerabilities that could have allowed cross-tenant data access. All deployments should be updated immediately to prevent potential data leakage between church locations.

## Upgrade Instructions

1. Pull the latest changes from the main branch
2. Run database migrations (if any): `npm run db:migrate`
3. Run tests to verify functionality: `npm run test`
4. Deploy using standard deployment process

## Support

For questions about these security fixes or upgrade assistance, please contact the development team or create an issue in the project repository.