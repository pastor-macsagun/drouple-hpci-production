import { test, expect } from '@playwright/test'

const SUPER_ADMIN_CREDS = {
  email: 'super@test.com',
  password: 'Hpci!Test2025'
}

test.describe('SUPER_ADMIN Quick Validation', () => {

  test('Login and verify all SUPER_ADMIN functionality', async ({ page }) => {
    console.log('🚀 Starting quick SUPER_ADMIN validation...')

    // Login
    await page.goto('http://localhost:3000/auth/signin')
    await page.fill('#email', SUPER_ADMIN_CREDS.email)
    await page.fill('#password', SUPER_ADMIN_CREDS.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    console.log('✅ Login successful')

    // Test Super Dashboard
    await page.goto('http://localhost:3000/super')
    await expect(page.getByText('Super Admin Dashboard')).toBeVisible()
    await expect(page.getByTestId('oversight-kpis')).toBeVisible()
    console.log('✅ Super Dashboard loads with KPIs')

    // Test Churches page
    await page.goto('http://localhost:3000/super/churches')
    await expect(page.getByRole('heading', { name: 'Churches' })).toBeVisible()
    console.log('✅ Churches page accessible')

    // Test Church creation form
    await page.goto('http://localhost:3000/super/churches/new')
    await expect(page.getByTestId('create-church-form')).toBeVisible()
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#description')).toBeVisible()
    console.log('✅ Church creation form loads')

    // Test Local Churches page
    await page.goto('http://localhost:3000/super/local-churches')
    await expect(page.getByRole('heading', { name: 'Local Churches' })).toBeVisible()
    console.log('✅ Local Churches page accessible')

    // Test Local Church creation form
    await page.goto('http://localhost:3000/super/local-churches/new')
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#churchId')).toBeVisible()
    console.log('✅ Local Church creation form loads')

    // Test cross-tenant access
    await page.goto('http://localhost:3000/admin/members')
    await expect(page.getByRole('heading', { name: 'Member Management' })).toBeVisible()
    console.log('✅ Cross-tenant admin access works')

    // Test role bypass
    await page.goto('http://localhost:3000/vip/firsttimers')
    await expect(page.getByRole('heading', { name: 'First Timer Management' })).toBeVisible()
    console.log('✅ Role bypass works (VIP access)')

    console.log('🎉 All SUPER_ADMIN functionality validated!')
  })

  test('Create and manage a church end-to-end', async ({ page }) => {
    console.log('🏗️ Testing end-to-end church creation and management...')

    // Login
    await page.goto('http://localhost:3000/auth/signin')
    await page.fill('#email', SUPER_ADMIN_CREDS.email)
    await page.fill('#password', SUPER_ADMIN_CREDS.password)
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')

    // Create a test church
    const testChurchName = `E2E Test Church ${Date.now()}`
    
    await page.goto('http://localhost:3000/super/churches/new')
    await page.fill('#name', testChurchName)
    await page.fill('#description', 'End-to-end test church')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/super/churches')
    await expect(page.getByText(testChurchName)).toBeVisible()
    console.log(`✅ Church created: ${testChurchName}`)

    // Create a local church
    const testLocalChurchName = `E2E Local ${Date.now()}`
    
    await page.goto('http://localhost:3000/super/local-churches/new')
    await page.fill('#name', testLocalChurchName)
    await page.fill('#description', 'End-to-end test local church')
    await page.selectOption('#churchId', { label: testChurchName })
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/super/local-churches')
    await expect(page.getByText(testLocalChurchName)).toBeVisible()
    console.log(`✅ Local Church created: ${testLocalChurchName}`)

    // Test admin invitation
    const localChurchRow = page.locator(`text=${testLocalChurchName}`).locator('..')
    await localChurchRow.getByRole('button', { name: 'Manage' }).click()
    
    await expect(page.getByText('Admin Management')).toBeVisible()
    await expect(page.getByTestId('invite-admin-form')).toBeVisible()
    console.log('✅ Admin management interface accessible')

    // Cleanup
    await page.goto('http://localhost:3000/super/churches')
    const testChurchCard = page.locator(`text=${testChurchName}`).locator('..')
    await testChurchCard.getByRole('button', { name: 'Archive' }).click()
    await page.waitForLoadState('networkidle')
    
    console.log('✅ Test data cleaned up')
    console.log('🎉 End-to-end test completed successfully!')
  })
})