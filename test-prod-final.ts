import { chromium } from 'playwright';

async function testProductionComplete() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Complete Production Test\n');
  
  // Step 1: Sign in
  console.log('Step 1: Signing in...');
  await page.goto('https://drouple-hpci-prod.vercel.app/auth/signin');
  await page.fill('input[type="email"]', 'superadmin@test.com');
  await page.fill('input[type="password"]', 'Hpci!Test2025');
  await page.click('button[type="submit"]');
  
  // Wait for any response
  await page.waitForTimeout(3000);
  
  // Step 2: Try to navigate directly to admin pages
  console.log('\nStep 2: Testing direct navigation to protected pages...');
  
  const protectedPages = [
    '/super',
    '/admin',
    '/admin/dashboard',
    '/dashboard',
    '/admin/members',
  ];
  
  for (const path of protectedPages) {
    console.log(`\n   Trying ${path}...`);
    const response = await page.goto(`https://drouple-hpci-prod.vercel.app${path}`, {
      waitUntil: 'networkidle',
      timeout: 10000
    }).catch(e => null);
    
    const currentUrl = page.url();
    const status = response ? response.status() : 'error';
    
    if (currentUrl.includes('/auth/signin')) {
      console.log(`      ❌ Redirected to signin (not authenticated)`);
    } else if (currentUrl.includes(path)) {
      console.log(`      ✅ SUCCESS! Accessed ${path}`);
      await page.screenshot({ path: `prod-success-${path.replace(/\//g, '-')}.png` });
      
      // If we successfully accessed a page, we're authenticated!
      console.log('\n🎉 AUTHENTICATION SUCCESSFUL!');
      console.log(`📸 Screenshot saved: prod-success-${path.replace(/\//g, '-')}.png`);
      
      // Try to find user info on the page
      const userName = await page.locator('text=/super.*admin/i').first().textContent().catch(() => null);
      if (userName) {
        console.log(`👤 Logged in as: ${userName}`);
      }
      
      break;
    } else {
      console.log(`      ➡️ Redirected to: ${currentUrl}`);
    }
  }
  
  await browser.close();
}

testProductionComplete();