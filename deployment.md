# Deployment Guide

## Prerequisites
- Node.js 20+
- PostgreSQL (local or cloud)
- Vercel account (for hosting)

## Environment Variables
Copy `.env.example` to `.env.production` and set:
- `DATABASE_URL`: Neon Postgres connection string (pooled)
- `DATABASE_URL_UNPOOLED`: Neon Postgres direct connection
- `NEXTAUTH_URL`: Your production URL
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

## Local PostgreSQL Setup

Choose one of the following options:

### Option 1: Create Local User and Database
```bash
# Using psql (adjust path if needed)
psql -U postgres -c "CREATE USER test WITH PASSWORD 'test123';"
psql -U postgres -c "CREATE DATABASE hpci_chms OWNER test;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hpci_chms TO test;"
```

### Option 2: Use Docker PostgreSQL
```bash
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_USER=test \
  -e POSTGRES_PASSWORD=test123 \
  -e POSTGRES_DB=hpci_chms \
  --name hpci-postgres \
  postgres:15
```

### Option 3: Use Neon Cloud Database
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the pooled connection string
3. Update `.env` with:
```
DATABASE_URL=postgresql://<user>:<pass>@<host>/<dbname>?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://<user>:<pass>@<host>/<dbname>?sslmode=require
```

## Deployment Steps

### 1. Database Setup
```bash
# For fresh setup (resets database)
npx prisma db push --accept-data-loss

# Or for migrations
npx prisma migrate deploy

# Seed initial data
npm run seed
npm run seed:verify
```

### 2. Vercel Deployment
```bash
vercel --prod
```

### 3. Verify Deployment
```bash
npm run ship:verify
```

## Post-Deployment
1. Test authentication flow with email + password
2. Verify role-based redirects work correctly
3. Check rate limiting (5 attempts per 15 minutes)
4. Monitor error logs
5. Change default passwords for production users