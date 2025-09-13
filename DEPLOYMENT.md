# Production Deployment Guide - Drouple

## Prerequisites
✅ GitHub repository: `https://github.com/pastor-macsagun/drouple-hpci-production.git`
✅ Vercel CLI installed
✅ Production database (Neon)

## Step 1: Login to Vercel

```bash
vercel login
```

Choose your preferred login method:
- GitHub (recommended)
- GitLab
- Bitbucket
- Email

## Step 2: Link Project to Vercel

Run this command in your project directory:

```bash
vercel
```

Answer the prompts:
1. Set up and deploy? **Y**
2. Which scope? **Select your account**
3. Link to existing project? **N** (first time) or **Y** (if exists)
4. Project name? **drouple-hpci-production**
5. Directory? **./** (current directory)
6. Override settings? **N**

## Step 3: Configure Environment Variables

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these production variables:

```env
# Database (PRODUCTION - use your production Neon database)
DATABASE_URL="postgresql://..."
DATABASE_URL_UNPOOLED="postgresql://..."

# Authentication
NEXTAUTH_SECRET="[generate with: openssl rand -base64 32]"
NEXTAUTH_URL="https://your-domain.vercel.app"

# Environment
NODE_ENV="production"

# Optional Features (if needed)
RESEND_API_KEY="re_your_api_key"
REDIS_URL="redis://..."
ENABLE_2FA="true"

# Monitoring (optional)
ALERT_EMAIL_TO="admin@yourdomain.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
```

### Option B: Via CLI

```bash
# Add each variable
vercel env add DATABASE_URL production
vercel env add DATABASE_URL_UNPOOLED production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
```

## Step 4: Deploy to Production

### Initial Deployment
```bash
vercel --prod
```

### Automatic Deployments (GitHub Integration)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Git
4. Connect to GitHub repository
5. Configure:
   - Production Branch: `main`
   - Preview Branches: All branches
   - Auto-deploy: Enabled

Now every push to `main` will auto-deploy to production!

## Step 5: Set Custom Domain (Optional)

1. Go to project Settings → Domains
2. Add your domain: `yourdomain.com`
3. Follow DNS configuration instructions

## Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Check database connectivity
- [ ] Verify all routes are working
- [ ] Test mobile responsiveness
- [ ] Check PWA installation
- [ ] Monitor error logs in Vercel dashboard

## Useful Commands

```bash
# View deployment status
vercel ls

# View logs
vercel logs

# Promote preview to production
vercel promote [deployment-url]

# Rollback
vercel rollback

# View environment variables
vercel env ls
```

## GitHub Actions CI/CD (Already Configured)

Your project includes GitHub Actions workflows for:
- Automated testing on PR
- Security scanning
- Performance monitoring
- Auto-deployment to Vercel

See `.github/workflows/` for configuration.

## Monitoring

- **Vercel Analytics**: Automatically enabled
- **Speed Insights**: Performance monitoring
- **Error Tracking**: Check Functions tab in Vercel dashboard

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- GitHub Issues: https://github.com/pastor-macsagun/drouple-hpci-production/issues
