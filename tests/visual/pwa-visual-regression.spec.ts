import { test, expect } from '@playwright/test'

test.describe('PWA Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set consistent viewport for all tests
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test.describe('Mobile Components Visual Tests', () => {
    test('install prompt renders correctly', async ({ page }) => {
      // Mock PWA install prompt conditions
      await page.addInitScript(() => {
        // Mock install prompt availability
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault()
        })
      })

      await page.goto('/')

      // Wait for potential install prompt to appear
      await page.waitForTimeout(1000)

      // Take screenshot of install prompt if visible
      const installPrompt = page.locator('[role="dialog"]')
      if (await installPrompt.isVisible()) {
        await expect(installPrompt).toHaveScreenshot('install-prompt-mobile.png')
      }
    })

    test('offline indicator displays properly', async ({ page, context }) => {
      await page.goto('/auth/signin')
      await page.fill('#email', 'member1@test.com')
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('/member')

      // Go offline
      await context.setOffline(true)
      await page.reload()

      // Wait for offline indicator
      await page.waitForSelector('[role="status"]', { timeout: 5000 })

      // Screenshot offline state
      await expect(page).toHaveScreenshot('offline-indicator-mobile.png')

      // Go back online
      await context.setOffline(false)
      await page.waitForTimeout(2000)

      // Screenshot online state
      await expect(page).toHaveScreenshot('online-indicator-mobile.png')
    })

    test('mobile buttons render correctly', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.fill('#email', 'member1@test.com')
      await page.fill('#password', 'Hpci!Test2025')

      // Screenshot login button
      const loginButton = page.locator('button[type="submit"]')
      await expect(loginButton).toHaveScreenshot('login-button-mobile.png')

      await loginButton.click()
      await page.waitForURL('/member')

      // Screenshot navigation buttons
      const checkInButton = page.locator('text=Check In').first()
      if (await checkInButton.isVisible()) {
        await expect(checkInButton).toHaveScreenshot('checkin-button-mobile.png')
      }
    })

    test('pull-to-refresh visual indicator', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.fill('#email', 'member1@test.com')
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('/member')
      await page.goto('/events')

      // Simulate pull gesture
      const container = page.locator('main').first()
      const box = await container.boundingBox()

      if (box) {
        // Start pull gesture
        await page.mouse.move(box.x + box.width / 2, box.y + 50)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width / 2, box.y + 150)

        // Screenshot during pull
        await expect(page).toHaveScreenshot('pull-to-refresh-active-mobile.png')

        await page.mouse.up()
      }
    })

    test('bottom sheet modals on mobile', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.fill('#email', 'admin.manila@test.com')
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('/admin')
      await page.goto('/admin/members')

      // Try to open create member modal
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add Member")')
      if (await createButton.count() > 0) {
        await createButton.first().click()
        await page.waitForTimeout(500)

        // Screenshot modal
        await expect(page).toHaveScreenshot('member-create-modal-mobile.png')
      }
    })
  })

  test.describe('Responsive Design Tests', () => {
    const breakpoints = [
      { name: 'mobile-small', width: 320, height: 568 },
      { name: 'mobile-medium', width: 375, height: 667 },
      { name: 'mobile-large', width: 414, height: 896 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1024, height: 768 }
    ]

    test('responsive layout on all breakpoints', async ({ page }) => {
      for (const breakpoint of breakpoints) {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height })

        // Test login page
        await page.goto('/auth/signin')
        await expect(page).toHaveScreenshot(`login-${breakpoint.name}.png`)

        // Login and test dashboard
        await page.fill('#email', 'admin.manila@test.com')
        await page.fill('#password', 'Hpci!Test2025')
        await page.click('button[type="submit"]')

        await page.waitForURL('/admin')
        await expect(page).toHaveScreenshot(`admin-dashboard-${breakpoint.name}.png`)

        // Test members page
        await page.goto('/admin/members')
        await page.waitForSelector('table, .md\\:hidden')
        await expect(page).toHaveScreenshot(`admin-members-${breakpoint.name}.png`)
      }
    })
  })

  test.describe('PWA-Specific Visual Elements', () => {
    test('app shell with safe area on notched devices', async ({ page }) => {
      // Simulate notched device
      await page.setViewportSize({ width: 375, height: 812 })

      await page.addInitScript(() => {
        // Mock safe area insets
        document.documentElement.style.setProperty('--safe-area-inset-top', '44px')
        document.documentElement.style.setProperty('--safe-area-inset-bottom', '34px')
      })

      await page.goto('/auth/signin')
      await page.fill('#email', 'member1@test.com')
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('/member')
      await expect(page).toHaveScreenshot('safe-area-layout-mobile.png')
    })

    test('loading states and skeletons', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.fill('#email', 'admin.manila@test.com')
      await page.fill('#password', 'Hpci!Test2025')
      await page.click('button[type="submit"]')

      await page.waitForURL('/admin')

      // Navigate to members page and capture loading state
      const membersLink = page.locator('text=Members')
      await membersLink.click()

      // Try to capture loading skeleton (if visible)
      await page.waitForTimeout(100)
      const loadingElement = page.locator('.animate-pulse, [aria-label*="loading"]')
      if (await loadingElement.isVisible()) {
        await expect(page).toHaveScreenshot('loading-skeleton-mobile.png')
      }
    })

    test('dark mode theme toggle', async ({ page }) => {
      await page.goto('/auth/signin')

      // Test light mode
      await expect(page).toHaveScreenshot('light-mode-mobile.png')

      // Try to toggle dark mode if available
      const themeToggle = page.locator('[aria-label*="theme"], [aria-label*="dark"], button:has([data-icon="moon"])')
      if (await themeToggle.isVisible()) {
        await themeToggle.click()
        await page.waitForTimeout(500)

        // Test dark mode
        await expect(page).toHaveScreenshot('dark-mode-mobile.png')
      }
    })
  })

  test.describe('Interactive States', () => {
    test('button hover and focus states', async ({ page }) => {
      await page.goto('/auth/signin')

      const loginButton = page.locator('button[type="submit"]')

      // Default state
      await expect(loginButton).toHaveScreenshot('button-default-state.png')

      // Hover state
      await loginButton.hover()
      await expect(loginButton).toHaveScreenshot('button-hover-state.png')

      // Focus state
      await loginButton.focus()
      await expect(loginButton).toHaveScreenshot('button-focus-state.png')
    })

    test('form validation states', async ({ page }) => {
      await page.goto('/auth/signin')

      // Try to submit empty form
      await page.click('button[type="submit"]')
      await page.waitForTimeout(500)

      // Screenshot validation errors
      await expect(page).toHaveScreenshot('form-validation-errors-mobile.png')
    })
  })
})

test.describe('PWA Icon and Manifest Visual Verification', () => {
  test('manifest icons load correctly', async ({ page }) => {
    // Check manifest accessibility
    await page.goto('/')

    const manifestResponse = await page.request.get('/manifest.json')
    expect(manifestResponse.status()).toBe(200)

    const manifest = await manifestResponse.json()

    // Verify each icon loads
    for (const icon of manifest.icons) {
      const iconResponse = await page.request.get(icon.src)
      expect(iconResponse.status()).toBe(200)
    }
  })

  test('service worker registration visual feedback', async ({ page }) => {
    // Enable service worker logging
    await page.addInitScript(() => {
      window.addEventListener('load', () => {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js')
            .then(() => {
              console.log('SW registered successfully')
            })
            .catch((error) => {
              console.log('SW registration failed:', error)
            })
        }
      })
    })

    await page.goto('/')

    // Wait for potential service worker messages
    await page.waitForTimeout(2000)

    // Check for any SW-related UI updates
    await expect(page).toHaveScreenshot('service-worker-ready-state.png')
  })
})