import { test as base, expect } from '@playwright/test'
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs'
import { join } from 'path'

type AuthFixtures = {
  superAdminAuth: void
  churchAdminAuth: void
  vipAuth: void
  leaderAuth: void
  memberAuth: void
}

const STORAGE_STATE_DIR = join(process.cwd(), 'test-results', 'auth-states')

// Ensure storage state directory exists
if (!existsSync(STORAGE_STATE_DIR)) {
  mkdirSync(STORAGE_STATE_DIR, { recursive: true })
}

// Create a reusable test fixture with auth states and storage state caching
export const test = base.extend<AuthFixtures>({
  superAdminAuth: [async ({ page }, use) => {
    await authenticateUser(page, 'superadmin@test.com', 'Hpci!Test2025', 'superadmin')
    await use()
  }, { scope: 'test' }],

  churchAdminAuth: [async ({ page }, use) => {
    await authenticateUser(page, 'admin.manila@test.com', 'Hpci!Test2025', 'churchadmin')
    await use()
  }, { scope: 'test' }],

  vipAuth: [async ({ page }, use) => {
    await authenticateUser(page, 'vip.manila@test.com', 'Hpci!Test2025', 'vip')
    await use()
  }, { scope: 'test' }],

  leaderAuth: [async ({ page }, use) => {
    await authenticateUser(page, 'leader.manila@test.com', 'Hpci!Test2025', 'leader')
    await use()
  }, { scope: 'test' }],

  memberAuth: [async ({ page }, use) => {
    await authenticateUser(page, 'member1@test.com', 'Hpci!Test2025', 'member')
    await use()
  }, { scope: 'test' }],
})

async function authenticateUser(page: any, email: string, password: string, roleKey: string) {
  const storageStatePath = join(STORAGE_STATE_DIR, `${roleKey}.json`)
  
  // Try to use cached storage state first
  if (existsSync(storageStatePath)) {
    try {
      console.log(`[AUTH] Attempting to use cached auth state for ${email}`)
      const storageState = JSON.parse(readFileSync(storageStatePath, 'utf8'))
      await page.context().addCookies(storageState.cookies || [])
      
      // Verify cached authentication is still valid
      await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 10000 })
      await page.waitForTimeout(2000) // Allow redirect to complete
      
      const currentUrl = page.url()
      if (!currentUrl.includes('/auth/signin')) {
        console.log(`[AUTH] Successfully used cached auth for ${email} - URL: ${currentUrl}`)
        return
      }
      console.log(`[AUTH] Cached auth expired for ${email}, performing fresh login`)
    } catch (error) {
      console.log(`[AUTH] Failed to use cached auth for ${email}:`, error.message)
    }
  }
  
  // Perform fresh authentication
  await performFreshLogin(page, email, password, roleKey, storageStatePath)
}

