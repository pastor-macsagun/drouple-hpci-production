#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * Checks bundle sizes against performance budgets
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const BUNDLE_BUDGETS = {
  maxBaseSize: 50 * 1024 * 1024, // 50MB in bytes
  maxInstalledSize: 120 * 1024 * 1024, // 120MB in bytes
  maxRouteSize: 200 * 1024, // 200KB in bytes
};

class BundleSizeAnalyzer {
  constructor(platform = 'ios') {
    this.platform = platform;
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
   * Build app for analysis
   */
  async buildApp() {
    console.log(`📦 Building ${this.platform} app for bundle analysis...`);
    
    try {
      if (this.platform === 'ios') {
        execSync('npx expo run:ios --no-install --no-bundler', { stdio: 'inherit' });
      } else {
        execSync('npx expo run:android --no-install --no-bundler', { stdio: 'inherit' });
      }
      console.log('✅ Build completed');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  /**
   * Analyze JS bundle size
   */
  async analyzeJSBundle() {
    console.log('📊 Analyzing JavaScript bundle size...');
    
    try {
      // Create production bundle
      execSync('npx expo export --platform all --output-dir ./dist', { stdio: 'inherit' });
      
      const bundlePath = path.join(process.cwd(), 'dist', '_expo', 'static', 'js');
      const files = await fs.readdir(bundlePath);
      
      let totalSize = 0;
      const chunks = [];

      for (const file of files) {
        if (file.endsWith('.js')) {
          const filePath = path.join(bundlePath, file);
          const stats = await fs.stat(filePath);
          const size = stats.size;
          totalSize += size;
          
          chunks.push({
            name: file,
            size,
            sizeKB: Math.round(size / 1024),
            type: this.categorizeChunk(file),
          });
        }
      }

      // Sort chunks by size (largest first)
      chunks.sort((a, b) => b.size - a.size);
      
      const result = {
        metric: 'js_bundle_size',
        platform: this.platform,
        totalSize,
        totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
        budget: BUNDLE_BUDGETS.maxBaseSize,
        budgetMB: Math.round(BUNDLE_BUDGETS.maxBaseSize / (1024 * 1024)),
        passed: totalSize <= BUNDLE_BUDGETS.maxBaseSize,
        chunks,
        timestamp: new Date().toISOString(),
      };

      this.results.push(result);
      
      console.log(`📦 JS Bundle: ${result.totalSizeMB}MB (budget: ${result.budgetMB}MB) ${result.passed ? '✅' : '❌'}`);
      
      // Check individual chunk sizes
      this.analyzeChunkSizes(chunks);
      
      return result;
    } catch (error) {
      throw new Error(`JS bundle analysis failed: ${error.message}`);
    }
  }

  /**
   * Categorize bundle chunks
   */
  categorizeChunk(filename) {
    if (filename.includes('vendor') || filename.includes('node_modules')) {
      return 'vendor';
    } else if (filename.includes('runtime')) {
      return 'runtime';
    } else if (filename.includes('main') || filename.includes('index')) {
      return 'main';
    } else {
      return 'route';
    }
  }

  /**
   * Analyze individual chunk sizes against route budget
   */
  analyzeChunkSizes(chunks) {
    console.log('\\n🔍 Individual chunk analysis:');
    
    chunks.forEach(chunk => {
      if (chunk.type === 'route') {
        const passed = chunk.size <= BUNDLE_BUDGETS.maxRouteSize;
        const budgetKB = Math.round(BUNDLE_BUDGETS.maxRouteSize / 1024);
        
        console.log(`   ${chunk.name}: ${chunk.sizeKB}KB (budget: ${budgetKB}KB) ${passed ? '✅' : '❌'}`);
        
        if (!passed) {
          this.results.push({
            metric: 'route_chunk_size',
            chunkName: chunk.name,
            size: chunk.size,
            budget: BUNDLE_BUDGETS.maxRouteSize,
            passed: false,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        console.log(`   ${chunk.name}: ${chunk.sizeKB}KB (${chunk.type})`);
      }
    });
  }

  /**
   * Analyze installed app size (iOS/Android specific)
   */
  async analyzeInstalledSize() {
    console.log(`📱 Analyzing installed app size for ${this.platform}...`);
    
    try {
      let installedSize = 0;
      
      if (this.platform === 'ios') {
        installedSize = await this.getIOSInstalledSize();
      } else {
        installedSize = await this.getAndroidInstalledSize();
      }
      
      const result = {
        metric: 'installed_size',
        platform: this.platform,
        size: installedSize,
        sizeMB: Math.round(installedSize / (1024 * 1024) * 100) / 100,
        budget: BUNDLE_BUDGETS.maxInstalledSize,
        budgetMB: Math.round(BUNDLE_BUDGETS.maxInstalledSize / (1024 * 1024)),
        passed: installedSize <= BUNDLE_BUDGETS.maxInstalledSize,
        timestamp: new Date().toISOString(),
      };

      this.results.push(result);
      
      console.log(`📱 Installed: ${result.sizeMB}MB (budget: ${result.budgetMB}MB) ${result.passed ? '✅' : '❌'}`);
      return result;
    } catch (error) {
      console.warn('⚠️  Could not measure installed size:', error.message);
      return null;
    }
  }

  /**
   * Get iOS installed app size
   */
  async getIOSInstalledSize() {
    try {
      const bundleId = 'com.hpci.drouple.mobile';
      
      // Use simctl to get app size info
      const output = execSync(
        `xcrun simctl get_app_container booted ${bundleId} app`,
        { encoding: 'utf8' }
      );
      
      const appPath = output.trim();
      const sizeOutput = execSync(`du -sb "${appPath}"`, { encoding: 'utf8' });
      const size = parseInt(sizeOutput.split('\t')[0]);
      
      return size;
    } catch (error) {
      throw new Error(`iOS size measurement failed: ${error.message}`);
    }
  }

  /**
   * Get Android installed app size
   */
  async getAndroidInstalledSize() {
    try {
      const packageName = 'com.hpci.drouple.mobile';
      
      // Use ADB to get package info
      const output = execSync(
        `adb shell dumpsys package ${packageName} | grep codeSize`,
        { encoding: 'utf8' }
      );
      
      const match = output.match(/codeSize=(\d+)/);
      if (match) {
        return parseInt(match[1]);
      } else {
        throw new Error('Could not parse package size from dumpsys output');
      }
    } catch (error) {
      throw new Error(`Android size measurement failed: ${error.message}`);
    }
  }

  /**
   * Generate bundle size recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    this.results.forEach(result => {
      if (!result.passed) {
        switch (result.metric) {
          case 'js_bundle_size':
            recommendations.push({
              type: 'js_bundle',
              message: `JS bundle exceeds budget by ${(result.totalSizeMB - result.budgetMB).toFixed(1)}MB`,
              suggestions: [
                'Enable tree shaking for unused code elimination',
                'Implement route-based code splitting',
                'Use dynamic imports for non-critical features',
                'Optimize third-party library usage',
                'Consider lazy loading for heavy components',
              ],
            });
            break;
            
          case 'route_chunk_size':
            recommendations.push({
              type: 'route_chunk',
              message: `Route chunk '${result.chunkName}' exceeds ${Math.round(BUNDLE_BUDGETS.maxRouteSize / 1024)}KB budget`,
              suggestions: [
                'Split large routes into smaller chunks',
                'Lazy load heavy dependencies',
                'Move common code to shared chunks',
                'Optimize component memoization',
              ],
            });
            break;
            
          case 'installed_size':
            recommendations.push({
              type: 'installed_size',
              message: `Installed app exceeds budget by ${(result.sizeMB - result.budgetMB).toFixed(1)}MB`,
              suggestions: [
                'Remove unused assets and resources',
                'Optimize image assets and use appropriate formats',
                'Remove debug symbols in release builds',
                'Use asset delivery optimization',
              ],
            });
            break;
        }
      }
    });

    return recommendations;
  }

  /**
   * Run comprehensive bundle analysis
   */
  async analyzeAll() {
    console.log(`🔍 Starting comprehensive bundle analysis for ${this.platform}...\\n`);
    
    await this.ensureOutputDir();
    
    try {
      // Analyze JS bundle (doesn't require native build)
      await this.analyzeJSBundle();
      
      // Analyze installed size (requires native build)
      await this.analyzeInstalledSize();
      
      // Generate recommendations
      const recommendations = this.generateRecommendations();
      
      // Generate report
      await this.generateReport(recommendations);
      
      return this.validateResults();
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
      throw error;
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
      warnings: [],
    };

    let allPassed = true;

    this.results.forEach(result => {
      if (result.passed) {
        summary.passed++;
      } else {
        summary.failed++;
        allPassed = false;
        summary.warnings.push(`${result.metric} budget exceeded`);
      }
    });

    console.log(`\\n📊 Bundle Analysis Summary:`);
    console.log(`   Total metrics: ${summary.total}`);
    console.log(`   Passed: ${summary.passed} ✅`);
    console.log(`   Failed: ${summary.failed} ❌`);
    console.log(`   Overall: ${allPassed ? 'PASS ✅' : 'FAIL ❌'}`);

    if (summary.warnings.length > 0) {
      console.log(`\\n⚠️  Warnings:`);
      summary.warnings.forEach(warning => {
        console.log(`   - ${warning}`);
      });
    }

    return { passed: allPassed, summary, results: this.results };
  }

  /**
   * Generate detailed bundle analysis report
   */
  async generateReport(recommendations = []) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bundle-analysis-${this.platform}-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);
    
    const report = {
      platform: this.platform,
      timestamp: new Date().toISOString(),
      budgets: {
        maxBaseSize: `${Math.round(BUNDLE_BUDGETS.maxBaseSize / (1024 * 1024))}MB`,
        maxInstalledSize: `${Math.round(BUNDLE_BUDGETS.maxInstalledSize / (1024 * 1024))}MB`,
        maxRouteSize: `${Math.round(BUNDLE_BUDGETS.maxRouteSize / 1024)}KB`,
      },
      results: this.results,
      recommendations,
      summary: this.validateResults().summary,
    };

    await fs.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`\\n📄 Bundle analysis report saved to: ${filepath}`);
    
    if (recommendations.length > 0) {
      console.log(`\\n💡 Optimization Recommendations:`);
      recommendations.forEach((rec, index) => {
        console.log(`\\n   ${index + 1}. ${rec.message}`);
        rec.suggestions.forEach(suggestion => {
          console.log(`      • ${suggestion}`);
        });
      });
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const platform = args.find(arg => ['ios', 'android'].includes(arg)) || 'ios';
  const skipBuild = args.includes('--skip-build');
  
  const analyzer = new BundleSizeAnalyzer(platform);
  
  if (!skipBuild) {
    await analyzer.buildApp();
  }
  
  const result = await analyzer.analyzeAll();
  
  // Exit with error code if bundle budgets exceeded
  process.exit(result.passed ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Bundle analysis failed:', error);
    process.exit(1);
  });
}

export default BundleSizeAnalyzer;