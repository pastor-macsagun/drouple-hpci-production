#!/bin/bash

# Drouple.app Domain Setup Script
# This script automates the complete setup of drouple.app domain for Drouple - Church Management System

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="drouple.app"
STAGING_DOMAIN="staging.drouple.app"
PROJECT_NAME="drouple-hpci"

echo -e "${BLUE}🚀 Setting up drouple.app domain for Drouple - Church Management System${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

# Login to Vercel (if not already logged in)
echo -e "\n${YELLOW}📝 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}Please login to Vercel:${NC}"
    vercel login
fi

# Link project (if not already linked)
echo -e "\n${YELLOW}🔗 Linking Vercel project...${NC}"
if [ ! -f .vercel/project.json ]; then
    vercel link --yes
fi

# Add production domain
echo -e "\n${YELLOW}🌐 Adding production domain: ${DOMAIN}${NC}"
vercel domains add ${DOMAIN} --scope=$(vercel whoami) || echo "Domain might already exist"

# Add staging domain
echo -e "\n${YELLOW}🌐 Adding staging domain: ${STAGING_DOMAIN}${NC}"
vercel domains add ${STAGING_DOMAIN} --scope=$(vercel whoami) || echo "Domain might already exist"

# Set environment variables for production
echo -e "\n${YELLOW}⚙️ Setting production environment variables...${NC}"

# Core environment variables
vercel env add NEXTAUTH_URL production <<< "https://${DOMAIN}"
vercel env add RESEND_FROM_EMAIL production <<< "noreply@${DOMAIN}"

# Set staging environment variables
echo -e "\n${YELLOW}⚙️ Setting staging environment variables...${NC}"
vercel env add NEXTAUTH_URL preview <<< "https://${STAGING_DOMAIN}"
vercel env add RESEND_FROM_EMAIL preview <<< "staging@${DOMAIN}"

# Get Vercel project info
VERCEL_PROJECT_ID=$(cat .vercel/project.json | grep -o '"projectId":"[^"]*' | cut -d'"' -f4)
VERCEL_ORG_ID=$(cat .vercel/project.json | grep -o '"orgId":"[^"]*' | cut -d'"' -f4)

echo -e "\n${GREEN}✅ Vercel configuration complete!${NC}"
echo -e "Project ID: ${VERCEL_PROJECT_ID}"
echo -e "Organization ID: ${VERCEL_ORG_ID}"

# Create DNS configuration guide
echo -e "\n${YELLOW}📋 Creating DNS configuration guide...${NC}"

cat > DNS_CONFIGURATION.md << EOF
# DNS Configuration for drouple.app

## Production Domain (drouple.app)

Add these DNS records to your domain registrar:

### Option 1: A Records (Recommended)
\`\`\`
Type: A
Name: @
Value: 76.76.19.19
TTL: 300

Type: A  
Name: www
Value: 76.76.19.19
TTL: 300
\`\`\`

### Option 2: CNAME Records
\`\`\`
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 300

Type: CNAME
Name: www  
Value: cname.vercel-dns.com
TTL: 300
\`\`\`

## Staging Domain (staging.drouple.app)

\`\`\`
Type: CNAME
Name: staging
Value: cname.vercel-dns.com
TTL: 300
\`\`\`

## Verification

After setting up DNS records, run:
\`\`\`bash
./scripts/verify-domain-setup.sh
\`\`\`

## Manual Steps in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project: ${PROJECT_NAME}
3. Go to Settings > Domains
4. Add custom domains:
   - drouple.app (set as primary)
   - www.drouple.app (redirect to drouple.app)
   - staging.drouple.app
5. Wait for SSL certificates to provision (5-10 minutes)

## Environment Variables Set

✅ NEXTAUTH_URL (production): https://drouple.app
✅ NEXTAUTH_URL (preview): https://staging.drouple.app  
✅ RESEND_FROM_EMAIL (production): hello@drouple.app
✅ RESEND_FROM_EMAIL (preview): hello@drouple.app

## Next Steps

1. Configure DNS records above
2. Run verification script: \`./scripts/verify-domain-setup.sh\`
3. Deploy to production: \`vercel --prod\`
4. Test the deployment: \`./scripts/test-production-deployment.sh\`
EOF

echo -e "${GREEN}📋 DNS configuration guide created: DNS_CONFIGURATION.md${NC}"

# Display next steps
echo -e "\n${BLUE}📋 NEXT STEPS${NC}"
echo -e "${BLUE}============${NC}"
echo -e "1. ${YELLOW}Configure DNS records${NC} (see DNS_CONFIGURATION.md)"
echo -e "2. ${YELLOW}Wait 5-10 minutes${NC} for DNS propagation"
echo -e "3. ${YELLOW}Run verification${NC}: ./scripts/verify-domain-setup.sh"
echo -e "4. ${YELLOW}Deploy to production${NC}: vercel --prod"
echo -e "5. ${YELLOW}Test deployment${NC}: ./scripts/test-production-deployment.sh"

echo -e "\n${GREEN}🎉 Domain setup script completed successfully!${NC}"
echo -e "${YELLOW}💡 Don't forget to update your DNS records with your domain registrar${NC}"