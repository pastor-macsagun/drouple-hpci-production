#!/bin/bash

# Production Deployment Script for HPCI-ChMS
# This script sets up environment variables in Vercel and deploys to production

echo "🚀 HPCI-ChMS Production Deployment Script"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

# Load production environment variables
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ .env.production file not found${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment checklist:${NC}"

# Run build checks
echo "1. Running type check..."
if npm run typecheck; then
    echo -e "${GREEN}✅ Type check passed${NC}"
else
    echo -e "${RED}❌ Type check failed${NC}"
    exit 1
fi

echo "2. Running lint..."
if npm run lint; then
    echo -e "${GREEN}✅ Lint check passed${NC}"
else
    echo -e "${RED}❌ Lint check failed${NC}"
    exit 1
fi

echo "3. Building application..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔐 Setting up Vercel environment variables...${NC}"
echo "This will configure your production environment in Vercel."
echo ""

# Function to add environment variable to Vercel
add_env_var() {
    local key=$1
    local value=$2
    echo "Setting $key..."
    echo "$value" | vercel env add "$key" production --force 2>/dev/null || echo "  (already exists or updated)"
}

# Read .env.production and set variables
export $(grep -v '^#' .env.production | xargs)

# Set all required environment variables
add_env_var "DATABASE_URL" "$DATABASE_URL"
add_env_var "DATABASE_URL_UNPOOLED" "$DATABASE_URL_UNPOOLED"
add_env_var "NEXTAUTH_URL" "$NEXTAUTH_URL"
add_env_var "NEXTAUTH_SECRET" "$NEXTAUTH_SECRET"
add_env_var "RESEND_API_KEY" "$RESEND_API_KEY"
add_env_var "RESEND_FROM_EMAIL" "$RESEND_FROM_EMAIL"
add_env_var "EMAIL_FROM" "$EMAIL_FROM"
add_env_var "NODE_ENV" "production"
add_env_var "APP_ENV" "production"
add_env_var "RATE_LIMIT_ENABLED" "true"

echo ""
echo -e "${GREEN}✅ Environment variables configured${NC}"
echo ""

# Deploy to production
echo -e "${YELLOW}🚀 Deploying to production...${NC}"
echo "This will deploy your application to Vercel production environment."
echo ""

read -p "Do you want to proceed with deployment? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo ""
    echo "📌 Post-deployment steps:"
    echo "1. Visit your production URL: https://drouple-hpci-prod.vercel.app"
    echo "2. Test authentication flow"
    echo "3. Verify email sending works"
    echo "4. Check database connectivity"
    echo ""
    echo "📊 Monitor deployment at: https://vercel.com/dashboard"
else
    echo -e "${YELLOW}Deployment cancelled${NC}"
fi