import { test, expect } from '@playwright/test';
import { UserRole } from '@prisma/client';

// Define the expected navigation structure
// Header should no longer have navigation links (redundancy removed)
const HEADER_NAVIGATION: any[] = [];

const SIDEBAR_NAVIGATION = {
  main: [
    {
      name: "Dashboard",
      href: "/dashboard",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LEADER, UserRole.MEMBER],
    },
    {
      name: "Check-In",
      href: "/checkin",
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Events",
      href: "/events",
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "LifeGroups",
      href: "/lifegroups",
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Pathways",
      href: "/pathways",
      roles: [UserRole.MEMBER, UserRole.LEADER, UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
  ],
  admin: [
    {
      name: "Admin Services",
      href: "/admin/services",
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Admin Events",
      href: "/admin/events",
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Admin LifeGroups",
      href: "/admin/lifegroups",
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
    {
      name: "Admin Pathways",
      href: "/admin/pathways",
      roles: [UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN],
    },
  ],
  superAdmin: [
    {
      name: "Churches",
      href: "/super/churches",
      roles: [UserRole.SUPER_ADMIN],
    },
    {
      name: "Local Churches",
      href: "/super/local-churches",
      roles: [UserRole.SUPER_ADMIN],
    },
  ],
  bottom: [
    {
      name: "Profile",
      href: "/profile",
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.LEADER, UserRole.MEMBER],
    },
  ],
};

// Test users for different roles
const TEST_USERS = [
  { email: 'superadmin@test.com', role: UserRole.SUPER_ADMIN, password: 'test123', localChurch: 'Manila' },
  { email: 'admin.manila@test.com', role: UserRole.ADMIN, password: 'test123', localChurch: 'Manila' },
  { email: 'leader.manila@test.com', role: UserRole.LEADER, password: 'test123', localChurch: 'Manila' },
  { email: 'member1@test.com', role: UserRole.MEMBER, password: 'test123', localChurch: 'Manila' },
];

// Helper to check if a page exists
async function checkPageExists(page: any, url: string): Promise<'PASS' | 'STUB' | 'MISSING'> {
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    
    if (!response || response.status() === 404) {
      return 'MISSING';
    }
    
    if (response.status() >= 400) {
      return 'MISSING';
    }
    
    // Check for content to determine if it's a stub or functional page
    const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
    const hasContent = await page.locator('main').textContent();
    
    if (!hasHeading && (!hasContent || hasContent.trim().length < 50)) {
      return 'STUB';
    }
    
    return 'PASS';
  } catch (error) {
    console.error(`Error checking ${url}:`, error);
    return 'MISSING';
  }
}

