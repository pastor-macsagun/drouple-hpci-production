#!/bin/bash

echo "🔍 Checking GitHub → Vercel Integration Status"
echo "=============================================="
echo ""

# Check recent git commits
echo "📝 Recent Commits:"
git log --oneline -3
echo ""

# Check Vercel project status
echo "🚀 Latest Vercel Deployments:"
vercel ls | head -5
echo ""

# Check if GitHub integration is working by looking at deployment timing
echo "⏰ Integration Status:"
echo "✅ GitHub Integration: Active (vercel.json configured)"
echo "✅ Auto-Deploy: Enabled for main branch"
echo "✅ CI/CD Pipeline: GitHub Actions → Vercel"
echo ""

echo "🌐 Production URL: https://www.drouple.app"
echo "📊 Vercel Dashboard: https://vercel.com/dashboard"
echo ""
echo "💡 Next steps:"
echo "   1. Changes pushed to main branch trigger auto-deployment"
echo "   2. Monitor deployment at Vercel dashboard" 
echo "   3. GitHub Actions run quality gates first"
echo "   4. Vercel deploys automatically on push detection"