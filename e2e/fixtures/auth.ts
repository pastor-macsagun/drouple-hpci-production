import { test as base, expect } from '@playwright/test'

type AuthFixtures = {
  superAdminAuth: void
  churchAdminAuth: void
  vipAuth: void
  leaderAuth: void
  memberAuth: void
}

// Create a reusable test fixture with auth states
export const test = base.extend<AuthFixtures>({
  superAdminAuth: [async ({ page }, use) => {
    await loginAs(page, 'superadmin@test.com', 'Hpci!Test2025')
    await use()
  }, { scope: 'test' }],

  churchAdminAuth: [async ({ page }, use) => {
    await loginAs(page, 'admin.manila@test.com', 'Hpci!Test2025')
    await use()
  }, { scope: 'test' }],

  vipAuth: [async ({ page }, use) => {
    await loginAs(page, 'vip.manila@test.com', 'Hpci!Test2025')
    await use()
  }, { scope: 'test' }],

  leaderAuth: [async ({ page }, use) => {
    await loginAs(page, 'leader.manila@test.com', 'Hpci!Test2025')
    await use()
  }, { scope: 'test' }],

  memberAuth: [async ({ page }, use) => {
    await loginAs(page, 'member1@test.com', 'Hpci!Test2025')
    await use()
  }, { scope: 'test' }],
})

async function loginAs(page: any, email: string, password: string) {
  console.log(`Logging in as ${email}`)
  
  await page.goto('/auth/signin')
  await page.waitForLoadState('networkidle')
  
  // Fill credentials
  await page.fill('#email', email)
  await page.fill('#password', password)
  
  // Click sign in and wait for redirect
  await page.click('button[type="submit"]')
  
  // Wait for dashboard with multiple possible redirect patterns
  await page.waitForURL(/.*\/(dashboard|admin|super|vip|leader).*/, { timeout: 10000 })
  
  console.log(`Successfully logged in as ${email}`)
}

export { expect }