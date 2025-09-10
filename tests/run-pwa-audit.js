#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_URL = process.env.APP_URL || 'https://app.drouple.app';
const DATE = new Date().toISOString().split('T')[0];
const ARTIFACT_DIR = path.join(__dirname, '..', 'artifacts', `PWA-AUDIT-${DATE}`);

async function runPWAAudit() {
  console.log(`🚀 PWA Native-Like UI Audit Starting...`);
  console.log(`📍 Target URL: ${APP_URL}`);
  console.log(`📁 Artifacts: ${ARTIFACT_DIR}`);
  console.log(`📅 Date: ${DATE}\n`);

  // Ensure artifact directory exists
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const summary = {
    url: APP_URL,
    date: DATE,
    lighthouse: { pwaScore: 0, performanceScore: 0, pwaPass: false, perfPass: false },
    touchTargets: { total: 0, failing: 0 },
    offline: { success: false, swPresent: false },
    artifacts: {
      lighthouse: false,
      pwaSanity: false,
      screenshots: false,
      videos: false,
      touchTargets: false,
      offlineLog: false,
      checklist: false
    }
  };

  try {
    // Step 1: Run Lighthouse
    console.log(`📊 Running Lighthouse audit...`);
    try {
      const lighthouseModule = require('./run-lighthouse.js');
      const lighthouseResults = await lighthouseModule();
      summary.lighthouse = lighthouseResults;
      summary.artifacts.lighthouse = true;
      console.log(`   ✅ Lighthouse completed: PWA ${lighthouseResults.pwaScore}/100, Perf ${lighthouseResults.performanceScore}/100`);
    } catch (error) {
      console.warn(`   ⚠️ Lighthouse failed: ${error.message}`);
    }

    // Step 2: Run PWA Sanity Checks  
    console.log(`\n🔍 Running PWA sanity checks...`);
    try {
      execSync(`npx playwright test tests/pwa-sanity.ts --config tests/playwright.config.ts`, {
        stdio: 'pipe',
        env: { ...process.env, APP_URL }
      });
      summary.artifacts.pwaSanity = fs.existsSync(path.join(ARTIFACT_DIR, 'pwa-sanity.json'));
      console.log(`   ✅ PWA sanity checks completed`);
    } catch (error) {
      console.warn(`   ⚠️ PWA sanity checks had issues: ${error.message}`);
    }

    // Step 3: Run Playwright Visual Tests
    console.log(`\n📱 Running visual tests on iPhone 16 Pro & Pixel 8...`);
    try {
      execSync(`npx playwright test tests/pwa.spec.ts --config tests/playwright.config.ts`, {
        stdio: 'pipe',
        env: { ...process.env, APP_URL }
      });
      
      // Check for artifacts
      const iPhoneScreens = path.join(ARTIFACT_DIR, 'playwright', 'iPhone 16 Pro', 'screens');
      const pixelScreens = path.join(ARTIFACT_DIR, 'playwright', 'Pixel 8', 'screens');
      summary.artifacts.screenshots = fs.existsSync(iPhoneScreens) || fs.existsSync(pixelScreens);
      
      console.log(`   ✅ Visual tests completed`);
    } catch (error) {
      console.warn(`   ⚠️ Visual tests had issues: ${error.message}`);
    }

    // Step 4: Analyze Results
    console.log(`\n📊 Analyzing results...`);
    
    // Touch targets analysis
    const touchTargetsPath = path.join(ARTIFACT_DIR, 'touch-targets.json');
    if (fs.existsSync(touchTargetsPath)) {
      try {
        const touchData = JSON.parse(fs.readFileSync(touchTargetsPath, 'utf8'));
        let totalElements = 0;
        let failingElements = 0;
        
        touchData.forEach(device => {
          device.elements.forEach(el => {
            totalElements++;
            if (!el.meetsMinSize) failingElements++;
          });
        });
        
        summary.touchTargets = { total: totalElements, failing: failingElements };
        summary.artifacts.touchTargets = true;
      } catch (error) {
        console.warn(`   ⚠️ Touch targets analysis failed: ${error}`);
      }
    }

    // Offline test analysis
    const offlineLogPath = path.join(ARTIFACT_DIR, 'offline-sync.log');
    if (fs.existsSync(offlineLogPath)) {
      const offlineLog = fs.readFileSync(offlineLogPath, 'utf8');
      summary.offline.success = offlineLog.includes('✅ Cached');
      summary.offline.swPresent = offlineLog.includes('Service Worker installed: ✅');
      summary.artifacts.offlineLog = true;
    }

    // Step 5: Generate Human Checklist
    console.log(`\n📋 Generating manual checklist...`);
    try {
      const generateChecklist = require('./generate-checklist.js');
      const checklistPath = path.join(ARTIFACT_DIR, 'CHECKLIST.md');
      fs.writeFileSync(checklistPath, generateChecklist());
      summary.artifacts.checklist = true;
      console.log(`   ✅ Manual checklist generated`);
    } catch (error) {
      console.warn(`   ⚠️ Checklist generation failed: ${error}`);
    }

  } catch (error) {
    console.error(`❌ Audit failed: ${error}`);
  }

  // Final Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🏁 PWA NATIVE-LIKE UI AUDIT SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 App URL: ${summary.url}`);
  console.log(`📅 Date: ${summary.date}`);
  console.log(``);
  console.log(`📊 LIGHTHOUSE SCORES:`);
  console.log(`   PWA: ${summary.lighthouse.pwaScore}/100 ${summary.lighthouse.pwaPass ? '✅' : '⚠️'}`);
  console.log(`   Performance: ${summary.lighthouse.performanceScore}/100 ${summary.lighthouse.perfPass ? '✅' : '⚠️'}`);
  console.log(``);
  console.log(`📱 TOUCH TARGETS:`);
  console.log(`   Total interactive elements: ${summary.touchTargets.total}`);
  console.log(`   Below 44x44px: ${summary.touchTargets.failing} ${summary.touchTargets.failing === 0 ? '✅' : '⚠️'}`);
  console.log(``);
  console.log(`📵 OFFLINE FUNCTIONALITY:`);
  console.log(`   Service Worker present: ${summary.offline.swPresent ? '✅' : '❌'}`);
  console.log(`   Offline navigation: ${summary.offline.success ? '✅' : '❌'}`);
  console.log(``);
  console.log(`🎯 ARTIFACTS GENERATED:`);
  console.log(`   📊 Lighthouse reports: ${summary.artifacts.lighthouse ? '✅' : '❌'}`);
  console.log(`   🔍 PWA sanity check: ${summary.artifacts.pwaSanity ? '✅' : '❌'}`);
  console.log(`   📸 Device screenshots: ${summary.artifacts.screenshots ? '✅' : '❌'}`);
  console.log(`   📏 Touch targets data: ${summary.artifacts.touchTargets ? '✅' : '❌'}`);
  console.log(`   📵 Offline test log: ${summary.artifacts.offlineLog ? '✅' : '❌'}`);
  console.log(`   📋 Manual checklist: ${summary.artifacts.checklist ? '✅' : '❌'}`);
  console.log(``);
  console.log(`📁 ARTIFACT LOCATION:`);
  console.log(`   ${ARTIFACT_DIR}`);
  console.log(`${'='.repeat(60)}`);
  
  // Overall assessment
  const scores = [
    summary.lighthouse.pwaScore >= 90 ? 1 : 0,
    summary.lighthouse.performanceScore >= 85 ? 1 : 0,
    summary.touchTargets.failing === 0 ? 1 : 0,
    summary.offline.swPresent ? 1 : 0,
    summary.offline.success ? 1 : 0
  ];
  
  const totalScore = scores.reduce((a, b) => a + b, 0);
  const maxScore = scores.length;
  const percentage = Math.round((totalScore / maxScore) * 100);
  
  console.log(`🏆 OVERALL NATIVE-LIKE SCORE: ${totalScore}/${maxScore} (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log(`🟢 EXCELLENT: Truly native-like experience achieved!`);
  } else if (percentage >= 75) {
    console.log(`🟡 GOOD: Strong native-like qualities with minor gaps`);
  } else if (percentage >= 60) {
    console.log(`🟠 NEEDS IMPROVEMENT: Some native features present but gaps exist`);
  } else {
    console.log(`🔴 NEEDS MAJOR WORK: Limited native-like experience`);
  }

  // Save summary
  const summaryPath = path.join(ARTIFACT_DIR, 'audit-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log(`\n💾 Complete audit data saved to: ${summaryPath}`);
  console.log(`\n🔗 Next steps: Review ${path.join(ARTIFACT_DIR, 'CHECKLIST.md')} for 5-minute manual verification`);
}

if (require.main === module) {
  runPWAAudit().catch(console.error);
}

module.exports = runPWAAudit;