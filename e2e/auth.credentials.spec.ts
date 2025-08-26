import { test, expect } from '@playwright/test'

// Default test password for all seeded users
const DEFAULT_PASSWORD = 'Hpci!Test2025'

test.describe('Credentials Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signin')
  })

  test('should display email and password login form', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('nonexistent@test.com')
    await page.getByLabel('Password').fill('WrongPassword123!')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Invalid email or password')).toBeVisible()
  })

  test('should login super admin and redirect to /super', async ({ page }) => {
    await page.getByLabel('Email').fill('superadmin@test.com')
    await page.getByLabel('Password').fill(DEFAULT_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()

    await page.waitForURL('**/super')
    expect(page.url()).toContain('/super')
  })

  test('should login church admin and redirect to dashboard with local church', async ({ page }) => {
    await page.getByLabel('Email').fill('admin.manila@test.com')
    await page.getByLabel('Password').fill(DEFAULT_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()

    await page.waitForURL('**/dashboard?lc=*')
    expect(page.url()).toContain('/dashboard')
    expect(page.url()).toContain('lc=')
  })

  test('should login leader and redirect to dashboard with local church', async ({ page }) => {
    await page.getByLabel('Email').fill('leader.manila@test.com')
    await page.getByLabel('Password').fill(DEFAULT_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()

    await page.waitForURL('**/dashboard?lc=*')
    expect(page.url()).toContain('/dashboard')
    expect(page.url()).toContain('lc=')
  })

  test('should login member and redirect to dashboard', async ({ page }) => {
    await page.getByLabel('Email').fill('member1@test.com')
    await page.getByLabel('Password').fill(DEFAULT_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()

    await page.waitForURL('**/dashboard*')
    expect(page.url()).toContain('/dashboard')
  })

  test('should show error after multiple failed attempts', async ({ page }) => {
    // Attempt to login with wrong password 6 times
    for (let i = 0; i < 6; i++) {
      await page.getByLabel('Email').fill('test@example.com')
      await page.getByLabel('Password').fill('WrongPassword123!')
      await page.getByRole('button', { name: 'Sign In' }).click()
      
      if (i < 5) {
        // Clear the form for the next attempt
        await page.getByLabel('Email').clear()
        await page.getByLabel('Password').clear()
      }
    }

    // After 6th attempt, should show rate limit error
    await expect(page.getByText(/too many login attempts/i)).toBeVisible()
  })
})

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('should display registration form with password fields', async ({ page }) => {
    await expect(page.getByLabel('Email Address *')).toBeVisible()
    await expect(page.getByLabel('Full Name *')).toBeVisible()
    await expect(page.getByLabel('Password *')).toBeVisible()
    await expect(page.getByLabel('Confirm Password *')).toBeVisible()
    await expect(page.getByText('Select Your Local Church')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
  })

  test('should show password requirements', async ({ page }) => {
    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
  })

  test('should validate password requirements', async ({ page }) => {
    const timestamp = Date.now()
    const email = `newuser${timestamp}@test.com`
    
    await page.getByLabel('Email Address *').fill(email)
    await page.getByLabel('Full Name *').fill('Test User')
    await page.getByLabel('Password *').fill('weak') // Too short
    await page.getByLabel('Confirm Password *').fill('weak')
    
    // Select a church
    await page.selectOption('select[name="localChurchId"]', { index: 1 })
    
    await page.getByRole('button', { name: 'Register' }).click()
    
    // Should show validation error (exact message depends on implementation)
    await expect(page).toHaveURL(/error=validation|error=invalid_data/)
  })

  test('should successfully register with valid password', async ({ page }) => {
    const timestamp = Date.now()
    const email = `newuser${timestamp}@test.com`
    const password = 'ValidPass123!'
    
    await page.getByLabel('Email Address *').fill(email)
    await page.getByLabel('Full Name *').fill('Test User')
    await page.getByLabel('Password *').fill(password)
    await page.getByLabel('Confirm Password *').fill(password)
    
    // Select a church
    await page.selectOption('select[name="localChurchId"]', { index: 1 })
    
    await page.getByRole('button', { name: 'Register' }).click()
    
    // Should redirect to signin with success message
    await page.waitForURL('**/auth/signin?registered=true')
    await expect(page.getByText(/registration successful/i)).toBeVisible()
  })
})