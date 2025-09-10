#!/usr/bin/env node
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const APP_URL = process.env.APP_URL || 'https://app.drouple.app';
const DATE = new Date().toISOString().split('T')[0];
const ARTIFACT_DIR = path.join(__dirname, '..', 'artifacts', `PWA-AUDIT-${DATE}`, 'lighthouse');

async function runLighthouse() {
  console.log(`🚀 Running Lighthouse PWA audit on ${APP_URL}`);
  
  // Ensure artifact directory exists
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const options = {
      logLevel: 'info',
      output: ['json', 'html'],
      onlyCategories: ['pwa', 'performance'],
      port: chrome.port,
      settings: {
        // Mobile device emulation
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 10240,
          uploadThroughputKbps: 1024,
        },
        // PWA specific settings
        skipAudits: ['uses-http2'],
      },
    };

    const runnerResult = await lighthouse(APP_URL, options);

    // Save JSON report
    const jsonPath = path.join(ARTIFACT_DIR, 'report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(runnerResult.lhr, null, 2));

    // Save HTML report
    const htmlPath = path.join(ARTIFACT_DIR, 'report.html');
    fs.writeFileSync(htmlPath, runnerResult.report[1]);

    // Extract scores
    const lhr = runnerResult.lhr;
    const pwaScore = lhr.categories.pwa?.score || 0;
    const performanceScore = lhr.categories.performance?.score || 0;

    console.log('\n📊 Lighthouse Results:');
    console.log(`   PWA Score: ${(pwaScore * 100).toFixed(0)}/100`);
    console.log(`   Performance Score: ${(performanceScore * 100).toFixed(0)}/100`);

    // Gate checks
    const pwaPass = pwaScore >= 0.9;
    const perfPass = performanceScore >= 0.85;

    if (!pwaPass) {
      console.warn(`⚠️  PWA score below 90%: ${(pwaScore * 100).toFixed(0)}%`);
    }
    if (!perfPass) {
      console.warn(`⚠️  Performance score below 85%: ${(performanceScore * 100).toFixed(0)}%`);
    }

    console.log(`✅ Reports saved to: ${ARTIFACT_DIR}`);

    // Return summary for main test runner
    return {
      pwaScore: Math.round(pwaScore * 100),
      performanceScore: Math.round(performanceScore * 100),
      pwaPass,
      perfPass,
      artifactDir: ARTIFACT_DIR
    };

  } finally {
    await chrome.kill();
  }
}

if (require.main === module) {
  runLighthouse().catch(console.error);
}

module.exports = runLighthouse;