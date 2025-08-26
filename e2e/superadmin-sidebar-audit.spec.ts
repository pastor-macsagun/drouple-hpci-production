import { test, expect } from './fixtures/auth'
import fs from 'fs/promises'
import path from 'path'

// Expected sidebar structure for SUPER_ADMIN
const EXPECTED_SIDEBAR = {
  memberSection: {
    title: 'Member Section',
    items: ['Dashboard', 'Check-In', 'Events', 'LifeGroups', 'Pathways']
  },
  adminSection: {
    title: 'Administration',
    items: ['Admin Services', 'Admin Events', 'Admin LifeGroups', 'Admin Pathways']
  },
  superAdminSection: {
    title: 'Super Admin',
    items: ['Churches', 'Local Churches']
  },
  bottomSection: {
    items: ['Profile', 'Logout']
  }
}

// Pages to audit
const PAGES_TO_AUDIT = [
  { name: 'Home', path: '/' },
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Check-In', path: '/checkin' },
  { name: 'Events', path: '/events' },
  { name: 'LifeGroups', path: '/lifegroups' },
  { name: 'Pathways', path: '/pathways' },
  { name: 'Admin Services', path: '/admin/services' },
  { name: 'Admin Events', path: '/admin/events' },
  { name: 'Admin LifeGroups', path: '/admin/lifegroups' },
  { name: 'Admin Pathways', path: '/admin/pathways' },
  { name: 'Super Admin', path: '/super' },
  { name: 'Churches', path: '/super/churches' },
  { name: 'Local Churches', path: '/super/local-churches' },
  { name: 'Profile', path: '/profile' }
]

interface SidebarAuditResult {
  page: string
  path: string
  memberSection: string[]
  adminSection: string[]
  superAdminSection: string[]
  bottomSection: string[]
  issues: string[]
  screenshot?: string
}

