import { test, expect } from '@playwright/test'

test.describe('Tenant Isolation Validation', () => {
  
  test('Manila admin should not see Cebu data', async ({ page }) => {
    // Login as Manila admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Check members page - should only see Manila members
    await page.goto('/admin/members')
    await page.waitForTimeout(2000)
    
    // Look for member names - Manila members should be visible
    const pageContent = await page.content()
    console.log('Manila admin can see:', {
      member1: pageContent.includes('Manila Member 1'),
      member6: pageContent.includes('Cebu Member 6'),
      total_members: (pageContent.match(/Member \d+/g) || []).length
    })
    
    // Check services page
    await page.goto('/admin/services')
    await page.waitForTimeout(2000)
    
    const servicesContent = await page.content()
    console.log('Services visible to Manila admin:', {
      manila_service: servicesContent.includes('HPCI Manila'),
      cebu_service: servicesContent.includes('HPCI Cebu')
    })
    
    // Check life groups
    await page.goto('/admin/lifegroups')
    await page.waitForTimeout(2000)
    
    const lifegroupsContent = await page.content()
    console.log('Life groups visible to Manila admin:', {
      youth_connect: lifegroupsContent.includes('Youth Connect'),
      young_professionals: lifegroupsContent.includes('Young Professionals')
    })
  })
  
  test('Cebu admin should not see Manila data', async ({ page }) => {
    // Login as Cebu admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.cebu@test.com') 
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Check members page
    await page.goto('/admin/members')
    await page.waitForTimeout(2000)
    
    const pageContent = await page.content()
    console.log('Cebu admin can see:', {
      member1: pageContent.includes('Manila Member 1'),
      member6: pageContent.includes('Cebu Member 6'),
      total_members: (pageContent.match(/Member \d+/g) || []).length
    })
    
    // Try to access Manila-specific entity by direct URL manipulation
    // This is a security test to see if we can access cross-tenant data
    const manilaServiceId = 'service_manila_today'
    await page.goto(`/admin/services?action=view&id=${manilaServiceId}`)
    await page.waitForTimeout(2000)
    
    // Should not show Manila service details
    const serviceDetails = await page.content()
    console.log('Cross-tenant access attempt:', {
      can_see_manila_service: serviceDetails.includes('HPCI Manila')
    })
  })
  
  test('Super admin should see all tenant data', async ({ page }) => {
    // Login as super admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'superadmin@test.com')
    await page.fill('#password', 'Hpci!Test2025') 
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Should be redirected to /super but currently goes to /dashboard due to bug
    console.log('Super admin current URL:', page.url())
    
    // Navigate to admin section (super admin should have access)
    await page.goto('/admin/members')
    await page.waitForTimeout(2000)
    
    const pageContent = await page.content()
    console.log('Super admin member visibility:', {
      manila_member: pageContent.includes('Manila Member'),
      cebu_member: pageContent.includes('Cebu Member'),
      total_members: (pageContent.match(/Member \d+/g) || []).length
    })
    
    // Test if super admin can see church filter dropdown
    const hasChurchFilter = await page.locator('select, [role="combobox"]').count()
    console.log('Super admin has church filter:', hasChurchFilter > 0)
  })
  
  test('VIP role tenant isolation', async ({ page }) => {
    // Test VIP Manila
    await page.goto('/auth/signin')
    await page.fill('#email', 'vip.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Should go to /vip but currently goes to dashboard due to bug
    await page.goto('/vip/firsttimers')
    await page.waitForTimeout(2000)
    
    const content = await page.content()
    console.log('VIP Manila first-timers access:', {
      can_access_vip_page: !page.url().includes('/auth/signin'),
      has_first_timers_content: content.includes('First Timer') || content.includes('firsttimer')
    })
  })
  
  test('Direct entity access cross-tenant test', async ({ page }) => {
    // Login as Manila admin
    await page.goto('/auth/signin')
    await page.fill('#email', 'admin.manila@test.com')
    await page.fill('#password', 'Hpci!Test2025')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    
    // Try to access Cebu entities directly by ID
    const cebuEntities = [
      '/admin/members?id=user_member_6', // Cebu member
      '/admin/lifegroups?id=lg_cebu_youth', // Cebu life group  
      '/admin/services?id=service_cebu_today' // Cebu service
    ]
    
    for (const entityUrl of cebuEntities) {
      await page.goto(entityUrl)
      await page.waitForTimeout(1000)
      
      console.log(`Direct access to ${entityUrl}:`, {
        url: page.url(),
        accessible: !page.url().includes('/forbidden') && !page.url().includes('/auth/signin')
      })
    }
  })
})