#!/usr/bin/env node

/**
 * Coverage Enforcement Script
 * Checks if test coverage meets minimum thresholds for critical modules
 */

const fs = require('fs');
const path = require('path');

// Define thresholds
const GLOBAL_THRESHOLDS = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};

const CRITICAL_MODULE_THRESHOLDS = {
  'lib/rbac.ts': { statements: 90, branches: 90, functions: 90, lines: 90 },
  'lib/tenancy.ts': { statements: 90, branches: 90, functions: 90, lines: 90 },
  'app/events/actions.ts': { statements: 85, branches: 85, functions: 85, lines: 85 },
  'app/checkin/actions.ts': { statements: 85, branches: 85, functions: 85, lines: 85 },
  'app/pathways/actions.ts': { statements: 85, branches: 85, functions: 85, lines: 85 },
};

function checkCoverage() {
  // Check if coverage file exists
  const coverageFile = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coverageFile)) {
    console.error('❌ Coverage file not found. Run tests with coverage first: npm run test:unit:coverage');
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
  let hasFailures = false;
  const results = [];

  console.log('\n📊 Coverage Report');
  console.log('==================\n');

  // Check global coverage
  console.log('Global Coverage:');
  const total = coverage.total;
  
  for (const metric of ['statements', 'branches', 'functions', 'lines']) {
    const pct = total[metric].pct;
    const threshold = GLOBAL_THRESHOLDS[metric];
    const status = pct >= threshold ? '✅' : '❌';
    
    console.log(`  ${status} ${metric}: ${pct.toFixed(2)}% (threshold: ${threshold}%)`);
    
    if (pct < threshold) {
      hasFailures = true;
      results.push({
        type: 'global',
        metric,
        actual: pct,
        threshold,
        passed: false,
      });
    } else {
      results.push({
        type: 'global',
        metric,
        actual: pct,
        threshold,
        passed: true,
      });
    }
  }

  // Check critical modules
  console.log('\nCritical Modules:');
  
  for (const [modulePath, thresholds] of Object.entries(CRITICAL_MODULE_THRESHOLDS)) {
    const fullPath = path.join(process.cwd(), modulePath);
    const moduleData = coverage[fullPath];
    
    if (!moduleData) {
      console.log(`  ⚠️  ${modulePath}: No coverage data found`);
      continue;
    }

    console.log(`  ${modulePath}:`);
    
    for (const metric of ['statements', 'branches', 'functions', 'lines']) {
      const pct = moduleData[metric].pct;
      const threshold = thresholds[metric];
      const status = pct >= threshold ? '✅' : '❌';
      
      console.log(`    ${status} ${metric}: ${pct.toFixed(2)}% (threshold: ${threshold}%)`);
      
      if (pct < threshold) {
        hasFailures = true;
        results.push({
          type: 'critical',
          module: modulePath,
          metric,
          actual: pct,
          threshold,
          passed: false,
        });
      } else {
        results.push({
          type: 'critical',
          module: modulePath,
          metric,
          actual: pct,
          threshold,
          passed: true,
        });
      }
    }
  }

  // Generate summary
  console.log('\n📈 Summary');
  console.log('=========');
  
  const globalPassed = results.filter(r => r.type === 'global' && r.passed).length;
  const globalTotal = results.filter(r => r.type === 'global').length;
  const criticalPassed = results.filter(r => r.type === 'critical' && r.passed).length;
  const criticalTotal = results.filter(r => r.type === 'critical').length;
  
  console.log(`Global: ${globalPassed}/${globalTotal} metrics passed`);
  console.log(`Critical: ${criticalPassed}/${criticalTotal} metrics passed`);

  // Write results to file for CI
  const reportPath = path.join(process.cwd(), 'coverage', 'coverage-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    passed: !hasFailures,
    global: {
      passed: globalPassed,
      total: globalTotal,
      metrics: results.filter(r => r.type === 'global'),
    },
    critical: {
      passed: criticalPassed,
      total: criticalTotal,
      metrics: results.filter(r => r.type === 'critical'),
    },
  }, null, 2));

  console.log(`\n📝 Detailed report saved to: ${reportPath}`);

  // Exit with appropriate code
  if (hasFailures) {
    console.error('\n❌ Coverage thresholds not met!');
    console.log('\nTo improve coverage:');
    console.log('1. Add more unit tests for uncovered code paths');
    console.log('2. Test edge cases and error conditions');
    console.log('3. Ensure all critical functions have tests');
    process.exit(1);
  } else {
    console.log('\n✅ All coverage thresholds met!');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  checkCoverage();
}

module.exports = { checkCoverage };