import { test, expect } from './fixtures/auth'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

test.describe('CSV Exports @csv', () => {
  test.describe('Service Attendance Export', () => {
    test('should export service attendance as CSV', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Setup download promise
      const downloadPromise = page.waitForEvent('download')
      
      // Click export button
      await page.getByRole('button', { name: /export csv/i }).click()
      
      // Wait for download
      const download = await downloadPromise
      
      // Verify filename
      expect(download.suggestedFilename()).toMatch(/service-attendance.*\.csv/)
      
      // Save and read file
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Parse CSV
        const records = parse(content, { columns: true })
        
        // Verify headers
        expect(records.length).toBeGreaterThan(0)
        expect(records[0]).toHaveProperty('Service Name')
        expect(records[0]).toHaveProperty('Date')
        expect(records[0]).toHaveProperty('Time')
        expect(records[0]).toHaveProperty('Total Attendance')
        expect(records[0]).toHaveProperty('New Believers')
        expect(records[0]).toHaveProperty('Church')
        
        // Verify data format
        const firstRecord = records[0]
        expect(firstRecord['Date']).toMatch(/\d{4}-\d{2}-\d{2}/)
        expect(parseInt(firstRecord['Total Attendance'])).toBeGreaterThanOrEqual(0)
      }
    })
    
    test('should handle date range filter in export', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      // Set date filter
      await page.getByLabel(/from date/i).fill('2025-01-01')
      await page.getByLabel(/to date/i).fill('2025-01-31')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // Export filtered data
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // All records should be within date range
        for (const record of records) {
          const date = new Date(record['Date'])
          expect(date >= new Date('2025-01-01')).toBe(true)
          expect(date <= new Date('2025-01-31')).toBe(true)
        }
      }
    })
  })
  
  test.describe('LifeGroup Roster Export', () => {
    test('should export life group roster', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Open life group
      await page.getByRole('row', { name: /youth group/i })
        .getByRole('button', { name: /manage/i }).click()
      
      const drawer = page.getByRole('dialog')
      
      // Export roster
      const downloadPromise = page.waitForEvent('download')
      await drawer.getByRole('button', { name: /export roster/i }).click()
      const download = await downloadPromise
      
      // Verify file
      expect(download.suggestedFilename()).toMatch(/lifegroup-roster.*\.csv/)
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // Verify roster headers
        expect(records[0]).toHaveProperty('Name')
        expect(records[0]).toHaveProperty('Email')
        expect(records[0]).toHaveProperty('Phone')
        expect(records[0]).toHaveProperty('Joined Date')
        expect(records[0]).toHaveProperty('Role')
      }
    })
    
    test('should export life group attendance history', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/lifegroups')
      
      // Open life group
      await page.getByRole('row', { name: /youth group/i })
        .getByRole('button', { name: /manage/i }).click()
      
      const drawer = page.getByRole('dialog')
      
      // Go to attendance tab
      await drawer.getByRole('tab', { name: /attendance/i }).click()
      
      // Export attendance
      const downloadPromise = page.waitForEvent('download')
      await drawer.getByRole('button', { name: /export attendance/i }).click()
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toMatch(/attendance-history.*\.csv/)
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // Verify attendance headers
        expect(records[0]).toHaveProperty('Session Date')
        expect(records[0]).toHaveProperty('Session Name')
        expect(records[0]).toHaveProperty('Total Members')
        expect(records[0]).toHaveProperty('Present')
        expect(records[0]).toHaveProperty('Attendance Rate')
        expect(records[0]).toHaveProperty('Notes')
      }
    })
  })
  
  test.describe('Event Attendees Export', () => {
    test('should export event attendees with payment status', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/events')
      
      // Open event
      await page.getByRole('row', { name: /youth conference/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Export attendees
      const downloadPromise = page.waitForEvent('download')
      await modal.getByRole('button', { name: /export attendees/i }).click()
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toMatch(/event-attendees.*\.csv/)
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // Verify headers include payment info
        expect(records[0]).toHaveProperty('Name')
        expect(records[0]).toHaveProperty('Email')
        expect(records[0]).toHaveProperty('Phone')
        expect(records[0]).toHaveProperty('Registration Date')
        expect(records[0]).toHaveProperty('Status')
        expect(records[0]).toHaveProperty('Payment Status')
        expect(records[0]).toHaveProperty('Amount Paid')
      }
    })
    
    test('should include waitlist in export', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/events')
      
      // Open full event
      await page.getByRole('row').filter({ hasText: /full/i }).click()
      
      const modal = page.getByRole('dialog')
      
      // Export with waitlist
      const downloadPromise = page.waitForEvent('download')
      await modal.getByRole('button', { name: /export all/i }).click()
      const download = await downloadPromise
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // Should have both confirmed and waitlisted
        const confirmed = records.filter(r => r['Status'] === 'CONFIRMED')
        const waitlisted = records.filter(r => r['Status'] === 'WAITLISTED')
        
        expect(confirmed.length).toBeGreaterThan(0)
        expect(waitlisted.length).toBeGreaterThan(0)
        
        // Waitlisted should have position
        expect(waitlisted[0]).toHaveProperty('Waitlist Position')
      }
    })
  })
  
  test.describe('Member Directory Export', () => {
    test('should export member directory', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Export members
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toMatch(/members.*\.csv/)
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // Verify member data
        expect(records[0]).toHaveProperty('Name')
        expect(records[0]).toHaveProperty('Email')
        expect(records[0]).toHaveProperty('Phone')
        expect(records[0]).toHaveProperty('Role')
        expect(records[0]).toHaveProperty('Joined Date')
        expect(records[0]).toHaveProperty('Church')
        
        // Should respect privacy settings
        // Some phone numbers might be hidden
        const hasPrivatePhone = records.some(r => r['Phone'] === 'Private')
        expect(hasPrivatePhone).toBe(true)
      }
    })
    
    test('should filter export by role', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Filter by leaders
      await page.getByLabel(/role/i).selectOption('LEADER')
      await page.getByRole('button', { name: /apply filter/i }).click()
      
      // Export filtered
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // All should be leaders
        for (const record of records) {
          expect(record['Role']).toBe('LEADER')
        }
      }
    })
  })
  
  test.describe('Pathway Progress Export', () => {
    test('should export pathway progress report', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/pathways')
      
      // Go to reports
      await page.getByRole('button', { name: /progress reports/i }).click()
      
      // Export progress
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export progress/i }).click()
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toMatch(/pathway-progress.*\.csv/)
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // Verify progress data
        expect(records[0]).toHaveProperty('Member Name')
        expect(records[0]).toHaveProperty('Pathway')
        expect(records[0]).toHaveProperty('Enrolled Date')
        expect(records[0]).toHaveProperty('Progress %')
        expect(records[0]).toHaveProperty('Steps Completed')
        expect(records[0]).toHaveProperty('Status')
      }
    })
  })
  
  test.describe('Financial Reports Export', () => {
    test('should export event revenue report', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/reports/financial')
      
      // Select event revenue report
      await page.getByLabel(/report type/i).selectOption('Event Revenue')
      await page.getByRole('button', { name: /generate report/i }).click()
      
      // Export
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      expect(download.suggestedFilename()).toMatch(/event-revenue.*\.csv/)
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // Verify financial data
        expect(records[0]).toHaveProperty('Event Name')
        expect(records[0]).toHaveProperty('Date')
        expect(records[0]).toHaveProperty('Total Attendees')
        expect(records[0]).toHaveProperty('Paid Attendees')
        expect(records[0]).toHaveProperty('Total Revenue')
        expect(records[0]).toHaveProperty('Outstanding')
      }
    })
  })
  
  test.describe('CSV Format Validation', () => {
    test('should generate valid CSV with proper escaping', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Add member with special characters
      await page.getByRole('button', { name: /add member/i }).click()
      await page.getByLabel(/name/i).fill('John "Johnny" O\'Brien')
      await page.getByLabel(/email/i).fill('john@test.com')
      await page.getByLabel(/notes/i).fill('Has comma, and "quotes"')
      await page.getByRole('button', { name: /save/i }).click()
      
      // Export
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Should properly escape quotes and commas
        expect(content).toContain('"John ""Johnny"" O\'Brien"')
        expect(content).toContain('"Has comma, and ""quotes"""')
        
        // Should parse without errors
        const records = parse(content, { columns: true })
        expect(records.length).toBeGreaterThan(0)
      }
    })
    
    test('should handle Unicode characters', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Export
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Should have UTF-8 BOM for Excel compatibility
        expect(content.charCodeAt(0)).toBe(0xFEFF) // UTF-8 BOM
        
        // Should handle Unicode names
        if (content.includes('José') || content.includes('María')) {
          expect(content).toMatch(/José|María/)
        }
      }
    })
    
    test('should open correctly in Excel/Sheets', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/services')
      
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Check for common Excel compatibility issues
        // 1. UTF-8 BOM for proper encoding
        expect(content.charCodeAt(0)).toBe(0xFEFF)
        
        // 2. Consistent column count
        const lines = content.split('\n').filter(l => l.trim())
        const headerColumns = lines[0].split(',').length
        
        for (const line of lines) {
          // Account for quoted fields with commas
          const columns = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g)
          expect(columns?.length).toBe(headerColumns)
        }
        
        // 3. No trailing commas
        for (const line of lines) {
          expect(line.endsWith(',')).toBe(false)
        }
      }
    })
  })
  
  test.describe('Export Performance', () => {
    test('should handle large datasets', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Assuming we have many members
      const startTime = Date.now()
      
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (10 seconds)
      expect(duration).toBeLessThan(10000)
      
      const filePath = await download.path()
      if (filePath) {
        const stats = fs.statSync(filePath)
        // File should not be corrupted or truncated
        expect(stats.size).toBeGreaterThan(0)
      }
    })
  })
  
  test.describe('Export Security', () => {
    test('should respect data access permissions', async ({ page, context }) => {
      // Login as Manila admin
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-manila-admin-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/admin/members')
      
      // Export
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const records = parse(content, { columns: true })
        
        // Should only contain Manila members
        for (const record of records) {
          expect(record['Church']).toBe('Manila')
        }
        
        // Should not contain Cebu data
        expect(content).not.toContain('Cebu')
      }
    })
    
    test('should sanitize data to prevent injection', async ({ page, churchAdminAuth }) => {
      await page.goto('/admin/members')
      
      // Add member with formula injection attempt
      await page.getByRole('button', { name: /add member/i }).click()
      await page.getByLabel(/name/i).fill('=1+1')
      await page.getByLabel(/email/i).fill('test@test.com')
      await page.getByRole('button', { name: /save/i }).click()
      
      // Export
      const downloadPromise = page.waitForEvent('download')
      await page.getByRole('button', { name: /export csv/i }).click()
      const download = await downloadPromise
      
      const filePath = await download.path()
      if (filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        
        // Formula should be escaped
        expect(content).toContain("'=1+1") // Leading apostrophe to prevent execution
      }
    })
  })
})