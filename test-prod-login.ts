import { chromium } from 'playwright';

async function testProductionLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Testing production login...');
  
  // Navigate to sign in page
  await page.goto('https://drouple-hpci-prod.vercel.app/auth/signin');
  console.log('📄 Loaded sign-in page');
  
  // Fill in credentials
  await page.fill('input[type="email"]', 'superadmin@test.com');
  await page.fill('input[type="password"]', 'Hpci!Test2025');
  console.log('✏️ Filled credentials');
  
  // Submit form
  await page.click('button[type="submit"]');
  console.log('🚀 Submitted login form');
  
  // Wait for navigation
  try {
    await page.waitForURL((url) => !url.href.includes('/auth/signin'), { timeout: 10000 });
    const currentUrl = page.url();
    console.log(`✅ SUCCESS! Redirected to: ${currentUrl}`);
    
    // Take a screenshot as proof
    await page.screenshot({ path: 'prod-login-success.png' });
    console.log('📸 Screenshot saved: prod-login-success.png');
  } catch (error) {
    console.error('❌ Login failed or timed out');
    await page.screenshot({ path: 'prod-login-failed.png' });
  }
  
  await browser.close();
}

testProductionLogin();