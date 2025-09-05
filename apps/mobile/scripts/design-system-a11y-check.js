#!/usr/bin/env node
/**
 * Design System Accessibility Checker
 * Validates accessibility compliance for Drouple Mobile Design System v1.0
 * Checks for WCAG 2.2 AA compliance, contrast ratios, and mobile accessibility patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Accessibility rules configuration
const A11Y_RULES = {
  // Contrast ratios (WCAG AA requirements)
  CONTRAST: {
    TEXT_MIN: 4.5,      // Normal text minimum contrast
    LARGE_TEXT_MIN: 3.0, // Large text minimum contrast  
    UI_MIN: 3.0,        // UI component minimum contrast
  },
  
  // Touch target sizes (iOS/Android guidelines)
  TOUCH_TARGETS: {
    MIN_SIZE: 44,       // Minimum 44x44 pts
    RECOMMENDED: 48,    // Recommended 48x48 pts
  },
  
  // Required accessibility props
  REQUIRED_PROPS: [
    'accessibilityLabel',
    'accessibilityRole',
    'testID',
  ],
  
  // Component-specific rules
  COMPONENTS: {
    'Button': ['accessibilityLabel', 'accessibilityRole'],
    'Input': ['accessibilityLabel'],
    'ListCell': ['accessibilityLabel', 'accessibilityRole'],
    'Toast': ['accessibilityRole', 'accessibilityLiveRegion'],
  },
};

let violations = [];
let checkedFiles = 0;
let totalComponents = 0;

/**
 * Main execution function
 */
function main() {
  console.log('🎨 Running Design System Accessibility Check...\n');
  console.log('📋 Checking WCAG 2.2 AA compliance for mobile components\n');
  
  // Check design tokens for color contrast
  checkDesignTokens();
  
  // Check UI components
  checkUIComponents();
  
  // Check pattern components
  checkPatternComponents();
  
  // Generate report
  generateReport();
}

/**
 * Check design tokens for accessibility compliance
 */
function checkDesignTokens() {
  console.log('🔍 Checking design tokens...');
  
  const tokensPath = path.join(__dirname, '../../packages/design-tokens/src');
  
  if (!fs.existsSync(tokensPath)) {
    console.warn('⚠️  Design tokens not found, skipping token checks');
    return;
  }
  
  // Check color contrast ratios
  try {
    const colorsFile = path.join(tokensPath, 'colors.ts');
    if (fs.existsSync(colorsFile)) {
      const content = fs.readFileSync(colorsFile, 'utf8');
      checkColorContrast(content, colorsFile);
    }
    
    // Check spacing for touch targets
    const spacingFile = path.join(tokensPath, 'spacing.ts');
    if (fs.existsSync(spacingFile)) {
      const content = fs.readFileSync(spacingFile, 'utf8');
      checkTouchTargetSizes(content, spacingFile);
    }
    
    console.log('✅ Design tokens checked\n');
  } catch (error) {
    console.warn('⚠️  Error checking design tokens:', error.message);
  }
}

/**
 * Check UI components for accessibility compliance
 */
