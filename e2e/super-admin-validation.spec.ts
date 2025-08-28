import { test, expect } from '@playwright/test'

// Test users from seed data
const testUsers = {
  superAdmin: { email: 'super@test.com', password: 'Hpci!Test2025' },
  adminManila: { email: 'admin.manila@test.com', password: 'Hpci!Test2025' },
  adminCebu: { email: 'admin.cebu@test.com', password: 'Hpci!Test2025' },
  member: { email: 'member1@test.com', password: 'Hpci!Test2025' }
}

test.describe('@super-admin SUPER_ADMIN Feature Validation', () => {

  test.beforeEach(async ({ page }) => {
    // Ensure fresh state
    await page.goto('/')
  })

  test.describe('Route Protection', () => {
    test('should block non-SUPER_ADMIN from /super routes', async ({ page }) => {
      // Login as regular admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.adminManila.email)
      await page.fill('#password', testUsers.adminManila.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/admin')

      // Try to access /super - should redirect to /dashboard
      await page.goto('/super')
      await page.waitForURL('**/dashboard')
      await expect(page.url()).toContain('/dashboard')

      // Try to access /super/churches - should redirect
      await page.goto('/super/churches')
      await page.waitForURL('**/dashboard')
      await expect(page.url()).toContain('/dashboard')

      // Try to access /super/local-churches - should redirect
      await page.goto('/super/local-churches')  
      await page.waitForURL('**/dashboard')
      await expect(page.url()).toContain('/dashboard')
    })

    test('should allow SUPER_ADMIN access to /super routes', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Access /super dashboard
      await page.goto('/super')
      await page.waitForLoadState('networkidle')
      await expect(page.getByTestId('oversight-kpis')).toBeVisible()
      await expect(page.getByText('Total Churches')).toBeVisible()
      await expect(page.getByText('Local Churches')).toBeVisible()
      await expect(page.getByText('Total Members')).toBeVisible()

      // Access churches management
      await page.goto('/super/churches')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Churches' })).toBeVisible()

      // Access local churches management  
      await page.goto('/super/local-churches')
      await page.waitForLoadState('networkidle')
      await expect(page.getByRole('heading', { name: 'Local Churches' })).toBeVisible()
    })

    test('should allow SUPER_ADMIN bypass for all role-restricted routes', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Should access admin routes
      await page.goto('/admin/members')
      await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()

      // Should access VIP routes  
      await page.goto('/vip/firsttimers')
      await expect(page.getByRole('heading', { name: 'First Timer Management' })).toBeVisible()

      // Should access regular user routes
      await page.goto('/events')
      await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible()
    })
  })

  test.describe('Church CRUD Operations', () => {
    test('should create, list, and archive churches', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Go to churches page
      await page.goto('/super/churches')
      await page.waitForLoadState('networkidle')

      // Create new church
      await page.getByRole('link', { name: 'Add Church' }).click()
      await page.waitForURL('**/super/churches/new')

      await page.getByTestId('create-church-form').waitFor()
      await page.fill('#name', 'Test Global Church')
      await page.fill('#description', 'A test church organization for validation')
      await page.getByRole('button', { name: 'Create Church' }).click()

      // Should redirect back to churches list
      await page.waitForURL('**/super/churches')
      await page.waitForLoadState('networkidle')

      // Verify church appears in list
      await page.getByTestId('church-list').waitFor()
      await expect(page.getByText('Test Global Church')).toBeVisible()
      await expect(page.getByText('A test church organization for validation')).toBeVisible()

      // Archive the church (cleanup)
      await page.getByRole('button', { name: 'Archive' }).first().click()
      await page.waitForLoadState('networkidle')
    })

    test('should validate church name requirements', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Go to create church page
      await page.goto('/super/churches/new')
      await page.waitForLoadState('networkidle')

      // Try to submit without name (required field validation)
      await page.getByTestId('create-church-form').waitFor()
      await page.fill('#description', 'Description without name')
      await page.getByRole('button', { name: 'Create Church' }).click()

      // Should remain on same page due to client-side validation
      await expect(page.url()).toContain('/super/churches/new')
    })
  })

  test.describe('Local Church Management', () => {
    test('should display local churches list', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Go to local churches page
      await page.goto('/super/local-churches')
      await page.waitForLoadState('networkidle')

      // Should see seeded local churches (from seed data)
      await expect(page.getByRole('heading', { name: 'Local Churches' })).toBeVisible()
      await expect(page.getByText('Manila')).toBeVisible()
      await expect(page.getByText('Cebu')).toBeVisible()
    })
  })

  test.describe('Admin Invitation Flow', () => {
    test('should display admin management interface', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Go to local churches page
      await page.goto('/super/local-churches')
      await page.waitForLoadState('networkidle')

      // Click manage button for Manila church (from seed data)
      await page.getByRole('button', { name: 'Manage' }).first().click()
      await page.waitForLoadState('networkidle')

      // Should see admin management interface
      await expect(page.getByRole('heading', { name: /Manila - Admin Management/ })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Current Administrators' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Invite New Administrator' })).toBeVisible()

      // Should see existing admins from seed data
      await page.getByTestId('local-church-admins').waitFor()
      await expect(page.getByText('admin.manila@test.com')).toBeVisible()
    })

    test('should show invite form with role restrictions', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Navigate to admin management
      await page.goto('/super/local-churches')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Manage' }).first().click()
      await page.waitForLoadState('networkidle')

      // Check invite form elements
      await page.getByTestId('invite-admin-form').waitFor()
      await expect(page.locator('#email')).toBeVisible()
      await expect(page.locator('#role')).toBeVisible()
      await expect(page.locator('#name')).toBeVisible()

      // Verify role options (should only be ADMIN and PASTOR)
      const roleSelect = page.locator('#role')
      const options = await roleSelect.locator('option').allTextContents()
      expect(options).toContain('Admin')
      expect(options).toContain('Pastor')
      expect(options).not.toContain('Member')
      expect(options).not.toContain('Leader')
    })

    test('should validate email requirements', async ({ page }) => {
      // Login as super admin  
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Navigate to admin management
      await page.goto('/super/local-churches')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: 'Manage' }).first().click()
      await page.waitForLoadState('networkidle')

      // Try to submit form without email
      await page.getByTestId('invite-admin-form').waitFor()
      await page.fill('#name', 'Test Admin')
      await page.selectOption('#role', 'ADMIN')
      await page.getByRole('button', { name: 'Send Invitation' }).click()

      // Should remain on same page due to validation
      await expect(page.url()).toContain('/admins')
    })
  })

  test.describe('Platform Oversight Dashboard', () => {
    test('should display platform-wide statistics', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Go to super dashboard
      await page.goto('/super')
      await page.waitForLoadState('networkidle')

      // Check KPI cards are present
      await page.getByTestId('oversight-kpis').waitFor()
      
      // Should show statistics with values > 0 (from seed data)
      const totalChurches = await page.getByText('Total Churches').locator('..').getByText(/\d+/).textContent()
      const localChurches = await page.getByText('Local Churches').locator('..').getByText(/\d+/).textContent()  
      const totalMembers = await page.getByText('Total Members').locator('..').getByText(/\d+/).textContent()
      const totalEvents = await page.getByText('Total Events').locator('..').getByText(/\d+/).textContent()

      expect(parseInt(totalChurches || '0')).toBeGreaterThan(0)
      expect(parseInt(localChurches || '0')).toBeGreaterThan(0)
      expect(parseInt(totalMembers || '0')).toBeGreaterThan(0)
      expect(parseInt(totalEvents || '0')).toBeGreaterThanOrEqual(0)
    })

    test('should provide quick action links', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Go to super dashboard
      await page.goto('/super')
      await page.waitForLoadState('networkidle')

      // Check quick action links
      await expect(page.getByRole('link', { name: 'Manage Churches' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Manage Local Churches' })).toBeVisible()

      // Test navigation
      await page.getByRole('link', { name: 'Manage Churches' }).click()
      await page.waitForURL('**/super/churches')
      await expect(page.getByRole('heading', { name: 'Churches' })).toBeVisible()
    })

    test('should show platform status indicators', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Go to super dashboard
      await page.goto('/super')
      await page.waitForLoadState('networkidle')

      // Check platform status section
      await expect(page.getByText('Platform Status')).toBeVisible()
      await expect(page.getByText('System Status')).toBeVisible()
      await expect(page.getByText('Operational')).toBeVisible()
      await expect(page.getByText('Database')).toBeVisible()
      await expect(page.getByText('Connected')).toBeVisible()
    })
  })

  test.describe('Tenant Isolation Verification', () => {
    test('should prevent cross-tenant data leakage for non-super users', async ({ page }) => {
      // Test with Manila admin - should not see Cebu data
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.adminManila.email)
      await page.fill('#password', testUsers.adminManila.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/admin')

      // Go to members page
      await page.goto('/admin/members')
      await page.waitForLoadState('networkidle')

      // Should only see Manila members, not Cebu
      // This test verifies tenant isolation is working
      await expect(page.getByText('Manila')).toBeVisible()
      await expect(page.getByText('Cebu')).not.toBeVisible()

      // Test with services
      await page.goto('/admin/services')
      await page.waitForLoadState('networkidle')
      
      // Should only see Manila services
      await expect(page.getByText('Manila')).toBeVisible()
      await expect(page.getByText('Cebu')).not.toBeVisible()
    })

    test('should allow SUPER_ADMIN to see cross-tenant data', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Go to members page - super admin should see all
      await page.goto('/admin/members')
      await page.waitForLoadState('networkidle')

      // Should see both Manila and Cebu members
      await expect(page.getByText('Manila')).toBeVisible()
      await expect(page.getByText('Cebu')).toBeVisible()

      // Test with services
      await page.goto('/admin/services') 
      await page.waitForLoadState('networkidle')

      // Should see both Manila and Cebu services
      await expect(page.getByText('Manila')).toBeVisible()
      await expect(page.getByText('Cebu')).toBeVisible()
    })
  })

  test.describe('Navigation and UI Elements', () => {
    test('should show super admin navigation in sidebar', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.superAdmin.email)
      await page.fill('#password', testUsers.superAdmin.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard')

      // Check sidebar contains super admin links
      await expect(page.getByRole('link', { name: 'Super Admin' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Churches' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Local Churches' })).toBeVisible()

      // Super admin should also see regular admin links
      await expect(page.getByRole('link', { name: 'Members' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Services' })).toBeVisible()
    })

    test('should NOT show super admin navigation for non-super users', async ({ page }) => {
      // Login as regular admin
      await page.goto('/auth/signin')
      await page.fill('#email', testUsers.adminManila.email)
      await page.fill('#password', testUsers.adminManila.password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/admin')

      // Should not see super admin navigation
      await expect(page.getByRole('link', { name: 'Super Admin' })).not.toBeVisible()
      await expect(page.getByRole('link', { name: 'Churches' })).not.toBeVisible()
      await expect(page.getByRole('link', { name: 'Local Churches' })).not.toBeVisible()

      // Should see regular admin links
      await expect(page.getByRole('link', { name: 'Members' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Services' })).toBeVisible()
    })
  })
})