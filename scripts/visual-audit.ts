#!/usr/bin/env npx tsx

import { chromium, Browser, Page } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import fs from 'fs/promises';
import path from 'path';

const ROUTES = [
  '/',
  '/auth/signin',
  '/dashboard',
  '/members',
  '/members/member1@test.com',
  '/profile',
  '/events',
  '/lifegroups',
  '/pathways',
  '/checkin',
  '/vip/firsttimers',
  '/admin',
  '/admin/services',
  '/admin/lifegroups',
  '/admin/events',
  '/admin/pathways',
  '/super',
  '/super/churches',
  '/super/local-churches',
];

const BASE_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = 'docs/design/visual-audit/screenshots';
const REPORTS_DIR = 'docs/design/visual-audit';

interface ContrastResult {
  route: string;
  mode: string;
  component: string;
  element: string;
  text: string;
  fg: string;
  bg: string;
  ratio: number;
  required: number;
  status: 'PASS' | 'FAIL';
  fileLine: string;
}

interface TokenMisuse {
  file: string;
  line: number;
  content: string;
  issue: string;
  suggestion: string;
}

class VisualAuditor {
  private browser!: Browser;
  private contrastResults: ContrastResult[] = [];
  private axeResults: any[] = [];

  async init() {
    this.browser = await chromium.launch({ headless: true });
  }

  async close() {
    await this.browser?.close();
  }

