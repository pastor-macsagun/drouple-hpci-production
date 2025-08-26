import { test, expect } from './fixtures/auth'
import fs from 'fs/promises'

// Expected sidebar structure for SUPER_ADMIN
const EXPECTED_SIDEBAR = {
  memberSection: ['Dashboard', 'Check-In', 'Events', 'LifeGroups', 'Pathways'],
  adminSection: ['Services', 'Events', 'LifeGroups', 'Pathways'],
  superAdminSection: ['Churches', 'Local Churches'],
  bottomSection: ['Profile', 'Logout']
}

// Pages to audit - grouped for efficiency
const PAGES_TO_AUDIT = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Admin Services', path: '/admin/services' },
  { name: 'Super Admin', path: '/super' },
  { name: 'Profile', path: '/profile' }
]

test.describe('SUPER_ADMIN Sidebar Quick Audit', () => {
  test('Audit sidebar consistency across key pages', async ({ page, superAdminAuth }) => {
    const auditResults = []
    
    // Ensure directory exists
    await fs.mkdir('docs/verification', { recursive: true })
    
    for (const pageInfo of PAGES_TO_AUDIT) {
      console.log(`Auditing ${pageInfo.name}...`)
      
      // Navigate to page
      await page.goto(pageInfo.path)
      await page.waitForLoadState('domcontentloaded')
      
      // Small delay to ensure page renders
      await page.waitForTimeout(1000)
      
      // Get all visible link texts
      const links = await page.locator('a:visible, button:visible').allTextContents()
      const linkTexts = links.map(t => t.trim()).filter(t => t.length > 0)
      
      // Categorize links
      const memberLinks = linkTexts.filter(t => 
        EXPECTED_SIDEBAR.memberSection.includes(t) && 
        !linkTexts.some(l => l.includes('Admin') && l.includes(t))
      )
      
      const adminLinks = linkTexts.filter(t => 
        EXPECTED_SIDEBAR.adminSection.some(section => t.includes(section)) &&
        (t.includes('Admin') || linkTexts.indexOf(t) > linkTexts.indexOf('Administration'))
      )
      
      const superAdminLinks = linkTexts.filter(t => 
        EXPECTED_SIDEBAR.superAdminSection.includes(t)
      )
      
      const bottomLinks = linkTexts.filter(t => 
        EXPECTED_SIDEBAR.bottomSection.includes(t) || t === 'Sign Out'
      )
      
      // Record results
      const issues = []
      
      // Check member section
      for (const expected of EXPECTED_SIDEBAR.memberSection) {
        if (!memberLinks.includes(expected)) {
          issues.push(`Missing: ${expected} (Member)`)
        }
      }
      
      // Check admin section
      if (adminLinks.length === 0) {
        issues.push('Missing: Entire Admin Section')
      }
      
      // Check super admin section
      for (const expected of EXPECTED_SIDEBAR.superAdminSection) {
        if (!superAdminLinks.includes(expected)) {
          issues.push(`Missing: ${expected} (Super Admin)`)
        }
      }
      
      // Check bottom section
      if (!bottomLinks.some(l => l === 'Profile')) {
        issues.push('Missing: Profile link')
      }
      if (!bottomLinks.some(l => l === 'Logout' || l === 'Sign Out')) {
        issues.push('Missing: Logout link')
      }
      
      auditResults.push({
        page: pageInfo.name,
        path: pageInfo.path,
        memberLinks: memberLinks.length,
        adminLinks: adminLinks.length,
        superAdminLinks: superAdminLinks.length,
        bottomLinks: bottomLinks.length,
        issues
      })
    }
    
    // Generate simple report
    let report = `# SUPER_ADMIN Sidebar Audit - Quick Report\n\n`
    report += `Generated: ${new Date().toISOString()}\n\n`
    report += `## Summary\n\n`
    report += `| Page | Member | Admin | Super Admin | Bottom | Issues |\n`
    report += `|------|--------|-------|-------------|--------|--------|\n`
    
    let totalIssues = 0
    for (const result of auditResults) {
      const status = result.issues.length === 0 ? '✅' : `⚠️ ${result.issues.length}`
      report += `| ${result.page} | ${result.memberLinks} | ${result.adminLinks} | ${result.superAdminLinks} | ${result.bottomLinks} | ${status} |\n`
      totalIssues += result.issues.length
    }
    
    report += `\n## Issues Found\n\n`
    
    if (totalIssues === 0) {
      report += `✅ No issues found - sidebar is consistent!\n`
    } else {
      for (const result of auditResults) {
        if (result.issues.length > 0) {
          report += `### ${result.page}\n`
          for (const issue of result.issues) {
            report += `- ${issue}\n`
          }
          report += '\n'
        }
      }
    }
    
    // Save report
    await fs.writeFile('docs/verification/SUPER_ADMIN_SIDEBAR_QUICK.md', report)
    console.log('Quick audit report saved to docs/verification/SUPER_ADMIN_SIDEBAR_QUICK.md')
    
    // Assert no critical issues
    expect(totalIssues).toBe(0)
  })
})