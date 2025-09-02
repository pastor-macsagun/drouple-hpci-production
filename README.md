# Drouple

Multi-church management system with Sunday Check-In, LifeGroups, Events, Discipleship Pathway, VIP Team/First Timer Management, and Members management.

## Tech Stack

- **Framework**: Next.js 15 with TypeScript and App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **UI/UX**: Modern design system with dark mode support
- **Database**: Neon Postgres (pooled) with Prisma ORM
- **Authentication**: NextAuth with Credentials Provider (email + password)
- **Testing**: Vitest (unit/component) + Playwright (e2e)
- **CI/CD**: GitHub Actions + Vercel

## Setup Instructions

For detailed setup instructions, see [docs/dev-setup.md](docs/dev-setup.md).

### Quick Start

1. Clone the repository:
```bash
git clone https://github.com/your-org/drouple.git
cd drouple
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
npx prisma migrate deploy
npm run seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Test Accounts

After running the seed script, the following test accounts are available (password for all: `Hpci!Test2025`):

| Email | Role | Redirects To |
|-------|------|--------------|
| superadmin@test.com | SUPER_ADMIN | /super |
| admin.manila@test.com | ADMIN | /dashboard?lc=local_manila |
| admin.cebu@test.com | ADMIN | /dashboard?lc=local_cebu |
| vip.manila@test.com | VIP | /dashboard?lc=local_manila |
| vip.cebu@test.com | VIP | /dashboard?lc=local_cebu |
| leader.manila@test.com | LEADER | /dashboard?lc=local_manila |
| leader.cebu@test.com | LEADER | /dashboard?lc=local_cebu |
| member1@test.com - member10@test.com | MEMBER | /dashboard |
| firsttimer1@test.com - firsttimer3@test.com | MEMBER (First Timer) | /dashboard |

## Pre-Release Quick Start

Before shipping to production, verify the system is ready:

### 1. Run Shippability Checklist
```bash
# Review the comprehensive checklist
cat docs/shippability-checklist.md

# Run all verification commands
npm run typecheck
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

### 2. Check Test Coverage
```bash
# Generate coverage report
npm run test:unit:coverage

# View coverage summary
npm run coverage:summary
```

### 3. View Test Reports
- **Unit test coverage**: Open `coverage/index.html` in browser
- **E2E test report**: Run `npm run test:e2e -- --reporter=html` then open `playwright-report/index.html`

### 4. Documentation
- **[📚 Complete Documentation Index](docs/README.md)** - Organized navigation to all documentation
- **[🚀 Development Setup](docs/dev-setup.md)** - Complete setup guide for developers
- **[🔧 Deployment Guide](docs/deployment.md)** - Production deployment procedures
- **[📖 API Reference](docs/api.md)** - Server actions, schemas, and authentication
- **[🔐 RBAC Documentation](docs/rbac.md)** - Role permissions and access control
- **[🎨 UI Redesign](docs/ui-redesign.md)** - Modern design system (Aug 2025)
- **[👥 VIP Team Management](docs/vip-team.md)** - First timer tracking system
- **[✅ Shippability Checklist](docs/shippability-checklist.md)** - Pre-release verification

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit/component tests
- `npx playwright test` - Run e2e tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

## Deployment

### Vercel

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

The app will automatically deploy on push to main branch.

### Database Setup (Neon)

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Get both pooled and unpooled connection strings
3. Add to environment variables:
   - `DATABASE_URL` - Pooled connection string
   - `DATABASE_URL_UNPOOLED` - Direct connection string

### Email Setup (Resend)

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Get API key
4. Add SMTP settings to environment variables

## Key Features

### UI/UX Features (New!)
- **Modern Design System** - Sacred blue + soft gold color palette with clean aesthetics
- **Dark Mode** - Full dark theme support with system preference detection
- **Responsive Design** - Mobile-first approach with touch-friendly interfaces
- **Role-Based Dashboards** - Customized experiences for each user role
- **Interactive Components** - Smooth animations, hover effects, and loading states

### Admin Features
- **Service Management** - Create and manage Sunday services, track attendance, export reports
- **LifeGroups Management** - Full CRUD for small groups, member management, attendance tracking
- **Events Management** - Create events with RSVP, waitlist management, payment tracking
- **Pathways Management** - Discipleship pathways with step tracking and progress monitoring

### VIP Team Features
- **First Timer Management** - Log and track first-time visitors with immediate member account creation
- **Follow-up Tracking** - Track gospel sharing and ROOTS pathway completion status
- **Assignment System** - Assign VIP team members for personalized follow-up
- **Auto-enrollment** - Automatic enrollment in ROOTS pathway for new believers

### Member Features  
- **Sunday Check-in** - Self-service check-in for Sunday services
- **LifeGroups** - Join groups, view schedules, track attendance
- **Events** - RSVP for events, join waitlists
- **Pathways** - Enroll in discipleship programs, track progress

## Project Structure

```
├── app/                  # Next.js app router pages
│   ├── api/             # API routes
│   ├── auth/            # Authentication pages
│   ├── admin/           # Admin management pages
│   │   ├── services/    # Service management
│   │   ├── lifegroups/  # LifeGroup management
│   │   ├── events/      # Event management
│   │   └── pathways/    # Pathway management
│   ├── vip/             # VIP Team pages
│   │   └── firsttimers/ # First timer management
│   └── dashboard/       # Protected dashboard
├── components/          # React components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility functions
├── prisma/             # Database schema and migrations
├── emails/             # Email templates
├── e2e/                # Playwright tests
└── test/               # Test setup and utilities
```

## Authentication Flow

1. User enters email and password on sign-in page
2. System validates credentials using bcrypt
3. Session created with JWT strategy
4. User redirected to dashboard based on role
5. Rate limiting prevents brute force attacks

## Testing

Run all tests:
```bash
npm run test           # Unit/component tests
npx playwright test    # E2E tests
```

## License

Private - All rights reserved