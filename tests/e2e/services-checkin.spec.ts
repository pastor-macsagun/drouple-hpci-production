import { test, expect } from './fixtures/auth'

test.describe('Services & Check-In @services', () => {
  test.describe('Admin Service Management', () => {
    test('should create a new service', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Click create service button
      await page.getByRole('button', { name: /create service/i }).click()
      
      // Fill in service details
      await page.getByLabel(/service name/i).fill('Sunday Morning Service')
      await page.getByLabel(/date/i).fill('2025-02-01')
      await page.getByLabel(/time/i).fill('09:00')
      await page.getByLabel(/church/i).selectOption('Manila')
      
      // Submit
      await page.getByRole('button', { name: /create/i }).click()
      
      // Verify service appears in list
      await expect(page.getByText('Sunday Morning Service')).toBeVisible()
      await expect(page.getByText('Feb 1, 2025')).toBeVisible()
      await expect(page.getByText('9:00 AM')).toBeVisible()
    })
    
    test('should view service details in drawer', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Click on a service to view details
      await page.getByRole('row', { name: /sunday service/i }).click()
      
      // Drawer should open
      const drawer = page.getByRole('dialog')
      await expect(drawer).toBeVisible()
      
      // Check drawer content
      await expect(drawer.getByRole('heading', { name: /service details/i })).toBeVisible()
      await expect(drawer.getByText(/attendance/i)).toBeVisible()
      await expect(drawer.getByText(/check-ins/i)).toBeVisible()
      
      // Should show recent check-ins
      await expect(drawer.getByRole('heading', { name: /recent check-ins/i })).toBeVisible()
      
      // Close drawer
      await drawer.getByRole('button', { name: /close/i }).click()
      await expect(drawer).not.toBeVisible()
    })
    
    test('should update service details', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Click edit on a service
      await page.getByRole('row', { name: /sunday service/i })
        .getByRole('button', { name: /edit/i }).click()
      
      // Update service name
      await page.getByLabel(/service name/i).clear()
      await page.getByLabel(/service name/i).fill('Sunday Evening Service')
      
      // Update time
      await page.getByLabel(/time/i).clear()
      await page.getByLabel(/time/i).fill('18:00')
      
      // Save changes
      await page.getByRole('button', { name: /save/i }).click()
      
      // Verify updates
      await expect(page.getByText('Sunday Evening Service')).toBeVisible()
      await expect(page.getByText('6:00 PM')).toBeVisible()
    })
    
    test('should delete a service', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Create a test service first
      await page.getByRole('button', { name: /create service/i }).click()
      await page.getByLabel(/service name/i).fill('Test Service to Delete')
      await page.getByLabel(/date/i).fill('2025-02-15')
      await page.getByLabel(/time/i).fill('14:00')
      await page.getByRole('button', { name: /create/i }).click()
      
      // Find and delete the service
      await page.getByRole('row', { name: /test service to delete/i })
        .getByRole('button', { name: /delete/i }).click()
      
      // Confirm deletion
      await page.getByRole('button', { name: /confirm/i }).click()
      
      // Service should be removed
      await expect(page.getByText('Test Service to Delete')).not.toBeVisible()
    })
    
    test('should export service attendance as CSV', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Setup download promise before clicking
      const downloadPromise = page.waitForEvent('download')
      
      // Click export button
      await page.getByRole('button', { name: /export csv/i }).click()
      
      // Wait for download
      const download = await downloadPromise
      
      // Verify download
      expect(download.suggestedFilename()).toContain('service-attendance')
      expect(download.suggestedFilename()).toContain('.csv')
      
      // Verify HTTP 200 status
      const response = await page.waitForResponse(resp => 
        resp.url().includes('/api/services/export') && resp.status() === 200
      )
      expect(response.status()).toBe(200)
    })
  })
  
  test.describe('Member Check-In', () => {
    test('should display check-in page', async ({ page, memberAuth }) => {
      await page.goto('/checkin')
      
      await expect(page.getByRole('heading', { name: /check-in/i })).toBeVisible()
      await expect(page.getByText(/select a service/i)).toBeVisible()
      
      // Should show available services
      await expect(page.getByRole('button', { name: /sunday service/i })).toBeVisible()
    })
    
    test('should successfully check in to service', async ({ page, memberAuth }) => {
      await page.goto('/checkin')
      
      // Select a service
      await page.getByRole('button', { name: /sunday service.*9:00 AM/i }).click()
      
      // Confirm check-in
      await page.getByRole('button', { name: /check in/i }).click()
      
      // Should show success message
      await expect(page.getByText(/successfully checked in/i)).toBeVisible()
      
      // Check-in button should be disabled
      await expect(page.getByRole('button', { name: /already checked in/i })).toBeDisabled()
    })
    
    test('should prevent duplicate check-in', async ({ page, memberAuth }) => {
      await page.goto('/checkin')
      
      // First check-in
      await page.getByRole('button', { name: /sunday service.*9:00 AM/i }).click()
      await page.getByRole('button', { name: /check in/i }).click()
      await expect(page.getByText(/successfully checked in/i)).toBeVisible()
      
      // Try to check in again
      await page.reload()
      await page.getByRole('button', { name: /sunday service.*9:00 AM/i }).click()
      
      // Should show already checked in
      await expect(page.getByRole('button', { name: /already checked in/i })).toBeDisabled()
    })
    
    test('should check in as new believer', async ({ page, memberAuth }) => {
      await page.goto('/checkin')
      
      // Select service
      await page.getByRole('button', { name: /sunday service.*11:00 AM/i }).click()
      
      // Check new believer checkbox
      await page.getByRole('checkbox', { name: /new believer/i }).check()
      
      // Check in
      await page.getByRole('button', { name: /check in/i }).click()
      
      // Should show special welcome message
      await expect(page.getByText(/welcome to the family/i)).toBeVisible()
      
      // Should trigger ROOTS pathway enrollment (verify via navigation)
      await page.goto('/pathways')
      await expect(page.getByText(/roots.*enrolled/i)).toBeVisible()
    })
    
    test('should show check-in history', async ({ page, memberAuth }) => {
      await page.goto('/checkin')
      
      // Click history tab/link
      await page.getByRole('tab', { name: /history/i }).click()
      
      // Should show past check-ins
      await expect(page.getByRole('heading', { name: /check-in history/i })).toBeVisible()
      await expect(page.getByText(/sunday service/i)).toBeVisible()
      await expect(page.getByText(/checked in/i)).toBeVisible()
    })
  })
  
  test.describe('Real-time Attendance Updates', () => {
    test('should update attendance count in real-time', async ({ page, churchAdminAuth, context }) => {
      await page.goto('/admin/services')
      
      // Note initial count
      const initialCount = await page.getByTestId('attendance-count-service1').textContent()
      
      // Open new tab as member
      const memberPage = await context.newPage()
      await memberPage.goto('/checkin')
      
      // Member checks in
      await memberPage.getByRole('button', { name: /sunday service.*9:00 AM/i }).click()
      await memberPage.getByRole('button', { name: /check in/i }).click()
      
      // Wait for real-time update (5 second polling)
      await page.waitForTimeout(6000)
      
      // Count should increase
      const updatedCount = await page.getByTestId('attendance-count-service1').textContent()
      expect(parseInt(updatedCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'))
      
      await memberPage.close()
    })
  })
  
  test.describe('Service Filtering', () => {
    test('should filter services by date', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Set date filter
      await page.getByLabel(/from date/i).fill('2025-01-01')
      await page.getByLabel(/to date/i).fill('2025-01-31')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // Should only show services in January
      const serviceRows = page.getByRole('row')
      const count = await serviceRows.count()
      
      for (let i = 1; i < count; i++) { // Skip header row
        const dateText = await serviceRows.nth(i).getByTestId('service-date').textContent()
        expect(dateText).toContain('Jan')
      }
    })
    
    test('should filter services by church', async ({ page, superAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Filter by Manila church
      await page.getByLabel(/church/i).selectOption('Manila')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // All services should be from Manila
      const churchCells = page.getByTestId('service-church')
      const count = await churchCells.count()
      
      for (let i = 0; i < count; i++) {
        const church = await churchCells.nth(i).textContent()
        expect(church).toBe('Manila')
      }
    })
  })
  
  test.describe('Attendance Statistics', () => {
    test('should display attendance statistics', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Click on service to view stats
      await page.getByRole('row', { name: /sunday service/i }).click()
      
      const drawer = page.getByRole('dialog')
      
      // Should show statistics
      await expect(drawer.getByText(/total attendance/i)).toBeVisible()
      await expect(drawer.getByText(/new believers/i)).toBeVisible()
      await expect(drawer.getByText(/first time visitors/i)).toBeVisible()
      
      // Should show percentage
      await expect(drawer.getByText(/%/)).toBeVisible()
    })
    
    test('should show attendance trends', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/reports')
      
      // Navigate to attendance report
      await page.getByRole('link', { name: /attendance trends/i }).click()
      
      // Should show chart
      await expect(page.getByRole('img', { name: /attendance chart/i })).toBeVisible()
      
      // Should show summary stats
      await expect(page.getByText(/average attendance/i)).toBeVisible()
      await expect(page.getByText(/growth rate/i)).toBeVisible()
    })
  })
  
  test.describe('Batch Check-In', () => {
    test('should allow admin to check in multiple members', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Click batch check-in
      await page.getByRole('button', { name: /batch check-in/i }).click()
      
      // Select service
      await page.getByLabel(/service/i).selectOption({ label: /sunday service/i })
      
      // Search and select members
      await page.getByPlaceholder(/search members/i).fill('John')
      await page.getByRole('checkbox', { name: /john doe/i }).check()
      
      await page.getByPlaceholder(/search members/i).clear()
      await page.getByPlaceholder(/search members/i).fill('Jane')
      await page.getByRole('checkbox', { name: /jane smith/i }).check()
      
      // Submit batch check-in
      await page.getByRole('button', { name: /check in selected/i }).click()
      
      // Should show success
      await expect(page.getByText(/2 members checked in/i)).toBeVisible()
    })
  })
  
  test.describe('Service Reminders', () => {
    test('should schedule service reminder', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Click on service
      await page.getByRole('row', { name: /sunday service/i })
        .getByRole('button', { name: /reminders/i }).click()
      
      // Set reminder
      await page.getByLabel(/reminder time/i).selectOption('1 day before')
      await page.getByLabel(/reminder message/i).fill('Don\'t forget Sunday Service tomorrow!')
      
      // Save reminder
      await page.getByRole('button', { name: /schedule reminder/i }).click()
      
      await expect(page.getByText(/reminder scheduled/i)).toBeVisible()
    })
  })
  
  test.describe('QR Code Check-In', () => {
    test.skip('should generate QR code for service', async ({ page, churchAdminAuth }) => {
      // Skip if QR not implemented
      await page.goto('/admin/services')
      
      // Click QR code button
      await page.getByRole('row', { name: /sunday service/i })
        .getByRole('button', { name: /qr code/i }).click()
      
      // QR code should be displayed
      await expect(page.getByRole('img', { name: /qr code/i })).toBeVisible()
      
      // Download QR code
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /download qr/i }).click()
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toContain('qr-code')
    })
  })
})