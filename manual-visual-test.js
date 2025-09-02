const { chromium } = require('playwright');

async function quickVisualTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    // Test sign-in page
    console.log('Testing sign-in page...');
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'visual-test-screenshots/signin-page.png', fullPage: true });

    // Login as admin
    await page.fill('#email', 'admin.manila@test.com');
    await page.fill('#password', 'Hpci!Test2025');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'visual-test-screenshots/admin-dashboard.png', fullPage: true });

    // Test admin pages
    const adminPages = ['/admin/members', '/admin/services', '/admin/lifegroups', '/admin/events'];
    
    for (const pagePath of adminPages) {
      console.log(`Testing ${pagePath}...`);
      await page.goto(`http://localhost:3000${pagePath}`);
      await page.waitForLoadState('networkidle');
      const pageName = pagePath.split('/').pop();
      await page.screenshot({ path: `visual-test-screenshots/admin-${pageName}.png`, fullPage: true });
      await page.waitForTimeout(1000);
    }

    // Test member login and pages
    await page.goto('http://localhost:3000/auth/signin');
    await page.waitForLoadState('networkidle');
    
    await page.fill('#email', 'member1@test.com');
    await page.fill('#password', 'Hpci!Test2025');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'visual-test-screenshots/member-dashboard.png', fullPage: true });

    // Test user-facing pages
    const userPages = ['/members', '/events', '/lifegroups', '/pathways'];
    
    for (const pagePath of userPages) {
      console.log(`Testing ${pagePath}...`);
      await page.goto(`http://localhost:3000${pagePath}`);
      await page.waitForLoadState('networkidle');
      const pageName = pagePath.split('/').pop();
      await page.screenshot({ path: `visual-test-screenshots/user-${pageName}.png`, fullPage: true });
      await page.waitForTimeout(1000);
    }

    // Test dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'visual-test-screenshots/dark-mode.png', fullPage: true });

    console.log('Visual testing completed!');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
}

quickVisualTest();