  async auditRoute(route: string, mode: 'light' | 'dark') {
    console.log(`Auditing ${route} in ${mode} mode...`);
    
    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      colorScheme: mode,
    });
    
    const page = await context.newPage();
    
    try {
      // Navigate to route
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      
      // Wait for theme to apply
      await page.waitForTimeout(500);
      
      // Set theme attribute
      await page.evaluate((theme) => {
        document.documentElement.setAttribute('data-theme', theme);
      }, mode);
      
      await page.waitForTimeout(500);

      // Take screenshot
      const screenshotPath = path.join(SCREENSHOTS_DIR, route.replace(/^\//, '').replace(/\//g, '_') || 'home', `${mode}.png`);
      await fs.mkdir(path.dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Run axe accessibility audit
      const axeResults = await new AxeBuilder({ page }).analyze();
      this.axeResults.push({
        route,
        mode,
        violations: axeResults.violations.filter(v => 
          v.tags.includes('wcag21aa') && 
          (v.tags.includes('color-contrast') || v.id.includes('contrast'))
        )
      });

      // Analyze contrast ratios
      await this.analyzeContrast(page, route, mode);
      
    } catch (error) {
      console.error(`Failed to audit ${route} in ${mode} mode:`, error);
    } finally {
      await context.close();
    }
  }

  async analyzeContrast(page: Page, route: string, mode: string) {
    // Get all text elements and their computed styles
    const elements = await page.evaluate(() => {
      const results: any[] = [];
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while (node = walker.nextNode()) {
        const element = node.parentElement;
        if (!element || !node.textContent?.trim()) continue;

        const styles = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        
        if (rect.width === 0 || rect.height === 0) continue;

        results.push({
          text: node.textContent.trim().substring(0, 50),
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontSize: parseFloat(styles.fontSize),
          fontWeight: styles.fontWeight,
          tagName: element.tagName.toLowerCase(),
          className: element.className,
        });
      }
      return results;
    });

    // Calculate contrast ratios for each element
    for (const el of elements) {
      if (el.color === 'rgba(0, 0, 0, 0)' || el.backgroundColor === 'rgba(0, 0, 0, 0)') {
        continue;
      }

      const fgColor = this.parseRgb(el.color);
      const bgColor = this.parseRgb(el.backgroundColor);
      
      if (!fgColor || !bgColor) continue;

      const ratio = this.calculateContrastRatio(fgColor, bgColor);
      const isLargeText = el.fontSize >= 18 || (el.fontSize >= 14 && el.fontWeight >= 700);
      const required = isLargeText ? 3.0 : 4.5;
      
      this.contrastResults.push({
        route,
        mode,
        component: el.tagName,
        element: el.className || el.tagName,
        text: el.text,
        fg: el.color,
        bg: el.backgroundColor,
        ratio: Math.round(ratio * 100) / 100,
        required,
        status: ratio >= required ? 'PASS' : 'FAIL',
        fileLine: 'dynamic', // Would need source mapping for exact line
      });
    }
  }

  parseRgb(color: string): [number, number, number] | null {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }

  relativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  calculateContrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
    const l1 = this.relativeLuminance(fg[0], fg[1], fg[2]);
    const l2 = this.relativeLuminance(bg[0], bg[1], bg[2]);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  async scanTokenMisuse(): Promise<TokenMisuse[]> {
    const issues: TokenMisuse[] = [];
    const componentDirs = ['components', 'app'];
    
    for (const dir of componentDirs) {
      await this.scanDirectory(dir, issues);
    }
    
    return issues;
  }

  async scanDirectory(dirPath: string, issues: TokenMisuse[]) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, issues);
        } else if (entry.name.match(/\.(tsx?|jsx?)$/)) {
          await this.scanFile(fullPath, issues);
        }
      }
    } catch (error) {
      // Directory might not exist, skip silently
    }
  }

  async scanFile(filePath: string, issues: TokenMisuse[]) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Check for hard-coded hex colors
        const hexMatches = line.match(/#([0-9a-fA-F]{3,8})\b/g);
        if (hexMatches) {
          hexMatches.forEach(hex => {
            issues.push({
              file: filePath,
              line: lineNum,
              content: line.trim(),
              issue: `Hard-coded hex color: ${hex}`,
              suggestion: 'Use design tokens instead (e.g., text-ink, bg-surface)',
            });
          });
        }

        // Check for problematic Tailwind classes
        const problematicClasses = [
          'text-white', 'bg-white', 'border-white',
          'text-black', 'bg-black', 'border-black',
          'text-slate-', 'bg-slate-', 'border-slate-',
          'text-gray-', 'bg-gray-', 'border-gray-',
        ];

        problematicClasses.forEach(cls => {
          if (line.includes(cls)) {
            issues.push({
              file: filePath,
              line: lineNum,
              content: line.trim(),
              issue: `Non-token Tailwind class: ${cls}`,
              suggestion: this.getSuggestion(cls),
            });
          }
        });
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  getSuggestion(className: string): string {
    const suggestions: Record<string, string> = {
      'text-white': 'text-ink (or text-accent-ink for accent backgrounds)',
      'bg-white': 'bg-surface or bg-elevated',
      'border-white': 'border-border',
      'text-black': 'text-ink',
      'bg-black': 'bg-surface (dark mode handled automatically)',
      'border-black': 'border-border',
    };

    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (className.includes(key)) return suggestion;
    }

    if (className.includes('slate-') || className.includes('gray-')) {
      return 'Use semantic tokens: text-ink, text-ink-muted, bg-surface, bg-elevated';
    }

    return 'Use design system tokens';
  }

  async generateReports() {
    console.log('Generating reports...');
    
    // Generate contrast report CSV
    const contrastCsv = [
      'route,mode,component,element,text,fg,bg,ratio,required,status,file:line',
      ...this.contrastResults.map(r => 
        `${r.route},${r.mode},${r.component},"${r.element}","${r.text}","${r.fg}","${r.bg}",${r.ratio},${r.required},${r.status},${r.fileLine}`
      )
    ].join('\n');
    
    await fs.writeFile(path.join(REPORTS_DIR, 'CONTRAST_REPORT.csv'), contrastCsv);

    // Generate axe report
    await fs.writeFile(
      path.join(REPORTS_DIR, 'A11Y_AXE_REPORT.json'), 
      JSON.stringify(this.axeResults, null, 2)
    );

    // Generate token misuse report
    const tokenIssues = await this.scanTokenMisuse();
    const tokenReport = this.generateTokenMisuseReport(tokenIssues);
    await fs.writeFile(path.join(REPORTS_DIR, 'TOKEN_MISUSE_REPORT.md'), tokenReport);

    // Generate summary report
    const summary = this.generateSummaryReport(tokenIssues);
    await fs.writeFile(path.join(REPORTS_DIR, 'VISUAL_AUDIT_SUMMARY.md'), summary);

    console.log('Reports generated successfully!');
  }

  generateTokenMisuseReport(issues: TokenMisuse[]): string {
    let report = '# Token Misuse Report\n\n';
    
    report += `Found ${issues.length} instances of hard-coded colors or non-token classes.\n\n`;
    
    const groupedIssues = issues.reduce((acc, issue) => {
      if (!acc[issue.file]) acc[issue.file] = [];
      acc[issue.file].push(issue);
      return acc;
    }, {} as Record<string, TokenMisuse[]>);

    Object.entries(groupedIssues).forEach(([file, fileIssues]) => {
      report += `## ${file}\n\n`;
      fileIssues.forEach(issue => {
        report += `**Line ${issue.line}:** ${issue.issue}\n`;
        report += `\`\`\`\n${issue.content}\n\`\`\`\n`;
        report += `**Suggestion:** ${issue.suggestion}\n\n`;
      });
    });

    return report;
  }

  generateSummaryReport(tokenIssues: TokenMisuse[]): string {
    const failedContrast = this.contrastResults.filter(r => r.status === 'FAIL');
    const axeViolations = this.axeResults.flatMap(r => r.violations);
    
    let report = '# Visual Audit Summary\n\n';
    
    report += '## Executive Summary\n\n';
    report += `- **Contrast Failures:** ${failedContrast.length} of ${this.contrastResults.length} elements\n`;
    report += `- **Accessibility Violations:** ${axeViolations.length} issues found\n`;
    report += `- **Token Misuse:** ${tokenIssues.length} instances of hard-coded colors/classes\n`;
    report += `- **Routes Audited:** ${ROUTES.length} routes in both light and dark modes\n\n`;

    // Top 10 contrast issues
    report += '## Top 10 Contrast Issues\n\n';
    failedContrast
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 10)
      .forEach((issue, index) => {
        report += `### Issue VA-${String(index + 1).padStart(3, '0')}\n`;
        report += `- **Route/Mode:** ${issue.route} (${issue.mode})\n`;
        report += `- **Component:** ${issue.component}\n`;
        report += `- **Problem:** Text contrast ${issue.ratio}:1 fails WCAG AA (needs ${issue.required}:1)\n`;
        report += `- **Colors:** ${issue.fg} on ${issue.bg}\n`;
        report += `- **Text:** "${issue.text}"\n`;
        report += `- **Screenshot:** ./screenshots/${issue.route.replace(/^\//, '').replace(/\//g, '_') || 'home'}/${issue.mode}.png\n\n`;
      });

    return report;
  }
}

async function main() {
  const auditor = new VisualAuditor();
  
  try {
    await auditor.init();
    
    console.log('Starting visual audit...');
    
    // Audit all routes in both light and dark modes
    for (const route of ROUTES) {
      for (const mode of ['light', 'dark'] as const) {
        await auditor.auditRoute(route, mode);
      }
    }
    
    await auditor.generateReports();
    
    console.log('Visual audit completed!');
    console.log('Check docs/design/visual-audit/ for reports and screenshots');
    
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  } finally {
    await auditor.close();
  }
}

if (require.main === module) {
  main();
}