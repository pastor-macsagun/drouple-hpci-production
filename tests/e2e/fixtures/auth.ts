import { test as base } from '@playwright/test'

// Define fixtures for different user roles
export const test = base.extend({
  superAdminAuth: async ({ page }, use) => {
    // Set up super admin authentication
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-super-admin-token',
      domain: 'localhost',
      path: '/',
    }])
    await use(page)
  },
  
  churchAdminAuth: async ({ page }, use) => {
    // Set up church admin authentication
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-church-admin-token',
      domain: 'localhost',
      path: '/',
    }])
    await use(page)
  },
  
  leaderAuth: async ({ page }, use) => {
    // Set up leader authentication
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-leader-token',
      domain: 'localhost',
      path: '/',
    }])
    await use(page)
  },
  
  memberAuth: async ({ page }, use) => {
    // Set up member authentication
    await page.context().addCookies([{
      name: 'next-auth.session-token',
      value: 'mock-member-token',
      domain: 'localhost',
      path: '/',
    }])
    await use(page)
  },
})

export { expect } from '@playwright/test'