import { test, expect } from '@playwright/test'
import { prisma } from '../lib/prisma'
import { UserRole, EventScope } from '@prisma/client'

test.describe('Events Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up test data
    await prisma.eventRsvp.deleteMany({})
    await prisma.event.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.localChurch.deleteMany({})
    await prisma.church.deleteMany({})

    // Create test church and local church
    const church = await prisma.church.create({
      data: {
        name: 'Test Church',
        description: 'Test church for e2e tests',
      },
    })

    const localChurch = await prisma.localChurch.create({
      data: {
        name: 'Main Campus',
        churchId: church.id,
        city: 'Test City',
      },
    })

    // Create test users
    await prisma.user.createMany({
      data: [
        {
          id: 'admin1',
          email: 'admin@test.com',
          name: 'Admin User',
          role: UserRole.ADMIN,
          tenantId: localChurch.id,
        },
        {
          id: 'member1',
          email: 'member1@test.com',
          name: 'Member One',
          role: UserRole.MEMBER,
          tenantId: localChurch.id,
        },
        {
          id: 'member2',
          email: 'member2@test.com',
          name: 'Member Two',
          role: UserRole.MEMBER,
          tenantId: localChurch.id,
        },
        {
          id: 'member3',
          email: 'member3@test.com',
          name: 'Member Three',
          role: UserRole.MEMBER,
          tenantId: localChurch.id,
        },
      ],
    })

    // Create test event with capacity of 2
    await prisma.event.create({
      data: {
        id: 'event1',
        name: 'Test Event',
        description: 'Test event for e2e tests',
        startDateTime: new Date('2024-06-01T09:00:00Z'),
        endDateTime: new Date('2024-06-01T17:00:00Z'),
        location: 'Main Hall',
        capacity: 2,
        scope: EventScope.LOCAL_CHURCH,
        localChurchId: localChurch.id,
        requiresPayment: true,
        feeAmount: 25.00,
        visibleToRoles: [],
      },
    })
  })

  test('member can RSVP to event', async ({ page }) => {
    // Mock authentication as member1
    await page.goto('/api/auth/signin')
    await page.evaluate(() => {
      localStorage.setItem('test-user', 'member1')
    })

    // Navigate to events page
    await page.goto('/events')
    await expect(page.locator('h1')).toContainText('Events')
    
    // Click on the test event
    await page.click('text=Test Event')
    await expect(page.locator('h1')).toContainText('Test Event')
    
    // RSVP to the event
    await page.click('button:has-text("RSVP to Event")')
    await expect(page.locator('text=You\'re Going!')).toBeVisible()
    await expect(page.locator('text=Payment Pending')).toBeVisible()
    
    // Verify attendee count updated
    await expect(page.locator('text=1 / 2 attending')).toBeVisible()
  })

  test('waitlist and automatic promotion', async ({ page, context }) => {
    // First member RSVPs
    const page1 = await context.newPage()
    await page1.goto('/api/auth/signin')
    await page1.evaluate(() => {
      localStorage.setItem('test-user', 'member1')
    })
    await page1.goto('/events/event1')
    await page1.click('button:has-text("RSVP to Event")')
    await expect(page1.locator('text=You\'re Going!')).toBeVisible()

    // Second member RSVPs
    const page2 = await context.newPage()
    await page2.goto('/api/auth/signin')
    await page2.evaluate(() => {
      localStorage.setItem('test-user', 'member2')
    })
    await page2.goto('/events/event1')
    await page2.click('button:has-text("RSVP to Event")')
    await expect(page2.locator('text=You\'re Going!')).toBeVisible()
    
    // Event should now be full
    await expect(page2.locator('text=2 / 2 attending')).toBeVisible()
    await expect(page2.locator('text=Full')).toBeVisible()

    // Third member joins waitlist
    const page3 = await context.newPage()
    await page3.goto('/api/auth/signin')
    await page3.evaluate(() => {
      localStorage.setItem('test-user', 'member3')
    })
    await page3.goto('/events/event1')
    await expect(page3.locator('button:has-text("Join Waitlist")')).toBeVisible()
    await page3.click('button:has-text("Join Waitlist")')
    await expect(page3.locator('text=You\'re on the Waitlist')).toBeVisible()
    await expect(page3.locator('text=1 on waitlist')).toBeVisible()

    // First member cancels RSVP
    await page1.reload()
    await page1.click('button:has-text("Cancel RSVP")')
    await expect(page1.locator('button:has-text("RSVP to Event")')).toBeVisible()

    // Third member should be automatically promoted
    await page3.reload()
    await expect(page3.locator('text=You\'re Going!')).toBeVisible()
    await expect(page3.locator('text=You\'re on the Waitlist')).not.toBeVisible()
  })

  test('admin can mark attendee as paid', async ({ page }) => {
    // Add an RSVP
    await prisma.eventRsvp.create({
      data: {
        eventId: 'event1',
        userId: 'member1',
        status: 'GOING',
        hasPaid: false,
      },
    })

    // Mock authentication as admin
    await page.goto('/api/auth/signin')
    await page.evaluate(() => {
      localStorage.setItem('test-user', 'admin1')
    })

    // Navigate to admin event page
    await page.goto('/admin/events/event1')
    await expect(page.locator('h1')).toContainText('Test Event')
    
    // Mark attendee as paid
    await expect(page.locator('text=Member One')).toBeVisible()
    await page.click('button:has-text("Mark Paid")')
    await expect(page.locator('text=Paid').first()).toBeVisible()
    
    // Verify payment stats updated
    await expect(page.locator('text=Payment Stats')).toBeVisible()
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=$25.00')).toBeVisible()
  })

  test('CSV export includes all attendees', async ({ page }) => {
    // Add RSVPs
    await prisma.eventRsvp.createMany({
      data: [
        {
          eventId: 'event1',
          userId: 'member1',
          status: 'GOING',
          hasPaid: true,
        },
        {
          eventId: 'event1',
          userId: 'member2',
          status: 'WAITLIST',
          hasPaid: false,
        },
      ],
    })

    // Mock authentication as admin
    await page.goto('/api/auth/signin')
    await page.evaluate(() => {
      localStorage.setItem('test-user', 'admin1')
    })

    // Navigate to admin event page
    await page.goto('/admin/events/event1')
    
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    await page.click('button:has-text("Export Attendees")')
    
    // Wait for download
    const download = await downloadPromise
    const content = await download.createReadStream()
    const text = await streamToString(content)
    
    // Verify CSV content
    expect(text).toContain('Name,Email,Status,Paid,RSVP Date')
    expect(text).toContain('Member One,member1@test.com,GOING,Yes')
    expect(text).toContain('Member Two,member2@test.com,WAITLIST,No')
  })

  test('role-based visibility filtering', async ({ page }) => {
    // Create leader-only event
    await prisma.event.create({
      data: {
        id: 'event2',
        name: 'Leaders Only Event',
        startDateTime: new Date('2024-07-01T09:00:00Z'),
        endDateTime: new Date('2024-07-01T17:00:00Z'),
        capacity: 10,
        scope: EventScope.LOCAL_CHURCH,
        localChurchId: 'localchurch1',
        visibleToRoles: [UserRole.LEADER, UserRole.ADMIN],
      },
    })

    // Member shouldn't see leader-only event
    await page.goto('/api/auth/signin')
    await page.evaluate(() => {
      localStorage.setItem('test-user', 'member1')
    })
    await page.goto('/events')
    await expect(page.locator('text=Test Event')).toBeVisible()
    await expect(page.locator('text=Leaders Only Event')).not.toBeVisible()

    // Admin should see all events
    await page.evaluate(() => {
      localStorage.setItem('test-user', 'admin1')
    })
    await page.reload()
    await expect(page.locator('text=Test Event')).toBeVisible()
    await expect(page.locator('text=Leaders Only Event')).toBeVisible()
  })

  test('event scope visibility', async ({ page }) => {
    // Create whole church event
    await prisma.event.create({
      data: {
        id: 'event3',
        name: 'Whole Church Event',
        startDateTime: new Date('2024-08-01T09:00:00Z'),
        endDateTime: new Date('2024-08-01T17:00:00Z'),
        capacity: 100,
        scope: EventScope.WHOLE_CHURCH,
        visibleToRoles: [],
      },
    })

    // Member from any church should see whole church event
    await page.goto('/api/auth/signin')
    await page.evaluate(() => {
      localStorage.setItem('test-user', 'member1')
    })
    await page.goto('/events')
    await expect(page.locator('text=Test Event')).toBeVisible()
    await expect(page.locator('text=Whole Church Event')).toBeVisible()
    
    // Verify badge indicator
    await expect(page.locator('text=All Churches')).toBeVisible()
  })
})

// Helper function to convert stream to string
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks).toString('utf-8')
}