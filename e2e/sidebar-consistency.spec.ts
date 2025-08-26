import { test, expect } from './fixtures/auth'

// Define expected sidebar structure for each role
const SIDEBAR_STRUCTURE = {
  SUPER_ADMIN: {
    memberSection: ['Dashboard', 'Check-In', 'Events', 'LifeGroups', 'Pathways'],
    adminSection: ['Admin Services', 'Admin Events', 'Admin LifeGroups', 'Admin Pathways'],
    superAdminSection: ['Churches', 'Local Churches'],
    bottomSection: ['Profile']
  },
  ADMIN: {
    memberSection: ['Dashboard', 'Check-In', 'Events', 'LifeGroups', 'Pathways'],
    adminSection: ['Admin Services', 'Admin Events', 'Admin LifeGroups', 'Admin Pathways'],
    superAdminSection: [], // Should not see this
    bottomSection: ['Profile']
  },
  LEADER: {
    memberSection: ['Dashboard', 'Check-In', 'Events', 'LifeGroups', 'Pathways'],
    adminSection: [], // Should not see admin section
    superAdminSection: [], // Should not see this
    bottomSection: ['Profile']
  },
  MEMBER: {
    memberSection: ['Dashboard', 'Check-In', 'Events', 'LifeGroups', 'Pathways'],
    adminSection: [], // Should not see admin section
    superAdminSection: [], // Should not see this
    bottomSection: ['Profile']
  }
}

// Pages to test for sidebar consistency
const AUTHENTICATED_PAGES = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Check-In', path: '/checkin' },
  { name: 'Events', path: '/events' },
  { name: 'LifeGroups', path: '/lifegroups' },
  { name: 'Pathways', path: '/pathways' },
  { name: 'Profile', path: '/profile' },
]

const ADMIN_PAGES = [
  { name: 'Admin Services', path: '/admin/services' },
  { name: 'Admin Events', path: '/admin/events' },
  { name: 'Admin LifeGroups', path: '/admin/lifegroups' },
  { name: 'Admin Pathways', path: '/admin/pathways' },
]

const SUPER_ADMIN_PAGES = [
  { name: 'Super Admin Dashboard', path: '/super' },
  { name: 'Churches', path: '/super/churches' },
  { name: 'Local Churches', path: '/super/local-churches' },
]

