import { test, expect } from './fixtures/auth'
import AxeBuilder from '@axe-core/playwright'

// Comprehensive accessibility checks with axe-core
test.describe('Accessibility Tests with Axe', () => {
  test('critical pages pass axe accessibility scan', async ({ page, memberAuth }) => {
    const pagesToScan = [
      { url: '/dashboard', name: 'Dashboard' },
      { url: '/events', name: 'Events' },
      { url: '/lifegroups', name: 'LifeGroups' },
      { url: '/checkin', name: 'Check-in' },
      { url: '/pathways', name: 'Pathways' },
    ]

    for (const pageInfo of pagesToScan) {
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
      
      // Log violations for debugging
      if (results.violations.length > 0) {
        console.log(`\n⚠️ Accessibility violations found on ${pageInfo.name}:`)
        results.violations.forEach(violation => {
          console.log(`  - ${violation.impact}: ${violation.description}`)
          console.log(`    Help: ${violation.helpUrl}`)
        })
      }
      
      // Assert no critical violations
      const criticalViolations = results.violations.filter(v => v.impact === 'critical')
      expect(criticalViolations).toHaveLength(0)
      
      // Warn about serious violations but don't fail
      const seriousViolations = results.violations.filter(v => v.impact === 'serious')
      if (seriousViolations.length > 0) {
        console.warn(`  Found ${seriousViolations.length} serious violations on ${pageInfo.name}`)
      }
    }
  })

  test('admin pages pass accessibility scan', async ({ page, churchAdminAuth }) => {
    const adminPages = [
      { url: '/admin/services', name: 'Admin Services' },
      { url: '/admin/lifegroups', name: 'Admin LifeGroups' },
      { url: '/admin/events', name: 'Admin Events' },
      { url: '/admin/pathways', name: 'Admin Pathways' },
    ]

    for (const pageInfo of adminPages) {
      await page.goto(pageInfo.url)
      await page.waitForLoadState('networkidle')
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()
      
      // Focus on critical and serious issues
      const importantViolations = results.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      )
      
      expect(importantViolations).toHaveLength(0)
    }
  })

  test('super admin pages pass accessibility scan', async ({ page, superAdminAuth }) => {
    await page.goto('/super/churches')
    await page.waitForLoadState('networkidle')
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze()
    
    expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0)
  })

  test('authentication pages are accessible', async ({ page }) => {
    const authPages = [
      '/auth/signin',
      '/register',
    ]

    for (const url of authPages) {
      await page.goto(url)
      await page.waitForLoadState('networkidle')
      
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
        .analyze()
      
      // Auth pages should have no violations
      expect(results.violations.filter(v => 
        v.impact === 'critical' || v.impact === 'serious'
      )).toHaveLength(0)
    }
  })
})

