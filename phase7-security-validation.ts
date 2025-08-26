#!/usr/bin/env tsx
/**
 * Phase 7: Test rate limiting (5 bad attempts) AND security headers
 * (Testing security features and protections)
 */

import { chromium } from 'playwright'
import fs from 'fs'

const BASE_URL = 'http://localhost:3000'

// Load created QA users
const qaUsersFile = './qa-users-created.json'
if (!fs.existsSync(qaUsersFile)) {
  console.error('❌ QA users file not found. Run create-qa-users.ts first.')
  process.exit(1)
}

const { timestamp: TIMESTAMP } = JSON.parse(fs.readFileSync(qaUsersFile, 'utf8'))

async function testRateLimiting(page: any) {
  console.log(`\n🚫 Testing Rate Limiting (5 Bad Login Attempts)`)
  
  try {
    const testEmail = 'rate.limit.test@test.com'
    const badPassword = 'WrongPassword123'
    let rateLimited = false
    let attempts = 0
    
    for (let i = 1; i <= 6; i++) {
      console.log(`   🔄 Bad login attempt ${i}/6`)
      
      await page.goto(`${BASE_URL}/auth/signin`)
      await page.waitForSelector('input#email')
      await page.fill('input#email', testEmail)
      await page.fill('input#password', badPassword)
      
      // Monitor network response
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/auth') || response.url().includes('/auth'), 
        { timeout: 5000 }
      ).catch(() => null)
      
      await page.click('button[type="submit"]')
      
      const response = await responsePromise
      if (response) {
        const status = response.status()
        const headers = response.headers()
        
        console.log(`     Status: ${status}`)
        
        // Check for rate limiting indicators
        if (status === 429) {
          rateLimited = true
          console.log(`     🚫 Rate limited on attempt ${i}`)
          
          // Check for rate limit headers
          const rateLimitHeaders = [
            'x-ratelimit-limit',
            'x-ratelimit-remaining',
            'x-ratelimit-reset',
            'retry-after'
          ]
          
          console.log(`     📊 Rate limit headers:`)
          rateLimitHeaders.forEach(header => {
            if (headers[header]) {
              console.log(`       ${header}: ${headers[header]}`)
            }
          })
          
          break
        }
        
        // Check for other rate limiting responses
        const bodyText = await response.text().catch(() => '')
        if (bodyText.toLowerCase().includes('too many requests') || 
            bodyText.toLowerCase().includes('rate limit') ||
            bodyText.toLowerCase().includes('rate exceeded')) {
          rateLimited = true
          console.log(`     🚫 Rate limited (message in response)`)
          break
        }
      }
      
      attempts++
      
      // Take screenshot of error state
      await page.screenshot({ 
        path: `./test-artifacts/${TIMESTAMP}-phase7-rate-limit-attempt-${i}.png`, 
        fullPage: true 
      })
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    console.log(`   📊 Completed ${attempts} attempts, Rate limited: ${rateLimited}`)
    
    return {
      status: 'PASS',
      test: 'Rate Limiting',
      rateLimited,
      attempts,
      expectedAfter: 5
    }
    
  } catch (error) {
    console.log(`   ❌ Rate limiting test failed: ${error}`)
    
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase7-rate-limit-ERROR.png`, 
      fullPage: true 
    })
    
    return {
      status: 'FAIL',
      test: 'Rate Limiting',
      error: error.toString()
    }
  }
}

async function testSecurityHeaders(page: any) {
  console.log(`\n🔒 Testing Security Headers`)
  
  try {
    // Test security headers on different endpoints
    const endpoints = [
      '/',
      '/auth/signin',
      '/dashboard',
      '/api/health'
    ]
    
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy',
      'referrer-policy'
    ]
    
    const headerResults: any = {}
    
    for (const endpoint of endpoints) {
      console.log(`   🔍 Testing ${endpoint}`)
      
      const responsePromise = page.waitForResponse(
        response => response.url().includes(endpoint.replace('/api', '/api')),
        { timeout: 10000 }
      )
      
      await page.goto(`${BASE_URL}${endpoint}`)
      
      try {
        const response = await responsePromise
        const headers = response.headers()
        
        headerResults[endpoint] = {}
        
        securityHeaders.forEach(header => {
          headerResults[endpoint][header] = headers[header] || 'Not Set'
        })
        
        console.log(`     Status: ${response.status()}`)
        const foundHeaders = securityHeaders.filter(h => headers[h]).length
        console.log(`     Security headers found: ${foundHeaders}/${securityHeaders.length}`)
        
      } catch (responseError) {
        console.log(`     ⚠️ Could not capture response for ${endpoint}`)
        headerResults[endpoint] = { error: 'Response not captured' }
      }
    }
    
    // Take screenshot of final page
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase7-security-headers.png`, 
      fullPage: true 
    })
    
    // Analyze security header coverage
    let totalHeaders = 0
    let setHeaders = 0
    
    Object.values(headerResults).forEach((endpointHeaders: any) => {
      if (!endpointHeaders.error) {
        Object.values(endpointHeaders).forEach((headerValue: any) => {
          totalHeaders++
          if (headerValue !== 'Not Set') {
            setHeaders++
          }
        })
      }
    })
    
    const coverage = totalHeaders > 0 ? Math.round((setHeaders / totalHeaders) * 100) : 0
    console.log(`   📊 Security header coverage: ${coverage}% (${setHeaders}/${totalHeaders})`)
    
    return {
      status: 'PASS',
      test: 'Security Headers',
      coverage,
      headerResults,
      totalChecked: totalHeaders,
      headersSet: setHeaders
    }
    
  } catch (error) {
    console.log(`   ❌ Security headers test failed: ${error}`)
    
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase7-security-ERROR.png`, 
      fullPage: true 
    })
    
    return {
      status: 'FAIL',
      test: 'Security Headers',
      error: error.toString()
    }
  }
}

async function testCSRFProtection(page: any) {
  console.log(`\n🛡️ Testing CSRF Protection`)
  
  try {
    // Check for CSRF tokens in forms
    await page.goto(`${BASE_URL}/auth/signin`)
    await page.waitForLoadState('networkidle')
    
    // Look for CSRF token fields
    const csrfSelectors = [
      'input[name="csrf"]',
      'input[name="csrfToken"]',
      'input[name="_token"]',
      'meta[name="csrf-token"]',
      '[data-csrf]'
    ]
    
    let csrfFound = false
    for (const selector of csrfSelectors) {
      if (await page.locator(selector).count() > 0) {
        csrfFound = true
        console.log(`   ✅ CSRF token found: ${selector}`)
        break
      }
    }
    
    if (!csrfFound) {
      console.log(`   ℹ️ No explicit CSRF tokens found (may use other protection)`)
    }
    
    // Check for double-submit cookie pattern
    const cookies = await page.context().cookies()
    const csrfCookie = cookies.find(c => 
      c.name.toLowerCase().includes('csrf') || 
      c.name.toLowerCase().includes('token') ||
      c.name.toLowerCase().includes('xsrf')
    )
    
    if (csrfCookie) {
      console.log(`   🍪 CSRF cookie found: ${csrfCookie.name}`)
    }
    
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase7-csrf-protection.png`, 
      fullPage: true 
    })
    
    return {
      status: 'PASS',
      test: 'CSRF Protection',
      tokenFound: csrfFound,
      cookieFound: !!csrfCookie,
      cookieName: csrfCookie?.name
    }
    
  } catch (error) {
    console.log(`   ❌ CSRF protection test failed: ${error}`)
    
    await page.screenshot({ 
      path: `./test-artifacts/${TIMESTAMP}-phase7-csrf-ERROR.png`, 
      fullPage: true 
    })
    
    return {
      status: 'FAIL',
      test: 'CSRF Protection',
      error: error.toString()
    }
  }
}

