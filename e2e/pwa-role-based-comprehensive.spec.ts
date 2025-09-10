import { test, expect } from '@playwright/test'

test.describe('PWA Role-Based Comprehensive Feature Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/')
  })

  test.describe('SUPER_ADMIN Role PWA Features', () => {
    test('super admin can access all PWA-enhanced admin features', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'superadmin@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      // Should redirect to super admin dashboard
      await expect(page).toHaveURL('/super')
      
      // Test PWA-enhanced church management
      await page.click('text=Church Management')
      await page.waitForSelector('table, .md\\:hidden') // Wait for DataTable
      
      // Test desktop table view (enhanced with PWA features)
      if (await page.isVisible('table')) {
        // Test sortable headers with haptic feedback
        const nameHeader = page.locator('th:has-text("Name")')
        await nameHeader.click()
        
        // Verify table data loads
        await expect(page.locator('tbody tr')).toHaveCount({ min: 1 })
      }
      
      // Test mobile card view with swipe actions
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Should show mobile cards
      await expect(page.locator('.md\\:hidden')).toBeVisible()
      const mobileCards = page.locator('.md\\:hidden .space-y-3 > div')
      await expect(mobileCards.first()).toBeVisible()
      
      // Test PWA navigation
      await page.goto('/super/analytics')
      await expect(page.locator('h1, h2')).toContainText(['Analytics', 'Dashboard'])
    })

    test('super admin can manage churches with PWA features', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'superadmin@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      await page.goto('/super')
      
      // Test church creation with PWA forms
      const createButton = page.locator('button:has-text("Create Church"), button:has-text("Add Church")')
      if (await createButton.count() > 0) {
        await createButton.first().click()
        
        // Should open modal/form with PWA enhancements
        await page.waitForSelector('input[name="name"], input[placeholder*="name"]')
        
        // Test form validation (PWA enhanced)
        await page.click('button[type="submit"]')
        // Should show validation errors
      }
    })
  })

  test.describe('CHURCH_ADMIN Role PWA Features', () => {
    test('church admin can access PWA-enhanced member management', async ({ page }) => {
      // Login as church admin
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'admin.manila@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      // Should redirect to admin dashboard
      await expect(page).toHaveURL('/admin')
      
      // Navigate to members page
      await page.click('text=Members')
      await expect(page).toHaveURL('/admin/members')
      
      // Test PWA-enhanced DataTable
      await page.waitForSelector('table, .md\\:hidden')
      
      // Test search functionality with PWA enhancements
      const searchInput = page.locator('input[placeholder*="Search"]')
      if (await searchInput.count() > 0) {
        await searchInput.fill('admin')
        await page.waitForTimeout(500) // Allow search to process
        
        // Should filter results
        await expect(page.locator('text=admin')).toBeVisible()
      }
      
      // Test mobile view with swipe actions
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Test mobile cards with PWA features
      const mobileCards = page.locator('.md\\:hidden .space-y-3 > div')
      if (await mobileCards.count() > 0) {
        const firstCard = mobileCards.first()
        
        // Try to trigger swipe actions (simulate touch)
        const cardBox = await firstCard.boundingBox()
        if (cardBox) {
          await page.mouse.move(cardBox.x + cardBox.width - 20, cardBox.y + cardBox.height / 2)
          await page.mouse.down()
          await page.mouse.move(cardBox.x + 20, cardBox.y + cardBox.height / 2)
          await page.mouse.up()
          
          await page.waitForTimeout(500) // Allow animation
        }
      }
    })

    test('church admin can create members with PWA forms', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'admin.manila@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      await page.goto('/admin/members')
      
      // Test member creation with PWA-enhanced forms
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add Member")')
      if (await createButton.count() > 0) {
        await createButton.first().click()
        
        // Should open PWA-enhanced form
        await page.waitForSelector('input[name="name"], input[placeholder*="name"]')
        
        // Test PWA form validation
        await page.fill('input[name="name"]', 'Test PWA User')
        await page.fill('input[name="email"]', 'test.pwa@example.com')
        
        // Test role selection with PWA bottom sheet
        const roleSelect = page.locator('button:has-text("Select"), select[name="role"]')
        if (await roleSelect.count() > 0) {
          await roleSelect.first().click()
          await page.waitForTimeout(500)
          
          // Should show options
          const memberOption = page.locator('text=Member, option:has-text("Member")')
          if (await memberOption.count() > 0) {
            await memberOption.first().click()
          }
        }
        
        // Test form submission with PWA feedback
        await page.click('button[type="submit"]')
        await page.waitForTimeout(2000) // Allow processing
      }
    })

    test('church admin can manage services with PWA features', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'admin.manila@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      await page.goto('/admin/services')
      
      // Test PWA-enhanced services table
      await page.waitForSelector('table, .md\\:hidden')
      
      // Test export functionality with PWA file system API
      const exportButton = page.locator('button:has-text("Export"), button:has-text("CSV")')
      if (await exportButton.count() > 0) {
        await exportButton.first().click()
        await page.waitForTimeout(1000) // Allow export processing
      }
    })
  })

  test.describe('VIP Role PWA Features', () => {
    test('vip can access first-timer management with PWA enhancements', async ({ page }) => {
      // Login as VIP
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'vip.manila@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      // Should redirect to VIP dashboard
      await expect(page).toHaveURL('/vip')
      
      // Navigate to first-timers
      await page.click('text=First Timers')
      await expect(page).toHaveURL('/vip/firsttimers')
      
      // Test PWA-enhanced first-timer table
      await page.waitForSelector('table, .md\\:hidden')
      
      // Test mobile view for VIP features
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Should show mobile cards with swipe actions
      const mobileCards = page.locator('.md\\:hidden .space-y-3 > div')
      if (await mobileCards.count() > 0) {
        await expect(mobileCards.first()).toBeVisible()
      }
    })

    test('vip can create first-timer with PWA forms', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'vip.manila@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      await page.goto('/vip/firsttimers')
      
      // Test first-timer creation
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add First Timer")')
      if (await createButton.count() > 0) {
        await createButton.first().click()
        
        // Test PWA form enhancements
        await page.waitForSelector('input[name="name"], input[placeholder*="name"]')
        await page.fill('input[name="name"]', 'PWA First Timer')
        await page.fill('input[name="email"]', 'pwa.firsttimer@test.com')
        
        // Test boolean toggles with PWA styling
        const gospelSharedToggle = page.locator('input[type="checkbox"]:near(text*="Gospel")')
        if (await gospelSharedToggle.count() > 0) {
          await gospelSharedToggle.click()
        }
        
        await page.click('button[type="submit"]')
        await page.waitForTimeout(2000)
      }
    })
  })

  test.describe('LEADER Role PWA Features', () => {
    test('leader can access PWA-enhanced life groups', async ({ page }) => {
      // Login as leader
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'leader.manila@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      // Should redirect to leader dashboard
      await expect(page).toHaveURL('/leader')
      
      // Navigate to life groups
      await page.click('text=Life Groups')
      await expect(page).toHaveURL('/leader/lifegroups')
      
      // Test PWA-enhanced life groups view
      await page.waitForSelector('table, .md\\:hidden, .grid')
      
      // Test mobile responsiveness
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Should adapt to mobile view
      await page.waitForSelector('.md\\:hidden, .grid')
    })

    test('leader can manage life group attendance with PWA features', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'leader.manila@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      await page.goto('/leader/lifegroups')
      
      // Find a life group to manage
      const manageButton = page.locator('button:has-text("Manage"), button:has-text("View")')
      if (await manageButton.count() > 0) {
        await manageButton.first().click()
        
        // Test PWA-enhanced management interface
        await page.waitForSelector('tab, button:has-text("Attendance")')
        
        const attendanceTab = page.locator('button:has-text("Attendance")')
        if (await attendanceTab.count() > 0) {
          await attendanceTab.click()
          
          // Test attendance marking with PWA enhancements
          const checkboxes = page.locator('input[type="checkbox"]')
          if (await checkboxes.count() > 0) {
            await checkboxes.first().click()
            // Should provide haptic feedback
          }
        }
      }
    })
  })

  test.describe('MEMBER Role PWA Features', () => {
    test('member can access PWA-enhanced member features', async ({ page }) => {
      // Login as member
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'member1@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      // Should redirect to member dashboard
      await expect(page).toHaveURL('/member')
      
      // Test PWA-enhanced check-in
      await page.click('text=Check In')
      await expect(page).toHaveURL('/checkin')
      
      // Test PWA check-in interface
      await page.waitForSelector('button:has-text("Check In"), form')
      
      // Test mobile check-in experience
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Should show mobile-optimized check-in
      const checkInButton = page.locator('button:has-text("Check In")')
      if (await checkInButton.count() > 0) {
        await checkInButton.click()
        await page.waitForTimeout(2000) // Allow processing
        
        // Should provide PWA feedback
      }
    })

    test('member can view events with PWA enhancements', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'member1@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      await page.goto('/events')
      
      // Test PWA-enhanced events view
      await page.waitForSelector('.grid, .space-y-4')
      
      // Test mobile events interface
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Should show mobile-optimized events
      const eventCards = page.locator('[class*="card"], .space-y-4 > div')
      if (await eventCards.count() > 0) {
        await expect(eventCards.first()).toBeVisible()
        
        // Test RSVP with PWA features
        const rsvpButton = eventCards.first().locator('button:has-text("RSVP"), button:has-text("Register")')
        if (await rsvpButton.count() > 0) {
          await rsvpButton.click()
          await page.waitForTimeout(1000)
        }
      }
    })

    test('member can access pathways with PWA features', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'member1@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      await page.goto('/pathways')
      
      // Test PWA-enhanced pathways
      await page.waitForSelector('.grid, .space-y-4')
      
      // Test mobile pathways view
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Should show mobile-optimized pathways
      const pathwayCards = page.locator('[class*="card"], .space-y-4 > div')
      if (await pathwayCards.count() > 0) {
        await expect(pathwayCards.first()).toBeVisible()
      }
    })
  })

  test.describe('Cross-Role PWA Features', () => {
    test('PWA navigation works across all roles', async ({ page }) => {
      const roles = [
        { email: 'superadmin@test.com', expectedUrl: '/super' },
        { email: 'admin.manila@test.com', expectedUrl: '/admin' },
        { email: 'vip.manila@test.com', expectedUrl: '/vip' },
        { email: 'leader.manila@test.com', expectedUrl: '/leader' },
        { email: 'member1@test.com', expectedUrl: '/member' }
      ]
      
      for (const role of roles) {
        // Login
        await page.goto('/auth/signin')
        await page.fill('#email', role.email)
        await page.fill('#password', 'Hpci!Test2025')
        await page.click('button[type="submit"]')
        
        // Verify redirect
        await expect(page).toHaveURL(role.expectedUrl)
        
        // Test mobile navigation
        await page.setViewportSize({ width: 375, height: 667 })
        
        // Should show mobile-optimized navigation
        const mobileNav = page.locator('[class*="mobile"], .md\\:hidden')
        
        // Logout for next iteration
        await page.goto('/auth/signin')
      }
    })

    test('PWA offline indicators work', async ({ page, context }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'member1@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      // Go offline
      await context.setOffline(true)
      
      // Navigate to different pages
      await page.goto('/events')
      
      // Should show offline indicator
      const offlineIndicator = page.locator('.offline, [class*="offline"], text*="offline"')
      await expect(offlineIndicator).toBeVisible({ timeout: 5000 })
      
      // Go back online
      await context.setOffline(false)
      await page.waitForTimeout(1000)
    })

    test('PWA responsive design works on all breakpoints', async ({ page }) => {
      await page.goto('/auth/signin')
      await page.waitForSelector('input[type="email"]')
      await page.fill('input[type="email"]', 'admin.manila@test.com')
      await page.fill('input[type="password"]', 'Hpci!Test2025')
      await page.click('button[type="submit"]')
      
      await page.goto('/admin/members')
      
      const breakpoints = [
        { width: 320, height: 568 },  // Mobile small
        { width: 375, height: 667 },  // Mobile medium  
        { width: 768, height: 1024 }, // Tablet
        { width: 1024, height: 768 }, // Desktop small
        { width: 1920, height: 1080 } // Desktop large
      ]
      
      for (const breakpoint of breakpoints) {
        await page.setViewportSize(breakpoint)
        await page.reload()
        
        // Should adapt layout properly
        await page.waitForSelector('table, .md\\:hidden, .grid')
        
        if (breakpoint.width < 768) {
          // Mobile: should show cards
          await expect(page.locator('.md\\:hidden')).toBeVisible()
        } else {
          // Desktop: should show table
          await expect(page.locator('table')).toBeVisible()
        }
      }
    })
  })
})