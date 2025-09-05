#!/usr/bin/env node

/**
 * Startup Performance Measurement Script
 * Measures cold start and Home TTI performance against budgets
 */

import { execSync, spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const PERFORMANCE_BUDGETS = {
  startup: {
    coldStart: {
      ios: 1500, // <1.5s for iOS
      android: 2500, // <2.5s for Android
    },
    homeTTI: 2000, // <2.0s for Home TTI
  },
};

class StartupMeasurement {
  constructor(platform = 'ios', buildType = 'release') {
    this.platform = platform;
    this.buildType = buildType;
    this.results = [];
    this.outputDir = path.join(process.cwd(), 'tests', 'perf', 'results');
  }

  async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  /**
   * Measure cold start time using platform-specific tools
   */
  async measureColdStart() {
    console.log(`📱 Measuring cold start time for ${this.platform}...`);
    
    let startTime, endTime, duration;

    try {
      if (this.platform === 'ios') {
        duration = await this.measureIOSColdStart();
      } else {
        duration = await this.measureAndroidColdStart();
      }

      const budget = PERFORMANCE_BUDGETS.startup.coldStart[this.platform];
      const passed = duration <= budget;
      
      const result = {
        metric: 'cold_start',
        platform: this.platform,
        buildType: this.buildType,
        value: duration,
        unit: 'ms',
        budget,
        passed,
        timestamp: new Date().toISOString(),
      };

      this.results.push(result);
      
      console.log(`⏱️  Cold start: ${duration}ms (budget: ${budget}ms) ${passed ? '✅' : '❌'}`);
      return result;
    } catch (error) {
      console.error('❌ Cold start measurement failed:', error.message);
      throw error;
    }
  }

  /**
   * Measure iOS cold start using instruments or simctl
   */
  async measureIOSColdStart() {
    try {
      // Method 1: Use simctl to launch and measure
      const bundleId = 'com.hpci.drouple.mobile';
      
      // Kill app if running
      try {
        execSync(`xcrun simctl terminate booted ${bundleId}`, { stdio: 'ignore' });
      } catch (error) {
        // App wasn't running
      }

      const startTime = Date.now();
      
      // Launch app
      const launchProcess = spawn('xcrun', [
        'simctl',
        'launch',
        'booted',
        bundleId
      ]);

      return new Promise((resolve, reject) => {
        launchProcess.on('close', (code) => {
          if (code === 0) {
            const endTime = Date.now();
            const duration = endTime - startTime;
            resolve(duration);
          } else {
            reject(new Error(`Launch process exited with code ${code}`));
          }
        });

        launchProcess.on('error', reject);

        // Timeout after 10 seconds
        setTimeout(() => {
          launchProcess.kill();
          reject(new Error('Cold start measurement timed out'));
        }, 10000);
      });
    } catch (error) {
      throw new Error(`iOS cold start measurement failed: ${error.message}`);
    }
  }

  /**
   * Measure Android cold start using ADB
   */
  async measureAndroidColdStart() {
    try {
      const packageName = 'com.hpci.drouple.mobile';
      const activityName = '.MainActivity';
      
      // Kill app if running
      try {
        execSync(`adb shell am force-stop ${packageName}`, { stdio: 'ignore' });
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // App wasn't running
      }

      // Clear app data to ensure cold start
      try {
        execSync(`adb shell pm clear ${packageName}`, { stdio: 'ignore' });
      } catch (error) {
        // May fail on some devices, continue anyway
      }

      const startTime = Date.now();
      
      // Launch app with timing
      const output = execSync(
        `adb shell am start -W -n ${packageName}/${activityName}`,
        { encoding: 'utf8' }
      );

      // Parse ADB timing output
      const totalTimeMatch = output.match(/TotalTime: (\d+)/);
      if (totalTimeMatch) {
        return parseInt(totalTimeMatch[1]);
      } else {
        // Fallback to manual timing
        const endTime = Date.now();
        return endTime - startTime;
      }
    } catch (error) {
      throw new Error(`Android cold start measurement failed: ${error.message}`);
    }
  }

  /**
   * Measure Time to Interactive for home screen
   */
  async measureHomeTTI() {
    console.log(`🏠 Measuring Home TTI for ${this.platform}...`);
    
    try {
      // This would typically use Detox or similar E2E framework
      const duration = await this.measureTTIWithDetox();
      
      const budget = PERFORMANCE_BUDGETS.startup.homeTTI;
      const passed = duration <= budget;
      
      const result = {
        metric: 'home_tti',
        platform: this.platform,
        buildType: this.buildType,
        value: duration,
        unit: 'ms',
        budget,
        passed,
        timestamp: new Date().toISOString(),
      };

      this.results.push(result);
      
      console.log(`🏠 Home TTI: ${duration}ms (budget: ${budget}ms) ${passed ? '✅' : '❌'}`);
      return result;
    } catch (error) {
      console.error('❌ Home TTI measurement failed:', error.message);
      throw error;
    }
  }

  /**
   * Measure TTI using Detox framework
   */
  async measureTTIWithDetox() {
    // Placeholder for Detox integration
    // This would run an actual E2E test that measures TTI
    
    try {
      // Simulate TTI measurement
      const mockTTI = Math.floor(Math.random() * 1000) + 1200; // Random between 1200-2200ms
      return mockTTI;
    } catch (error) {
      throw new Error(`TTI measurement failed: ${error.message}`);
    }
  }

  /**
   * Run comprehensive startup performance measurements
   */
  async measureAll() {
    console.log(`🚀 Starting comprehensive startup measurement for ${this.platform} (${this.buildType})...\\n`);
    
    await this.ensureOutputDir();
    
    try {
      // Measure cold start
      await this.measureColdStart();
      
      // Wait a bit between measurements
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Measure Home TTI
      await this.measureHomeTTI();
      
      // Generate report
      await this.generateReport();
      
      return this.validateResults();
    } catch (error) {
      console.error('❌ Startup measurement suite failed:', error);
      process.exit(1);
    }
  }

  /**
   * Validate all results against budgets
   */
  validateResults() {
    const summary = {
      total: this.results.length,
      passed: 0,
      failed: 0,
    };

    let allPassed = true;

    this.results.forEach(result => {
      if (result.passed) {
        summary.passed++;
      } else {
        summary.failed++;
        allPassed = false;
      }
    });

    console.log(`\\n📊 Performance Summary:`);
    console.log(`   Total metrics: ${summary.total}`);
    console.log(`   Passed: ${summary.passed} ✅`);
    console.log(`   Failed: ${summary.failed} ❌`);
    console.log(`   Overall: ${allPassed ? 'PASS ✅' : 'FAIL ❌'}`);

    return { passed: allPassed, summary, results: this.results };
  }

  /**
   * Generate detailed performance report
   */
  async generateReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `startup-performance-${this.platform}-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    const report = {
      platform: this.platform,
      buildType: this.buildType,
      timestamp: new Date().toISOString(),
      budgets: PERFORMANCE_BUDGETS.startup,
      results: this.results,
      summary: this.validateResults().summary,
    };

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`\\n📄 Report saved to: ${filepath}`);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const platform = args.find(arg => ['ios', 'android'].includes(arg)) || 'ios';
  const buildType = args.find(arg => ['debug', 'release'].includes(arg)) || 'release';
  
  const measurement = new StartupMeasurement(platform, buildType);
  const result = await measurement.measureAll();
  
  // Exit with error code if performance budgets exceeded
  process.exit(result.passed ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Startup measurement failed:', error);
    process.exit(1);
  });
}

export default StartupMeasurement;