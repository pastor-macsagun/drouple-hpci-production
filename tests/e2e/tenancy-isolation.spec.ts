import { test, expect } from '@playwright/test'

test.describe('Tenancy Isolation @tenancy', () => {
  // Setup different church contexts
  const manilaContext = {
    churchId: 'clxtest002',
    churchName: 'Manila',
    adminEmail: 'admin.manila@test.com',
    memberEmail: 'member1@test.com',
  }
  
  const cebuContext = {
    churchId: 'clxtest003',
    churchName: 'Cebu',
    adminEmail: 'admin.cebu@test.com',
    memberEmail: 'member5@test.com',
  }
  
  test.describe('Service Isolation', () => {
    test('Manila admin cannot see Cebu services', async ({ page, context }) => {
      // Login as Manila admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      
      // Should only see Manila services
      const services = page.getByRole('row')
      const count = await services.count()
      
      for (let i = 1; i < count; i++) { // Skip header
        const churchCell = await services.nth(i).getByTestId('service-church').textContent()
        expect(churchCell).toBe('Manila')
      }
      
      // Should NOT see Cebu services
      await expect(page.getByText('Cebu Sunday Service')).not.toBeVisible()
    })
    
    test('Cebu admin cannot see Manila services', async ({ page, context }) => {
      // Login as Cebu admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-cebu-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      
      // Should only see Cebu services
      const services = page.getByRole('row')
      const count = await services.count()
      
      for (let i = 1; i < count; i++) {
        const churchCell = await services.nth(i).getByTestId('service-church').textContent()
        expect(churchCell).toBe('Cebu')
      }
      
      // Should NOT see Manila services
      await expect(page.getByText('Manila Sunday Service')).not.toBeVisible()
    })
    
    test('Super admin can see all church services', async ({ page, context }) => {
      // Login as super admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-super-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      
      // Should see both Manila and Cebu services
      await expect(page.getByText('Manila')).toBeVisible()
      await expect(page.getByText('Cebu')).toBeVisible()
      
      // Can filter by church
      await page.getByLabel(/church/i).selectOption('Manila')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // Now only Manila visible
      await expect(page.getByText('Manila')).toBeVisible()
      await expect(page.getByText('Cebu')).not.toBeVisible()
    })
  })
  
  test.describe('LifeGroup Isolation', () => {
    test('Manila member cannot see Cebu life groups', async ({ page, context }) => {
      // Login as Manila member
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/lifegroups')
      
      // Should only see Manila life groups
      await expect(page.getByText('Manila Youth Group')).toBeVisible()
      await expect(page.getByText('Manila Singles')).toBeVisible()
      
      // Should NOT see Cebu life groups
      await expect(page.getByText('Cebu Youth Group')).not.toBeVisible()
      await expect(page.getByText('Cebu Couples')).not.toBeVisible()
    })
    
    test('Cannot join life group from different church', async ({ page, context }) => {
      // Manila member tries to access Cebu group directly
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      // Try direct URL to Cebu life group
      await page.goto('/lifegroups/cebu-youth-group-id')
      
      // Should show error or redirect
      await expect(page.getByText(/not found|unauthorized/i)).toBeVisible()
    })
  })
  
  test.describe('Event Isolation', () => {
    test('LOCAL_CHURCH events visible only to same church', async ({ page, context }) => {
      // Login as Manila member
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/events')
      
      // Should see Manila local events
      await expect(page.getByText('Manila Youth Conference')).toBeVisible()
      
      // Should NOT see Cebu local events
      await expect(page.getByText('Cebu Beach Retreat')).not.toBeVisible()
    })
    
    test('WHOLE_CHURCH events visible to all churches', async ({ browser }) => {
      // Test with Manila member
      const manilaContext = await browser.newContext()
      await manilaContext.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      const manilaPage = await manilaContext.newPage()
      
      await manilaPage.goto('/events')
      await expect(manilaPage.getByText('HPCI Anniversary')).toBeVisible()
      
      // Test with Cebu member
      const cebuContext = await browser.newContext()
      await cebuContext.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-cebu-member-token',
        domain: 'localhost',
        path: '/',
      }])
      const cebuPage = await cebuContext.newPage()
      
      await cebuPage.goto('/events')
      await expect(cebuPage.getByText('HPCI Anniversary')).toBeVisible()
      
      // Cleanup
      await manilaContext.close()
      await cebuContext.close()
    })
    
    test('Cannot RSVP to event from different church', async ({ page, context }) => {
      // Manila member tries to RSVP to Cebu event
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      // Try direct URL to Cebu event
      await page.goto('/events/cebu-retreat-id')
      
      // Should show error
      await expect(page.getByText(/not available for your church/i)).toBeVisible()
    })
  })
  
  test.describe('Member Data Isolation', () => {
    test('Manila admin cannot see Cebu members', async ({ page, context }) => {
      // Login as Manila admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/members')
      
      // Should only see Manila members
      const members = page.getByRole('row')
      const count = await members.count()
      
      for (let i = 1; i < count; i++) {
        const churchCell = await members.nth(i).getByTestId('member-church').textContent()
        expect(churchCell).toBe('Manila')
      }
      
      // Search for Cebu member should return no results
      await page.getByPlaceholder(/search/i).fill('cebu.member@test.com')
      await page.getByPlaceholder(/search/i).press('Enter')
      
      await expect(page.getByText(/no members found/i)).toBeVisible()
    })
    
    test('Cannot view profile of member from different church', async ({ page, context }) => {
      // Manila member tries to view Cebu member profile
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      // Try direct URL to Cebu member profile
      await page.goto('/members/cebu-member-id')
      
      // Should show error or redirect
      await expect(page.getByText(/not found|unauthorized/i)).toBeVisible()
    })
  })
  
  test.describe('Pathway Isolation', () => {
    test('Pathways are church-specific', async ({ page, context }) => {
      // Login as Manila member
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/pathways')
      
      // Should see Manila pathways
      await expect(page.getByText('Manila ROOTS')).toBeVisible()
      
      // Should NOT see Cebu pathways
      await expect(page.getByText('Cebu ROOTS')).not.toBeVisible()
    })
    
    test('Cannot enroll in pathway from different church', async ({ page, context }) => {
      // Manila member tries to enroll in Cebu pathway
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      // Try direct URL to Cebu pathway
      await page.goto('/pathways/cebu-roots-id')
      
      // Should show error
      await expect(page.getByText(/not found|unauthorized/i)).toBeVisible()
    })
  })
  
  test.describe('Check-In Isolation', () => {
    test('Can only check in to own church services', async ({ page, context }) => {
      // Login as Manila member
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/checkin')
      
      // Should only see Manila services
      await expect(page.getByText('Manila Sunday Service')).toBeVisible()
      
      // Should NOT see Cebu services
      await expect(page.getByText('Cebu Sunday Service')).not.toBeVisible()
    })
  })
  
  test.describe('Message Isolation', () => {
    test('Cannot send message to member from different church', async ({ page, context }) => {
      // Login as Manila member
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/messages/compose')
      
      // Search for recipient
      await page.getByPlaceholder(/search recipient/i).fill('cebu')
      
      // Should not find Cebu members
      await expect(page.getByText(/no members found/i)).toBeVisible()
    })
    
    test('Broadcasts respect church boundaries', async ({ page, context }) => {
      // Login as Manila admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/messages/broadcast')
      
      // Create broadcast
      await page.getByLabel(/subject/i).fill('Manila Announcement')
      await page.getByLabel(/message/i).fill('This is for Manila members only')
      await page.getByRole('button', { name: /send broadcast/i }).click()
      
      // Check recipient count
      await expect(page.getByText(/sent to \d+ manila members/i)).toBeVisible()
    })
  })
  
  test.describe('Report Isolation', () => {
    test('Reports show only own church data', async ({ page, context }) => {
      // Login as Manila admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/reports')
      
      // View attendance report
      await page.getByRole('link', { name: /attendance report/i }).click()
      
      // Should only show Manila data
      await expect(page.getByText(/manila attendance/i)).toBeVisible()
      
      // Stats should be Manila-specific
      const totalMembers = await page.getByTestId('total-members').textContent()
      expect(parseInt(totalMembers || '0')).toBeLessThan(200) // Not all churches combined
    })
    
    test('Super admin can view cross-church reports', async ({ page, context }) => {
      // Login as super admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-super-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/super/reports')
      
      // Should see global stats
      await expect(page.getByText(/all churches/i)).toBeVisible()
      
      // Can filter by church
      await page.getByLabel(/church/i).selectOption('Manila')
      await page.getByRole('button', { name: /generate report/i }).click()
      
      // Now shows Manila-specific
      await expect(page.getByText(/manila report/i)).toBeVisible()
    })
  })
  
  test.describe('Direct URL Access Prevention', () => {
    test('Cannot access cross-tenant resources via direct URL', async ({ page, context }) => {
      // Login as Manila member
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-member-token',
        domain: 'localhost',
        path: '/',
      }])
      
      const cebuResources = [
        '/services/cebu-service-id',
        '/lifegroups/cebu-group-id',
        '/events/cebu-event-id',
        '/members/cebu-member-id',
        '/pathways/cebu-pathway-id',
      ]
      
      for (const url of cebuResources) {
        await page.goto(url)
        await expect(page.getByText(/not found|unauthorized|not available/i)).toBeVisible()
      }
    })
  })
  
  test.describe('Data Creation Isolation', () => {
    test('Created data automatically assigned to user church', async ({ page, context }) => {
      // Login as Manila admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/services')
      
      // Create new service
      await page.getByRole('button', { name: /create service/i }).click()
      await page.getByLabel(/service name/i).fill('Test Service')
      await page.getByLabel(/date/i).fill('2025-02-01')
      await page.getByLabel(/time/i).fill('10:00')
      
      // Church field should be pre-selected and disabled for non-super admin
      const churchField = page.getByLabel(/church/i)
      await expect(churchField).toHaveValue('Manila')
      await expect(churchField).toBeDisabled()
      
      await page.getByRole('button', { name: /create/i }).click()
      
      // Service should appear in Manila list
      await expect(page.getByRole('row', { name: /test service/i })
        .getByTestId('service-church')).toHaveText('Manila')
    })
  })
})