async function performFreshLogin(page: any, email: string, password: string, roleKey: string, storageStatePath: string) {
  console.log(`[AUTH] Performing fresh login for ${email}`)
  
  try {
    // Navigate to signin page
    await page.goto('/auth/signin')
    await page.waitForLoadState('networkidle')
    
    // Wait for the form to be ready and use proper selectors for MobileInput components
    await page.waitForSelector('input[autocomplete="email"]', { timeout: 10000 })
    await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 })
    
    // Fill in the form using autocomplete attributes since no IDs are set
    await page.fill('input[autocomplete="email"]', email)
    await page.fill('input[autocomplete="current-password"]', password)
    
    // Submit the form and wait for navigation
    console.log(`[AUTH] Submitting login form for ${email}`)
    await page.click('button[type="submit"]')
    
    // Wait for success notification to appear (indicates successful authentication)
    try {
      await page.waitForSelector('text=Welcome Back!', { timeout: 5000 })
      console.log(`[AUTH] Success notification appeared for ${email}`)
    } catch {
      console.log(`[AUTH] No success notification found for ${email}`)
    }
    
    // Wait for redirect to complete (signin page shows success message before redirecting)
    await page.waitForTimeout(2000) // Wait for the 500ms redirect delay plus buffer
    
    // Check if we've been redirected away from signin
    let currentUrl = page.url()
    let attempts = 0
    while (currentUrl.includes('/auth/signin') && attempts < 5) {
      await page.waitForTimeout(1000)
      currentUrl = page.url()
      attempts++
      console.log(`[AUTH] Waiting for redirect... attempt ${attempts}, URL: ${currentUrl}`)
    }
    
    console.log(`[AUTH] Final login result URL: ${currentUrl}`)
    
    // Check if login was successful
    if (currentUrl.includes('/auth/signin')) {
      // Still on signin page - check for error message (not success message)
      const errorElements = await page.locator('text*=Invalid').all()
      const failureElements = await page.locator('text*=Failed').all()
      
      if (errorElements.length > 0 || failureElements.length > 0) {
        const errorText = errorElements.length > 0 
          ? await errorElements[0].textContent() 
          : await failureElements[0].textContent()
        throw new Error(`Login failed: ${errorText}`)
      }
      
      // If no clear error and we have success notification, assume login is processing
      const successElements = await page.locator('text=Welcome Back!').all()
      if (successElements.length > 0) {
        console.log(`[AUTH] Success notification present but still on signin - waiting longer...`)
        await page.waitForTimeout(3000) // Wait longer for redirect
        currentUrl = page.url()
        if (currentUrl.includes('/auth/signin')) {
          throw new Error('Login appeared successful but redirect never completed')
        }
      } else {
        throw new Error('Login failed - still on signin page with no success indication')
      }
    }
    
    console.log(`[AUTH] Successfully authenticated ${email}`)
    
    // Save storage state for caching
    const storageState = await page.context().storageState()
    writeFileSync(storageStatePath, JSON.stringify(storageState, null, 2))
    console.log(`[AUTH] Session state cached for ${email}`)
    
  } catch (error) {
    console.error(`[AUTH] Fresh login failed for ${email}:`, error.message)
    
    // Enhanced debug information
    try {
      const currentUrl = page.url()
      const title = await page.title()
      console.error(`[AUTH] Debug - URL: ${currentUrl}, Title: ${title}`)
      
      // Check for specific error indicators
      const isOnSigninPage = currentUrl.includes('/auth/signin')
      const isOnErrorPage = currentUrl.includes('/auth/error')
      
      if (isOnSigninPage) {
        // Check if form is still visible (might indicate validation error)
        const formVisible = await page.locator('input[autocomplete="email"]').isVisible()
        console.error(`[AUTH] Still on signin page, form visible: ${formVisible}`)
        
        // Check for any notifications
        const notifications = await page.locator('[role="alert"]').all()
        if (notifications.length === 0) {
          // Try other notification selectors
          const otherNotifications = await page.locator('text*=Welcome').all()
          for (const notification of otherNotifications) {
            const text = await notification.textContent()
            console.error(`[AUTH] Found notification: ${text}`)
          }
        }
      }
      
      if (isOnErrorPage) {
        const errorContent = await page.textContent('body')
        console.error(`[AUTH] Error page content:`, errorContent?.substring(0, 200))
      }
    } catch (debugError) {
      console.error(`[AUTH] Could not gather debug info:`, debugError.message)
    }
    
    throw error
  }
}

export { expect }

// Utility function to clear all auth states (useful for debugging)
export async function clearAuthStates() {
  const fs = await import('fs')
  if (fs.existsSync(STORAGE_STATE_DIR)) {
    const files = fs.readdirSync(STORAGE_STATE_DIR)
    for (const file of files) {
      if (file.endsWith('.json')) {
        fs.unlinkSync(join(STORAGE_STATE_DIR, file))
      }
    }
    console.log('[AUTH] Cleared all cached auth states')
  }
}
