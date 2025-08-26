import { test as base, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

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
    await authenticateAs(page, 'superadmin@test.com', 'user_superadmin')
    await use()
  }, { scope: 'test' }],

  churchAdminAuth: [async ({ page }, use) => {
    await authenticateAs(page, 'admin.manila@test.com', 'user_admin_manila')
    await use()
  }, { scope: 'test' }],

  vipAuth: [async ({ page }, use) => {
    await authenticateAs(page, 'vip.manila@test.com', 'user_vip_manila')
    await use()
  }, { scope: 'test' }],

  leaderAuth: [async ({ page }, use) => {
    await authenticateAs(page, 'leader.manila@test.com', 'user_leader_manila')
    await use()
  }, { scope: 'test' }],

  memberAuth: [async ({ page }, use) => {
    await authenticateAs(page, 'member1@test.com', 'user_member_1')
    await use()
  }, { scope: 'test' }],
})

async function authenticateAs(page: any, email: string, userId: string) {
  // Create a session directly in the database
  const sessionToken = crypto.randomUUID()
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  })

  // Set the session cookie
  await page.context().addCookies([{
    name: 'authjs.session-token',
    value: sessionToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    expires: expires.getTime() / 1000,
  }])
}

export { expect }