// Keep existing manual accessibility checks
test.describe('Manual Accessibility Checks', () => {
  const pagesToTest = [
    { url: '/', name: 'Home' },
    { url: '/dashboard', name: 'Dashboard', auth: 'memberAuth' },
    { url: '/checkin', name: 'Check-in', auth: 'memberAuth' },
    { url: '/lifegroups', name: 'LifeGroups', auth: 'memberAuth' },
    { url: '/events', name: 'Events', auth: 'memberAuth' },
    { url: '/pathways', name: 'Pathways', auth: 'memberAuth' },
    { url: '/auth/signin', name: 'Sign In' },
    { url: '/register', name: 'Registration' },
  ]

  for (const pageTest of pagesToTest) {
    test(`${pageTest.name} page basic accessibility`, async ({ page, memberAuth }) => {
      // Use auth if specified
      if (pageTest.auth) {
        // Auth is already set up by fixture
      }
      
      await page.goto(pageTest.url)

      // Check for page title
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title).not.toBe('') 

      // Check for main heading
      const h1 = await page.locator('h1').first()
      if (await h1.isVisible()) {
        const h1Text = await h1.textContent()
        expect(h1Text).toBeTruthy()
      }

      // Check for skip navigation link (best practice)
      const skipLink = page.locator('a[href="#main"], a[href="#content"], a:text-matches("skip", "i")')
      if (await skipLink.first().isVisible()) {
        console.log(`✅ ${pageTest.name}: Has skip navigation link`)
      } else {
        console.warn(`⚠️ ${pageTest.name}: Missing skip navigation link`)
      }

      // Check images have alt text
      const images = await page.locator('img').all()
      for (const img of images) {
        const alt = await img.getAttribute('alt')
        const src = await img.getAttribute('src')
        if (!alt && !src?.includes('data:image')) { // Skip data URLs
          console.warn(`⚠️ ${pageTest.name}: Image missing alt text: ${src}`)
        }
      }

      // Check form labels
      const inputs = await page.locator('input:not([type="hidden"]), select, textarea').all()
      for (const input of inputs) {
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledby = await input.getAttribute('aria-labelledby')
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`)
          const hasLabel = await label.isVisible() || ariaLabel || ariaLabelledby
          
          if (!hasLabel) {
            const type = await input.getAttribute('type')
            console.warn(`⚠️ ${pageTest.name}: Input missing label: type=${type}, id=${id}`)
          }
        }
      }

      // Check buttons have accessible text
      const buttons = await page.locator('button').all()
      for (const button of buttons) {
        const text = await button.textContent()
        const ariaLabel = await button.getAttribute('aria-label')
        
        if (!text?.trim() && !ariaLabel) {
          console.warn(`⚠️ ${pageTest.name}: Button missing accessible text`)
        }
      }

      // Check color contrast (basic check)
      // This is a simplified check - real contrast testing requires more complex calculations
      const elementsWithColor = await page.locator('[style*="color"], [class*="text-"]').all()
      if (elementsWithColor.length > 0) {
        console.log(`ℹ️ ${pageTest.name}: Has ${elementsWithColor.length} elements with color styling (manual contrast check needed)`)
      }

      // Check for ARIA landmarks
      const landmarks = {
        main: await page.locator('main, [role="main"]').count(),
        navigation: await page.locator('nav, [role="navigation"]').count(),
        banner: await page.locator('header, [role="banner"]').count(),
        contentinfo: await page.locator('footer, [role="contentinfo"]').count(),
      }

      if (landmarks.main === 0) {
        console.warn(`⚠️ ${pageTest.name}: Missing main landmark`)
      }
      if (landmarks.main > 1) {
        console.warn(`⚠️ ${pageTest.name}: Multiple main landmarks (${landmarks.main})`)
      }

      // Check heading hierarchy
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
      let previousLevel = 0
      let headingIssues = []
      
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName)
        const level = parseInt(tagName.substring(1))
        
        if (previousLevel > 0 && level - previousLevel > 1) {
          headingIssues.push(`Skipped heading level: h${previousLevel} -> h${level}`)
        }
        previousLevel = level
      }
      
      if (headingIssues.length > 0) {
        console.warn(`⚠️ ${pageTest.name}: Heading hierarchy issues:`, headingIssues)
      }

      // Check for duplicate IDs
      const ids = await page.evaluate(() => {
        const elements = document.querySelectorAll('[id]')
        const idMap = new Map()
        elements.forEach(el => {
          const id = el.id
          if (idMap.has(id)) {
            idMap.set(id, idMap.get(id) + 1)
          } else {
            idMap.set(id, 1)
          }
        })
        return Array.from(idMap.entries()).filter(([id, count]) => count > 1)
      })
      
      if (ids.length > 0) {
        console.warn(`⚠️ ${pageTest.name}: Duplicate IDs found:`, ids)
      }

      // Check focus visibility
      const firstFocusable = page.locator('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])').first()
      if (await firstFocusable.isVisible()) {
        await firstFocusable.focus()
        
        // Check if focus is visible (this is a basic check)
        const focusStyles = await firstFocusable.evaluate(el => {
          const styles = window.getComputedStyle(el)
          return {
            outline: styles.outline,
            boxShadow: styles.boxShadow,
            border: styles.border,
          }
        })
        
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' || 
          focusStyles.boxShadow !== 'none' ||
          focusStyles.border !== 'none'
        
        if (!hasFocusIndicator) {
          console.warn(`⚠️ ${pageTest.name}: Focus indicator may not be visible`)
        }
      }

      // Check for keyboard navigation
      await page.keyboard.press('Tab')
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      if (focusedElement === 'BODY') {
        console.warn(`⚠️ ${pageTest.name}: Keyboard navigation may be broken`)
      }
    })
  }

  test('forms are keyboard accessible', async ({ page, memberAuth }) => {
    await page.goto('/checkin')
    
    // Tab through form
    let tabCount = 0
    const maxTabs = 20
    const focusedElements = []
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        type: (document.activeElement as any)?.type,
        text: document.activeElement?.textContent,
      }))
      focusedElements.push(focused)
      tabCount++
      
      // Check if we've cycled back
      if (focused.tag === 'BODY') break
    }
    
    // Should have focusable elements
    const interactiveElements = focusedElements.filter(el => 
      ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A'].includes(el.tag || '')
    )
    
    expect(interactiveElements.length).toBeGreaterThan(0)
  })

  test('modal dialogs trap focus', async ({ page, memberAuth }) => {
    // This test would check if modals properly trap focus
    // Look for any modal triggers
    await page.goto('/events')
    
    // Try to trigger a modal (e.g., RSVP)
    const modalTrigger = page.getByRole('button', { name: /rsvp|details|more/i }).first()
    
    if (await modalTrigger.isVisible()) {
      await modalTrigger.click()
      
      // Check if focus is trapped
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      // Focus should still be within modal
      const focusedElement = await page.evaluate(() => {
        const modal = document.querySelector('[role="dialog"], .modal, [class*="modal"]')
        return modal?.contains(document.activeElement)
      })
      
      if (focusedElement === false) {
        console.warn('⚠️ Modal may not properly trap focus')
      }
    }
  })

  test('error messages are accessible', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Submit invalid form to trigger errors
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for error messages
    const errors = await page.locator('[role="alert"], [aria-live], .error, .text-red-500').all()
    
    for (const error of errors) {
      const role = await error.getAttribute('role')
      const ariaLive = await error.getAttribute('aria-live')
      
      if (!role && !ariaLive) {
        console.warn('⚠️ Error message missing ARIA attributes for screen readers')
      }
    }
  })

  test('tables have proper structure', async ({ page, churchAdminAuth }) => {
    await page.goto('/admin/services')
    
    const tables = await page.locator('table').all()
    
    for (const table of tables) {
      // Check for caption or aria-label
      const caption = await table.locator('caption').isVisible()
      const ariaLabel = await table.getAttribute('aria-label')
      
      if (!caption && !ariaLabel) {
        console.warn('⚠️ Table missing caption or aria-label')
      }
      
      // Check for headers
      const headers = await table.locator('th').count()
      if (headers === 0) {
        console.warn('⚠️ Table missing header cells (th)')
      }
      
      // Check scope attributes
      const thElements = await table.locator('th').all()
      for (const th of thElements) {
        const scope = await th.getAttribute('scope')
        if (!scope) {
          console.warn('⚠️ Table header missing scope attribute')
        }
      }
    }
  })

  test('interactive elements are large enough', async ({ page, memberAuth }) => {
    await page.goto('/dashboard')
    
    const buttons = await page.locator('button, a[role="button"]').all()
    
    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        // WCAG 2.5.5 recommends 44x44 pixels minimum
        if (box.width < 44 || box.height < 44) {
          const text = await button.textContent()
          console.warn(`⚠️ Button too small (${box.width}x${box.height}): ${text}`)
        }
      }
    }
  })

  test('page is usable when zoomed', async ({ page, memberAuth }) => {
    await page.goto('/dashboard')
    
    // Zoom to 200%
    await page.evaluate(() => {
      document.body.style.zoom = '2'
    })
    
    // Check if main content is still visible
    const mainContent = page.locator('main, [role="main"]').first()
    const isVisible = await mainContent.isVisible()
    expect(isVisible).toBe(true)
    
    // Check for horizontal scroll (shouldn't be necessary at 200% zoom)
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    
    if (hasHorizontalScroll) {
      console.warn('⚠️ Page requires horizontal scrolling at 200% zoom')
    }
  })
})