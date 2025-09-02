import { test, expect } from '@playwright/test';

test('debug admin members page', async ({ page }) => {
  // Navigate to the login page
  await page.goto('http://localhost:3004/auth/signin');
  
  // Take a screenshot to see what we have
  await page.screenshot({ path: 'debug-login.png' });
  
  // Fill in admin credentials
  await page.fill('#email', 'admin.manila@test.com');
  await page.fill('#password', 'Hpci!Test2025');
  
  // Click sign in
  await page.click('button[type="submit"]');
  
  // Wait for redirect
  await page.waitForURL(/\/admin/);
  
  // Take screenshot of admin dashboard
  await page.screenshot({ path: 'debug-admin-dashboard.png' });
  
  // Navigate to admin members page
  await page.goto('http://localhost:3004/admin/members');
  
  // Wait a moment for loading
  await page.waitForTimeout(2000);
  
  // Take screenshot of members page
  await page.screenshot({ path: 'debug-admin-members.png' });
  
  // Check what's on the page
  const content = await page.textContent('body');
  console.log('Page content preview:', content?.substring(0, 500));
  
  // Check console errors
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  console.log('Console errors:', errors);
  
  // Check network requests
  const responses: any[] = [];
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
  });
  
  console.log('Network responses:', responses);
});