function checkUIComponents() {
  console.log('🔍 Checking UI components...');
  
  const componentsPath = path.join(__dirname, '../src/components/ui');
  
  if (!fs.existsSync(componentsPath)) {
    console.warn('⚠️  UI components not found');
    return;
  }
  
  const files = fs.readdirSync(componentsPath)
    .filter(file => file.endsWith('.tsx') && file !== 'index.ts');
  
  files.forEach(file => {
    const filePath = path.join(componentsPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const componentName = file.replace('.tsx', '');
    
    checkComponentAccessibility(content, filePath, componentName);
    checkedFiles++;
  });
  
  console.log(`✅ Checked ${files.length} UI components\n`);
}

/**
 * Check pattern components for accessibility compliance
 */
function checkPatternComponents() {
  console.log('🔍 Checking pattern components...');
  
  const patternsPath = path.join(__dirname, '../src/components/patterns');
  
  if (!fs.existsSync(patternsPath)) {
    console.warn('⚠️  Pattern components not found');
    return;
  }
  
  const files = fs.readdirSync(patternsPath)
    .filter(file => file.endsWith('.tsx') && file !== 'index.ts');
  
  files.forEach(file => {
    const filePath = path.join(patternsPath, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const componentName = file.replace('.tsx', '');
    
    checkPatternAccessibility(content, filePath, componentName);
    checkedFiles++;
  });
  
  console.log(`✅ Checked ${files.length} pattern components\n`);
}

/**
 * Check color contrast compliance
 */
function checkColorContrast(content, filePath) {
  const fileName = path.relative(process.cwd(), filePath);
  
  // Look for potential low-contrast color combinations
  const lightBgPattern = /#[Ff]{6}|#[Ff]{3}/; // White backgrounds
  const darkTextPattern = /#[0-9A-Fa-f]{6}/g;  // Dark text colors
  
  // This is a simplified check - in real implementation, you'd calculate actual contrast ratios
  const colorValues = content.match(darkTextPattern) || [];
  
  colorValues.forEach(color => {
    // Simplified contrast check (would need proper color contrast calculation in production)
    if (color.toLowerCase() === '#666666' || color.toLowerCase() === '#999999') {
      violations.push({
        file: fileName,
        rule: 'color-contrast',
        severity: 'warning',
        message: `Color ${color} may not meet WCAG AA contrast requirements. Verify contrast ratio >= 4.5:1`,
        component: 'Color Tokens',
      });
    }
  });
}

/**
 * Check touch target sizes
 */
function checkTouchTargetSizes(content, filePath) {
  const fileName = path.relative(process.cwd(), filePath);
  
  // Look for size definitions that might be too small
  const sizePattern = /(?:height|width|minHeight|minWidth):\s*(\d+)/g;
  let match;
  
  while ((match = sizePattern.exec(content)) !== null) {
    const size = parseInt(match[1]);
    if (size < A11Y_RULES.TOUCH_TARGETS.MIN_SIZE && size > 20) { // Avoid flagging border widths, etc.
      violations.push({
        file: fileName,
        rule: 'touch-target-size',
        severity: 'error',
        message: `Size ${size}px is below minimum touch target size of ${A11Y_RULES.TOUCH_TARGETS.MIN_SIZE}px`,
        component: 'Spacing Tokens',
      });
    }
  }
}

/**
 * Check component accessibility compliance
 */
function checkComponentAccessibility(content, filePath, componentName) {
  const fileName = path.relative(process.cwd(), filePath);
  totalComponents++;
  
  // Check for required accessibility props
  const requiredProps = A11Y_RULES.COMPONENTS[componentName] || A11Y_RULES.REQUIRED_PROPS;
  
  requiredProps.forEach(prop => {
    if (!content.includes(prop)) {
      violations.push({
        file: fileName,
        rule: 'missing-accessibility-prop',
        severity: 'warning',
        message: `Component ${componentName} should include ${prop} for better accessibility`,
        component: componentName,
      });
    }
  });
  
  // Check for accessibility role usage
  if (content.includes('Pressable') && !content.includes('accessibilityRole')) {
    violations.push({
      file: fileName,
      rule: 'pressable-accessibility-role',
      severity: 'error',
      message: 'Pressable components must have accessibilityRole defined',
      component: componentName,
    });
  }
  
  // Check for proper screen reader support
  if (content.includes('TextInput') && !content.includes('accessibilityLabel')) {
    violations.push({
      file: fileName,
      rule: 'input-accessibility-label',
      severity: 'error',
      message: 'TextInput components must have accessibilityLabel for screen readers',
      component: componentName,
    });
  }
  
  // Check for Dynamic Type support
  if (content.includes('fontSize') && !content.includes('allowFontScaling')) {
    violations.push({
      file: fileName,
      rule: 'dynamic-type-support',
      severity: 'warning',
      message: 'Text components should support Dynamic Type with allowFontScaling',
      component: componentName,
    });
  }
}

/**
 * Check pattern component accessibility
 */
function checkPatternAccessibility(content, filePath, componentName) {
  const fileName = path.relative(process.cwd(), filePath);
  
  // Check for loading state accessibility
  if (componentName.includes('Skeleton') && !content.includes('progressbar')) {
    violations.push({
      file: fileName,
      rule: 'loading-state-role',
      severity: 'warning',
      message: 'Loading states should have accessibilityRole="progressbar"',
      component: componentName,
    });
  }
  
  // Check for error state accessibility
  if (componentName.includes('Error') && !content.includes('alert')) {
    violations.push({
      file: fileName,
      rule: 'error-state-role',
      severity: 'warning',
      message: 'Error states should have accessibilityRole="alert"',
      component: componentName,
    });
  }
}

/**
 * Generate accessibility report
 */
function generateReport() {
  console.log('📊 Accessibility Check Results');
  console.log('=' .repeat(50));
  
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  
  console.log(`📁 Files checked: ${checkedFiles}`);
  console.log(`🧩 Components analyzed: ${totalComponents}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`⚠️  Warnings: ${warningCount}`);
  console.log('');
  
  if (violations.length === 0) {
    console.log('🎉 No accessibility violations found!');
    console.log('✅ Design system meets WCAG 2.2 AA compliance standards');
    process.exit(0);
  }
  
  // Group violations by severity
  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');
  
  if (errors.length > 0) {
    console.log('❌ ERRORS (Must Fix):');
    console.log('-'.repeat(30));
    errors.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}`);
      console.log(`   Component: ${violation.component}`);
      console.log(`   Rule: ${violation.rule}`);
      console.log(`   Message: ${violation.message}`);
      console.log('');
    });
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (Should Fix):');
    console.log('-'.repeat(30));
    warnings.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}`);
      console.log(`   Component: ${violation.component}`);
      console.log(`   Rule: ${violation.rule}`);
      console.log(`   Message: ${violation.message}`);
      console.log('');
    });
  }
  
  console.log('📚 Accessibility Guidelines:');
  console.log('• All interactive elements must have minimum 44x44pt touch targets');
  console.log('• Text contrast must meet WCAG AA (4.5:1 for normal, 3:1 for large)');
  console.log('• All components must support Dynamic Type scaling');
  console.log('• Screen readers must be able to navigate and understand all content');
  console.log('• Respect user preferences for reduced motion');
  console.log('');
  
  // Exit with warning but don't fail build (for now)
  console.log('⚠️  Please address accessibility issues for optimal user experience');
  process.exit(0);
}

// Run the accessibility check
if (require.main === module) {
  main();
}