import { chromium } from 'playwright';

async function testProductionLoginDetailed() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', error => console.log('Page error:', error.message));
  
  // Track network requests
  page.on('response', response => {
    if (response.url().includes('/auth') || response.url().includes('/api')) {
      console.log(`📡 Response: ${response.status()} ${response.url()}`);
    }
  });
  
  console.log('🔍 Testing production login with detailed logging...\n');
  
  // Navigate to sign in page
  await page.goto('https://drouple-hpci-prod.vercel.app/auth/signin');
  console.log('📄 Loaded sign-in page');
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle');
  
  // Check what form fields exist
  const emailInput = await page.locator('input[type="email"]').count();
  const passwordInput = await page.locator('input[type="password"]').count();
  const submitButton = await page.locator('button[type="submit"]').count();
  
  console.log(`   Found email input: ${emailInput > 0 ? 'Yes' : 'No'}`);
  console.log(`   Found password input: ${passwordInput > 0 ? 'Yes' : 'No'}`);
  console.log(`   Found submit button: ${submitButton > 0 ? 'Yes' : 'No'}\n`);
  
  // Fill in credentials
  await page.fill('input[type="email"]', 'superadmin@test.com');
  await page.fill('input[type="password"]', 'Hpci!Test2025');
  console.log('✏️ Filled credentials\n');
  
  // Submit form and track what happens
  console.log('🚀 Submitting login form...\n');
  
  const navigationPromise = page.waitForNavigation({ timeout: 15000 }).catch(() => null);
  await page.click('button[type="submit"]');
  
  // Wait a bit for any errors to appear
  await page.waitForTimeout(3000);
  
  // Check for error messages
  const errorMessages = await page.locator('[role="alert"], .error, .text-red-500, .text-destructive').allTextContents();
  if (errorMessages.length > 0) {
    console.log('❌ Error messages found:', errorMessages);
  }
  
  // Wait for navigation or timeout
  const nav = await navigationPromise;
  
  if (nav) {
    const currentUrl = page.url();
    console.log(`✅ Navigated to: ${currentUrl}`);
    await page.screenshot({ path: 'prod-login-success-detailed.png' });
  } else {
    console.log('❌ No navigation occurred (stayed on signin page)');
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    await page.screenshot({ path: 'prod-login-failed-detailed.png' });
  }
  
  // Check cookies to see if session was created
  const cookies = await context.cookies();
  const sessionCookies = cookies.filter(c => c.name.includes('session') || c.name.includes('auth'));
  console.log(`\n🍪 Session cookies: ${sessionCookies.length > 0 ? 'Yes' : 'No'}`);
  if (sessionCookies.length > 0) {
    sessionCookies.forEach(c => console.log(`   - ${c.name}: ${c.value.substring(0, 20)}...`));
  }
  
  await browser.close();
}

testProductionLoginDetailed();