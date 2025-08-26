import { test, expect } from './fixtures/auth'

test.describe('Events @events', () => {
  test.describe('Admin Event Management', () => {
    test('should create a new event', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/events')
      
      // Click create event button
      await page.getByRole('button', { name: /create event/i }).click()
      
      // Fill event details
      await page.getByLabel(/event title/i).fill('Youth Conference 2025')
      await page.getByLabel(/description/i).fill('Annual youth conference with worship and workshops')
      await page.getByLabel(/start date/i).fill('2025-03-15')
      await page.getByLabel(/start time/i).fill('09:00')
      await page.getByLabel(/end date/i).fill('2025-03-15')
      await page.getByLabel(/end time/i).fill('17:00')
      await page.getByLabel(/location/i).fill('Main Auditorium')
      await page.getByLabel(/capacity/i).fill('200')
      await page.getByLabel(/fee/i).fill('500')
      await page.getByLabel(/scope/i).selectOption('LOCAL_CHURCH')
      
      // Select visible roles
      await page.getByRole('checkbox', { name: /members/i }).check()
      await page.getByRole('checkbox', { name: /leaders/i }).check()
      
      // Submit
      await page.getByRole('button', { name: /create event/i }).click()
      
      // Verify event appears
      await expect(page.getByText('Youth Conference 2025')).toBeVisible()
      await expect(page.getByText('Mar 15, 2025')).toBeVisible()
      await expect(page.getByText('0/200')).toBeVisible() // Attendees/Capacity
    })
    
    test('should view event details and attendees', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/events')
      
      // Click on an event
      await page.getByRole('row', { name: /youth conference/i }).click()
      
      // Modal should open
      const modal = page.getByRole('dialog')
      await expect(modal).toBeVisible()
      
      // Check details
      await expect(modal.getByRole('heading', { name: /event details/i })).toBeVisible()
      await expect(modal.getByText(/attendees/i)).toBeVisible()
      await expect(modal.getByText(/waitlist/i)).toBeVisible()
      await expect(modal.getByText(/revenue/i)).toBeVisible()
      
      // View attendees tab
      await modal.getByRole('tab', { name: /attendees/i }).click()
      await expect(modal.getByRole('heading', { name: /confirmed attendees/i })).toBeVisible()
    })
    
    test('should mark attendee as paid', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/events')
      
      // Open event details
      await page.getByRole('row', { name: /youth conference/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Go to attendees tab
      await modal.getByRole('tab', { name: /attendees/i }).click()
      
      // Find unpaid attendee
      const unpaidRow = modal.getByRole('row').filter({ hasText: /unpaid/i }).first()
      
      // Mark as paid
      await unpaidRow.getByRole('button', { name: /mark paid/i }).click()
      
      // Confirm payment
      await page.getByLabel(/amount/i).fill('500')
      await page.getByLabel(/payment method/i).selectOption('Cash')
      await page.getByRole('button', { name: /confirm payment/i }).click()
      
      // Should show as paid
      await expect(unpaidRow.getByText(/paid/i)).toBeVisible()
    })
    
    test('should export attendees as CSV', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/events')
      
      // Open event details
      await page.getByRole('row', { name: /youth conference/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Setup download promise
      const downloadPromise = page.waitForEvent('download')
      
      // Click export
      await modal.getByRole('button', { name: /export attendees/i }).click()
      
      // Wait for download
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toContain('event-attendees')
      expect(download.suggestedFilename()).toContain('.csv')
    })
    
    test('should cancel an event', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/events')
      
      // Create a test event to cancel
      await page.getByRole('button', { name: /create event/i }).click()
      await page.getByLabel(/event title/i).fill('Event to Cancel')
      await page.getByLabel(/start date/i).fill('2025-04-01')
      await page.getByLabel(/end date/i).fill('2025-04-01')
      await page.getByRole('button', { name: /create event/i }).click()
      
      // Cancel the event
      await page.getByRole('row', { name: /event to cancel/i })
        .getByRole('button', { name: /cancel event/i }).click()
      
      // Confirm cancellation
      await page.getByLabel(/reason/i).fill('Venue not available')
      await page.getByRole('button', { name: /confirm cancel/i }).click()
      
      // Event should show as cancelled
      await expect(page.getByText(/cancelled/i)).toBeVisible()
    })
  })
  
  test.describe('Member RSVP Flow', () => {
    test('should view available events', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      await expect(page.getByRole('heading', { name: /events/i })).toBeVisible()
      
      // Should see event cards
      await expect(page.getByText(/youth conference/i)).toBeVisible()
      await expect(page.getByText(/prayer night/i)).toBeVisible()
      
      // Should show capacity
      await expect(page.getByText(/\d+\/\d+ attending/i)).toBeVisible()
    })
    
    test('should RSVP to an event', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Click on an event
      await page.getByRole('article', { name: /leadership summit/i }).click()
      
      // Should see event details
      await expect(page.getByRole('heading', { name: /leadership summit/i })).toBeVisible()
      await expect(page.getByText(/date.*time/i)).toBeVisible()
      await expect(page.getByText(/location/i)).toBeVisible()
      
      // RSVP
      await page.getByRole('button', { name: /rsvp/i }).click()
      
      // Confirm RSVP
      await page.getByRole('button', { name: /confirm rsvp/i }).click()
      
      await expect(page.getByText(/rsvp confirmed/i)).toBeVisible()
      
      // Button should change
      await expect(page.getByRole('button', { name: /cancel rsvp/i })).toBeVisible()
    })
    
    test('should prevent duplicate RSVP', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Click on event already RSVP'd to
      await page.getByRole('article', { name: /leadership summit/i }).click()
      
      // Should show already registered
      await expect(page.getByRole('button', { name: /cancel rsvp/i })).toBeVisible()
      
      // Should not have RSVP button
      await expect(page.getByRole('button', { name: /^rsvp$/i })).not.toBeVisible()
    })
    
    test('should cancel RSVP', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Find event with RSVP
      await page.getByRole('article', { name: /leadership summit/i }).click()
      
      // Cancel RSVP
      await page.getByRole('button', { name: /cancel rsvp/i }).click()
      
      // Confirm cancellation
      await page.getByRole('button', { name: /confirm cancel/i }).click()
      
      await expect(page.getByText(/rsvp cancelled/i)).toBeVisible()
      
      // Button should change back
      await expect(page.getByRole('button', { name: /^rsvp$/i })).toBeVisible()
    })
    
    test('should view my RSVPs', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Click my events tab
      await page.getByRole('tab', { name: /my events/i }).click()
      
      // Should show events I've RSVP'd to
      await expect(page.getByText(/upcoming events/i)).toBeVisible()
      await expect(page.getByRole('article')).toHaveCount(1) // At least one event
    })
  })
  
  test.describe('Waitlist Management', () => {
    test('should join waitlist when event is full', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Find a full event (capacity reached)
      const fullEvent = page.getByRole('article').filter({ hasText: /100\/100/i })
      await fullEvent.click()
      
      // Should show event is full
      await expect(page.getByText(/event full/i)).toBeVisible()
      
      // Should offer waitlist
      await expect(page.getByRole('button', { name: /join waitlist/i })).toBeVisible()
      
      // Join waitlist
      await page.getByRole('button', { name: /join waitlist/i }).click()
      
      await expect(page.getByText(/added to waitlist/i)).toBeVisible()
      await expect(page.getByText(/waitlist position.*\d+/i)).toBeVisible()
    })
    
    test('should promote from waitlist when spot opens', async ({ page, churchAdminAuth, context }) => {
      await page.goto('/admin/events')
      
      // Open full event
      await page.getByRole('row').filter({ hasText: /100\/100/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Go to attendees
      await modal.getByRole('tab', { name: /attendees/i }).click()
      
      // Cancel an attendee
      await modal.getByRole('row', { name: /john doe/i })
        .getByRole('button', { name: /remove/i }).click()
      
      await page.getByRole('button', { name: /confirm/i }).click()
      
      // Check waitlist tab
      await modal.getByRole('tab', { name: /waitlist/i }).click()
      
      // First person should be promoted
      await expect(modal.getByText(/promoted from waitlist/i)).toBeVisible()
    })
  })
  
  test.describe('Event Visibility and Scope', () => {
    test('should filter events by role visibility', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Should not see leader-only events
      await expect(page.getByText(/leaders retreat/i)).not.toBeVisible()
      
      // Should see member-visible events
      await expect(page.getByText(/community outreach/i)).toBeVisible()
    })
    
    test('should show LOCAL_CHURCH events only to same church', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Manila member should see Manila events
      await expect(page.getByText(/manila youth conference/i)).toBeVisible()
      
      // Should not see Cebu local events
      await expect(page.getByText(/cebu beach retreat/i)).not.toBeVisible()
    })
    
    test('should show WHOLE_CHURCH events to all churches', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Should see whole church events regardless of location
      await expect(page.getByText(/hpci anniversary celebration/i)).toBeVisible()
    })
  })
  
  test.describe('Payment Tracking', () => {
    test('should show payment required for paid events', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Click on paid event
      await page.getByRole('article').filter({ hasText: /₱500/i }).click()
      
      // Should show fee
      await expect(page.getByText(/registration fee.*₱500/i)).toBeVisible()
      
      // RSVP
      await page.getByRole('button', { name: /rsvp/i }).click()
      
      // Should show payment instructions
      await expect(page.getByText(/payment instructions/i)).toBeVisible()
      await expect(page.getByText(/pay at the venue/i)).toBeVisible()
    })
    
    test('should track payment status', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/events')
      
      // Open paid event
      await page.getByRole('row').filter({ hasText: /₱500/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Check revenue summary
      await expect(modal.getByText(/total revenue/i)).toBeVisible()
      await expect(modal.getByText(/paid.*\d+/i)).toBeVisible()
      await expect(modal.getByText(/unpaid.*\d+/i)).toBeVisible()
      
      // Go to attendees
      await modal.getByRole('tab', { name: /attendees/i }).click()
      
      // Should show payment status column
      await expect(modal.getByRole('columnheader', { name: /payment/i })).toBeVisible()
    })
  })
  
  test.describe('Event Filtering and Search', () => {
    test('should search events', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Search
      await page.getByPlaceholder(/search events/i).fill('youth')
      await page.getByPlaceholder(/search events/i).press('Enter')
      
      // Should filter results
      await expect(page.getByText(/youth conference/i)).toBeVisible()
      await expect(page.getByText(/prayer night/i)).not.toBeVisible()
    })
    
    test('should filter by date range', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Set date filter
      await page.getByLabel(/from date/i).fill('2025-03-01')
      await page.getByLabel(/to date/i).fill('2025-03-31')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // Should only show March events
      const events = page.getByRole('article')
      const count = await events.count()
      
      for (let i = 0; i < count; i++) {
        const eventText = await events.nth(i).textContent()
        expect(eventText).toContain('Mar')
      }
    })
    
    test('should filter by event type', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Filter by type
      await page.getByLabel(/event type/i).selectOption('Conference')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // Should only show conferences
      await expect(page.getByText(/conference/i)).toBeVisible()
      await expect(page.getByText(/retreat/i)).not.toBeVisible()
    })
  })
  
  test.describe('Event Calendar View', () => {
    test('should display events in calendar', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Switch to calendar view
      await page.getByRole('button', { name: /calendar view/i }).click()
      
      // Should show calendar
      await expect(page.getByRole('grid', { name: /calendar/i })).toBeVisible()
      
      // Should show events on dates
      await expect(page.getByRole('gridcell').filter({ hasText: /youth conference/i })).toBeVisible()
    })
    
    test('should navigate calendar months', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Switch to calendar view
      await page.getByRole('button', { name: /calendar view/i }).click()
      
      // Navigate to next month
      await page.getByRole('button', { name: /next month/i }).click()
      
      // Month should change
      await expect(page.getByRole('heading', { name: /march 2025/i })).toBeVisible()
      
      // Navigate to previous month
      await page.getByRole('button', { name: /previous month/i }).click()
      
      await expect(page.getByRole('heading', { name: /february 2025/i })).toBeVisible()
    })
  })
  
  test.describe('Event Reminders', () => {
    test('should set event reminder', async ({ page, memberAuth }) => {
      await page.goto('/events')
      
      // Open event with RSVP
      await page.getByRole('article', { name: /youth conference/i }).click()
      
      // Set reminder
      await page.getByRole('button', { name: /set reminder/i }).click()
      
      // Choose reminder time
      await page.getByLabel(/remind me/i).selectOption('1 day before')
      await page.getByRole('button', { name: /save reminder/i }).click()
      
      await expect(page.getByText(/reminder set/i)).toBeVisible()
    })
  })
  
  test.describe('Recurring Events', () => {
    test.skip('should create recurring event', async ({ page, churchAdminAuth }) => {
      // Skip if not implemented
      await page.goto('/admin/events')
      
      await page.getByRole('button', { name: /create event/i }).click()
      
      // Fill basic details
      await page.getByLabel(/event title/i).fill('Weekly Prayer Meeting')
      
      // Enable recurring
      await page.getByRole('checkbox', { name: /recurring event/i }).check()
      
      // Set recurrence
      await page.getByLabel(/repeat/i).selectOption('Weekly')
      await page.getByLabel(/every/i).fill('1')
      await page.getByLabel(/on/i).selectOption('Wednesday')
      await page.getByLabel(/ends/i).selectOption('After')
      await page.getByLabel(/occurrences/i).fill('10')
      
      await page.getByRole('button', { name: /create series/i }).click()
      
      // Should create multiple events
      await expect(page.getByText(/10 events created/i)).toBeVisible()
    })
  })
})