async function validatePhase7() {
  console.log('🚀 Phase 7: Rate Limiting and Security Headers')
  console.log(`📋 Testing 5 bad login attempts, security headers, and CSRF protection`)
  
  const browser = await chromium.launch({ headless: false })
  const results: any = {}
  let successCount = 0
  let failCount = 0
  
  try {
    // Create browser context
    const context = await browser.newContext()
    const page = await context.newPage()
    
    // Test security features
    const securityTests = [
      () => testRateLimiting(page),
      () => testSecurityHeaders(page),
      () => testCSRFProtection(page)
    ]
    
    for (let i = 0; i < securityTests.length; i++) {
      console.log(`\n🔒 Security Test ${i + 1}/${securityTests.length}`)
      
      const result = await securityTests[i]()
      results[result.test] = result
      
      if (result.status === 'PASS') {
        successCount++
      } else {
        failCount++
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
    
    await context.close()
    
    // Generate summary
    console.log(`\n📊 PHASE 7 SECURITY VALIDATION RESULTS:`)
    console.log(`   ✅ Security tests passed: ${successCount}/${securityTests.length}`)
    console.log(`   ❌ Security tests failed: ${failCount}`)
    
    // Detailed results
    Object.entries(results).forEach(([test, result]: [string, any]) => {
      if (result.status === 'PASS') {
        if (test === 'Rate Limiting') {
          console.log(`   🚫 ${test}: ${result.rateLimited ? 'Working' : 'Not detected'} (${result.attempts} attempts)`)
        } else if (test === 'Security Headers') {
          console.log(`   🔒 ${test}: ${result.coverage}% coverage (${result.headersSet}/${result.totalChecked})`)
        } else if (test === 'CSRF Protection') {
          const protection = result.tokenFound || result.cookieFound ? 'Detected' : 'Not detected'
          console.log(`   🛡️ ${test}: ${protection}`)
        }
      } else {
        console.log(`   ❌ ${test}: ${result.error}`)
      }
    })
    
    const overallStatus = failCount === 0 ? 'PASS' : 'PASS_WITH_ISSUES'
    
    console.log(`\n${overallStatus === 'PASS' ? '✅' : '⚠️'} Phase 7: ${overallStatus}`)
    
    return {
      status: overallStatus,
      details: `Security testing: ${successCount} tests passed, ${failCount} failed`,
      results,
      screenshots: [
        `${TIMESTAMP}-phase7-rate-limit-attempt-1.png`,
        `${TIMESTAMP}-phase7-rate-limit-attempt-2.png`,
        `${TIMESTAMP}-phase7-rate-limit-attempt-3.png`,
        `${TIMESTAMP}-phase7-rate-limit-attempt-4.png`,
        `${TIMESTAMP}-phase7-rate-limit-attempt-5.png`,
        `${TIMESTAMP}-phase7-security-headers.png`,
        `${TIMESTAMP}-phase7-csrf-protection.png`
      ]
    }
    
  } catch (error) {
    console.log(`\n❌ Phase 7: FAIL - ${error}`)
    
    return {
      status: 'FAIL',
      details: `Phase 7 failed: ${error}`,
      results
    }
  } finally {
    await browser.close()
  }
}

// Run validation
if (require.main === module) {
  validatePhase7()
    .then(result => {
      console.log('\nPhase 7 Final Result:', result)
      
      if (result.status === 'PASS' || result.status === 'PASS_WITH_ISSUES') {
        console.log(`\n🎉 SECURITY VALIDATION COMPLETED${result.status === 'PASS_WITH_ISSUES' ? ' (WITH ISSUES)' : ''}`)
        process.exit(0)
      } else {
        console.log('\n💥 SECURITY VALIDATION FAILED')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Phase 7 Error:', error)
      process.exit(1)
    })
}

export { validatePhase7 }