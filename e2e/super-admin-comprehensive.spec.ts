import { test, expect } from '@playwright/test'

// Super admin credentials from seed data
const SUPER_ADMIN_CREDS = {
  email: 'super@test.com',
  password: 'Hpci!Test2025'
}

test.describe('SUPER_ADMIN Comprehensive Integration Test', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/')
  })

  test('Complete SUPER_ADMIN workflow: login → navigation → church creation → local church creation → admin invitation', async ({ page }) => {
    // Set longer timeout for comprehensive test
    test.setTimeout(300000) // 5 minutes
    
    console.log('🚀 Starting comprehensive SUPER_ADMIN integration test...')

    // ==========================================
    // STEP 1: LOGIN AS SUPER_ADMIN
    // ==========================================
    console.log('📋 STEP 1: Authenticating as SUPER_ADMIN')
    
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    // Fill login form
    await page.fill('#email', SUPER_ADMIN_CREDS.email)
    await page.fill('#password', SUPER_ADMIN_CREDS.password)
    await page.click('button[type="submit"]')
    
    // Verify successful login - should redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    console.log('✅ Successfully logged in as SUPER_ADMIN')

    // ==========================================
    // STEP 2: VERIFY SUPER_ADMIN NAVIGATION
    // ==========================================
    console.log('📋 STEP 2: Verifying SUPER_ADMIN navigation access')
    
    // Check super admin dashboard access
    await page.goto('/super')
    await page.waitForLoadState('networkidle')
    await expect(page.getByTestId('oversight-kpis')).toBeVisible({ timeout: 10000 })
    console.log('✅ Super dashboard accessible')
    
    // Verify KPI statistics are showing
    const kpiSection = page.getByTestId('oversight-kpis')
    await expect(kpiSection.getByText('Total Churches')).toBeVisible()
    await expect(kpiSection.getByText('Local Churches')).toBeVisible()
    await expect(kpiSection.getByText('Total Members')).toBeVisible()
    await expect(kpiSection.getByText('Total Events')).toBeVisible()
    console.log('✅ KPI statistics visible')
    
    // Test quick action navigation
    await page.getByRole('link', { name: 'Manage Churches' }).click()
    await page.waitForURL('**/super/churches')
    await expect(page.getByRole('heading', { name: 'Churches' })).toBeVisible()
    console.log('✅ Quick action navigation working')

    // ==========================================
    // STEP 3: CREATE NEW CHURCH
    // ==========================================
    console.log('📋 STEP 3: Creating new church organization')
    
    const testChurchName = `Test Church ${Date.now()}`
    const testChurchDesc = 'Integration test church created by automated testing'
    
    // Navigate to create church form
    await page.getByRole('link', { name: 'Add Church' }).click()
    await page.waitForURL('**/super/churches/new')
    
    // Fill and submit church creation form
    await page.getByTestId('create-church-form').waitFor()
    await page.fill('#name', testChurchName)
    await page.fill('#description', testChurchDesc)
    await page.getByRole('button', { name: 'Create Church' }).click()
    
    // Should redirect back to churches list
    await page.waitForURL('**/super/churches', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Verify church appears in list
    await page.getByTestId('church-list').waitFor()
    await expect(page.getByText(testChurchName)).toBeVisible()
    await expect(page.getByText(testChurchDesc)).toBeVisible()
    console.log(`✅ Church created: ${testChurchName}`)
    
    // Store church card for later reference
    const churchCard = page.locator(`[data-testid="church-list"] >> text=${testChurchName}`).locator('..')

    // ==========================================
    // STEP 4: CREATE LOCAL CHURCH
    // ==========================================
    console.log('📋 STEP 4: Creating local church branch')
    
    const testLocalChurchName = `Test Local ${Date.now()}`
    
    // Navigate to local churches management
    await page.goto('/super/local-churches')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Local Churches' })).toBeVisible()
    
    // Click create new local church
    await page.getByRole('link', { name: 'Add Local Church' }).click()
    await page.waitForURL('**/super/local-churches/new')
    
    // Fill local church form
    await page.fill('#name', testLocalChurchName)
    await page.fill('#description', 'Integration test local church branch')
    
    // Select the church we just created
    await page.selectOption('#churchId', { label: testChurchName })
    
    await page.getByRole('button', { name: 'Create Local Church' }).click()
    
    // Should redirect back to local churches list
    await page.waitForURL('**/super/local-churches', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Verify local church appears in list
    await expect(page.getByText(testLocalChurchName)).toBeVisible()
    console.log(`✅ Local church created: ${testLocalChurchName}`)

    // ==========================================
    // STEP 5: INVITE ADMIN TO LOCAL CHURCH
    // ==========================================
    console.log('📋 STEP 5: Inviting admin to local church')
    
    const testAdminEmail = `test.admin.${Date.now()}@integration.test`
    const testAdminName = 'Integration Test Admin'
    
    // Find the manage button for our test local church
    const localChurchRow = page.locator(`text=${testLocalChurchName}`).locator('..')
    await localChurchRow.getByRole('button', { name: 'Manage' }).click()
    
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: new RegExp(`${testLocalChurchName} - Admin Management`) })).toBeVisible()
    
    // Fill invitation form
    await page.getByTestId('invite-admin-form').waitFor()
    await page.fill('#email', testAdminEmail)
    await page.fill('#name', testAdminName)
    await page.selectOption('#role', 'ADMIN')
    
    await page.getByRole('button', { name: 'Send Invitation' }).click()
    await page.waitForLoadState('networkidle')
    
    // Verify admin appears in the administrators list
    await page.getByTestId('local-church-admins').waitFor()
    await expect(page.getByText(testAdminEmail)).toBeVisible()
    await expect(page.getByText(testAdminName)).toBeVisible()
    console.log(`✅ Admin invited: ${testAdminEmail}`)

    // ==========================================
    // STEP 6: VERIFY DATABASE PERSISTENCE
    // ==========================================
    console.log('📋 STEP 6: Verifying data persistence across navigation')
    
    // Navigate away and back to verify data persists
    await page.goto('/super')
    await page.waitForLoadState('networkidle')
    
    // Go back to churches list
    await page.goto('/super/churches')
    await page.waitForLoadState('networkidle')
    
    // Verify our church still exists
    await expect(page.getByText(testChurchName)).toBeVisible()
    console.log('✅ Church data persisted after navigation')
    
    // Go to local churches
    await page.goto('/super/local-churches')
    await page.waitForLoadState('networkidle')
    
    // Verify our local church still exists
    await expect(page.getByText(testLocalChurchName)).toBeVisible()
    console.log('✅ Local church data persisted after navigation')

    // ==========================================
    // STEP 7: TEST CROSS-TENANT ACCESS
    // ==========================================
    console.log('📋 STEP 7: Verifying SUPER_ADMIN cross-tenant access')
    
    // Navigate to admin pages that would be tenant-restricted for regular admins
    await page.goto('/admin/members')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()
    
    // Should see members from multiple churches (Manila, Cebu, and our test church)
    await expect(page.getByText('Manila')).toBeVisible()
    await expect(page.getByText('Cebu')).toBeVisible()
    console.log('✅ Cross-tenant access verified in Members page')
    
    await page.goto('/admin/services')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Service Management' })).toBeVisible()
    console.log('✅ Cross-tenant access verified in Services page')

    // ==========================================
    // STEP 8: TEST ROLE BYPASS FUNCTIONALITY
    // ==========================================
    console.log('📋 STEP 8: Testing role bypass functionality')
    
    // Test VIP route access (normally restricted)
    await page.goto('/vip/firsttimers')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'First Timer Management' })).toBeVisible()
    console.log('✅ VIP route accessible (role bypass working)')
    
    // Test regular user routes
    await page.goto('/events')
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible()
    console.log('✅ Regular user routes accessible')

    // ==========================================
    // STEP 9: CLEANUP (OPTIONAL)
    // ==========================================
    console.log('📋 STEP 9: Cleaning up test data')
    
    // Navigate back to churches and archive our test church
    await page.goto('/super/churches')
    await page.waitForLoadState('networkidle')
    
    // Find and archive the test church we created
    const testChurchCard = page.locator(`text=${testChurchName}`).locator('..')
    await testChurchCard.getByRole('button', { name: 'Archive' }).click()
    await page.waitForLoadState('networkidle')
    
    // Verify church is no longer in the list
    await expect(page.getByText(testChurchName)).not.toBeVisible()
    console.log('✅ Test church archived (cleanup completed)')

    // ==========================================
    // FINAL SUCCESS MESSAGE
    // ==========================================
    console.log('🎉 COMPREHENSIVE INTEGRATION TEST COMPLETED SUCCESSFULLY!')
    console.log('All SUPER_ADMIN functionality verified:')
    console.log('  ✅ Authentication and login')
    console.log('  ✅ Navigation and route access')
    console.log('  ✅ Church creation and CRUD')
    console.log('  ✅ Local church creation and management')
    console.log('  ✅ Admin invitation system')
    console.log('  ✅ Database persistence')
    console.log('  ✅ Cross-tenant access')
    console.log('  ✅ Role bypass functionality')
    console.log('  ✅ Data cleanup')
  })

  test('Quick navigation link verification', async ({ page }) => {
    // Quick test to verify all super admin links work
    test.setTimeout(60000)
    
    console.log('🔗 Testing all SUPER_ADMIN navigation links')
    
    // Login
    await page.goto('/auth/signin')
    await page.fill('#email', SUPER_ADMIN_CREDS.email)
    await page.fill('#password', SUPER_ADMIN_CREDS.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    // Test each major super admin route
    const routesToTest = [
      { path: '/super', expectedText: 'Super Admin Dashboard' },
      { path: '/super/churches', expectedText: 'Churches' },
      { path: '/super/churches/new', expectedText: 'Create Church' },
      { path: '/super/local-churches', expectedText: 'Local Churches' },
      { path: '/super/local-churches/new', expectedText: 'Create Local Church' },
    ]

    for (const route of routesToTest) {
      await page.goto(route.path)
      await page.waitForLoadState('networkidle')
      await expect(page.getByText(route.expectedText)).toBeVisible()
      console.log(`✅ ${route.path} - accessible and content verified`)
    }

    console.log('🎉 All navigation links verified!')
  })

  test('Database interaction verification', async ({ page }) => {
    // Test that ensures database operations are working
    test.setTimeout(120000)
    
    console.log('🗄️  Testing database interactions')
    
    // Login
    await page.goto('/auth/signin')
    await page.fill('#email', SUPER_ADMIN_CREDS.email)
    await page.fill('#password', SUPER_ADMIN_CREDS.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    // Go to super dashboard and capture initial stats
    await page.goto('/super')
    await page.waitForLoadState('networkidle')
    
    const kpiSection = page.getByTestId('oversight-kpis')
    
    // Extract current numbers
    const totalChurches = await kpiSection.locator('text=Total Churches').locator('..').locator('.text-2xl').textContent()
    const localChurches = await kpiSection.locator('text=Local Churches').locator('..').locator('.text-2xl').textContent()
    
    console.log(`📊 Current stats - Churches: ${totalChurches}, Local Churches: ${localChurches}`)
    
    // Create a test church
    const testName = `DB Test ${Date.now()}`
    await page.goto('/super/churches/new')
    await page.fill('#name', testName)
    await page.fill('#description', 'Database verification test')
    await page.getByRole('button', { name: 'Create Church' }).click()
    await page.waitForURL('**/super/churches')
    
    // Verify it appears in the list
    await expect(page.getByText(testName)).toBeVisible()
    console.log('✅ Church creation confirmed in UI')
    
    // Go back to dashboard and verify stats increased
    await page.goto('/super')
    await page.waitForLoadState('networkidle')
    
    const newTotalChurches = await kpiSection.locator('text=Total Churches').locator('..').locator('.text-2xl').textContent()
    
    // Verify the count increased
    expect(parseInt(newTotalChurches || '0')).toBeGreaterThan(parseInt(totalChurches || '0'))
    console.log(`✅ Database stats updated - New count: ${newTotalChurches}`)
    
    // Clean up
    await page.goto('/super/churches')
    await page.waitForLoadState('networkidle')
    const testChurchCard = page.locator(`text=${testName}`).locator('..')
    await testChurchCard.getByRole('button', { name: 'Archive' }).click()
    await page.waitForLoadState('networkidle')
    
    console.log('🎉 Database interaction test completed!')
  })
})