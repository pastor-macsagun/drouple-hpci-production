# 🚀 Complete drouple.app Setup Guide

This guide walks you through setting up your HPCI-ChMS application on your new domain `drouple.app`. Everything is automated with the scripts provided.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Domain registered**: drouple.app
- ✅ **Vercel CLI installed**: `npm i -g vercel`
- ✅ **Required credentials**:
  - Neon PostgreSQL database URLs
  - NextAuth secret key
  - Resend API key
  - Sentry DSN and tokens

## 🎯 Quick Start (5 Minutes)

```bash
# 1. Run the automated domain setup
chmod +x scripts/setup-drouple-domain.sh
./scripts/setup-drouple-domain.sh

# 2. Configure your environment variables
cp .env.production.example .env.production
# Edit .env.production with your actual values

# 3. Deploy environment variables to Vercel
chmod +x scripts/deploy-production-env.sh  
./scripts/deploy-production-env.sh

# 4. Configure DNS records (see DNS_CONFIGURATION.md)
# ... add DNS records to your domain registrar ...

# 5. Verify setup
chmod +x scripts/verify-domain-setup.sh
./scripts/verify-domain-setup.sh

# 6. Deploy to production
vercel --prod

# 7. Test deployment
chmod +x scripts/test-production-deployment.sh
./scripts/test-production-deployment.sh
```

## 📝 Step-by-Step Instructions

### Step 1: Domain & Vercel Setup

Run the automated Vercel configuration:

```bash
chmod +x scripts/setup-drouple-domain.sh
./scripts/setup-drouple-domain.sh
```

This script will:
- ✅ Add drouple.app and staging.drouple.app domains to Vercel
- ✅ Configure basic environment variables
- ✅ Generate DNS configuration guide

### Step 2: Environment Variables

1. **Create production environment file:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Edit `.env.production` with your values:**
   ```bash
   # Required - Get from Neon
   DATABASE_URL="postgresql://..."
   DATABASE_URL_UNPOOLED="postgresql://..."
   
   # Required - Generate with: openssl rand -base64 32  
   NEXTAUTH_SECRET="your-secret-here"
   
   # Required - Get from Resend
   RESEND_API_KEY="re_..."
   
   # Required - Get from Sentry
   SENTRY_DSN="https://..."
   NEXT_PUBLIC_SENTRY_DSN="https://..."
   SENTRY_ORG="your-org"
   SENTRY_PROJECT="drouple-hpci"
   SENTRY_AUTH_TOKEN="..."
   ```

3. **Deploy environment variables:**
   ```bash
   chmod +x scripts/deploy-production-env.sh
   ./scripts/deploy-production-env.sh
   ```

### Step 3: DNS Configuration

Configure DNS records with your domain registrar:

**For drouple.app:**
```
Type: A
Name: @
Value: 76.76.19.19
TTL: 300

Type: A
Name: www
Value: 76.76.19.19  
TTL: 300
```

**For staging.drouple.app:**
```
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: 300
```

### Step 4: Verify Setup

Wait 5-10 minutes for DNS propagation, then verify:

```bash
chmod +x scripts/verify-domain-setup.sh
./scripts/verify-domain-setup.sh
```

This checks:
- ✅ DNS resolution
- ✅ SSL certificates
- ✅ HTTP responses
- ✅ Security headers

### Step 5: Deploy to Production

```bash
vercel --prod
```

### Step 6: Test Deployment

```bash
chmod +x scripts/test-production-deployment.sh
./scripts/test-production-deployment.sh
```

This comprehensive test checks:
- ✅ Application health
- ✅ Authentication pages
- ✅ Security headers
- ✅ Rate limiting
- ✅ Database connectivity
- ✅ Performance

## 🛠️ Manual Steps in Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings > Domains**
4. Add custom domains:
   - `drouple.app` (set as primary)
   - `www.drouple.app` (redirect to drouple.app)
   - `staging.drouple.app`
5. Wait for SSL certificates to provision

## 🔍 Verification Checklist

- [ ] DNS records configured at domain registrar
- [ ] Vercel domains added and verified
- [ ] SSL certificates provisioned (green checkmarks in Vercel)
- [ ] Environment variables deployed
- [ ] Production deployment successful
- [ ] All tests passing
- [ ] https://drouple.app loads correctly
- [ ] Authentication flow works

## 🚨 Troubleshooting

### DNS Issues
```bash
# Check DNS propagation
dig drouple.app A
dig www.drouple.app A
dig staging.drouple.app CNAME

# Wait longer for DNS propagation (up to 48 hours)
```

### SSL Certificate Issues
- Wait 10-15 minutes after DNS propagation
- Check Vercel domain settings for errors
- Try removing and re-adding the domain

### Environment Variable Issues  
```bash
# Verify environment variables are set
vercel env ls production
vercel env ls preview

# Re-run environment deployment if needed
./scripts/deploy-production-env.sh
```

### Application Issues
```bash
# Check deployment logs
vercel logs --follow

# Re-run tests
./scripts/test-production-deployment.sh
```

## 📊 Monitoring & Maintenance

After successful deployment:

1. **Set up monitoring alerts** in Sentry
2. **Monitor logs**: `vercel logs --follow`
3. **Regular health checks**: Run verification script weekly
4. **Database backups**: Ensure Neon backups are configured
5. **SSL certificate renewal**: Automatic with Vercel

## 🎉 Success!

Once all steps complete successfully, your HPCI-ChMS will be live at:

- **Production**: https://drouple.app
- **Staging**: https://staging.drouple.app  
- **Health Check**: https://drouple.app/api/health

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review generated reports in `production-test-report-*.md`
3. Check Vercel deployment logs
4. Verify all environment variables are set correctly

## 🔧 Advanced Configuration

### Custom Email Templates
Update email templates to reference `drouple.app` in:
- Welcome emails
- Password reset emails
- Notification emails

### Performance Optimization
Consider:
- CDN configuration
- Image optimization
- Database connection pooling
- Caching strategies

### Security Enhancements
- Set up additional security monitoring
- Configure rate limiting policies
- Review and update CSP policies
- Enable additional security headers

---

**Generated on**: $(date)  
**Version**: drouple.app v1.0  
**Status**: Production Ready ✅