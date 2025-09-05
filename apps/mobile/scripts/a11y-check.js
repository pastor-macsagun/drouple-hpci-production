#!/usr/bin/env node
/**
 * Accessibility Checker for React Native Components
 * Validates accessibility props and common patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REQUIRED_A11Y_PROPS = [
  'accessibilityLabel',
  'accessibilityRole', 
  'accessibilityHint',
  'testID'
];

const A11Y_ROLES = [
  'button',
  'link', 
  'text',
  'image',
  'header',
  'search',
  'tablist',
  'tab',
  'list',
  'listitem'
];

let violations = [];

/**
 * Check file for accessibility violations
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.relative(process.cwd(), filePath);
  
  // Check for TouchableOpacity without accessibilityRole
  const touchableMatches = content.match(/<TouchableOpacity[^>]*>/g) || [];
  touchableMatches.forEach((match, index) => {
    if (!match.includes('accessibilityRole')) {
      violations.push({
        file: fileName,
        line: getLineNumber(content, match, index),
        rule: 'touchable-accessibility-role',
        message: 'TouchableOpacity should have accessibilityRole="button"'
      });
    }
    
    if (!match.includes('accessibilityLabel')) {
      violations.push({
        file: fileName,
        line: getLineNumber(content, match, index),
        rule: 'touchable-accessibility-label', 
        message: 'TouchableOpacity should have meaningful accessibilityLabel'
      });
    }
  });
  
  // Check for TextInput without accessibilityLabel
  const inputMatches = content.match(/<TextInput[^>]*>/g) || [];
  inputMatches.forEach((match, index) => {
    if (!match.includes('accessibilityLabel') && !match.includes('placeholder')) {
      violations.push({
        file: fileName,
        line: getLineNumber(content, match, index),
        rule: 'input-accessibility-label',
        message: 'TextInput should have accessibilityLabel or meaningful placeholder'
      });
    }
  });
  
  // Check for Image without alt text equivalent
  const imageMatches = content.match(/<Image[^>]*>/g) || [];
  imageMatches.forEach((match, index) => {
    if (!match.includes('accessibilityLabel') && !match.includes('alt')) {
      violations.push({
        file: fileName,
        line: getLineNumber(content, match, index),
        rule: 'image-accessibility-label',
        message: 'Image should have accessibilityLabel for screen readers'
      });
    }
  });
}

/**
 * Get line number of match in content
 */
function getLineNumber(content, match, matchIndex) {
  const beforeMatch = content.substring(0, content.indexOf(match));
  return beforeMatch.split('\n').length;
}

/**
 * Scan directory for React Native files
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      scanDirectory(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.tsx') || file.name.endsWith('.ts'))) {
      checkFile(fullPath);
    }
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Running accessibility checks...\n');
  
  const srcPath = path.join(__dirname, '../src');
  
  if (!fs.existsSync(srcPath)) {
    console.error('❌ Source directory not found:', srcPath);
    process.exit(1);
  }
  
  scanDirectory(srcPath);
  
  if (violations.length === 0) {
    console.log('✅ No accessibility violations found!');
    process.exit(0);
  } else {
    console.log(`❌ Found ${violations.length} accessibility violations:\n`);
    
    violations.forEach((violation, index) => {
      console.log(`${index + 1}. ${violation.file}:${violation.line}`);
      console.log(`   Rule: ${violation.rule}`);
      console.log(`   Message: ${violation.message}\n`);
    });
    
    // Don't fail CI for now, just warn
    console.log('⚠️  Please fix accessibility issues for better user experience');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkFile, scanDirectory };