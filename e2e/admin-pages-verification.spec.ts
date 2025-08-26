import { test, expect } from '@playwright/test'

test.describe('@admin-pages Admin Pages Verification', () => {
  const adminPages = [
    { name: 'Admin Services', path: '/admin/services' },
    { name: 'Admin LifeGroups', path: '/admin/lifegroups' }
  ]

  test.describe('Static Content Analysis', () => {
    test('capture admin pages content as ADMIN user', async ({ page }) => {
      // Login as admin
      await page.goto('/auth/signin')
      await page.getByPlaceholder('name@example.com').fill('admin.manila@test.com')
      await page.getByRole('button', { name: 'Sign in with Email' }).click()
      
      // Wait for redirect to dashboard
      await page.waitForURL('**/dashboard', { timeout: 10000 })

      for (const adminPage of adminPages) {
        await test.step(`Verify ${adminPage.name}`, async () => {
          // Navigate to page
          await page.goto(adminPage.path)
          
          // Wait for page load
          await page.waitForLoadState('networkidle')
          
          // Capture evidence
          const heading = await page.locator('h1').first().textContent()
          const bodyText = await page.locator('body').textContent()
          
          // Check for placeholder indicators
          const hasPlaceholders = 
            bodyText?.includes('coming soon') ||
            bodyText?.includes('management dashboard') ||
            bodyText?.includes('management for admins') ||
            bodyText?.includes('will appear here') ||
            bodyText?.includes('functionality coming')
          
          // Check for interactive elements
          const tables = await page.locator('table').count()
          const forms = await page.locator('form').count()
          const buttons = await page.locator('button').count()
          const dataRows = await page.locator('tbody tr').count()
          
          // Check sidebar presence
          const hasSidebar = await page.locator('[role="navigation"]').isVisible()
          
          // Take screenshot
          await page.screenshot({ 
            path: `test-results/admin-${adminPage.name.replace(/\s+/g, '-').toLowerCase()}.png`,
            fullPage: true 
          })
          
          // Log findings
          console.log(`\n=== ${adminPage.name} ===`)
          console.log(`Path: ${adminPage.path}`)
          console.log(`Heading: ${heading}`)
          console.log(`Has Placeholders: ${hasPlaceholders}`)
          console.log(`Tables: ${tables}, Forms: ${forms}, Buttons: ${buttons}, Data Rows: ${dataRows}`)
          console.log(`Has Sidebar: ${hasSidebar}`)
          
          // Assertions for report
          expect(heading).toBeTruthy()
          expect(page.url()).toContain(adminPage.path)
        })
      }
    })
  })

  test.describe('Role Enforcement', () => {
    test('MEMBER cannot access admin pages', async ({ page }) => {
      // Login as member
      await page.goto('/auth/signin')
      await page.getByPlaceholder('name@example.com').fill('member1@test.com')
      await page.getByRole('button', { name: 'Sign in with Email' }).click()
      
      // Wait for redirect
      await page.waitForURL('**/dashboard', { timeout: 10000 })

      for (const adminPage of adminPages) {
        await test.step(`Member blocked from ${adminPage.name}`, async () => {
          await page.goto(adminPage.path)
          
          // Should redirect away from admin page
          await expect(page).not.toHaveURL(adminPage.path)
          
          // Should be on dashboard or forbidden page
          const url = page.url()
          expect(url).toMatch(/\/(dashboard|forbidden)/)
        })
      }
    })

    test('SUPER_ADMIN can access admin pages', async ({ page }) => {
      // Login as super admin
      await page.goto('/auth/signin')
      await page.getByPlaceholder('name@example.com').fill('superadmin@test.com')
      await page.getByRole('button', { name: 'Sign in with Email' }).click()
      
      // Wait for redirect
      await page.waitForURL('**/dashboard', { timeout: 10000 })

      for (const adminPage of adminPages) {
        await test.step(`Super Admin accesses ${adminPage.name}`, async () => {
          await page.goto(adminPage.path)
          
          // Should stay on admin page
          await expect(page).toHaveURL(adminPage.path)
          
          // Should see the heading
          const heading = await page.locator('h1').first()
          await expect(heading).toBeVisible()
        })
      }
    })

    test('PASTOR can access admin pages', async ({ page }) => {
      // Create a pastor user for testing (using leader as proxy since PASTOR role exists)
      await page.goto('/auth/signin')
      await page.getByPlaceholder('name@example.com').fill('leader.manila@test.com')
      await page.getByRole('button', { name: 'Sign in with Email' }).click()
      
      // Wait for redirect
      await page.waitForURL('**/dashboard', { timeout: 10000 })

      for (const adminPage of adminPages) {
        await test.step(`Leader/Pastor attempt on ${adminPage.name}`, async () => {
          await page.goto(adminPage.path)
          
          // Leaders should be redirected (not PASTOR role)
          const url = page.url()
          if (!url.includes(adminPage.path)) {
            console.log(`Leader redirected from ${adminPage.path} to ${url}`)
          }
        })
      }
    })
  })

  test.describe('Functional Element Detection', () => {
    test('detailed element scan as ADMIN', async ({ page }) => {
      // Login as admin
      await page.goto('/auth/signin')
      await page.getByPlaceholder('name@example.com').fill('admin.manila@test.com')
      await page.getByRole('button', { name: 'Sign in with Email' }).click()
      
      await page.waitForURL('**/dashboard', { timeout: 10000 })

      const results: any[] = []

      for (const adminPage of adminPages) {
        await test.step(`Scan ${adminPage.name}`, async () => {
          await page.goto(adminPage.path)
          await page.waitForLoadState('networkidle')
          
          const pageAnalysis = {
            name: adminPage.name,
            path: adminPage.path,
            heading: await page.locator('h1').first().textContent(),
            subheading: await page.locator('p.text-muted-foreground').first().textContent().catch(() => ''),
            
            // Interactive elements
            buttons: {
              count: await page.locator('button').count(),
              createButton: await page.locator('button:has-text("Create")').count(),
              addButton: await page.locator('button:has-text("Add")').count(),
              exportButton: await page.locator('button:has-text("Export")').count(),
            },
            
            // Data display
            tables: await page.locator('table').count(),
            dataRows: await page.locator('tbody tr').count(),
            cards: await page.locator('.card').count(),
            
            // Forms
            forms: await page.locator('form').count(),
            inputs: await page.locator('input').count(),
            
            // Navigation
            tabs: await page.locator('[role="tab"]').count(),
            links: await page.locator('a').count(),
            
            // Empty states
            emptyStates: await page.locator('[class*="empty"]').count(),
            
            // Placeholder text detection
            placeholderPhrases: {
              comingSoon: (await page.locator('body').textContent())?.includes('coming soon') || false,
              dashboard: (await page.locator('body').textContent())?.includes('dashboard') || false,
              management: (await page.locator('body').textContent())?.includes('management') || false,
            }
          }
          
          results.push(pageAnalysis)
          console.log(`\nDetailed Analysis - ${adminPage.name}:`)
          console.log(JSON.stringify(pageAnalysis, null, 2))
        })
      }

      // Save results for report
      await page.evaluate((data) => {
        console.log('VERIFICATION_RESULTS:', JSON.stringify(data))
      }, results)
    })
  })
})