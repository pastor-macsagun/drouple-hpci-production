import { test, expect } from './fixtures/auth'

/**
 * Comprehensive User Journey Test
 * Tests the complete flow: member signup → pathway enrollment → event RSVP → check-in → attendance
 */

test.describe('Comprehensive User Journey', () => {
  // Test data
  const testEmail = `journey_test_${Date.now()}@test.com`
  const testName = 'Journey Test User'
  let memberId: string
  let eventId: string
  let pathwayId: string
  let serviceId: string

  test('should complete full member lifecycle journey', async ({ page, churchAdminAuth }) => {
    // STEP 1: Admin creates a new member
    test.step('Admin creates new member', async () => {
      await page.goto('/admin/members')
      await expect(page.getByRole('heading', { name: /members/i })).toBeVisible()

      // Click create member button
      await page.getByTestId('create-member-button').click()
      await expect(page.getByRole('dialog')).toBeVisible()

      // Fill member form
      await page.getByTestId('member-name-input').fill(testName)
      await page.getByTestId('member-email-input').fill(testEmail)
      await page.getByTestId('member-role-select').selectOption('MEMBER')
      
      // Submit form
      await page.getByTestId('create-member-submit').click()

      // Verify success
      await expect(page.getByText(/member created successfully/i)).toBeVisible()
      await expect(page.getByText(testEmail)).toBeVisible()

      // Extract member ID from URL or page content for later use
      memberId = await page.getByText(testEmail).first().getAttribute('data-member-id') || 'unknown'
    })

    // STEP 2: Member signs in and explores pathways
    test.step('Member signs in and enrolls in pathway', async () => {
      // Switch to member context (admin logs out, member logs in)
      await page.goto('/auth/signin')
      
      await page.getByTestId('email-input').fill(testEmail)
      await page.getByTestId('password-input').fill('Hpci!Test2025') // Seeded password
      await page.getByTestId('signin-submit').click()

      // Should redirect to dashboard for new member
      await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()

      // Navigate to pathways
      await page.goto('/pathways')
      await expect(page.getByRole('heading', { name: /pathways/i })).toBeVisible()

      // Find and enroll in ROOTS pathway (auto-enrollment pathway for new believers)
      const rootsPathway = page.getByTestId('pathway-card').filter({ hasText: /roots/i }).first()
      await expect(rootsPathway).toBeVisible()
      
      await rootsPathway.getByTestId('enroll-pathway-button').click()
      await expect(page.getByText(/enrolled successfully/i)).toBeVisible()

      // Extract pathway ID
      pathwayId = await rootsPathway.getAttribute('data-pathway-id') || 'unknown'
    })

    // STEP 3: Member RSVPs to an event
    test.step('Member RSVPs to upcoming event', async () => {
      await page.goto('/events')
      await expect(page.getByRole('heading', { name: /events/i })).toBeVisible()

      // Find an upcoming event
      const eventCard = page.getByTestId('event-card').first()
      await expect(eventCard).toBeVisible()

      // Click RSVP button
      await eventCard.getByTestId('rsvp-button').click()
      await expect(page.getByText(/rsvp confirmed/i)).toBeVisible()

      // Verify RSVP status changed
      await expect(eventCard.getByText(/going/i)).toBeVisible()

      // Extract event ID
      eventId = await eventCard.getAttribute('data-event-id') || 'unknown'
    })

    // STEP 4: Member checks in to Sunday service
    test.step('Member checks in to Sunday service', async () => {
      await page.goto('/checkin')
      await expect(page.getByRole('heading', { name: /check.*in/i })).toBeVisible()

      // Should see today's service
      const serviceCard = page.getByTestId('service-card').first()
      await expect(serviceCard).toBeVisible()

      // Check in to service
      await serviceCard.getByTestId('checkin-button').click()
      await expect(page.getByText(/checked in successfully/i)).toBeVisible()

      // Verify check-in status
      await expect(serviceCard.getByText(/checked in/i)).toBeVisible()

      // Extract service ID
      serviceId = await serviceCard.getAttribute('data-service-id') || 'unknown'
    })

    // STEP 5: Admin verifies member activity and progress
    test.step('Admin verifies member activity and progress', async () => {
      // Switch back to admin context
      await page.goto('/auth/signin')
      await page.getByTestId('email-input').fill('admin.manila@test.com')
      await page.getByTestId('password-input').fill('Hpci!Test2025')
      await page.getByTestId('signin-submit').click()

      // Check member in admin panel
      await page.goto('/admin/members')
      await page.getByTestId('search-input').fill(testEmail)
      await page.getByTestId('search-button').click()

      const memberRow = page.getByText(testEmail).first()
      await expect(memberRow).toBeVisible()

      // Verify member details
      await memberRow.click()
      await expect(page.getByText(testName)).toBeVisible()
      await expect(page.getByText('MEMBER')).toBeVisible()

      // Check pathway enrollment
      await page.goto('/admin/pathways')
      const pathwayRow = page.getByTestId('pathway-row').filter({ hasText: /roots/i })
      await pathwayRow.getByTestId('manage-pathway-button').click()
      
      // Should see the member enrolled
      await expect(page.getByText(testEmail)).toBeVisible()

      // Check event RSVP
      await page.goto('/admin/events')
      const eventRow = page.getByTestId('event-row').first()
      await eventRow.getByTestId('manage-event-button').click()
      
      // Should see the member in attendees
      await expect(page.getByText(testEmail)).toBeVisible()

      // Check service attendance
      await page.goto('/admin/services')
      const serviceRow = page.getByTestId('service-row').first()
      await serviceRow.getByTestId('view-service-button').click()
      
      // Should see the member in check-ins
      await expect(page.getByText(testEmail)).toBeVisible()
    })

    // STEP 6: Verify data consistency across all systems
    test.step('Verify data consistency and cleanup', async () => {
      // Final verification that all data is properly linked
      await page.goto('/admin/reports')
      
      // Member should appear in various reports
      const memberReports = page.getByText(testEmail)
      await expect(memberReports.first()).toBeVisible()

      // Clean up test data (optional - depends on test strategy)
      // Note: In a real test, you might want to keep this data or clean it up
      // For now, we'll just verify everything is connected properly
      
      console.log('Journey test completed successfully:')
      console.log(`- Member ID: ${memberId}`)
      console.log(`- Pathway ID: ${pathwayId}`)
      console.log(`- Event ID: ${eventId}`)
      console.log(`- Service ID: ${serviceId}`)
    })
  })

  test('should handle edge cases in user journey', async ({ page, churchAdminAuth }) => {
    const edgeTestEmail = `edge_test_${Date.now()}@test.com`

    test.step('Member tries to RSVP to full capacity event', async () => {
      // Create member
      await page.goto('/admin/members')
      await page.getByTestId('create-member-button').click()
      await page.getByTestId('member-name-input').fill('Edge Test User')
      await page.getByTestId('member-email-input').fill(edgeTestEmail)
      await page.getByTestId('member-role-select').selectOption('MEMBER')
      await page.getByTestId('create-member-submit').click()

      // Switch to member context
      await page.goto('/auth/signin')
      await page.getByTestId('email-input').fill(edgeTestEmail)
      await page.getByTestId('password-input').fill('Hpci!Test2025')
      await page.getByTestId('signin-submit').click()

      // Try to RSVP to an event
      await page.goto('/events')
      const eventCard = page.getByTestId('event-card').first()
      
      // If event is at capacity, should see waitlist option
      await eventCard.getByTestId('rsvp-button').click()
      
      // Should either confirm RSVP or add to waitlist
      const rsvpResult = page.locator('text=/rsvp confirmed|added to waitlist/i')
      await expect(rsvpResult).toBeVisible()
    })

    test.step('Member tries duplicate check-in', async () => {
      await page.goto('/checkin')
      const serviceCard = page.getByTestId('service-card').first()
      
      // First check-in
      await serviceCard.getByTestId('checkin-button').click()
      await expect(page.getByText(/checked in successfully/i)).toBeVisible()

      // Try duplicate check-in - should show already checked in
      await page.reload()
      await expect(serviceCard.getByText(/already checked in/i)).toBeVisible()
    })

    test.step('Member pathway progress tracking', async () => {
      await page.goto('/pathways')
      
      // Should show enrolled pathways with progress
      const pathwayCard = page.getByTestId('enrolled-pathway-card').first()
      await expect(pathwayCard).toBeVisible()
      
      // Progress should be tracked
      const progressIndicator = pathwayCard.getByTestId('progress-indicator')
      await expect(progressIndicator).toBeVisible()
    })
  })
})