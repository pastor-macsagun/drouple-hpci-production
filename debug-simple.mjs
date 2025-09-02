import { chromium } from 'playwright';

async function debugMembersPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console messages and errors from the start
  const errors = [];
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.log('❌ Console Error:', msg.text());
    } else if (msg.type() === 'warn') {
      console.log('⚠️ Console Warning:', msg.text());
    } else {
      console.log(`📝 Console [${msg.type()}]:`, msg.text());
    }
  });
  
  // Listen to network failures
  page.on('requestfailed', request => {
    console.log('🔴 Request failed:', request.url(), request.failure()?.errorText);
  });
  
  console.log('🔄 Navigating to login page with returnTo parameter...');
  await page.goto('http://localhost:3004/auth/signin?returnTo=%2Fadmin%2Fmembers');
  
  // Wait for the form to load
  await page.waitForSelector('#email', { timeout: 10000 });
  await page.waitForSelector('#password', { timeout: 10000 });
  
  console.log('🔒 Filling in admin credentials...');
  await page.fill('#email', 'admin.manila@test.com');
  await page.fill('#password', 'Hpci!Test2025');
  
  // Verify the values were filled
  const emailValue = await page.inputValue('#email');
  const passwordValue = await page.inputValue('#password');
  console.log('📧 Email filled:', emailValue);
  console.log('🔐 Password filled:', passwordValue ? '***' : 'EMPTY!');
  
  console.log('🚀 Clicking sign in...');
  
  // Listen for network requests during form submission
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers()
    });
    console.log(`📡 Request: ${request.method()} ${request.url()}`);
  });
  
  // Submit form and wait for network activity
  await page.click('button[type="submit"]');
  
  console.log('⏳ Waiting for redirect...');
  
  // Listen for response status codes
  page.on('response', response => {
    console.log(`📥 Response: ${response.status()} ${response.url()}`);
    if (response.status() >= 400) {
      console.log(`❌ Error response: ${response.status()} ${response.statusText()}`);
    }
  });
  
  try {
    // Wait for either redirect to admin or error message with longer timeout
    await Promise.race([
      page.waitForURL(/\/admin/, { timeout: 15000 }),
      page.waitForSelector('[role="alert"], .alert, [data-testid="error"]', { timeout: 15000 })
    ]);
  } catch (e) {
    console.log('⚠️ No redirect or error detected within timeout');
  }
  
  // Wait a bit longer after the timeout for any delayed requests
  await page.waitForTimeout(3000);
  
  console.log('📍 Current URL after login:', page.url());
  
  // Check for error messages
  const errorAlert = await page.isVisible('[role="alert"], .alert-destructive');
  if (errorAlert) {
    const errorText = await page.textContent('[role="alert"], .alert-destructive');
    console.log('🚨 Error message:', errorText);
  }
  
  // Take screenshot after login attempt
  await page.screenshot({ path: 'debug-after-login.png' });
  console.log('📸 Screenshot after login saved as debug-after-login.png');
  
  if (page.url().includes('/admin')) {
    console.log('✅ Successfully logged in! Now navigating to members page...');
    
    await page.goto('http://localhost:3004/admin/members');
    await page.waitForTimeout(3000);
    
    console.log('📍 Final URL:', page.url());
    
    // Take final screenshot
    await page.screenshot({ path: 'debug-members-final.png' });
    console.log('📸 Final screenshot saved as debug-members-final.png');
    
    // Check page content
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    const headingExists = await page.isVisible('h1');
    console.log('📑 Has h1 heading:', headingExists);
    
    if (headingExists) {
      const heading = await page.textContent('h1');
      console.log('📑 Heading text:', heading);
    }
    
    // Check for member data
    const tableExists = await page.isVisible('table');
    console.log('📊 Table exists:', tableExists);
  } else {
    console.log('❌ Login failed - still on signin page');
  }
  
  console.log('🔍 Total console messages:', logs.length);
  console.log('🔍 Total errors:', errors.length);
  
  console.log('✅ Debug complete.');
  
  await browser.close();
}

debugMembersPage().catch(console.error);