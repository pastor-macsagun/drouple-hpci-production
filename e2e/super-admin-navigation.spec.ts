import { test, expect } from './fixtures/auth'

test.describe('SUPER_ADMIN Navigation Verification @superadmin-nav', () => {
  const SUPER_ADMIN_EMAIL = 'superadmin@test.com'

  test('1. LOGIN FLOW: SUPER_ADMIN login and redirect', async ({ page, superAdminAuth }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/super')
    await expect(page.getByRole('heading', { name: /Super Admin Dashboard/i })).toBeVisible()
  })

  test('2. SIDEBAR NAVIGATION AUDIT: List all visible links', async ({ page, superAdminAuth }) => {
    await page.goto('/super')
    const sidebar = page.locator('aside')
    await expect(sidebar).toBeVisible()

    const sidebarLinks = []
    
    const memberSection = sidebar.getByText('Member').first()
    if (await memberSection.isVisible()) {
      const memberLinks = await sidebar.locator('a[href^="/"], a[href^="/events"], a[href^="/lifegroups"], a[href^="/pathways"], a[href^="/checkin"]').all()
      for (const link of memberLinks) {
        const text = await link.textContent()
        const href = await link.getAttribute('href')
        if (!href?.includes('/admin') && !href?.includes('/super')) {
          sidebarLinks.push({ section: 'Member', label: text?.trim(), href })
        }
      }
    }

    const adminSection = sidebar.getByText('Church Admin').first()
    if (await adminSection.isVisible()) {
      const adminLinks = await sidebar.locator('a[href^="/admin"]').all()
      for (const link of adminLinks) {
        const text = await link.textContent()
        const href = await link.getAttribute('href')
        sidebarLinks.push({ section: 'Church Admin', label: text?.trim(), href })
      }
    }

    const superSection = sidebar.getByText('Super Admin').first()
    if (await superSection.isVisible()) {
      const superLinks = await sidebar.locator('a[href^="/super"]').all()
      for (const link of superLinks) {
        const text = await link.textContent()
        const href = await link.getAttribute('href')
        if (href !== '/super') {
          sidebarLinks.push({ section: 'Super Admin', label: text?.trim(), href })
        }
      }
    }

    console.log('SIDEBAR LINKS FOUND:', JSON.stringify(sidebarLinks, null, 2))
    expect(sidebarLinks.length).toBeGreaterThan(0)
  })

  test('3. HEADER AUDIT: No redundant navigation links', async ({ page, superAdminAuth }) => {
    await page.goto('/super')
    const header = page.locator('header')
    await expect(header).toBeVisible()
    
    const navLinks = await header.locator('nav a').all()
    const redundantLinks = []
    
    for (const link of navLinks) {
      const href = await link.getAttribute('href')
      const text = await link.textContent()
      if (href && !href.includes('profile') && !href.includes('logout')) {
        redundantLinks.push({ text: text?.trim(), href })
      }
    }
    
    console.log('HEADER NAV LINKS:', redundantLinks)
    expect(redundantLinks.length).toBe(0)
  })

  test('4. FUNCTIONAL TESTS: All sidebar links', async ({ page, superAdminAuth }) => {
    const results = []
    
    const memberRoutes = [
      { label: 'Dashboard', href: '/' },
      { label: 'Events', href: '/events' },
      { label: 'LifeGroups', href: '/lifegroups' },
      { label: 'Pathways', href: '/pathways' },
      { label: 'Check-In', href: '/checkin' },
      { label: 'Profile', href: '/profile' }
    ]
    
    const adminRoutes = [
      { label: 'Admin Dashboard', href: '/admin' },
      { label: 'Services', href: '/admin/services' },
      { label: 'Members', href: '/admin/members' },
      { label: 'Life Groups', href: '/admin/lifegroups' },
      { label: 'Events', href: '/admin/events' },
      { label: 'Pathways', href: '/admin/pathways' }
    ]
    
    const superRoutes = [
      { label: 'Super Dashboard', href: '/super' },
      { label: 'Churches', href: '/super/churches' },
      { label: 'Local Churches', href: '/super/local-churches' }
    ]
    
    for (const route of [...memberRoutes, ...adminRoutes, ...superRoutes]) {
      await page.goto(route.href)
      await page.waitForLoadState('networkidle')
      
      const response = page.context().request
      let status = 'PASS'
      let notes = ''
      
      const heading = await page.getByRole('heading').first().textContent().catch(() => null)
      const pageTitle = await page.title()
      
      if (await page.locator('text=/not found/i').isVisible().catch(() => false)) {
        status = 'MISSING'
        notes = '404 page displayed'
      } else if (await page.locator('text=/under construction/i').isVisible().catch(() => false)) {
        status = 'STUB'
        notes = 'Placeholder page'
      } else if (heading) {
        notes = `Page heading: ${heading}`
      }
      
      results.push({
        label: route.label,
        href: route.href,
        status,
        notes,
        title: pageTitle
      })
      
      await page.screenshot({ 
        path: `test-results/screenshots/${route.label.replace(/\s+/g, '-').toLowerCase()}.png`,
        fullPage: true 
      })
    }
    
    console.log('FUNCTIONAL TEST RESULTS:', JSON.stringify(results, null, 2))
    
    const missingPages = results.filter(r => r.status === 'MISSING')
    expect(missingPages).toHaveLength(0)
  })

  test('5. REDIRECTS: Root and 404 behavior', async ({ page, superAdminAuth }) => {
    await page.goto('/')
    await page.waitForURL('**/super')
    await expect(page).toHaveURL('/super')
    console.log('ROOT REDIRECT: / → /super ✓')
    
    await page.goto('/non-existent-route-12345')
    await page.waitForLoadState('networkidle')
    
    const is404 = await page.locator('text=/404|not found/i').isVisible().catch(() => false)
    expect(is404).toBeTruthy()
    console.log('404 HANDLING: Invalid route shows 404 page ✓')
  })

  test('6. SUPER ADMIN SPECIFIC: Churches management', async ({ page, superAdminAuth }) => {
    await page.goto('/super/churches')
    await expect(page.getByRole('heading')).toBeVisible()
    
    // Check that page loaded (may be empty or have content)
    const pageContent = page.locator('main, [role="main"], body')
    await expect(pageContent).toBeVisible()
  })

  test('7. SUPER ADMIN SPECIFIC: Local Churches management', async ({ page, superAdminAuth }) => {
    await page.goto('/super/local-churches')
    await expect(page.getByRole('heading')).toBeVisible()
    
    // Check that page loaded (may be empty or have content)
    const pageContent = page.locator('main, [role="main"], body')
    await expect(pageContent).toBeVisible()
  })
})