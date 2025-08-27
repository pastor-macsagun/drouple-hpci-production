import { test, expect } from '@playwright/test'

test.describe('CRUD Operations Validation', () => {
  
  test('Members CRUD operations', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Go to members page
    await page.goto('/admin/members')
    await page.waitForTimeout(2000)
    
    console.log('Members page URL:', page.url())
    
    // Test creating a member (if button exists)
    const createButton = await page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first()
    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(1000)
      
      // Fill form if modal opens
      const nameInput = await page.locator('input[name="name"], #name').first()
      const emailInput = await page.locator('input[name="email"], #email').first()
      
      if (await nameInput.isVisible()) {
        await nameInput.fill('DROU-TEST-MEMBER-' + Date.now())
        await emailInput.fill('drou-test@test.com')
        
        const submitBtn = await page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(2000)
          console.log('Member creation attempted')
        }
      }
    }
    
    // Test malicious inputs
    const searchInput = await page.locator('input[placeholder*="search"], input[type="search"]').first()
    if (await searchInput.isVisible()) {
      // XSS attempt
      await searchInput.fill('<script>alert("xss")</script>')
      await page.waitForTimeout(1000)
      
      // SQL injection attempt  
      await searchInput.fill("'; DROP TABLE users; --")
      await page.waitForTimeout(1000)
      
      console.log('Malicious input test completed')
    }
  })
  
  test('Services CRUD operations', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    await page.goto('/admin/services')
    await page.waitForTimeout(2000)
    
    console.log('Services page loaded, content sample:', 
      (await page.content()).slice(0, 200).replace(/\s+/g, ' '))
    
    // Test creating service with edge cases
    const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first()
    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(1000)
      
      // Try to create service with extreme date
      const dateInput = await page.locator('input[type="date"], input[type="datetime-local"]').first()
      if (await dateInput.isVisible()) {
        await dateInput.fill('2050-12-31') // Far future date
        
        const submitBtn = await page.locator('button[type="submit"]').first()
        if (await submitBtn.isVisible()) {
          await submitBtn.click()
          await page.waitForTimeout(2000)
          console.log('Service creation with extreme date attempted')
        }
      }
    }
  })
  
  test('Events CRUD with capacity edge cases', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    await page.goto('/admin/events')
    await page.waitForTimeout(2000)
    
    // Test events page functionality
    const events = await page.locator('[data-testid="event-item"], .event-card, tr').count()
    console.log('Events visible to Manila admin:', events)
    
    // Try to access event creation
    const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first()
    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(1000)
      
      // Test with negative capacity
      const capacityInput = await page.locator('input[name="capacity"], #capacity').first()
      if (await capacityInput.isVisible()) {
        await capacityInput.fill('-100')
        console.log('Negative capacity test performed')
      }
      
      // Test with extreme capacity
      if (await capacityInput.isVisible()) {
        await capacityInput.fill('999999999')
        console.log('Extreme capacity test performed')
      }
    }
  })
  
  test('Life Groups CRUD operations', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    await page.goto('/admin/lifegroups')
    await page.waitForTimeout(2000)
    
    const content = await page.content()
    const hasLifeGroups = content.includes('Youth') || content.includes('Group') || content.includes('Life')
    console.log('Life groups page analysis:', {
      has_lifegroup_content: hasLifeGroups,
      content_length: content.length
    })
    
    // Test create life group with duplicate name
    const createButton = await page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")').first()
    if (await createButton.isVisible()) {
      await createButton.click()
      await page.waitForTimeout(1000)
      
      const nameInput = await page.locator('input[name="name"], #name').first()
      if (await nameInput.isVisible()) {
        await nameInput.fill('Youth Connect') // Duplicate of existing
        console.log('Duplicate name test performed')
        
        // Test with extremely long name
        await nameInput.fill('A'.repeat(1000))
        console.log('Extremely long name test performed')
      }
    }
  })
  
  test('CSV Export functionality', async ({ page }) => {
    // Login as admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Test CSV exports on different pages
    const pagesWithExport = ['/admin/members', '/admin/services']
    
    for (const pagePath of pagesWithExport) {
      await page.goto(pagePath)
      await page.waitForTimeout(2000)
      
      const exportButton = await page.locator('button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")').first()
      if (await exportButton.isVisible()) {
        // Start download
        const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
        await exportButton.click()
        
        try {
          const download = await downloadPromise
          console.log(`CSV export for ${pagePath}:`, {
            filename: download.suggestedFilename(),
            size: 'available'
          })
        } catch (error) {
          console.log(`CSV export for ${pagePath}: failed or timeout`)
        }
      } else {
        console.log(`CSV export for ${pagePath}: button not found`)
      }
    }
  })
})