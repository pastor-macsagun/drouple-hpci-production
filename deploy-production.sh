#!/bin/bash

# Drouple - Church Management System Production Deployment Script
# Run this after authenticating with Vercel

set -e  # Exit on error

echo "🚀 Drouple - Church Management System Production Deployment"
echo "=================================="
echo ""

# Check if authenticated
if ! vercel whoami > /dev/null 2>&1; then
    echo "❌ Not authenticated with Vercel"
    echo "Please run: vercel login"
    exit 1
fi

echo "✅ Vercel authentication confirmed"
echo ""

# Check if project is linked
if [ ! -d ".vercel" ]; then
    echo "📎 Linking to Vercel project..."
    echo "Please follow the prompts to link to your existing project"
    vercel
    
    if [ ! -d ".vercel" ]; then
        echo "❌ Project linking failed"
        exit 1
    fi
fi

echo "✅ Project linked"
echo ""

# Final confirmation
echo "⚠️  PRODUCTION DEPLOYMENT CONFIRMATION"
echo "======================================"
echo "You are about to deploy to PRODUCTION"
echo ""
read -p "Type 'DEPLOY' to continue: " confirmation

if [ "$confirmation" != "DEPLOY" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🏗️  Building and deploying to production..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 POST-DEPLOYMENT CHECKLIST:"
echo "============================="
echo "1. [ ] Run database migrations on production:"
echo "       DATABASE_URL=<PROD_URL> npx prisma migrate deploy"
echo ""
echo "2. [ ] Verify deployment:"
echo "       - Check https://drouple.app"
echo "       - Test /api/health endpoint"
echo "       - Verify sign in works"
echo ""
echo "3. [ ] Monitor for 24 hours:"
echo "       - Check Vercel dashboard for errors"
echo "       - Monitor Sentry (if configured)"
echo "       - Review Neon database metrics"
echo ""
echo "🎉 Deployment script completed!"