test.describe('@superadmin-sidebar SUPER_ADMIN Sidebar Audit', () => {
  const results: SidebarAuditResult[] = []

  test.beforeAll(async () => {
    // Ensure docs/verification directory exists
    await fs.mkdir('docs/verification', { recursive: true })
    await fs.mkdir('docs/verification/screenshots', { recursive: true })
  })

  for (const pageInfo of PAGES_TO_AUDIT) {
    test(`Audit sidebar on ${pageInfo.name} (${pageInfo.path})`, async ({ page, superAdminAuth }) => {
      // Navigate to the page
      await page.goto(pageInfo.path)
      await page.waitForLoadState('networkidle')
      
      const result: SidebarAuditResult = {
        page: pageInfo.name,
        path: pageInfo.path,
        memberSection: [],
        adminSection: [],
        superAdminSection: [],
        bottomSection: [],
        issues: []
      }

      // Take screenshot of sidebar
      const screenshotPath = `docs/verification/screenshots/sidebar-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`
      
      // Check if sidebar exists - look for common sidebar containers
      const sidebarSelectors = ['aside', 'nav[role="navigation"]', '[data-testid="sidebar"]', '.sidebar']
      let sidebar = null
      
      for (const selector of sidebarSelectors) {
        const element = page.locator(selector).first()
        if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
          sidebar = element
          break
        }
      }
      
      if (sidebar) {
        await sidebar.screenshot({ path: screenshotPath })
        result.screenshot = screenshotPath

        // Extract all navigation links text
        const allLinks = await page.locator('a, button').allTextContents()
        
        // Categorize links into sections
        for (const linkText of allLinks) {
          const text = linkText.trim()
          if (!text) continue
          
          // Member section items
          if (text === 'Dashboard' || text === 'Check-In' || text === 'Events' || 
              text === 'LifeGroups' || text === 'Pathways') {
            // Check if it's not an admin link
            const isAdminLink = await page.locator(`a:has-text("${text}")`).first()
              .getAttribute('href').then(href => href?.includes('/admin'))
              .catch(() => false)
            
            if (!isAdminLink) {
              result.memberSection.push(text)
            }
          }
          
          // Admin section items  
          if (text.includes('Admin') || 
              (await page.locator(`a:has-text("${text}")`).first()
                .getAttribute('href').then(href => href?.includes('/admin'))
                .catch(() => false))) {
            if (text.includes('Services') || text.includes('Events') || 
                text.includes('LifeGroups') || text.includes('Pathways')) {
              result.adminSection.push(text)
            }
          }
          
          // Super Admin section items
          if (text === 'Churches' || text === 'Local Churches' ||
              (await page.locator(`a:has-text("${text}")`).first()
                .getAttribute('href').then(href => href?.includes('/super'))
                .catch(() => false))) {
            result.superAdminSection.push(text)
          }
          
          // Bottom section items
          if (text === 'Profile' || text === 'Logout' || text === 'Sign Out') {
            result.bottomSection.push(text)
          }
        }

        // Remove duplicates
        result.memberSection = [...new Set(result.memberSection)]
        result.adminSection = [...new Set(result.adminSection)]
        result.superAdminSection = [...new Set(result.superAdminSection)]
        result.bottomSection = [...new Set(result.bottomSection)]

        // Check for issues - Member Section
        for (const expectedItem of EXPECTED_SIDEBAR.memberSection.items) {
          if (!result.memberSection.includes(expectedItem)) {
            result.issues.push(`Missing: ${expectedItem} in Member Section`)
          }
        }

        // Admin Section validation
        if (result.adminSection.length === 0) {
          result.issues.push('Missing: Entire Administration Section')
        } else {
          for (const expectedItem of EXPECTED_SIDEBAR.adminSection.items) {
            const found = result.adminSection.some(item => 
              item.includes('Services') && expectedItem.includes('Services') ||
              item.includes('Events') && expectedItem.includes('Events') ||
              item.includes('LifeGroups') && expectedItem.includes('LifeGroups') ||
              item.includes('Pathways') && expectedItem.includes('Pathways')
            )
            if (!found) {
              result.issues.push(`Missing: ${expectedItem} in Administration Section`)
            }
          }
        }

        // Super Admin Section validation
        if (result.superAdminSection.length === 0) {
          result.issues.push('Missing: Entire Super Admin Section')
        } else {
          for (const expectedItem of EXPECTED_SIDEBAR.superAdminSection.items) {
            if (!result.superAdminSection.includes(expectedItem)) {
              result.issues.push(`Missing: ${expectedItem} in Super Admin Section`)
            }
          }
        }

        // Bottom Section validation
        for (const expectedItem of EXPECTED_SIDEBAR.bottomSection.items) {
          const found = result.bottomSection.some(item => 
            item.includes(expectedItem) || 
            (expectedItem === 'Logout' && item === 'Sign Out')
          )
          if (!found) {
            result.issues.push(`Missing: ${expectedItem} in Bottom Section`)
          }
        }

      } else {
        result.issues.push('CRITICAL: No sidebar found on page')
      }

      results.push(result)
      
      // Log issues for this page if any
      if (result.issues.length > 0) {
        console.log(`Issues on ${pageInfo.name}:`, result.issues)
      }
    })
  }

  test.afterAll(async () => {
    // Generate the audit report
    const report = generateAuditReport(results)
    await fs.writeFile('docs/verification/SUPER_ADMIN_SIDEBAR_AUDIT.md', report)
    
    // Also save raw results as JSON for reference
    await fs.writeFile('docs/verification/sidebar-audit-results.json', JSON.stringify(results, null, 2))
    
    console.log('Audit report generated: docs/verification/SUPER_ADMIN_SIDEBAR_AUDIT.md')
  })
})

