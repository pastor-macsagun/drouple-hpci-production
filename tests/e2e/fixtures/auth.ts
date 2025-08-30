import { test as base } from '@playwright/test'

// Define fixtures for different user roles
export const test = base.extend({
  superAdminAuth: async ({ page }, use) => {
    // Use UI-based login for more reliable authentication
    await page.goto('/auth/signin')
    await page.waitForSelector('#email', { timeout: 10000 })
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(super|dashboard)/, { timeout: 15000 })
    await use(page)
  },
  
  churchAdminAuth: async ({ page }, use) => {
    await page.goto('/auth/signin')
    await page.waitForSelector('#email', { timeout: 10000 })
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 })
    await use(page)
  },
  
  vipAuth: async ({ page }, use) => {
    await page.goto('/auth/signin')
    await page.waitForSelector('#email', { timeout: 10000 })
    await page.fill('#email', 'vip.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(vip|dashboard)/, { timeout: 15000 })
    await use(page)
  },
  
  leaderAuth: async ({ page }, use) => {
    await page.goto('/auth/signin')
    await page.waitForSelector('#email', { timeout: 10000 })
    await page.fill('#email', 'leader.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(leader|dashboard)/, { timeout: 15000 })
    await use(page)
  },
  
  memberAuth: async ({ page }, use) => {
    await page.goto('/auth/signin')
    await page.waitForSelector('#email', { timeout: 10000 })
    await page.fill('#email', 'member1@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard', { timeout: 15000 })
    await use(page)
  },
})

export { expect } from '@playwright/test'