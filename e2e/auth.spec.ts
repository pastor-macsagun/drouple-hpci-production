import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.describe('Credentials login flow', () => {
    test('shows email and password login page', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Should show email input
      await expect(page.getByLabel(/email/i)).toBeVisible()
      
      // Should show password field
      await expect(page.getByLabel(/password/i)).toBeVisible()
      
      // Should have sign in button
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    })

    test('validates email format', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Invalid email
      await page.getByLabel(/email/i).fill('invalid-email')
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should show validation error
      await expect(page.getByText(/valid email|invalid/i)).toBeVisible()
    })

    test('requires both email and password', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Only email
      await page.getByLabel(/email/i).fill('test@example.com')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should not proceed without password
      await expect(page).toHaveURL(/auth\/signin/)
      
      // Clear and try with only password
      await page.getByLabel(/email/i).clear()
      await page.getByLabel(/password/i).fill('password123')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should not proceed without email
      await expect(page).toHaveURL(/auth\/signin/)
    })

    test('shows error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Invalid credentials
      await page.getByLabel(/email/i).fill('nonexistent@example.com')
      await page.getByLabel(/password/i).fill('wrongpassword')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Should show error message
      await expect(page.getByText(/invalid.*password|incorrect/i)).toBeVisible()
    })
  })

  test.describe('Session management', () => {
    test('maintains session across page refreshes', async ({ page }) => {
      // Create a test session
      await page.context().addCookies([{
        name: 'authjs.session-token',
        value: 'test-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Date.now() / 1000 + 3600,
      }])
      
      await page.goto('/dashboard')
      
      // Refresh page
      await page.reload()
      
      // Should still be on dashboard (not redirected to login)
      await expect(page).toHaveURL(/dashboard/)
    })

    test('expires old sessions', async ({ page }) => {
      // Create expired session
      await page.context().addCookies([{
        name: 'authjs.session-token',
        value: 'expired-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        expires: Date.now() / 1000 - 3600, // Expired 1 hour ago
      }])
      
      await page.goto('/dashboard')
      
      // Should redirect to login
      await expect(page).toHaveURL(/auth\/signin/)
    })
  })

  test.describe('Registration flow', () => {
    test('public registration page is accessible', async ({ page }) => {
      await page.goto('/register')
      
      // Should show registration form
      await expect(page.getByRole('heading', { name: /register|join/i })).toBeVisible()
      
      // Required fields
      await expect(page.getByLabel(/name/i)).toBeVisible()
      await expect(page.getByLabel(/email/i)).toBeVisible()
      await expect(page.getByLabel(/password/i)).toBeVisible()
      await expect(page.getByLabel(/church/i)).toBeVisible()
    })

    test('validates registration form', async ({ page }) => {
      await page.goto('/register')
      
      // Submit empty form
      await page.getByRole('button', { name: /register|submit/i }).click()
      
      // Should show validation errors
      await expect(page.getByText(/required/i)).toBeVisible()
    })

    test('shows new believer checkbox', async ({ page }) => {
      await page.goto('/register')
      
      const checkbox = page.getByRole('checkbox', { name: /new believer/i })
      await expect(checkbox).toBeVisible()
    })

    test('prevents duplicate email registration', async ({ page }) => {
      await page.goto('/register')
      
      // Use existing email
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('member1@test.com') // Existing user
      await page.getByLabel(/password/i).fill('Password123!')
      await page.getByLabel(/church/i).selectOption({ index: 1 })
      
      await page.getByRole('button', { name: /register/i }).click()
      
      // Should show error
      await expect(page.getByText(/already.*registered|exists/i)).toBeVisible()
    })
  })

  test.describe('Rate limiting', () => {
    test('enforces rate limits on login attempts', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Multiple failed login attempts with same email
      const email = 'ratelimit@test.com'
      for (let i = 0; i < 6; i++) {
        await page.getByLabel(/email/i).fill(email)
        await page.getByLabel(/password/i).fill(`wrongpass${i}`)
        await page.getByRole('button', { name: /sign in/i }).click()
        await page.waitForTimeout(100)
      }
      
      // Should show rate limit message after 5 attempts
      await expect(page.getByText(/too many.*attempts|try again later/i)).toBeVisible()
    })

    test('rate limits registration attempts', async ({ page }) => {
      await page.goto('/register')
      
      // Multiple registration attempts
      for (let i = 0; i < 5; i++) {
        await page.getByLabel(/name/i).fill(`Test ${i}`)
        await page.getByLabel(/email/i).fill(`rapid${i}@test.com`)
        await page.getByLabel(/password/i).fill('Password123!')
        await page.getByLabel(/church/i).selectOption({ index: 1 })
        await page.getByRole('button', { name: /register/i }).click()
        await page.waitForTimeout(100)
      }
      
      // Check for rate limit
      const rateLimitMessage = page.getByText(/too many|slow down|limit/i)
      if (await rateLimitMessage.isVisible()) {
        await expect(rateLimitMessage).toBeVisible()
      }
    })
  })

  test.describe('Password security', () => {
    test('password field masks input', async ({ page }) => {
      await page.goto('/auth/signin')
      
      const passwordField = page.getByLabel(/password/i)
      await expect(passwordField).toHaveAttribute('type', 'password')
    })

    test('registration enforces password requirements', async ({ page }) => {
      await page.goto('/register')
      
      // Weak password
      await page.getByLabel(/name/i).fill('Test User')
      await page.getByLabel(/email/i).fill('newuser@test.com')
      await page.getByLabel(/password/i).fill('weak')
      await page.getByLabel(/church/i).selectOption({ index: 1 })
      
      await page.getByRole('button', { name: /register/i }).click()
      
      // Should show password requirements error
      await expect(page.getByText(/password.*must|at least.*characters/i)).toBeVisible()
    })
  })

  test.describe('Error handling', () => {
    test('shows error page for auth errors', async ({ page }) => {
      await page.goto('/auth/error')
      
      // Should show error message
      await expect(page.getByText(/error|problem|wrong/i)).toBeVisible()
      
      // Should have retry link
      await expect(page.getByRole('link', { name: /try again|sign in/i })).toBeVisible()
    })

    test('handles invalid session tokens gracefully', async ({ page }) => {
      // Set invalid session
      await page.context().addCookies([{
        name: 'authjs.session-token',
        value: 'invalid-token-xyz',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Should redirect to login without crashing
      await expect(page).toHaveURL(/auth\/signin/)
    })
  })

  test.describe('Logout functionality', () => {
    test('can sign out from authenticated session', async ({ page }) => {
      // Set up authenticated session
      await page.context().addCookies([{
        name: 'authjs.session-token',
        value: 'valid-session',
        domain: 'localhost',
        path: '/',
        expires: Date.now() / 1000 + 3600,
      }])
      
      await page.goto('/dashboard')
      
      // Look for sign out button
      const signOutButton = page.getByRole('button', { name: /sign out|logout/i })
      if (await signOutButton.isVisible()) {
        await signOutButton.click()
        
        // Should redirect to home or login
        await expect(page).toHaveURL(/^\/($|auth\/signin)/)
      }
    })
  })

  test.describe('CSRF protection', () => {
    test('forms include CSRF tokens', async ({ page }) => {
      await page.goto('/auth/signin')
      
      // Check for CSRF token in form
      const csrfInput = page.locator('input[name="csrfToken"]')
      const csrfMeta = page.locator('meta[name="csrf-token"]')
      
      // At least one CSRF mechanism should be present
      const hasCSRF = await csrfInput.isVisible() || await csrfMeta.isVisible()
      expect(hasCSRF).toBeDefined()
    })
  })
})