function generateAuditReport(results: SidebarAuditResult[]): string {
  const timestamp = new Date().toISOString()
  
  let report = `# SUPER_ADMIN Sidebar Navigation Audit Report

Generated: ${timestamp}

## Section A: Expected Sidebar Structure

### Member Section
- Dashboard
- Check-In
- Events
- LifeGroups
- Pathways

### Administration Section
- Admin Services
- Admin Events
- Admin LifeGroups
- Admin Pathways

### Super Admin Section
- Churches
- Local Churches

### Bottom Section
- Profile
- Logout

## Section B: Page-by-Page Sidebar Comparison

| Page | Path | Member Section | Admin Section | Super Admin Section | Bottom Section | Status |
|------|------|----------------|---------------|---------------------|----------------|--------|
`

  for (const result of results) {
    const memberItems = result.memberSection.length || '❌ Missing'
    const adminItems = result.adminSection.length || '❌ Missing'
    const superAdminItems = result.superAdminSection.length || '❌ Missing'
    const bottomItems = result.bottomSection.length || '❌ Missing'
    const status = result.issues.length === 0 ? '✅ OK' : `⚠️ ${result.issues.length} issues`
    
    report += `| ${result.page} | ${result.path} | ${memberItems} items | ${adminItems} items | ${superAdminItems} items | ${bottomItems} items | ${status} |\n`
  }

  report += `\n## Section C: Inconsistencies Found\n\n`

  const allIssues: { page: string; issues: string[] }[] = []
  for (const result of results) {
    if (result.issues.length > 0) {
      allIssues.push({ page: result.page, issues: result.issues })
    }
  }

  if (allIssues.length === 0) {
    report += `✅ **No inconsistencies found!** All pages show consistent sidebar structure for SUPER_ADMIN.\n\n`
  } else {
    report += `### Issues by Page:\n\n`
    for (const { page, issues } of allIssues) {
      report += `#### ${page}\n`
      for (const issue of issues) {
        report += `- ${issue}\n`
      }
      report += '\n'
    }

    // Aggregate common issues
    const issueFrequency = new Map<string, number>()
    for (const { issues } of allIssues) {
      for (const issue of issues) {
        issueFrequency.set(issue, (issueFrequency.get(issue) || 0) + 1)
      }
    }

    report += `### Most Common Issues:\n\n`
    const sortedIssues = Array.from(issueFrequency.entries()).sort((a, b) => b[1] - a[1])
    for (const [issue, count] of sortedIssues) {
      report += `- **${issue}** (found on ${count} pages)\n`
    }
  }

  report += `\n## Section D: Recommendations\n\n`

  if (allIssues.length === 0) {
    report += `1. **No action needed** - Sidebar is consistent across all pages for SUPER_ADMIN role.\n`
    report += `2. Consider adding automated tests to maintain this consistency.\n`
  } else {
    report += `### Immediate Actions Needed:\n\n`
    
    // Check for critical issues
    const hasMissingSuperAdmin = allIssues.some(({ issues }) => 
      issues.some(i => i.includes('Super Admin Section'))
    )
    const hasMissingAdmin = allIssues.some(({ issues }) => 
      issues.some(i => i.includes('Administration Section'))
    )
    
    if (hasMissingSuperAdmin) {
      report += `1. **Critical**: Add Super Admin Section to all layouts where SUPER_ADMIN is logged in\n`
    }
    if (hasMissingAdmin) {
      report += `2. **Critical**: Ensure Administration Section is visible for SUPER_ADMIN on all pages\n`
    }
    
    report += `\n### Technical Recommendations:\n\n`
    report += `1. **Normalize Sidebar Component**: Create a single <Sidebar /> component that reads user role from context\n`
    report += `2. **Role-based Rendering**: Implement consistent role checks:\n`
    report += `   - Show Super Admin Section only for SUPER_ADMIN role\n`
    report += `   - Show Administration Section for SUPER_ADMIN and CHURCH_ADMIN roles\n`
    report += `   - Show Member Section for all authenticated users\n`
    report += `3. **Layout Consistency**: Use a shared layout component across all pages\n`
    report += `4. **Add Tests**: Create unit tests for sidebar role visibility logic\n`
  }

  report += `\n## Artifacts\n\n`
  report += `- Screenshots: \`docs/verification/screenshots/\`\n`
  report += `- Raw Results: \`docs/verification/sidebar-audit-results.json\`\n`
  report += `- HTML Report: Run \`npm run test:e2e -- --grep @superadmin-sidebar --reporter=html\`\n`

  return report
}