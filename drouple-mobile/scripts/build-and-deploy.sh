#!/bin/bash

# Drouple Mobile Build and Deploy Script
# Usage: ./scripts/build-and-deploy.sh [profile] [platform]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROFILE="internal"
PLATFORM="all"

# Parse arguments
if [ "$1" ]; then
    PROFILE="$1"
fi

if [ "$2" ]; then
    PLATFORM="$2"
fi

echo -e "${BLUE}🚀 Drouple Mobile Build & Deploy${NC}"
echo -e "${BLUE}Profile: ${YELLOW}$PROFILE${NC}"
echo -e "${BLUE}Platform: ${YELLOW}$PLATFORM${NC}"
echo ""

# Validate profile
case $PROFILE in
    "development"|"internal"|"preview"|"staging"|"production")
        ;;
    *)
        echo -e "${RED}❌ Invalid profile: $PROFILE${NC}"
        echo -e "${YELLOW}Valid profiles: development, internal, preview, staging, production${NC}"
        exit 1
        ;;
esac

# Validate platform
case $PLATFORM in
    "ios"|"android"|"all")
        ;;
    *)
        echo -e "${RED}❌ Invalid platform: $PLATFORM${NC}"
        echo -e "${YELLOW}Valid platforms: ios, android, all${NC}"
        exit 1
        ;;
esac

# Pre-build checks
echo -e "${BLUE}🔍 Pre-build checks...${NC}"

# Check if we're in the right directory
if [ ! -f "app.json" ] && [ ! -f "app.config.ts" ]; then
    echo -e "${RED}❌ Not in Expo project root${NC}"
    exit 1
fi

# Check EAS CLI
if ! command -v eas &> /dev/null; then
    echo -e "${RED}❌ EAS CLI not installed${NC}"
    echo -e "${YELLOW}Run: npm install -g @expo/eas-cli${NC}"
    exit 1
fi

# Check login status
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️ Not logged in to EAS${NC}"
    echo -e "${BLUE}Please login first...${NC}"
    eas login
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm ci

# Run tests for production builds
if [ "$PROFILE" = "production" ]; then
    echo -e "${BLUE}🧪 Running tests for production build...${NC}"
    npm run test 2>/dev/null || {
        echo -e "${RED}❌ Tests failed - aborting production build${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ All tests passed${NC}"
fi

# Type checking
echo -e "${BLUE}📝 Type checking...${NC}"
npx tsc --noEmit || {
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Type checking passed${NC}"

# Linting
echo -e "${BLUE}🔍 Linting...${NC}"
npm run lint || {
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
}
echo -e "${GREEN}✅ Linting passed${NC}"

# Build function
build_platform() {
    local platform=$1
    echo -e "${BLUE}🏗️ Building for ${platform}...${NC}"
    
    if [ "$PROFILE" = "development" ]; then
        eas build -p $platform --profile $PROFILE --local
    else
        eas build -p $platform --profile $PROFILE
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${platform} build completed successfully${NC}"
    else
        echo -e "${RED}❌ ${platform} build failed${NC}"
        exit 1
    fi
}

# Execute builds
case $PLATFORM in
    "ios")
        build_platform ios
        ;;
    "android") 
        build_platform android
        ;;
    "all")
        build_platform ios
        build_platform android
        ;;
esac

# Submit to stores for production builds
if [ "$PROFILE" = "production" ]; then
    echo -e "${BLUE}📱 Submitting to app stores...${NC}"
    
    read -p "Submit to App Store Connect? (y/N): " submit_ios
    if [[ $submit_ios =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📤 Submitting to App Store Connect...${NC}"
        eas submit -p ios --profile production
    fi
    
    read -p "Submit to Google Play Console? (y/N): " submit_android  
    if [[ $submit_android =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}📤 Submitting to Google Play Console...${NC}"
        eas submit -p android --profile production
    fi
fi

# Build summary
echo ""
echo -e "${GREEN}🎉 Build process completed!${NC}"
echo -e "${BLUE}Profile: ${YELLOW}$PROFILE${NC}"
echo -e "${BLUE}Platform: ${YELLOW}$PLATFORM${NC}"
echo ""

# Show next steps based on profile
case $PROFILE in
    "development")
        echo -e "${YELLOW}📲 Next steps:${NC}"
        echo -e "   • Install on simulator/device for testing"
        ;;
    "internal"|"preview")
        echo -e "${YELLOW}📲 Next steps:${NC}"
        echo -e "   • Share build with internal testers"
        echo -e "   • Test on physical devices"
        ;;
    "staging")
        echo -e "${YELLOW}📲 Next steps:${NC}"
        echo -e "   • Deploy to staging environment"
        echo -e "   • Conduct UAT testing"
        ;;
    "production")
        echo -e "${YELLOW}📱 Next steps:${NC}"
        echo -e "   • Monitor App Store Connect/Play Console for review status"
        echo -e "   • Prepare release notes"
        echo -e "   • Schedule release rollout"
        ;;
esac