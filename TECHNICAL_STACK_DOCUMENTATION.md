# Drouple Church Management System - Technical Stack Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Technologies](#core-technologies)
3. [Frontend Stack](#frontend-stack)
4. [Backend & Database](#backend--database)
5. [Authentication & Security](#authentication--security)
6. [Testing Infrastructure](#testing-infrastructure)
7. [Development Tools & DevOps](#development-tools--devops)
8. [Performance & Monitoring](#performance--monitoring)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Progressive Web App (PWA)](#progressive-web-app-pwa)
11. [Key Configuration Files](#key-configuration-files)
12. [Environment & Dependencies](#environment--dependencies)

---

## System Overview

Drouple is a production-ready, multi-tenant church management system built with modern web technologies. It provides comprehensive functionality for church administration, member management, event coordination, discipleship tracking, and service check-ins.

**Current Status**: Production-ready with 662 passing unit tests, comprehensive E2E coverage, and enterprise-grade DevOps pipeline.

---

## Core Technologies

### Framework & Runtime
- **Next.js 15.1.3** - React framework with App Router
- **React 19.0.0** - UI library with latest features
- **TypeScript 5.7.2** - Type-safe JavaScript
- **Node.js** - Runtime environment

### Language & Type System
- **TypeScript** - Primary development language
- **Zod 3.25.76** - Runtime type validation and schema definition
- **ESLint 9.34.0** - Code linting and quality enforcement
- **Prettier 3.6.2** - Code formatting

---

## Frontend Stack

### UI Components & Styling
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Tailwind CSS Animate 1.0.7** - Animation utilities
- **Radix UI** - Accessible component primitives
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-label`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-progress`
  - `@radix-ui/react-select`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-switch`
  - `@radix-ui/react-tabs`
- **shadcn/ui** - Pre-built component library
- **Class Variance Authority 0.7.1** - Component variant management
- **clsx 2.1.1** - Conditional className utility
- **Tailwind Merge 2.6.0** - Merge Tailwind classes intelligently

### Icons & Graphics
- **Lucide React 0.468.0** - Modern icon library
- **QR Code Generation** - `qrcode 1.5.4`
- **QR Code Scanning** - `html5-qrcode 2.3.8`

### State Management & Data Fetching
- **TanStack React Query 5.86.0** - Server state management
- **React Hook Form 7.62.0** - Form state management
- **@hookform/resolvers 3.10.0** - Form validation resolvers

### Theme & Design System
- **next-themes 0.4.6** - Dark/light mode support
- **Design System**: Sacred Blue (#1e7ce8) + Soft Gold (#e5c453) color palette
- **WCAG AA Compliant** - Accessibility standards met
- **CSS Custom Properties** - Design tokens for colors, spacing, typography
- **Responsive Design** - Mobile-first approach with drawer navigation

---

## Backend & Database

### Database
- **PostgreSQL** - Primary database (via Neon)
- **Prisma ORM 6.1.0** - Database toolkit and query builder
- **Connection Pooling** - Optimized with pgbouncer integration
- **Composite Indexes** - Performance-optimized query patterns

### Database Schema Highlights
```prisma
// Key models with multi-tenant support
- User (with tenantId, role-based access)
- Church & LocalChurch (hierarchical structure)
- Membership (user-church relationships)
- Service & Checkin (attendance tracking)
- LifeGroup & related models (small group management)
- Event & EventRsvp (event management with waitlists)
- Pathway & PathwayEnrollment (discipleship tracking)
- FirstTimer (VIP team management)
- AuditLog (comprehensive activity tracking)
```

### Server-Side Architecture
- **Next.js Server Actions** - Type-safe server mutations
- **Server Components (RSC)** - Default rendering strategy
- **Middleware** - Request processing and security
- **API Versioning** - v1/v2 endpoints with deprecation support
- **Multi-tenant Data Isolation** - Repository guard patterns

### Caching & Performance
- **Redis 5.8.2** - Caching and rate limiting backend
- **In-memory Fallback** - For development environments
- **Query Optimization** - N+1 prevention, selective field fetching
- **Background Jobs** - Bull 4.16.5 for async processing

---

## Authentication & Security

### Authentication System
- **NextAuth.js 5.0.0-beta.25** - Authentication framework
- **JWT Strategy** - Stateless session management
- **Credentials Provider** - Email/password authentication
- **bcryptjs 3.0.2** - Password hashing

### Security Features
- **Role-Based Access Control (RBAC)**
  - Hierarchy: SUPER_ADMIN > PASTOR > ADMIN > VIP > LEADER > MEMBER
- **Multi-tenant Isolation** - Tenant-scoped data access
- **Rate Limiting** - IP and email-based protection
- **Input Validation** - Zod schemas for all user inputs
- **Security Headers** - Comprehensive CSP, XSS protection

### Security Configuration
```typescript
// Content Security Policy (CSP)
- default-src 'self'
- script-src with Vercel Analytics support
- style-src 'self' 'unsafe-inline' (for dynamic styles)
- No 'unsafe-eval' in production
- Frame ancestors denied
- HSTS with 1-year max-age
```

---

## Testing Infrastructure

### Unit Testing
- **Vitest 2.1.9** - Fast unit test runner
- **jsdom** - DOM simulation
- **@testing-library/react 16.1.0** - React component testing
- **@testing-library/jest-dom 6.8.0** - Custom Jest matchers
- **Coverage**: 80%+ thresholds, 90%+ for critical modules

### End-to-End Testing
- **Playwright 1.55.0** - Browser automation
- **@axe-core/playwright 4.10.2** - Accessibility testing
- **Multi-browser Support** - Chromium primary target
- **Auth Fixtures** - Role-based test authentication
- **Visual Testing** - Screenshot comparisons

### Load Testing
- **Artillery 2.0.24** - Performance and load testing
- **Custom Scripts** - Production environment validation

### Test Configuration
```typescript
// Coverage thresholds
- General: 80% statements/branches/functions/lines
- Critical modules (RBAC, Tenancy): 90%
- Business actions: 85%
```

---

## Development Tools & DevOps

### Build Tools
- **Next.js Build System** - Optimized production builds
- **Bundle Analyzer** - `@next/bundle-analyzer 15.5.2`
- **TypeScript Compiler** - Strict type checking
- **ESLint Config** - Next.js and accessibility rules

### Development Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "test:unit": "vitest run",
  "test:e2e": "playwright test",
  "seed": "prisma db push --force-reset && tsx prisma/seed.ts",
  "analyze": "ANALYZE=true next build"
}
```

### CI/CD Pipeline (8-Stage Enterprise)
1. **Security Audit** - Dependency vulnerability scanning
2. **Code Quality** - ESLint, TypeScript, Prettier validation
3. **Unit Tests** - Vitest with coverage reporting
4. **Build Analysis** - Bundle size validation (200KB threshold)
5. **E2E Tests** - Playwright browser automation
6. **Performance Tests** - Lighthouse audits
7. **Staging Deployment** - Automated on develop branch
8. **Production Deployment** - Automated on main branch

### Database Management
- **Prisma Migrations** - Schema version control
- **Seeding System** - Deterministic test data
- **Backup Strategy** - Automated with 30-day retention
- **Health Monitoring** - Database connection tracking

---

## Performance & Monitoring

### Monitoring & Analytics
- **Vercel Analytics 1.5.0** - User behavior tracking
- **Vercel Speed Insights 1.2.0** - Core Web Vitals monitoring
- **Custom Error Tracking** - Business context logging
- **Health Checks** - System status monitoring

### Performance Features
- **Image Optimization** - Next.js `<Image />` components
- **Bundle Optimization** - 193kB max route size
- **Server Components** - Reduced client-side JavaScript
- **Query Optimization** - 60% performance improvement from N+1 prevention
- **Edge Caching** - Vercel CDN integration

### Metrics Tracked
- **Core Web Vitals**: LCP, FID, CLS, TTFB, INP, FCP
- **Business Metrics**: User engagement, conversion funnels
- **System Health**: Database performance, error rates, uptime

---

## Deployment & Infrastructure

### Hosting & Deployment
- **Vercel** - Primary hosting platform
- **GitHub Integration** - Automated deployments
- **Singapore Region (sin1)** - Optimized for Asian markets
- **Zero-downtime Deployments** - With health checks

### Environment Management
- **Environment Variables** - Secure configuration management
- **Multi-environment Support** - Development, staging, production
- **Secret Management** - Encrypted sensitive data
- **Rate Limiting Configuration** - Environment-specific policies

### Infrastructure Components
```yaml
# Vercel Configuration
regions: ["sin1"]
framework: "nextjs"
buildCommand: "npm run build"
installCommand: "npm ci"
```

### Database Infrastructure
- **Neon Postgres** - Serverless PostgreSQL
- **Connection Pooling** - pgbouncer integration
- **Backup Strategy** - Automated daily backups
- **Migration System** - Prisma-based schema management

---

## Progressive Web App (PWA)

### PWA Features
- **Web App Manifest** - Native app-like installation
- **Service Workers** - Offline functionality and caching
- **Push Notifications** - `web-push 3.6.7`
- **Install Prompts** - Custom installation flows
- **Offline Support** - Critical functionality available offline

### Push Notification System
- **Subscription Management** - User device registration
- **Multi-device Support** - Cross-platform notifications
- **Event Reminders** - Automated notification triggers
- **Admin Notifications** - System alerts and updates

---

## Key Configuration Files

### Next.js Configuration (`next.config.ts`)
```typescript
// Key features enabled
- Bundle analyzer integration
- Security headers (CSP, HSTS)
- Image optimization settings
- Server actions body size limit (2mb)
- OpenTelemetry warning suppression
```

### Tailwind Configuration (`tailwind.config.ts`)
```typescript
// Design system integration
- Custom color palette (Sacred Blue + Soft Gold)
- Design tokens via CSS custom properties
- Dark mode support
- Responsive breakpoints
- Animation configurations
```

### TypeScript Configuration (`tsconfig.json`)
```typescript
// Strict type checking enabled
- Path aliases (@/ for root)
- Next.js App Router support
- Strict null checks and type validation
```

---

## Environment & Dependencies

### Core Dependencies (Production)
```json
{
  "next": "15.1.3",
  "react": "^19.0.0",
  "typescript": "^5.7.2",
  "@prisma/client": "^6.1.0",
  "next-auth": "5.0.0-beta.25",
  "zod": "^3.25.76",
  "tailwindcss": "^3.4.17"
}
```

### Development Dependencies
```json
{
  "vitest": "^2.1.9",
  "@playwright/test": "^1.49.1",
  "eslint": "^9.34.0",
  "prettier": "^3.6.2",
  "@next/bundle-analyzer": "^15.5.2",
  "artillery": "^2.0.24"
}
```

### Environment Variables Required
```bash
# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Authentication
AUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# External Services
RESEND_API_KEY=your-resend-key
REDIS_URL=redis://...

# Monitoring
VERCEL_ANALYTICS_ID=your-analytics-id
```

---

## Architecture Highlights

### Multi-tenant Architecture
- **Tenant Isolation**: All data scoped by `tenantId`
- **RBAC Integration**: Role-based access with tenant boundaries
- **Repository Guards**: `getAccessibleChurchIds()` and `createTenantWhereClause()`
- **Audit Logging**: Comprehensive activity tracking per tenant

### Security-First Design
- **Input Validation**: Zod schemas for all user inputs
- **Rate Limiting**: Redis-backed with IP and email tracking
- **Error Handling**: Graceful degradation with detailed logging
- **Session Management**: JWT with secure cookie handling

### Performance Optimization
- **Query Optimization**: Composite indexes and N+1 prevention
- **Bundle Analysis**: Continuous monitoring with size limits
- **Image Optimization**: Automatic format conversion and sizing
- **Caching Strategy**: Multi-layer caching with Redis backend

### Quality Assurance
- **Test Coverage**: 80%+ with critical modules at 90%+
- **E2E Testing**: Comprehensive user flow validation
- **Accessibility**: WCAG AA compliance with axe-core integration
- **Performance Testing**: Lighthouse audits and load testing

---

## Conclusion

Drouple represents a modern, production-ready church management system built with enterprise-grade technologies and practices. The technical stack emphasizes security, performance, maintainability, and user experience while providing comprehensive functionality for multi-church organizations.

**Key Strengths:**
- Type-safe development with TypeScript and Zod
- Comprehensive testing strategy (unit, E2E, performance)
- Security-first architecture with RBAC and tenant isolation
- Performance-optimized with monitoring and alerting
- Modern UI/UX with accessibility compliance
- Production-ready DevOps pipeline with automated deployments

**Production Readiness Status:** ✅ **PRODUCTION-READY**
- 662 unit tests passing
- Comprehensive E2E coverage
- Zero TypeScript/lint errors
- Enterprise-grade CI/CD pipeline
- Comprehensive monitoring and alerting
- Multi-tenant security validation