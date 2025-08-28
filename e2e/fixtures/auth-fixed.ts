import { test as base, expect } from '@playwright/test'

type AuthFixtures = {
  superAdminAuth: void
  churchAdminAuth: void
  vipAuth: void
  leaderAuth: void
  memberAuth: void
}

// Create a reusable test fixture with reliable auth
export const test = base.extend<AuthFixtures>({
  superAdminAuth: [async ({ page }, use) => {
    await loginAs(page, 'superadmin@test.com', 'Hpci!Test2025', 'super admin', '/super')
    await use()
  }, { scope: 'test' }],

  churchAdminAuth: [async ({ page }, use) => {
    await loginAs(page, 'admin.manila@test.com', 'Hpci!Test2025', 'church admin', '/admin')
    await use()
  }, { scope: 'test' }],

  vipAuth: [async ({ page }, use) => {
    await loginAs(page, 'vip.manila@test.com', 'Hpci!Test2025', 'vip', '/vip')
    await use()
  }, { scope: 'test' }],

  leaderAuth: [async ({ page }, use) => {
    await loginAs(page, 'leader.manila@test.com', 'Hpci!Test2025', 'leader', '/leader')
    await use()
  }, { scope: 'test' }],

  memberAuth: [async ({ page }, use) => {
    await loginAs(page, 'member1@test.com', 'Hpci!Test2025', 'member', '/dashboard')
    await use()
  }, { scope: 'test' }],
})

async function loginAs(page: any, email: string, password: string, role: string, expectedPath: string) {
  console.log(`[AUTH] Logging in as ${role}: ${email}`)
  
  // Navigate to signin page
  await page.goto('/auth/signin', { waitUntil: 'domcontentloaded' })
  
  // Wait for form elements to be visible
  await page.waitForSelector('#email', { state: 'visible' })
  await page.waitForSelector('#password', { state: 'visible' })
  await page.waitForSelector('button[type="submit"]', { state: 'visible' })
  
  // Fill credentials
  await page.fill('#email', email)
  await page.fill('#password', password)
  
  console.log(`[AUTH] Filled credentials for ${email}`)
  
  // Submit form and wait for network activity
  const submitButton = page.locator('button[type="submit"]')
  await submitButton.click()
  
  console.log(`[AUTH] Clicked submit button for ${email}`)
  
  // Wait for authentication to complete by checking we're not on signin page anymore
  // The flow is: signin -> client redirect to / -> server redirect to role-specific page
  await page.waitForFunction(
    () => !window.location.pathname.includes('/auth/signin'),
    { timeout: 15000 }
  )
  
  console.log(`[AUTH] Successfully left signin page for ${email}`)
  
  // Wait for final destination (may need a bit more time for the server redirect)
  await page.waitForTimeout(2000) // Allow for server redirect to complete
  
  const finalUrl = page.url()
  const finalPath = new URL(finalUrl).pathname
  
  if (!finalPath.startsWith(expectedPath)) {
    throw new Error(`[AUTH] Expected ${role} to redirect to ${expectedPath}, but got ${finalPath}`)
  }
  
  console.log(`[AUTH] Successfully logged in ${role}: ${email} -> ${finalPath}`)
}

export { expect }