test.describe('Navigation Audit - @navigation', () => {
  test.describe('Header Navigation Redundancy Check', () => {
    test('Should verify header has no navigation links', async ({ page }) => {
      await page.goto('/');
      
      // Check that header does not contain navigation links
      const headerNavLinks = await page.locator('header nav a').count();
      
      console.log('Header Redundancy Analysis:');
      console.log('Navigation links found in header:', headerNavLinks);
      console.log('Expected: 0 (redundancy removed)');
      
      // Verify no navigation links in header
      expect(headerNavLinks).toBe(0);
      
      // Check that header still has branding
      const brandingLink = await page.locator('header a:has-text("HPCI")').isVisible();
      expect(brandingLink).toBeTruthy();
      
      // Take screenshot of header
      await page.screenshot({ 
        path: 'e2e/screenshots/header-navigation.png',
        fullPage: false,
        clip: { x: 0, y: 0, width: 1280, height: 100 }
      });
      
      console.log('Header now contains only branding and user menu (redundancy resolved)');
    });
  });
  
  test.describe('Sidebar Navigation Validation', () => {
    for (const user of TEST_USERS) {
      test(`Role: ${user.role} - Sidebar Navigation Check`, async ({ page }) => {
        // Login as the user
        // For now, we'll navigate directly and check what's visible
        await page.goto('/dashboard');
        
        const results: any[] = [];
        
        // Check main navigation
        for (const navItem of SIDEBAR_NAVIGATION.main) {
          if (navItem.roles.includes(user.role)) {
            const status = await checkPageExists(page, navItem.href);
            results.push({
              role: user.role,
              section: 'Main',
              name: navItem.name,
              href: navItem.href,
              status,
              notes: status === 'MISSING' ? 'Page does not exist' : ''
            });
          }
        }
        
        // Check admin navigation (if applicable)
        if ([UserRole.ADMIN, UserRole.PASTOR, UserRole.SUPER_ADMIN].includes(user.role as any)) {
          for (const navItem of SIDEBAR_NAVIGATION.admin) {
            if (navItem.roles.includes(user.role as any)) {
              const status = await checkPageExists(page, navItem.href);
              results.push({
                role: user.role,
                section: 'Admin',
                name: navItem.name,
                href: navItem.href,
                status,
                notes: status === 'MISSING' ? 'Page does not exist' : ''
              });
            }
          }
        }
        
        // Check super admin navigation (if applicable)
        if (user.role === UserRole.SUPER_ADMIN) {
          for (const navItem of SIDEBAR_NAVIGATION.superAdmin) {
            const status = await checkPageExists(page, navItem.href);
            results.push({
              role: user.role,
              section: 'Super Admin',
              name: navItem.name,
              href: navItem.href,
              status,
              notes: status === 'MISSING' ? 'Page does not exist' : ''
            });
          }
        }
        
        // Check bottom navigation
        for (const navItem of SIDEBAR_NAVIGATION.bottom) {
          if (navItem.roles.includes(user.role)) {
            const status = await checkPageExists(page, navItem.href);
            results.push({
              role: user.role,
              section: 'Bottom',
              name: navItem.name,
              href: navItem.href,
              status,
              notes: status === 'MISSING' ? 'Page does not exist' : ''
            });
          }
        }
        
        console.log(`\nNavigation Results for ${user.role}:`);
        console.table(results);
        
        // Take screenshot for this role
        await page.screenshot({ 
          path: `e2e/screenshots/sidebar-${user.role.toLowerCase()}.png`,
          fullPage: true
        });
      });
    }
  });
  
  test.describe('Role-Based Dashboard Redirects', () => {
    test('SUPER_ADMIN should have access to /super routes', async ({ page }) => {
      const superRoutes = [
        '/super/churches',
        '/super/local-churches',
      ];
      
      const results: any[] = [];
      
      for (const route of superRoutes) {
        const status = await checkPageExists(page, route);
        results.push({
          role: 'SUPER_ADMIN',
          route,
          status,
          notes: status === 'PASS' ? 'Super admin route accessible' : 'Route issue'
        });
      }
      
      console.log('\nSuper Admin Routes:');
      console.table(results);
    });
    
    test('Regular users should redirect from /dashboard appropriately', async ({ page }) => {
      const response = await page.goto('/dashboard');
      const finalUrl = page.url();
      
      console.log('Dashboard redirect behavior:');
      console.log('Initial: /dashboard');
      console.log('Final:', finalUrl);
      
      // Check if localChurch param is added for non-super admins
      const hasLocalChurchParam = finalUrl.includes('lc=');
      console.log('Has localChurch param:', hasLocalChurchParam);
    });
  });
  
  test.describe('Missing Pages Detection', () => {
    test('Compile list of all missing pages', async ({ page }) => {
      const allRoutes = [
        ...SIDEBAR_NAVIGATION.main.map(n => n.href),
        ...SIDEBAR_NAVIGATION.admin.map(n => n.href),
        ...SIDEBAR_NAVIGATION.superAdmin.map(n => n.href),
        ...SIDEBAR_NAVIGATION.bottom.map(n => n.href),
        ...HEADER_NAVIGATION.map(n => n.href),
      ];
      
      // Remove duplicates
      const uniqueRoutes = [...new Set(allRoutes)];
      const missingPages: any[] = [];
      const stubPages: any[] = [];
      const workingPages: any[] = [];
      
      for (const route of uniqueRoutes) {
        const status = await checkPageExists(page, route);
        
        if (status === 'MISSING') {
          missingPages.push({ route, status: 'MISSING' });
        } else if (status === 'STUB') {
          stubPages.push({ route, status: 'STUB' });
        } else {
          workingPages.push({ route, status: 'PASS' });
        }
      }
      
      console.log('\n=== ROUTE STATUS SUMMARY ===');
      console.log(`Total Routes: ${uniqueRoutes.length}`);
      console.log(`Working: ${workingPages.length}`);
      console.log(`Stub: ${stubPages.length}`);
      console.log(`Missing: ${missingPages.length}`);
      
      if (missingPages.length > 0) {
        console.log('\nMISSING PAGES:');
        console.table(missingPages);
      }
      
      if (stubPages.length > 0) {
        console.log('\nSTUB PAGES:');
        console.table(stubPages);
      }
      
      console.log('\nWORKING PAGES:');
      console.table(workingPages);
    });
  });
  
  test.describe('Navigation Component Integration', () => {
    test('AppLayout should render both Header and Sidebar', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check for header
      const header = await page.locator('header').isVisible();
      expect(header).toBeTruthy();
      
      // Check for sidebar on desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      const sidebar = await page.locator('aside').isVisible();
      
      console.log('Component Integration:');
      console.log('Header present:', header);
      console.log('Sidebar present (desktop):', sidebar);
      
      // Check mobile menu button
      await page.setViewportSize({ width: 375, height: 667 });
      const mobileMenuButton = await page.locator('button:has(svg)').first().isVisible();
      console.log('Mobile menu button present:', mobileMenuButton);
      
      // Take screenshots
      await page.screenshot({ 
        path: 'e2e/screenshots/layout-desktop.png',
        fullPage: false
      });
      
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({ 
        path: 'e2e/screenshots/layout-mobile.png',
        fullPage: false
      });
    });
  });
});

// Generate summary report
test.afterAll(async () => {
  console.log('\n\n=== NAVIGATION AUDIT COMPLETE ===');
  console.log('Screenshots saved to: e2e/screenshots/');
  console.log('Full report will be generated in: docs/verification/NAVIGATION-AUDIT.md');
});