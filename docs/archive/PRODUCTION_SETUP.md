# Production Environment Setup Checklist

## ✅ Database Setup
- [x] Neon PostgreSQL database created and accessible
- [x] Connection string: `postgresql://neondb_owner:***@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb`
- [x] Database schema matches Prisma schema
- [x] All 8 migrations applied successfully
- [x] Pooled connections enabled (`pgbouncer=true`)

## ⚠️ Environment Variables Needed

### Required for Production
```bash
# Database
DATABASE_URL="postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

# NextAuth (MUST CHANGE)
NEXTAUTH_URL="https://drouple.app"
NEXTAUTH_SECRET="[generate-with: openssl rand -base64 32]"  # ❌ GENERATE NEW

# Email Service (MUST CONFIGURE)
RESEND_API_KEY="re_xxxxx"  # ❌ ADD YOUR RESEND API KEY
RESEND_FROM_EMAIL="hello@drouple.app"

# Optional but Recommended
NODE_ENV="production"
APP_ENV="production"
```

## 🔴 Critical Issues to Fix

1. **NextAuth Secret**: 
   - Currently using development secret
   - Generate production secret: `openssl rand -base64 32`

2. **NextAuth URL**: 
   - Must match your production domain
   - Example: `https://hpci-chms.vercel.app`

3. **Email Configuration**:
   - No valid Resend API key configured
   - Get API key from: https://resend.com/api-keys
   - Update sender email to verified domain

## 📋 Deployment Steps

### 1. Set Environment Variables in Vercel
```bash
vercel env add DATABASE_URL production
vercel env add DATABASE_URL_UNPOOLED production  
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add RESEND_API_KEY production
vercel env add RESEND_FROM_EMAIL production
```

### 2. Deploy to Production
```bash
# Build and test locally first
npm run build
npm run typecheck
npm run lint

# Deploy to Vercel
vercel --prod
```

### 3. Post-Deployment Verification
- [ ] Check application loads: https://your-domain.com
- [ ] Test authentication flow
- [ ] Verify email sending
- [ ] Check database connectivity
- [ ] Monitor error logs

## 🔒 Security Checklist

- [ ] Generate unique NEXTAUTH_SECRET (32+ characters)
- [ ] Enable HTTPS only (handled by Vercel)
- [ ] Set secure cookie settings
- [ ] Configure CORS if needed
- [ ] Enable rate limiting
- [ ] Set up error monitoring (Sentry)

## 📊 Current Status Summary

### ✅ Working
- Database connection to Neon
- Prisma schema synchronized
- All migrations applied

### ❌ Needs Configuration
- NextAuth production secret
- Production domain URL
- Email service (Resend API key)
- Environment variables in Vercel

### 🚀 Ready for Deployment After
1. Setting proper environment variables in Vercel
2. Configuring Resend email service
3. Generating secure NextAuth secret

## Commands Reference

```bash
# Check database status
DATABASE_URL="your-prod-url" npx prisma migrate status

# Deploy future migrations
DATABASE_URL="your-prod-url" npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Seed production data (if needed)
DATABASE_URL="your-prod-url" npm run seed
```

## Support Contacts
- DevOps Team: devops@hpci.org
- Database Admin: dba@hpci.org
- On-Call Engineer: +1-555-0123