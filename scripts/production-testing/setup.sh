#!/bin/bash
# Production Testing Setup Script

set -e

echo "🚀 Setting up HPCI-ChMS Production Testing Suite"
echo "═════════════════════════════════════════════="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "../../package.json" ]; then
    echo "❌ Please run this script from scripts/production-testing/ directory"
    exit 1
fi

echo "📦 Installing production testing dependencies..."

# Install Playwright and other dependencies
npm install playwright @playwright/test tsx

echo "🎭 Installing Playwright browsers..."
npx playwright install chromium

echo "🔧 Setting up directory structure..."
mkdir -p screenshots videos reports

echo "📋 Verifying test configuration..."

# Check if main project has required dependencies
cd ../../
if ! npm list tsx &> /dev/null; then
    echo "⚠️  Installing tsx in main project..."
    npm install tsx --save-dev
fi

if ! npm list @prisma/client &> /dev/null; then
    echo "⚠️  Prisma client not found in main project"
    echo "   Make sure to run 'npm install' in the main project"
else
    echo "🗄️  Ensuring Prisma client is generated..."
    npm run db:generate
fi

cd scripts/production-testing/

echo ""
echo "✅ Production Testing Suite Setup Complete!"
echo ""
echo "🎯 Quick Start Commands:"
echo ""
echo "  # Run full test suite (interactive mode)"
echo "  npm run test"
echo ""
echo "  # Run in headless mode (faster)"
echo "  npm run test:headless"
echo ""
echo "  # Test only admin accounts"
echo "  npm run test:admins"
echo ""
echo "  # Test authentication flow only"
echo "  npm run test:auth"
echo ""
echo "📚 For more options, see README.md or run:"
echo "  npx tsx run-production-tests.ts --help"
echo ""
echo "🔐 Test Accounts (all use password: Hpci!Test2025):"
echo "  - superadmin@test.com (Super Admin)"
echo "  - admin.manila@test.com (Manila Admin)"  
echo "  - admin.cebu@test.com (Cebu Admin)"
echo "  - leader.manila@test.com (Manila Leader)"
echo "  - leader.cebu@test.com (Cebu Leader)"
echo "  - member1@test.com (Manila Member)"
echo "  - member2@test.com (Cebu Member)"
echo "  - member3@test.com (Manila Member)"
echo ""
echo "⚠️  IMPORTANT: These tests run against PRODUCTION at https://www.drouple.app"
echo "   Test data will be created and cleaned up automatically."
echo ""
echo "🎉 Ready to test! Run 'npm run test' to start."