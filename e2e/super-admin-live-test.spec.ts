import { test, expect } from '@playwright/test'

// Super admin credentials from seed data
const SUPER_ADMIN_CREDS = {
  email: 'super@test.com',
  password: 'Hpci!Test2025'
}

test.describe('SUPER_ADMIN Live Integration Test', () => {

  test('Complete SUPER_ADMIN workflow validation', async ({ page }) => {
    // Set generous timeout for the comprehensive test
    test.setTimeout(180000) // 3 minutes
    
    console.log('🚀 Starting SUPER_ADMIN live integration test...')

    // ==========================================
    // STEP 1: LOGIN AS SUPER_ADMIN
    // ==========================================
    console.log('📋 STEP 1: Login as SUPER_ADMIN')
    
    await page.goto('http://localhost:3000/auth/signin')
    await page.waitForLoadState('networkidle')
    
    // Fill login form
    await page.fill('#email', SUPER_ADMIN_CREDS.email)
    await page.fill('#password', SUPER_ADMIN_CREDS.password)
    await page.click('button[type="submit"]')
    
    // Verify successful login
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    console.log('✅ Successfully logged in as SUPER_ADMIN')

    // ==========================================
    // STEP 2: VERIFY SUPER ADMIN DASHBOARD
    // ==========================================
    console.log('📋 STEP 2: Testing Super Admin Dashboard')
    
    await page.goto('http://localhost:3000/super')
    await page.waitForLoadState('networkidle')
    
    // Verify dashboard elements
    await expect(page.getByText('Super Admin Dashboard')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('oversight-kpis')).toBeVisible()
    
    // Check KPI cards are present and have values
    await expect(page.getByText('Total Churches')).toBeVisible()
    await expect(page.getByText('Local Churches')).toBeVisible()
    await expect(page.getByText('Total Members')).toBeVisible()
    
    console.log('✅ Super Admin Dashboard loaded with KPIs')

    // ==========================================
    // STEP 3: TEST CHURCHES MANAGEMENT
    // ==========================================
    console.log('📋 STEP 3: Testing Churches Management')
    
    // Navigate to churches via quick action
    await page.getByRole('link', { name: 'Manage Churches' }).click()
    await page.waitForURL('**/super/churches')
    await page.waitForLoadState('networkidle')
    
    await expect(page.getByRole('heading', { name: 'Churches' })).toBeVisible()
    console.log('✅ Churches page accessible')

    // Test church creation
    const testChurchName = `Live Test Church ${Date.now()}`
    await page.getByRole('link', { name: 'Add Church' }).click()
    await page.waitForURL('**/super/churches/new')
    
    // Fill church form
    await page.getByTestId('create-church-form').waitFor()
    await page.fill('#name', testChurchName)
    await page.fill('#description', 'Live integration test church')
    
    await page.getByRole('button', { name: 'Create Church' }).click()
    await page.waitForURL('**/super/churches', { timeout: 15000 })
    
    // Verify church was created and appears in list
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(testChurchName)).toBeVisible({ timeout: 10000 })
    console.log(`✅ Church created successfully: ${testChurchName}`)

    // ==========================================
    // STEP 4: TEST LOCAL CHURCHES MANAGEMENT
    // ==========================================
    console.log('📋 STEP 4: Testing Local Churches Management')
    
    await page.goto('http://localhost:3000/super/local-churches')
    await page.waitForLoadState('networkidle')
    
    await expect(page.getByRole('heading', { name: 'Local Churches' })).toBeVisible()
    
    // Verify existing local churches from seed data
    await expect(page.getByText('Manila')).toBeVisible()
    await expect(page.getByText('Cebu')).toBeVisible()
    console.log('✅ Local Churches page shows existing data')

    // Test local church creation
    const testLocalChurchName = `Live Test Local ${Date.now()}`
    
    await page.getByRole('link', { name: 'Add Local Church' }).click()
    await page.waitForURL('**/super/local-churches/new')
    
    // Fill local church form
    await page.fill('#name', testLocalChurchName)
    await page.fill('#description', 'Live test local church branch')
    
    // Select our newly created church
    await page.selectOption('#churchId', { label: testChurchName })
    
    await page.getByRole('button', { name: 'Create Local Church' }).click()
    await page.waitForURL('**/super/local-churches', { timeout: 15000 })
    
    // Verify local church was created
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(testLocalChurchName)).toBeVisible({ timeout: 10000 })
    console.log(`✅ Local Church created successfully: ${testLocalChurchName}`)

    // ==========================================
    // STEP 5: TEST ADMIN INVITATION SYSTEM
    // ==========================================
    console.log('📋 STEP 5: Testing Admin Invitation System')
    
    // Find and click manage for our test local church
    const localChurchRow = page.locator(`text=${testLocalChurchName}`).locator('..')
    await localChurchRow.getByRole('button', { name: 'Manage' }).click()
    
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Admin Management')).toBeVisible()
    
    // Test admin invitation form
    const testAdminEmail = `livetest.admin.${Date.now()}@test.local`
    const testAdminName = `Live Test Admin ${Date.now()}`
    
    await page.getByTestId('invite-admin-form').waitFor()
    await page.fill('#email', testAdminEmail)
    await page.fill('#name', testAdminName)
    await page.selectOption('#role', 'ADMIN')
    
    await page.getByRole('button', { name: 'Send Invitation' }).click()
    await page.waitForLoadState('networkidle')
    
    // Verify admin was added to the list
    await expect(page.getByText(testAdminEmail)).toBeVisible({ timeout: 10000 })
    console.log(`✅ Admin invitation sent and appears in list: ${testAdminEmail}`)

    // ==========================================
    // STEP 6: TEST CROSS-TENANT ACCESS
    // ==========================================
    console.log('📋 STEP 6: Testing Cross-Tenant Access')
    
    // Test that SUPER_ADMIN can access admin pages
    await page.goto('http://localhost:3000/admin/members')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()
    
    // Should see members from different churches (cross-tenant access)
    await expect(page.getByText('Manila')).toBeVisible()
    await expect(page.getByText('Cebu')).toBeVisible()
    console.log('✅ Cross-tenant access verified - can see multiple churches')

    // Test VIP access (role bypass)
    await page.goto('http://localhost:3000/vip/firsttimers')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'First Timer Management' })).toBeVisible()
    console.log('✅ Role bypass working - VIP route accessible')

    // ==========================================
    // STEP 7: VERIFY DATABASE PERSISTENCE
    // ==========================================
    console.log('📋 STEP 7: Verifying Database Persistence')
    
    // Navigate back to super dashboard and check stats updated
    await page.goto('http://localhost:3000/super')
    await page.waitForLoadState('networkidle')
    
    // The KPI numbers should reflect our additions
    const kpiSection = page.getByTestId('oversight-kpis')
    const churchCount = await kpiSection.locator('text=Total Churches').locator('..').locator('.text-2xl').textContent()
    const localChurchCount = await kpiSection.locator('text=Local Churches').locator('..').locator('.text-2xl').textContent()
    
    console.log(`📊 Current stats - Churches: ${churchCount}, Local Churches: ${localChurchCount}`)
    
    // Navigate away and back to verify persistence
    await page.goto('http://localhost:3000/dashboard')
    await page.waitForLoadState('networkidle')
    
    await page.goto('http://localhost:3000/super/churches')
    await page.waitForLoadState('networkidle')
    
    // Our test church should still be there
    await expect(page.getByText(testChurchName)).toBeVisible()
    console.log('✅ Data persistence verified - church still exists after navigation')

    // ==========================================
    // STEP 8: TEST NAVIGATION LINKS
    // ==========================================
    console.log('📋 STEP 8: Testing All Navigation Links')
    
    const navigationTests = [
      { path: '/super', expectedText: 'Super Admin Dashboard' },
      { path: '/super/churches', expectedText: 'Churches' },
      { path: '/super/local-churches', expectedText: 'Local Churches' },
      { path: '/admin/members', expectedText: 'Member Management' },
      { path: '/admin/services', expectedText: 'Service Management' },
      { path: '/events', expectedText: 'Events' }
    ]

    for (const nav of navigationTests) {
      await page.goto(`http://localhost:3000${nav.path}`)
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(nav.expectedText)).toBeVisible()
      console.log(`✅ Navigation verified: ${nav.path}`)
    }

    // ==========================================
    // STEP 9: CLEANUP TEST DATA
    // ==========================================
    console.log('📋 STEP 9: Cleaning up test data')
    
    // Archive the test church we created
    await page.goto('http://localhost:3000/super/churches')
    await page.waitForLoadState('networkidle')
    
    // Find our test church and archive it
    const testChurchCard = page.locator(`text=${testChurchName}`).locator('..')
    await testChurchCard.getByRole('button', { name: 'Archive' }).click()
    await page.waitForLoadState('networkidle')
    
    // Verify it's no longer visible
    await expect(page.getByText(testChurchName)).not.toBeVisible()
    console.log('✅ Test data cleaned up - church archived')

    // ==========================================
    // FINAL SUCCESS
    // ==========================================
    console.log('🎉 LIVE INTEGRATION TEST COMPLETED SUCCESSFULLY!')
    console.log('✅ All SUPER_ADMIN functionality verified:')
    console.log('  - Authentication and login')
    console.log('  - Super Admin Dashboard with KPIs') 
    console.log('  - Church creation and management')
    console.log('  - Local church creation and management')
    console.log('  - Admin invitation system')
    console.log('  - Cross-tenant data access')
    console.log('  - Role bypass functionality')
    console.log('  - Database persistence')
    console.log('  - Navigation and routing')
    console.log('  - Data cleanup')
  })

  test('Quick smoke test of all links', async ({ page }) => {
    console.log('🔗 Running quick smoke test of all SUPER_ADMIN links')
    
    // Login
    await page.goto('http://localhost:3000/auth/signin')
    await page.fill('#email', SUPER_ADMIN_CREDS.email)
    await page.fill('#password', SUPER_ADMIN_CREDS.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    // Test all main routes quickly
    const routes = [
      '/super',
      '/super/churches', 
      '/super/churches/new',
      '/super/local-churches',
      '/super/local-churches/new'
    ]

    for (const route of routes) {
      await page.goto(`http://localhost:3000${route}`)
      await page.waitForLoadState('networkidle')
      // Just verify page loads without error
      await expect(page.locator('body')).toBeVisible()
      console.log(`✅ ${route} loads successfully`)
    }

    console.log('🎉 Smoke test completed - all routes accessible!')
  })
})