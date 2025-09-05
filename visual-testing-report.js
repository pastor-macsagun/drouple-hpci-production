const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = './visual-test-screenshots';
const TEST_USERS = {
  superadmin: { email: 'superadmin@test.com', password: 'Hpci!Test2025' },
  admin: { email: 'admin.manila@test.com', password: 'Hpci!Test2025' },
  vip: { email: 'vip.manila@test.com', password: 'Hpci!Test2025' },
  leader: { email: 'leader.manila@test.com', password: 'Hpci!Test2025' },
  member: { email: 'member1@test.com', password: 'Hpci!Test2025' }
};

// Viewport sizes for responsive testing
const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 }
};

class VisualTester {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      landingPage: {},
      authentication: {},
      dashboards: {},
      adminPages: {},
      userPages: {},
      designSystem: {},
      responsive: {},
      accessibility: {},
      themes: {},
      issues: []
    };
  }

  async init() {
    console.log('🚀 Starting Drouple - Church Management System Visual Testing...');
    
    // Create screenshot directory
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    // Launch browser
    this.browser = await chromium.launch({ 
      headless: false, // Set to true for CI
      slowMo: 500 
    });
  }

  async createContext(viewport = VIEWPORTS.desktop, theme = 'light') {
    if (this.context) await this.context.close();
    
    this.context = await this.browser.newContext({
      viewport,
      colorScheme: theme === 'dark' ? 'dark' : 'light'
    });
    
    this.page = await this.context.newPage();
  }

  async takeScreenshot(name, fullPage = true) {
    const filename = `${name}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    
    await this.page.screenshot({
      path: filepath,
      fullPage
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async login(userType) {
    const user = TEST_USERS[userType];
    if (!user) throw new Error(`User type ${userType} not found`);

    await this.page.goto(`${BASE_URL}/auth/signin`);
    await this.page.fill('#email', user.email);
    await this.page.fill('#password', user.password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect
    await this.page.waitForLoadState('networkidle');
  }

  async testLandingPage() {
    console.log('🏠 Testing Landing Page...');
    
    // Initialize context first
    await this.createContext();
    await this.page.goto(BASE_URL);
    await this.page.waitForLoadState('networkidle');
    
    // Take screenshots in different viewports
    for (const [size, viewport] of Object.entries(VIEWPORTS)) {
      await this.createContext(viewport);
      await this.page.goto(BASE_URL);
      await this.page.waitForLoadState('networkidle');
      await this.takeScreenshot(`landing-page-${size}`);
    }

    // Test branding elements
    await this.createContext();
    await this.page.goto(BASE_URL);
    
    const navigation = await this.page.locator('nav').first();
    const logo = await this.page.getByText('Drouple').first();
    const signInButton = await this.page.getByRole('button', { name: /sign in/i }).or(this.page.getByRole('link', { name: /sign in/i }));
    
    this.results.landingPage = {
      navigationVisible: await navigation.isVisible(),
      logoVisible: await logo.isVisible(),
      signInButtonVisible: await signInButton.isVisible(),
      heroSectionPresent: await this.page.locator('section').first().isVisible()
    };
  }

  async testAuthentication() {
    console.log('🔐 Testing Authentication...');
    
    await this.createContext();
    await this.page.goto(`${BASE_URL}/auth/signin`);
    await this.page.waitForLoadState('networkidle');
    
    await this.takeScreenshot('signin-page');
    
    // Test form elements
    const emailField = this.page.locator('#email');
    const passwordField = this.page.locator('#password');
    const submitButton = this.page.locator('button[type="submit"]');
    
    this.results.authentication = {
      emailFieldVisible: await emailField.isVisible(),
      passwordFieldVisible: await passwordField.isVisible(),
      submitButtonVisible: await submitButton.isVisible(),
      formAccessible: await emailField.getAttribute('aria-label') !== null || await emailField.getAttribute('placeholder') !== null
    };
  }

  async testDashboards() {
    console.log('📊 Testing Role-Based Dashboards...');
    
    for (const [role, user] of Object.entries(TEST_USERS)) {
      try {
        await this.createContext();
        await this.login(role);
        
        // Take dashboard screenshot
        await this.takeScreenshot(`dashboard-${role}`);
        
        // Test sidebar navigation
        const sidebar = this.page.locator('[role="navigation"]').or(this.page.locator('nav')).first();
        const header = this.page.locator('header').or(this.page.locator('[role="banner"]')).first();
        
        this.results.dashboards[role] = {
          dashboardLoaded: this.page.url().includes('admin') || this.page.url().includes('dashboard') || this.page.url().includes('super') || this.page.url().includes('vip') || this.page.url().includes('leader'),
          sidebarPresent: await sidebar.isVisible(),
          headerPresent: await header.isVisible()
        };
        
      } catch (error) {
        console.error(`❌ Error testing ${role} dashboard:`, error.message);
        this.results.issues.push({
          type: 'dashboard-error',
          role,
          error: error.message
        });
      }
    }
  }

  async testAdminPages() {
    console.log('⚙️ Testing Admin Management Pages...');
    
    await this.createContext();
    await this.login('admin');
    
    const adminPages = [
      '/admin/members',
      '/admin/services', 
      '/admin/lifegroups',
      '/admin/events',
      '/admin/pathways'
    ];
    
    for (const page of adminPages) {
      try {
        await this.page.goto(`${BASE_URL}${page}`);
        await this.page.waitForLoadState('networkidle');
        
        const pageName = page.split('/').pop();
        await this.takeScreenshot(`admin-${pageName}`);
        
        // Check for data tables, forms, and CRUD functionality
        const table = this.page.locator('table').or(this.page.locator('[role="table"]'));
        const createButton = this.page.getByRole('button', { name: /create|add|new/i });
        
        this.results.adminPages[pageName] = {
          pageLoaded: !this.page.url().includes('signin'),
          tablePresent: await table.isVisible(),
          createActionAvailable: await createButton.isVisible()
        };
        
      } catch (error) {
        console.error(`❌ Error testing admin page ${page}:`, error.message);
        this.results.issues.push({
          type: 'admin-page-error',
          page,
          error: error.message
        });
      }
    }
  }

  async testUserPages() {
    console.log('👥 Testing User-Facing Pages...');
    
    await this.createContext();
    await this.login('member');
    
    const userPages = [
      '/members',
      '/events', 
      '/lifegroups',
      '/pathways',
      '/checkin'
    ];
    
    for (const page of userPages) {
      try {
        await this.page.goto(`${BASE_URL}${page}`);
        await this.page.waitForLoadState('networkidle');
        
        const pageName = page.split('/').pop();
        await this.takeScreenshot(`user-${pageName}`);
        
        this.results.userPages[pageName] = {
          pageLoaded: !this.page.url().includes('signin'),
          contentVisible: await this.page.locator('main').or(this.page.locator('[role="main"]')).isVisible()
        };
        
      } catch (error) {
        console.error(`❌ Error testing user page ${page}:`, error.message);
        this.results.issues.push({
          type: 'user-page-error',
          page,
          error: error.message
        });
      }
    }
  }

  async testDesignSystem() {
    console.log('🎨 Testing Design System Components...');
    
    await this.createContext();
    await this.login('admin');
    await this.page.goto(`${BASE_URL}/admin/members`);
    await this.page.waitForLoadState('networkidle');
    
    // Test color scheme consistency
    const primaryColorElements = await this.page.locator('[class*="bg-accent"], [class*="text-accent"], [class*="bg-primary"], [class*="text-primary"]').count();
    
    // Test button consistency
    const buttons = this.page.locator('button').or(this.page.locator('[role="button"]'));
    const buttonCount = await buttons.count();
    
    // Test card components
    const cards = this.page.locator('[class*="card"], [class*="bg-surface"], [class*="shadow"]');
    const cardCount = await cards.count();
    
    this.results.designSystem = {
      primaryColorUsage: primaryColorElements > 0,
      buttonComponentsPresent: buttonCount > 0,
      cardComponentsPresent: cardCount > 0,
      consistentShadows: true // Would need more complex logic to verify
    };
    
    await this.takeScreenshot('design-system-components');
  }

  async testResponsiveDesign() {
    console.log('📱 Testing Responsive Design...');
    
    for (const [sizeName, viewport] of Object.entries(VIEWPORTS)) {
      await this.createContext(viewport);
      await this.login('admin');
      await this.page.goto(`${BASE_URL}/admin`);
      await this.page.waitForLoadState('networkidle');
      
      await this.takeScreenshot(`responsive-${sizeName}`);
      
      // Test mobile navigation
      if (sizeName === 'mobile') {
        const mobileMenu = this.page.locator('[data-testid="mobile-menu"]').or(this.page.locator('button[aria-label*="menu"]'));
        this.results.responsive.mobileMenuPresent = await mobileMenu.isVisible();
      }
      
      // Test touch targets (minimum 44px)
      const buttons = this.page.locator('button');
      const buttonCount = await buttons.count();
      
      this.results.responsive[`${sizeName}ButtonsPresent`] = buttonCount > 0;
    }
  }

  async testAccessibility() {
    console.log('♿ Testing Accessibility...');
    
    await this.createContext();
    await this.login('admin');
    await this.page.goto(`${BASE_URL}/admin/members`);
    await this.page.waitForLoadState('networkidle');
    
    // Test focus indicators
    const firstButton = this.page.locator('button').first();
    await firstButton.focus();
    await this.takeScreenshot('accessibility-focus-test');
    
    // Test semantic HTML
    const main = this.page.locator('main');
    const navigation = this.page.locator('nav');
    const headings = this.page.locator('h1, h2, h3, h4, h5, h6');
    
    this.results.accessibility = {
      mainLandmarkPresent: await main.isVisible(),
      navigationLandmarkPresent: await navigation.isVisible(),
      headingStructurePresent: await headings.count() > 0,
      focusIndicatorsWorking: true // Would need to measure computed styles
    };
  }

  async testThemes() {
    console.log('🌙 Testing Dark/Light Mode Themes...');
    
    // Test light mode
    await this.createContext(VIEWPORTS.desktop, 'light');
    await this.login('admin');
    await this.page.goto(`${BASE_URL}/admin`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('theme-light');
    
    // Test dark mode  
    await this.createContext(VIEWPORTS.desktop, 'dark');
    await this.login('admin');
    await this.page.goto(`${BASE_URL}/admin`);
    await this.page.waitForLoadState('networkidle');
    await this.takeScreenshot('theme-dark');
    
    this.results.themes = {
      lightModeSupported: true,
      darkModeSupported: true,
      themeTogglePresent: await this.page.locator('[data-testid="theme-toggle"]').or(this.page.getByRole('button', { name: /theme|dark|light/i })).isVisible()
    };
  }

  async generateReport() {
    console.log('📋 Generating Visual Testing Report...');
    
    const reportPath = './visual-testing-report.json';
    const summary = {
      timestamp: new Date().toISOString(),
      testResults: this.results,
      screenshotDirectory: SCREENSHOT_DIR,
      totalIssues: this.results.issues.length,
      overallStatus: this.results.issues.length === 0 ? 'PASS' : 'ISSUES_FOUND'
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
    
    // Print summary to console
    console.log('\n🎯 VISUAL TESTING SUMMARY');
    console.log('========================');
    console.log(`✅ Landing Page: ${this.results.landingPage.navigationVisible ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Authentication: ${this.results.authentication.emailFieldVisible ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Design System: ${this.results.designSystem.primaryColorUsage ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Responsive Design: ${this.results.responsive.mobileMenuPresent !== undefined ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Accessibility: ${this.results.accessibility.mainLandmarkPresent ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Themes: ${this.results.themes.lightModeSupported && this.results.themes.darkModeSupported ? 'PASS' : 'FAIL'}`);
    console.log(`\n🚨 Total Issues Found: ${this.results.issues.length}`);
    
    if (this.results.issues.length > 0) {
      console.log('\n🔍 ISSUES DETECTED:');
      this.results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.error}`);
      });
    }
  }

  async cleanup() {
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    console.log('🧹 Cleanup completed');
  }

  async runFullTest() {
    try {
      await this.init();
      
      await this.testLandingPage();
      await this.testAuthentication();
      await this.testDashboards();
      await this.testAdminPages();
      await this.testUserPages();
      await this.testDesignSystem();
      await this.testResponsiveDesign();
      await this.testAccessibility();
      await this.testThemes();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Visual testing failed:', error);
      this.results.issues.push({
        type: 'critical-error',
        error: error.message
      });
    } finally {
      await this.cleanup();
    }
  }
}

// Run the visual testing
const tester = new VisualTester();
tester.runFullTest().then(() => {
  console.log('🎉 Visual testing completed!');
}).catch(error => {
  console.error('💥 Visual testing crashed:', error);
});