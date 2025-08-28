#!/bin/bash

# Production Environment Variables Deployment Script
# Automatically sets all required environment variables for drouple.app

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Setting up production environment variables for drouple.app${NC}"
echo -e "${BLUE}===========================================================${NC}"

# Check for required files
if [ ! -f .env.production.example ]; then
    echo -e "${RED}❌ .env.production.example not found${NC}"
    exit 1
fi

# Check if user has a .env.production file
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}📝 Creating .env.production from example...${NC}"
    cp .env.production.example .env.production
    echo -e "${YELLOW}⚠️  Please edit .env.production with your actual values before continuing${NC}"
    echo -e "${YELLOW}   Required: DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, SENTRY_DSN${NC}"
    read -p "Press Enter when you've updated .env.production with your values..."
fi

# Source the production environment file
source .env.production

# Required variables check
required_vars=(
    "DATABASE_URL"
    "NEXTAUTH_SECRET" 
    "RESEND_API_KEY"
    "SENTRY_DSN"
    "NEXT_PUBLIC_SENTRY_DSN"
    "SENTRY_ORG"
    "SENTRY_PROJECT"
    "SENTRY_AUTH_TOKEN"
)

echo -e "\n${YELLOW}🔍 Checking required environment variables...${NC}"
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
        echo -e "${RED}❌ Missing: $var${NC}"
    else
        echo -e "${GREEN}✅ Found: $var${NC}"
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "\n${RED}❌ Missing required variables. Please update .env.production${NC}"
    exit 1
fi

# Set environment variables in Vercel
echo -e "\n${YELLOW}⚙️ Setting production environment variables in Vercel...${NC}"

# Core application variables
echo -e "${BLUE}Setting core application variables...${NC}"
echo "$NEXTAUTH_URL" | vercel env add NEXTAUTH_URL production
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET production

# Database variables
echo -e "${BLUE}Setting database variables...${NC}"
echo "$DATABASE_URL" | vercel env add DATABASE_URL production
echo "$DATABASE_URL_UNPOOLED" | vercel env add DATABASE_URL_UNPOOLED production

# Email variables
echo -e "${BLUE}Setting email variables...${NC}"
echo "$RESEND_API_KEY" | vercel env add RESEND_API_KEY production
echo "$RESEND_FROM_EMAIL" | vercel env add RESEND_FROM_EMAIL production

# Monitoring variables
echo -e "${BLUE}Setting monitoring variables...${NC}"
echo "$SENTRY_DSN" | vercel env add SENTRY_DSN production
echo "$NEXT_PUBLIC_SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN production
echo "$SENTRY_ORG" | vercel env add SENTRY_ORG production
echo "$SENTRY_PROJECT" | vercel env add SENTRY_PROJECT production
echo "$SENTRY_AUTH_TOKEN" | vercel env add SENTRY_AUTH_TOKEN production

# Performance and security variables
echo -e "${BLUE}Setting performance and security variables...${NC}"
echo "$RATE_LIMIT_ENABLED" | vercel env add RATE_LIMIT_ENABLED production
echo "$RATE_LIMIT_MAX_REQUESTS" | vercel env add RATE_LIMIT_MAX_REQUESTS production
echo "$RATE_LIMIT_WINDOW_MS" | vercel env add RATE_LIMIT_WINDOW_MS production

# Application environment
echo -e "${BLUE}Setting application environment variables...${NC}"
echo "$APP_ENV" | vercel env add APP_ENV production
echo "$NODE_ENV" | vercel env add NODE_ENV production

# Set staging/preview environment variables
echo -e "\n${YELLOW}⚙️ Setting staging environment variables...${NC}"

# Create staging variants
STAGING_NEXTAUTH_URL="https://staging.drouple.app"
STAGING_RESEND_FROM_EMAIL="staging@drouple.app"
STAGING_APP_ENV="staging"

echo "$STAGING_NEXTAUTH_URL" | vercel env add NEXTAUTH_URL preview
echo "$NEXTAUTH_SECRET" | vercel env add NEXTAUTH_SECRET preview
echo "$DATABASE_URL" | vercel env add DATABASE_URL preview  # You might want a separate staging DB
echo "$DATABASE_URL_UNPOOLED" | vercel env add DATABASE_URL_UNPOOLED preview
echo "$RESEND_API_KEY" | vercel env add RESEND_API_KEY preview
echo "$STAGING_RESEND_FROM_EMAIL" | vercel env add RESEND_FROM_EMAIL preview
echo "$SENTRY_DSN" | vercel env add SENTRY_DSN preview
echo "$NEXT_PUBLIC_SENTRY_DSN" | vercel env add NEXT_PUBLIC_SENTRY_DSN preview
echo "$SENTRY_ORG" | vercel env add SENTRY_ORG preview
echo "$SENTRY_PROJECT" | vercel env add SENTRY_PROJECT preview
echo "$SENTRY_AUTH_TOKEN" | vercel env add SENTRY_AUTH_TOKEN preview
echo "true" | vercel env add RATE_LIMIT_ENABLED preview
echo "200" | vercel env add RATE_LIMIT_MAX_REQUESTS preview  # More relaxed for staging
echo "60000" | vercel env add RATE_LIMIT_WINDOW_MS preview
echo "$STAGING_APP_ENV" | vercel env add APP_ENV preview
echo "production" | vercel env add NODE_ENV preview

echo -e "\n${GREEN}✅ All environment variables set successfully!${NC}"

# Verify environment variables
echo -e "\n${YELLOW}🔍 Verifying environment variables...${NC}"
echo -e "${BLUE}Production environment variables:${NC}"
vercel env ls production

echo -e "\n${BLUE}Preview/Staging environment variables:${NC}"
vercel env ls preview

echo -e "\n${GREEN}🎉 Environment setup completed!${NC}"
echo -e "${YELLOW}💡 Next steps:${NC}"
echo -e "  1. Verify DNS configuration"
echo -e "  2. Deploy to production: ${BLUE}vercel --prod${NC}"
echo -e "  3. Test the deployment: ${BLUE}./scripts/test-production-deployment.sh${NC}"