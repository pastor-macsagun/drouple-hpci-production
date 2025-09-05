#!/usr/bin/env node

/**
 * Production Configuration Verification Script
 * Validates that all required environment variables are properly configured
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

console.log(`${colors.blue}🔍 Drouple - Church Management System Production Configuration Verification${colors.reset}`);
console.log('=' .repeat(50));

// Load .env.production
const envPath = path.join(__dirname, '..', '.env.production');
if (!fs.existsSync(envPath)) {
  console.error(`${colors.red}❌ .env.production file not found!${colors.reset}`);
  process.exit(1);
}

// Parse environment file
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key) {
      envVars[key.trim()] = valueParts.join('=').replace(/["']/g, '').trim();
    }
  }
});

// Required configuration
const requiredVars = [
  { key: 'DATABASE_URL', description: 'Neon PostgreSQL connection string' },
  { key: 'DATABASE_URL_UNPOOLED', description: 'Direct database connection' },
  { key: 'NEXTAUTH_URL', description: 'Production application URL' },
  { key: 'NEXTAUTH_SECRET', description: 'Authentication secret key' },
  { key: 'RESEND_API_KEY', description: 'Email service API key' },
  { key: 'RESEND_FROM_EMAIL', description: 'Sender email address' },
];

const optionalVars = [
  { key: 'NODE_ENV', description: 'Node environment', expected: 'production' },
  { key: 'APP_ENV', description: 'Application environment', expected: 'production' },
  { key: 'RATE_LIMIT_ENABLED', description: 'Rate limiting flag' },
];

let hasErrors = false;
let hasWarnings = false;

console.log(`\n${colors.yellow}📋 Required Variables:${colors.reset}`);
requiredVars.forEach(({ key, description }) => {
  if (envVars[key]) {
    // Mask sensitive values
    let displayValue = envVars[key];
    if (key.includes('SECRET') || key.includes('API_KEY') || key.includes('PASSWORD')) {
      displayValue = displayValue.substring(0, 8) + '...' + displayValue.substring(displayValue.length - 4);
    } else if (key.includes('DATABASE_URL')) {
      displayValue = displayValue.replace(/:[^:@]+@/, ':****@');
    }
    console.log(`  ✅ ${key}: ${displayValue}`);
  } else {
    console.log(`  ${colors.red}❌ ${key}: NOT SET - ${description}${colors.reset}`);
    hasErrors = true;
  }
});

console.log(`\n${colors.yellow}📋 Optional Variables:${colors.reset}`);
optionalVars.forEach(({ key, description, expected }) => {
  if (envVars[key]) {
    const status = !expected || envVars[key] === expected ? '✅' : '⚠️';
    const color = status === '⚠️' ? colors.yellow : '';
    console.log(`  ${color}${status} ${key}: ${envVars[key]}${colors.reset}`);
    if (status === '⚠️') hasWarnings = true;
  } else {
    console.log(`  ⚠️  ${key}: NOT SET`);
    hasWarnings = true;
  }
});

// Validation checks
console.log(`\n${colors.yellow}🔐 Security Checks:${colors.reset}`);

// Check NEXTAUTH_SECRET strength
if (envVars.NEXTAUTH_SECRET) {
  if (envVars.NEXTAUTH_SECRET.length < 32) {
    console.log(`  ${colors.red}❌ NEXTAUTH_SECRET is too short (< 32 chars)${colors.reset}`);
    hasErrors = true;
  } else {
    console.log(`  ✅ NEXTAUTH_SECRET length: ${envVars.NEXTAUTH_SECRET.length} chars`);
  }
}

// Check NEXTAUTH_URL format
if (envVars.NEXTAUTH_URL) {
  if (!envVars.NEXTAUTH_URL.startsWith('https://')) {
    console.log(`  ${colors.yellow}⚠️  NEXTAUTH_URL should use HTTPS in production${colors.reset}`);
    hasWarnings = true;
  } else {
    console.log(`  ✅ NEXTAUTH_URL uses HTTPS`);
  }
}

// Check database URL format
if (envVars.DATABASE_URL) {
  if (envVars.DATABASE_URL.includes('pgbouncer=true')) {
    console.log(`  ✅ Database URL uses connection pooling`);
  } else {
    console.log(`  ${colors.yellow}⚠️  Database URL should use pgbouncer=true for production${colors.reset}`);
    hasWarnings = true;
  }
}

// Check email configuration
if (envVars.RESEND_FROM_EMAIL) {
  if (envVars.RESEND_FROM_EMAIL.includes('@')) {
    console.log(`  ✅ Email sender address configured`);
  } else {
    console.log(`  ${colors.red}❌ Invalid email sender address${colors.reset}`);
    hasErrors = true;
  }
}

// Summary
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log(`${colors.red}❌ Configuration has errors that must be fixed${colors.reset}`);
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${colors.yellow}⚠️  Configuration is valid but has warnings${colors.reset}`);
  console.log(`${colors.green}✅ Ready for deployment (review warnings)${colors.reset}`);
} else {
  console.log(`${colors.green}✅ Configuration is valid and ready for production!${colors.reset}`);
}

console.log(`\n${colors.blue}💡 Next steps:${colors.reset}`);
console.log('  1. Run: npm run build');
console.log('  2. Run: ./scripts/deploy-production.sh');
console.log('  3. Visit: https://drouple-hpci-prod.vercel.app');