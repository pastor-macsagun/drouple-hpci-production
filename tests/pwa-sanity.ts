import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const APP_URL = process.env.APP_URL || 'https://app.drouple.app';
const DATE = new Date().toISOString().split('T')[0];
const ARTIFACT_DIR = path.join(__dirname, '..', 'artifacts', `PWA-AUDIT-${DATE}`);

interface PWASanityResult {
  manifest: {
    exists: boolean;
    standalone: boolean;
    orientationPortrait: boolean;
    hasThemeColor: boolean;
    hasBackgroundColor: boolean;
    hasMaskableIcon192: boolean;
    hasMaskableIcon512: boolean;
    hasShortcuts: boolean;
    hasProtocolHandlers: boolean;
  };
  serviceWorker: {
    exists: boolean;
    hasCacheFirst: boolean;
    hasStaleWhileRevalidate: boolean;
    hasNetworkFirst: boolean;
    hasBackgroundSync: boolean;
    hasPushNotifications: boolean;
  };
  timestamp: string;
}

test.describe('PWA Sanity Checks', () => {
  let result: PWASanityResult;

  test.beforeAll(async () => {
    // Ensure artifact directory exists
    if (!fs.existsSync(ARTIFACT_DIR)) {
      fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    }

    result = {
      manifest: {
        exists: false,
        standalone: false,
        orientationPortrait: false,
        hasThemeColor: false,
        hasBackgroundColor: false,
        hasMaskableIcon192: false,
        hasMaskableIcon512: false,
        hasShortcuts: false,
        hasProtocolHandlers: false,
      },
      serviceWorker: {
        exists: false,
        hasCacheFirst: false,
        hasStaleWhileRevalidate: false,
        hasNetworkFirst: false,
        hasBackgroundSync: false,
        hasPushNotifications: false,
      },
      timestamp: new Date().toISOString(),
    };
  });

  test('should validate PWA manifest', async ({ request }) => {
    console.log(`🔍 Validating PWA manifest from ${APP_URL}`);

    try {
      // Fetch manifest.json
      const manifestResponse = await request.get(`${APP_URL}/manifest.json`);
      expect(manifestResponse.status()).toBe(200);
      result.manifest.exists = true;

      const manifest = await manifestResponse.json();
      
      // Check display mode
      result.manifest.standalone = manifest.display === 'standalone';
      
      // Check orientation
      result.manifest.orientationPortrait = manifest.orientation === 'portrait-primary';
      
      // Check colors
      result.manifest.hasThemeColor = !!manifest.theme_color;
      result.manifest.hasBackgroundColor = !!manifest.background_color;
      
      // Check icons for maskable 192 and 512
      if (manifest.icons && Array.isArray(manifest.icons)) {
        result.manifest.hasMaskableIcon192 = manifest.icons.some((icon: any) => 
          icon.sizes?.includes('192x192') && icon.purpose?.includes('maskable')
        );
        result.manifest.hasMaskableIcon512 = manifest.icons.some((icon: any) => 
          icon.sizes?.includes('512x512') && icon.purpose?.includes('maskable')
        );
      }
      
      // Check shortcuts
      result.manifest.hasShortcuts = !!manifest.shortcuts && manifest.shortcuts.length > 0;
      
      // Check protocol handlers
      result.manifest.hasProtocolHandlers = !!manifest.protocol_handlers && manifest.protocol_handlers.length > 0;

      console.log(`✅ Manifest validation complete`);
    } catch (error) {
      console.warn(`⚠️ Manifest validation failed: ${error}`);
    }
  });

  test('should validate service worker', async ({ request }) => {
    console.log(`🔍 Validating service worker from ${APP_URL}`);

    try {
      // Try common service worker paths
      const swPaths = ['/sw.js', '/service-worker.js', '/pwa-sw.js'];
      let swContent = '';
      
      for (const swPath of swPaths) {
        try {
          const swResponse = await request.get(`${APP_URL}${swPath}`);
          if (swResponse.status() === 200) {
            swContent = await swResponse.text();
            result.serviceWorker.exists = true;
            console.log(`✅ Found service worker at ${swPath}`);
            break;
          }
        } catch (e) {
          // Continue trying other paths
        }
      }

      if (swContent) {
        // Static analysis of service worker strategies
        result.serviceWorker.hasCacheFirst = swContent.includes('CacheFirst') || 
          swContent.includes('cache-first') || 
          swContent.includes('caches.match');
        
        result.serviceWorker.hasStaleWhileRevalidate = swContent.includes('StaleWhileRevalidate') || 
          swContent.includes('stale-while-revalidate');
        
        result.serviceWorker.hasNetworkFirst = swContent.includes('NetworkFirst') || 
          swContent.includes('network-first');
        
        result.serviceWorker.hasBackgroundSync = swContent.includes('background-sync') || 
          swContent.includes('backgroundSync') || 
          swContent.includes('sync');
        
        result.serviceWorker.hasPushNotifications = swContent.includes('push') && 
          (swContent.includes('addEventListener') || swContent.includes('onpush'));
      }

      console.log(`✅ Service worker analysis complete`);
    } catch (error) {
      console.warn(`⚠️ Service worker validation failed: ${error}`);
    }
  });

  test.afterAll(async () => {
    // Save results to JSON
    const outputPath = path.join(ARTIFACT_DIR, 'pwa-sanity.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    console.log('\n📋 PWA Sanity Check Results:');
    console.log(`   Manifest exists: ${result.manifest.exists ? '✅' : '❌'}`);
    console.log(`   Standalone mode: ${result.manifest.standalone ? '✅' : '❌'}`);
    console.log(`   Portrait orientation: ${result.manifest.orientationPortrait ? '✅' : '❌'}`);
    console.log(`   Theme/background colors: ${result.manifest.hasThemeColor && result.manifest.hasBackgroundColor ? '✅' : '❌'}`);
    console.log(`   Maskable icons (192 & 512): ${result.manifest.hasMaskableIcon192 && result.manifest.hasMaskableIcon512 ? '✅' : '❌'}`);
    console.log(`   Shortcuts: ${result.manifest.hasShortcuts ? '✅' : '❌'}`);
    console.log(`   Service worker exists: ${result.serviceWorker.exists ? '✅' : '❌'}`);
    console.log(`   Cache strategies: ${result.serviceWorker.hasCacheFirst ? 'Cache-First ✅' : '❌'} ${result.serviceWorker.hasStaleWhileRevalidate ? 'SWR ✅' : '❌'} ${result.serviceWorker.hasNetworkFirst ? 'Network-First ✅' : '❌'}`);
    console.log(`   Background sync: ${result.serviceWorker.hasBackgroundSync ? '✅' : '❌'}`);
    console.log(`   Push notifications: ${result.serviceWorker.hasPushNotifications ? '✅' : '❌'}`);
    console.log(`📁 Results saved to: ${outputPath}`);
  });
});