test.describe('Sidebar Consistency Tests', () => {
  test.describe('SUPER_ADMIN Sidebar', () => {
    const allPages = [...AUTHENTICATED_PAGES, ...ADMIN_PAGES, ...SUPER_ADMIN_PAGES]
    
    for (const pageInfo of allPages) {
      test(`has consistent sidebar on ${pageInfo.name}`, async ({ page, superAdminAuth }) => {
        // Navigate to the page
        await page.goto(pageInfo.path)
        await page.waitForLoadState('domcontentloaded')
        
        // Check that sidebar exists
        const sidebar = page.locator('aside').first()
        await expect(sidebar).toBeVisible()
        
        // Check Member Section links
        for (const link of SIDEBAR_STRUCTURE.SUPER_ADMIN.memberSection) {
          const linkLocator = sidebar.locator(`a:has-text("${link}")`)
          await expect(linkLocator).toBeVisible({ timeout: 5000 })
        }
        
        // Check Admin Section
        const adminSectionTitle = sidebar.locator('text=/Administration/i')
        await expect(adminSectionTitle).toBeVisible()
        
        for (const link of SIDEBAR_STRUCTURE.SUPER_ADMIN.adminSection) {
          const linkLocator = sidebar.locator(`a:has-text("${link}")`)
          await expect(linkLocator).toBeVisible()
        }
        
        // Check Super Admin Section
        const superAdminSectionTitle = sidebar.locator('text=/Super Admin/i')
        await expect(superAdminSectionTitle).toBeVisible()
        
        for (const link of SIDEBAR_STRUCTURE.SUPER_ADMIN.superAdminSection) {
          const linkLocator = sidebar.locator(`a:has-text("${link}")`)
          await expect(linkLocator).toBeVisible()
        }
        
        // Check Bottom Section
        for (const link of SIDEBAR_STRUCTURE.SUPER_ADMIN.bottomSection) {
          const linkLocator = sidebar.locator(`a:has-text("${link}")`)
          await expect(linkLocator).toBeVisible()
        }
        
        // Check Sign Out button
        const signOutButton = sidebar.locator('button:has-text("Sign Out")')
        await expect(signOutButton).toBeVisible()
      })
    }
    
    test('all sidebar links work without 404s', async ({ page, superAdminAuth }) => {
      await page.goto('/dashboard')
      
      const sidebar = page.locator('aside').first()
      
      // Test each link
      const links = [
        { text: 'Dashboard', expectedUrl: '/dashboard' },
        { text: 'Check-In', expectedUrl: '/checkin' },
        { text: 'Events', expectedUrl: '/events' },
        { text: 'LifeGroups', expectedUrl: '/lifegroups' },
        { text: 'Pathways', expectedUrl: '/pathways' },
        { text: 'Admin Services', expectedUrl: '/admin/services' },
        { text: 'Admin Events', expectedUrl: '/admin/events' },
        { text: 'Admin LifeGroups', expectedUrl: '/admin/lifegroups' },
        { text: 'Admin Pathways', expectedUrl: '/admin/pathways' },
        { text: 'Churches', expectedUrl: '/super/churches' },
        { text: 'Local Churches', expectedUrl: '/super/local-churches' },
        { text: 'Profile', expectedUrl: '/profile' },
      ]
      
      for (const link of links) {
        // Click the link
        await sidebar.locator(`a:has-text("${link.text}")`).click()
        
        // Wait for navigation
        await page.waitForLoadState('domcontentloaded')
        
        // Check we're on the right page
        expect(page.url()).toContain(link.expectedUrl)
        
        // Check no 404 error
        await expect(page.locator('text=/404/i')).not.toBeVisible()
        await expect(page.locator('text=/not found/i')).not.toBeVisible()
        
        // Sidebar should still be visible
        await expect(sidebar).toBeVisible()
      }
    })
  })
  
  test.describe('Role-based Sidebar Visibility', () => {
    test('CHURCH_ADMIN sees correct sections', async ({ page, churchAdminAuth }) => {
      await page.goto('/dashboard')
      
      const sidebar = page.locator('aside').first()
      await expect(sidebar).toBeVisible()
      
      // Should see member section
      await expect(sidebar.locator('a:has-text("Dashboard")')).toBeVisible()
      
      // Should see admin section
      await expect(sidebar.locator('text=/Administration/i')).toBeVisible()
      await expect(sidebar.locator('a:has-text("Admin Services")')).toBeVisible()
      
      // Should NOT see super admin section
      await expect(sidebar.locator('text=/Super Admin/i')).not.toBeVisible()
      await expect(sidebar.locator('a:has-text("Churches")')).not.toBeVisible()
    })
    
    test('LEADER sees correct sections', async ({ page, leaderAuth }) => {
      await page.goto('/dashboard')
      
      const sidebar = page.locator('aside').first()
      await expect(sidebar).toBeVisible()
      
      // Should see member section
      await expect(sidebar.locator('a:has-text("Dashboard")')).toBeVisible()
      await expect(sidebar.locator('a:has-text("Events")')).toBeVisible()
      
      // Should NOT see admin section
      await expect(sidebar.locator('text=/Administration/i')).not.toBeVisible()
      await expect(sidebar.locator('a:has-text("Admin Services")')).not.toBeVisible()
      
      // Should NOT see super admin section
      await expect(sidebar.locator('text=/Super Admin/i')).not.toBeVisible()
    })
    
    test('MEMBER sees correct sections', async ({ page, memberAuth }) => {
      await page.goto('/dashboard')
      
      const sidebar = page.locator('aside').first()
      await expect(sidebar).toBeVisible()
      
      // Should see member section
      await expect(sidebar.locator('a:has-text("Dashboard")')).toBeVisible()
      await expect(sidebar.locator('a:has-text("Check-In")')).toBeVisible()
      
      // Should NOT see admin section
      await expect(sidebar.locator('text=/Administration/i')).not.toBeVisible()
      
      // Should NOT see super admin section
      await expect(sidebar.locator('text=/Super Admin/i')).not.toBeVisible()
    })
  })
})