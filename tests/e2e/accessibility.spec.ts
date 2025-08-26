import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y, getViolations } from 'axe-playwright'

test.describe('Accessibility @a11y', () => {
  test.describe('Skip Links', () => {
    test('should have skip to main content link', async ({ page }) => {
      await page.goto('/')
      
      // Tab to reveal skip link
      await page.keyboard.press('Tab')
      
      const skipLink = page.getByRole('link', { name: /skip to main content/i })
      await expect(skipLink).toBeVisible()
      
      // Activate skip link
      await skipLink.click()
      
      // Should focus main content
      const main = page.getByRole('main')
      await expect(main).toBeFocused()
    })
    
    test('should have skip to navigation link', async ({ page }) => {
      await page.goto('/')
      
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      
      const skipLink = page.getByRole('link', { name: /skip to navigation/i })
      await expect(skipLink).toBeVisible()
    })
  })
  
  test.describe('Keyboard Navigation', () => {
    test('should navigate through interactive elements with Tab', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Start from body
      await page.locator('body').focus()
      
      // Tab through elements
      const focusableElements = [
        'link',
        'button',
        'input',
        'select',
        'textarea'
      ]
      
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        
        // Check if focused element is interactive
        const focusedElement = await page.evaluateHandle(() => document.activeElement)
        const tagName = await focusedElement.evaluate(el => el?.tagName.toLowerCase())
        const role = await focusedElement.evaluate(el => el?.getAttribute('role'))
        
        expect(
          focusableElements.includes(tagName || '') ||
          ['button', 'link', 'navigation'].includes(role || '')
        ).toBeTruthy()
      }
    })
    
    test('should navigate backwards with Shift+Tab', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Tab forward a few times
      for (let i = 0; i < 3; i++) {
        await page.keyboard.press('Tab')
      }
      
      // Tab backward
      await page.keyboard.press('Shift+Tab')
      
      // Should move focus backward
      const focusedElement = await page.evaluateHandle(() => document.activeElement)
      expect(focusedElement).toBeDefined()
    })
    
    test('should trap focus in modal', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      
      // Open modal
      await page.getByRole('button', { name: /create service/i }).click()
      
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      
      // Tab through modal elements
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        
        // Focus should stay within modal
        const focusedElement = await page.evaluateHandle(() => document.activeElement)
        const isInModal = await page.evaluate(
          ([el, modal]) => modal?.contains(el as Node),
          [focusedElement, await modal.elementHandle()]
        )
        
        expect(isInModal).toBeTruthy()
      }
    })
    
    test('should close modal with Escape', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      
      // Open modal
      await page.getByRole('button', { name: /create service/i }).click()
      
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      
      // Press Escape
      await page.keyboard.press('Escape')
      
      // Modal should close
      await expect(modal).not.toBeVisible()
    })
  })
  
  test.describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on buttons', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Check buttons have accessible names
      const buttons = page.getByRole('button')
      const count = await buttons.count()
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const button = buttons.nth(i)
        const name = await button.getAttribute('aria-label') || await button.textContent()
        expect(name).toBeTruthy()
      }
    })
    
    test('should have proper ARIA labels on form inputs', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      await page.getByRole('button', { name: /create service/i }).click()
      
      // Check form inputs have labels
      const inputs = page.locator('input, select, textarea')
      const count = await inputs.count()
      
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i)
        const id = await input.getAttribute('id')
        const ariaLabel = await input.getAttribute('aria-label')
        const ariaLabelledBy = await input.getAttribute('aria-labelledby')
        
        if (id) {
          // Should have associated label
          const label = page.locator(`label[for="${id}"]`)
          const hasLabel = await label.count() > 0
          
          expect(
            hasLabel || ariaLabel || ariaLabelledBy
          ).toBeTruthy()
        }
      }
    })
    
    test('should have landmark roles', async ({ page }) => {
      await page.goto('/')
      
      // Check for landmark roles
      await expect(page.getByRole('banner')).toBeVisible() // header
      await expect(page.getByRole('navigation')).toBeVisible()
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible() // footer
    })
    
    test('should have proper heading hierarchy', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Get all headings
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
        elements.map(el => ({
          level: parseInt(el.tagName[1]),
          text: el.textContent
        }))
      )
      
      // Should have exactly one h1
      const h1Count = headings.filter(h => h.level === 1).length
      expect(h1Count).toBe(1)
      
      // Check heading hierarchy (no skipping levels)
      let previousLevel = 0
      for (const heading of headings) {
        if (previousLevel > 0) {
          expect(heading.level).toBeLessThanOrEqual(previousLevel + 1)
        }
        previousLevel = heading.level
      }
    })
  })
  
  test.describe('Focus Management', () => {
    test('should show focus indicators', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Tab to first interactive element
      await page.keyboard.press('Tab')
      
      // Check for focus outline
      const focusedElement = await page.evaluateHandle(() => document.activeElement)
      const outline = await focusedElement.evaluate(el => {
        const styles = window.getComputedStyle(el as Element)
        return {
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        }
      })
      
      // Should have visible focus indicator
      expect(
        outline.outlineWidth !== '0px' ||
        outline.boxShadow.includes('rgb')
      ).toBeTruthy()
    })
    
    test('should restore focus after modal closes', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      
      const createButton = page.getByRole('button', { name: /create service/i })
      await createButton.focus()
      
      // Open modal
      await createButton.click()
      
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      
      // Close modal
      await page.getByRole('button', { name: /cancel/i }).click()
      
      // Focus should return to trigger button
      await expect(createButton).toBeFocused()
    })
    
    test('should manage focus on route change', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Navigate to another page
      await page.getByRole('link', { name: /services/i }).click()
      
      // Wait for navigation
      await page.waitForURL('**/services')
      
      // Focus should move to main content or heading
      const focusedElement = await page.evaluateHandle(() => document.activeElement)
      const tagName = await focusedElement.evaluate(el => el?.tagName.toLowerCase())
      
      expect(['main', 'h1', 'h2', 'div'].includes(tagName || '')).toBeTruthy()
    })
  })
  
  test.describe('Screen Reader Support', () => {
    test('should have descriptive page titles', async ({ page }) => {
      await page.goto('/')
      expect(await page.title()).toContain('HPCI')
      
      await page.goto('/signin')
      expect(await page.title()).toContain('Sign In')
      
      await page.goto('/events')
      expect(await page.title()).toContain('Events')
    })
    
    test('should announce live regions', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/checkin')
      
      // Check for live region
      const liveRegion = page.locator('[aria-live]')
      await expect(liveRegion).toHaveCount(1)
      
      // Check aria-live value
      const ariaLive = await liveRegion.getAttribute('aria-live')
      expect(['polite', 'assertive'].includes(ariaLive || '')).toBeTruthy()
    })
    
    test('should have accessible form error messages', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      await page.getByRole('button', { name: /create service/i }).click()
      
      // Submit empty form
      await page.getByRole('button', { name: /create/i }).click()
      
      // Check for error messages
      const errors = page.locator('[role="alert"]')
      await expect(errors).toHaveCount(1)
      
      // Errors should be associated with inputs
      const errorText = await errors.first().textContent()
      expect(errorText).toBeTruthy()
    })
    
    test('should have accessible loading states', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      
      // Check for loading indicators
      const loadingElements = page.locator('[aria-busy="true"], [role="status"]')
      
      if (await loadingElements.count() > 0) {
        // Should have accessible text
        const loadingText = await loadingElements.first().getAttribute('aria-label') ||
                          await loadingElements.first().textContent()
        expect(loadingText).toContain('Loading')
      }
    })
  })
  
  test.describe('Color Contrast', () => {
    test('should have sufficient color contrast for text', async ({ page }) => {
      await page.goto('/')
      
      // Check a sample of text elements
      const textElements = await page.$$eval('p, span, div, a, button', elements => {
        return elements.slice(0, 10).map(el => {
          const styles = window.getComputedStyle(el)
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight
          }
        })
      })
      
      // Basic check that text has color defined
      for (const element of textElements) {
        expect(element.color).not.toBe('rgba(0, 0, 0, 0)')
      }
    })
    
    test('should support high contrast mode', async ({ page }) => {
      await page.goto('/')
      
      // Emulate high contrast
      await page.emulateMedia({ colorScheme: 'dark' })
      
      // Page should still be functional
      await expect(page.getByRole('heading')).toBeVisible()
      await expect(page.getByRole('link')).toHaveCount(1)
    })
  })
  
  test.describe('Responsive Design', () => {
    test('should be usable on mobile with touch', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/dashboard')
      
      // Check touch targets are large enough
      const buttons = page.getByRole('button')
      const firstButton = buttons.first()
      
      if (await firstButton.count() > 0) {
        const box = await firstButton.boundingBox()
        
        // Touch targets should be at least 44x44 pixels
        expect(box?.width).toBeGreaterThanOrEqual(44)
        expect(box?.height).toBeGreaterThanOrEqual(44)
      }
    })
    
    test('should have readable text on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')
      
      // Check font sizes
      const fontSize = await page.evaluate(() => {
        const body = document.body
        const styles = window.getComputedStyle(body)
        return parseInt(styles.fontSize)
      })
      
      // Base font should be at least 14px on mobile
      expect(fontSize).toBeGreaterThanOrEqual(14)
    })
  })
  
  test.describe('Forms and Validation', () => {
    test('should have accessible form labels', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/profile/edit')
      
      // Check all form inputs have labels
      const inputs = page.locator('input:not([type="hidden"]), select, textarea')
      const count = await inputs.count()
      
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i)
        const id = await input.getAttribute('id')
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`)
          const hasLabel = await label.count() > 0
          const ariaLabel = await input.getAttribute('aria-label')
          
          expect(hasLabel || ariaLabel).toBeTruthy()
        }
      }
    })
    
    test('should announce form validation errors', async ({ page }) => {
      await page.goto('/signin')
      
      // Submit invalid email
      await page.getByPlaceholder(/email/i).fill('invalid')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Error should be announced
      const error = page.getByRole('alert')
      await expect(error).toBeVisible()
      
      // Error should be associated with input
      const input = page.getByPlaceholder(/email/i)
      const describedBy = await input.getAttribute('aria-describedby')
      
      if (describedBy) {
        const errorElement = page.locator(`#${describedBy}`)
        await expect(errorElement).toBeVisible()
      }
    })
    
    test('should indicate required fields', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      await page.getByRole('button', { name: /create service/i }).click()
      
      // Check required fields are marked
      const requiredInputs = page.locator('[required], [aria-required="true"]')
      await expect(requiredInputs).toHaveCount(1)
      
      // Check visual indicator
      const labels = page.locator('label:has-text("*")')
      await expect(labels).toHaveCount(1)
    })
  })
  
  test.describe('Tables and Data', () => {
    test('should have accessible tables', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/members')
      
      // Check table structure
      const table = page.getByRole('table')
      await expect(table).toBeVisible()
      
      // Should have headers
      const headers = page.getByRole('columnheader')
      await expect(headers).toHaveCount(1)
      
      // Headers should have scope
      const firstHeader = headers.first()
      const scope = await firstHeader.getAttribute('scope')
      expect(scope).toBe('col')
    })
    
    test('should have sortable column indicators', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/members')
      
      // Check sortable columns
      const sortableHeaders = page.getByRole('columnheader').filter({
        has: page.locator('[aria-sort]')
      })
      
      if (await sortableHeaders.count() > 0) {
        const ariaSort = await sortableHeaders.first().getAttribute('aria-sort')
        expect(['none', 'ascending', 'descending'].includes(ariaSort || '')).toBeTruthy()
      }
    })
  })
  
  test.describe('Images and Media', () => {
    test('should have alt text for images', async ({ page }) => {
      await page.goto('/')
      
      // Check all images have alt text
      const images = page.locator('img')
      const count = await images.count()
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i)
        const alt = await img.getAttribute('alt')
        
        // Should have alt attribute (can be empty for decorative)
        expect(alt !== null).toBeTruthy()
      }
    })
    
    test('should mark decorative images appropriately', async ({ page }) => {
      await page.goto('/')
      
      // Check for decorative images
      const decorativeImages = page.locator('img[alt=""], [role="presentation"], [aria-hidden="true"]')
      
      // Decorative images should not have meaningful alt text
      const count = await decorativeImages.count()
      for (let i = 0; i < count; i++) {
        const img = decorativeImages.nth(i)
        const alt = await img.getAttribute('alt')
        expect(alt === '' || alt === null).toBeTruthy()
      }
    })
  })
  
  test.describe('Error Recovery', () => {
    test('should provide clear error messages', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto('/admin')
      
      // Should show clear error or redirect
      const url = page.url()
      expect(url).toContain('signin')
      
      // Should have message explaining why
      await expect(page.getByText(/sign in required|please sign in/i)).toBeVisible()
    })
    
    test('should handle 404 pages accessibly', async ({ page }) => {
      await page.goto('/non-existent-page')
      
      // Should have clear 404 message
      await expect(page.getByRole('heading', { name: /404|not found/i })).toBeVisible()
      
      // Should provide way back
      await expect(page.getByRole('link', { name: /home|back/i })).toBeVisible()
    })
  })
  
  test.describe('Axe Accessibility Tests', () => {
    test('should pass axe accessibility checks on homepage', async ({ page }) => {
      await page.goto('/')
      await injectAxe(page)
      
      const violations = await getViolations(page, undefined, {
        detailedReport: true,
        detailedReportOptions: {
          html: true
        }
      })
      
      expect(violations).toHaveLength(0)
    })
    
    test('should pass axe checks on dashboard', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/dashboard')
      await injectAxe(page)
      
      const violations = await getViolations(page, undefined, {
        detailedReport: true,
        detailedReportOptions: {
          html: true
        }
      })
      
      expect(violations).toHaveLength(0)
    })
    
    test('should pass axe checks on forms', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      await page.getByRole('button', { name: /create service/i }).click()
      
      await injectAxe(page)
      
      const violations = await getViolations(page, undefined, {
        detailedReport: true,
        detailedReportOptions: {
          html: true
        }
      })
      
      expect(violations).toHaveLength(0)
    })
  })
})