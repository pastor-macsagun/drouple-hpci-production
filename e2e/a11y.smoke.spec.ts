import { test, expect } from './fixtures/auth';

const ROUTES_TO_TEST = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/auth/signin', name: 'Sign In', skipAuth: true },
  { path: '/register', name: 'Registration', skipAuth: true },
  { path: '/checkin', name: 'Check-in' },
  { path: '/lifegroups', name: 'LifeGroups' },
  { path: '/events', name: 'Events' },
];

for (const route of ROUTES_TO_TEST) {
  test(`${route.name}: accessibility smoke test`, async ({ page, memberAuth }) => {
    if (route.skipAuth) {
      await page.goto(route.path);
    } else {
      // memberAuth fixture is already applied
      await page.goto(route.path);
    }

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for main landmark
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check for icon-only buttons that should have aria-label

    // Check for tables and their accessibility
    const tables = page.locator('table');
    const tablesCount = await tables.count();
    
    if (tablesCount > 0) {
      for (let i = 0; i < tablesCount; i++) {
        const table = tables.nth(i);
        
        // Each table should have either caption or aria-label
        const caption = table.locator('caption');
        const ariaLabel = await table.getAttribute('aria-label');
        const hasCaption = await caption.count() > 0;
        
        expect(hasCaption || !!ariaLabel).toBeTruthy();
        
        // Check that header cells have scope attribute
        const headerCells = table.locator('th');
        const headerCellsCount = await headerCells.count();
        
        if (headerCellsCount > 0) {
          for (let j = 0; j < headerCellsCount; j++) {
            const th = headerCells.nth(j);
            const scope = await th.getAttribute('scope');
            expect(scope).toBeTruthy();
          }
        }
      }
    }

    // Check that there are no unlabeled icon-only buttons
    // Focus on buttons that likely need accessibility labels (have svg/icons but no text)
    const iconButtons = page.locator('button:has(svg), button[class*="icon"]').filter({
      hasNotText: /\w+/ // Exclude buttons that have meaningful text
    });
    const iconButtonsCount = await iconButtons.count();
    
    for (let i = 0; i < iconButtonsCount; i++) {
      const button = iconButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      const ariaLabelledBy = await button.getAttribute('aria-labelledby');
      const srOnlyText = await button.locator('.sr-only').textContent();
      
      // Button must have some form of accessible text
      const hasAccessibleText = ariaLabel || title || ariaLabelledBy || (srOnlyText && srOnlyText.trim());
      
      if (!hasAccessibleText) {
        console.log('Button without accessible text found:', await button.innerHTML());
      }
      expect(hasAccessibleText).toBeTruthy();
    }
  });
}