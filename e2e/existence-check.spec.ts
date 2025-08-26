import { test, expect } from '@playwright/test';

const pages = [
  { name: 'Check-In', path: '/checkin', adminOnly: false },
  { name: 'LifeGroups', path: '/lifegroups', adminOnly: false },
  { name: 'Admin Services', path: '/admin/services', adminOnly: true },
  { name: 'Admin LifeGroups', path: '/admin/lifegroups', adminOnly: true }
];

const credentials = {
  superAdmin: { email: 'superadmin@test.com', password: 'Hpci!Test2025' },
  member: { email: 'member1@test.com', password: 'Hpci!Test2025' }
};

test.describe('@existence-check Page Existence Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we start from a clean state
    await page.goto('/');
  });

  test('SUPER_ADMIN can access all pages', async ({ page }) => {
    // Login as SUPER_ADMIN
    await page.goto('/auth/signin');
    await page.fill('#email', credentials.superAdmin.email);
    await page.fill('#password', credentials.superAdmin.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    for (const pageInfo of pages) {
      await test.step(`Verify ${pageInfo.name} at ${pageInfo.path}`, async () => {
        await page.goto(pageInfo.path);
        
        // Check HTTP status is 200
        const response = await page.goto(pageInfo.path);
        expect(response?.status()).toBe(200);
        
        // Check for main heading
        const heading = await page.locator('h1').first().textContent();
        expect(heading).toBeTruthy();
        console.log(`${pageInfo.name} heading: ${heading}`);
        
        // Check for placeholder text
        const placeholderPatterns = ['coming soon', 'will appear here', 'placeholder', 'todo'];
        const pageContent = await page.locator('body').textContent();
        const hasPlaceholder = placeholderPatterns.some(pattern => 
          pageContent?.toLowerCase().includes(pattern)
        );
        
        // Check sidebar is present
        const sidebar = await page.locator('[data-testid="sidebar"], aside, nav').first().isVisible();
        expect(sidebar).toBe(true);
        
        // Take screenshot
        await page.screenshot({ 
          path: `test-results/screenshots/superadmin-${pageInfo.name.toLowerCase().replace(' ', '-')}.png`,
          fullPage: true 
        });
        
        console.log(`${pageInfo.name}: Placeholder detected: ${hasPlaceholder}, Sidebar visible: ${sidebar}`);
      });
    }
  });

  test('MEMBER can access member pages', async ({ page }) => {
    // Login as MEMBER
    await page.goto('/auth/signin');
    await page.fill('#email', credentials.member.email);
    await page.fill('#password', credentials.member.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    for (const pageInfo of pages) {
      await test.step(`Verify ${pageInfo.name} at ${pageInfo.path}`, async () => {
        const response = await page.goto(pageInfo.path);
        
        if (pageInfo.adminOnly) {
          // Should redirect or show unauthorized
          const url = page.url();
          const isRedirected = !url.includes(pageInfo.path);
          console.log(`${pageInfo.name}: Member access blocked (redirected: ${isRedirected})`);
          
          // Take screenshot of redirect/block
          await page.screenshot({ 
            path: `test-results/screenshots/member-blocked-${pageInfo.name.toLowerCase().replace(' ', '-')}.png`,
            fullPage: true 
          });
        } else {
          // Should be accessible
          expect(response?.status()).toBe(200);
          
          const heading = await page.locator('h1').first().textContent();
          expect(heading).toBeTruthy();
          
          // Check for placeholder text
          const placeholderPatterns = ['coming soon', 'will appear here', 'placeholder', 'todo'];
          const pageContent = await page.locator('body').textContent();
          const hasPlaceholder = placeholderPatterns.some(pattern => 
            pageContent?.toLowerCase().includes(pattern)
          );
          
          // Check sidebar is present
          const sidebar = await page.locator('[data-testid="sidebar"], aside, nav').first().isVisible();
          expect(sidebar).toBe(true);
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/screenshots/member-${pageInfo.name.toLowerCase().replace(' ', '-')}.png`,
            fullPage: true 
          });
          
          console.log(`${pageInfo.name}: Placeholder detected: ${hasPlaceholder}, Sidebar visible: ${sidebar}`);
        }
      });
    }
  });

  test('Detect actual vs placeholder implementation', async ({ page }) => {
    // Login as SUPER_ADMIN for full access
    await page.goto('/auth/signin');
    await page.fill('#email', credentials.superAdmin.email);
    await page.fill('#password', credentials.superAdmin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const results = [];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.path);
      
      const heading = await page.locator('h1').first().textContent();
      const pageContent = await page.locator('main, [role="main"], .container').first().textContent();
      
      // Check for interactive elements (signs of real implementation)
      const hasButtons = await page.locator('button').count() > 1; // More than just logout
      const hasForms = await page.locator('form').count() > 0;
      const hasTables = await page.locator('table').count() > 0;
      const hasCards = await page.locator('[class*="card"]').count() > 0;
      
      // Check for placeholder markers
      const placeholderPatterns = ['coming soon', 'will appear here', 'placeholder', 'todo', 'functionality coming'];
      const hasPlaceholder = placeholderPatterns.some(pattern => 
        pageContent?.toLowerCase().includes(pattern)
      );
      
      const status = hasPlaceholder ? 'STUB' : 
                    (hasButtons || hasForms || hasTables || hasCards) ? 'PASS' : 'STUB';
      
      results.push({
        page: pageInfo.name,
        path: pageInfo.path,
        heading,
        status,
        hasInteractiveElements: hasButtons || hasForms || hasTables || hasCards,
        hasPlaceholder
      });
      
      console.log(`\n${pageInfo.name}:`);
      console.log(`  Status: ${status}`);
      console.log(`  Heading: ${heading}`);
      console.log(`  Interactive elements: ${hasButtons || hasForms || hasTables || hasCards}`);
      console.log(`  Placeholder text: ${hasPlaceholder}`);
    }
    
    // Output summary
    console.log('\n=== SUMMARY ===');
    results.forEach(r => {
      console.log(`${r.page}: ${r.status}`);
    });
  });
});