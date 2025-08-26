import { test, expect } from '@playwright/test'

test.describe('Security Headers', () => {
  const pagesToTest = [
    '/',
    '/dashboard',
    '/auth/signin',
    '/register',
    '/checkin',
    '/events',
    '/api/health',
  ]

  test('validates security headers on main pages', async ({ page }) => {
    const results: any[] = []

    for (const url of pagesToTest) {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
      
      if (response) {
        const headers = response.headers()
        
        results.push({
          url,
          headers: {
            'content-security-policy': headers['content-security-policy'] || 'MISSING',
            'x-frame-options': headers['x-frame-options'] || 'MISSING',
            'x-content-type-options': headers['x-content-type-options'] || 'MISSING',
            'referrer-policy': headers['referrer-policy'] || 'MISSING',
            'strict-transport-security': headers['strict-transport-security'] || 'MISSING',
            'permissions-policy': headers['permissions-policy'] || 'MISSING',
          },
        })
      }
    }

    // Log results for verification report
    console.log('Security Headers Audit:')
    console.log(JSON.stringify(results, null, 2))

    // Check critical headers
    for (const result of results) {
      const { url, headers } = result

      // X-Content-Type-Options should always be present
      if (headers['x-content-type-options'] === 'MISSING') {
        console.warn(`⚠️ ${url}: Missing X-Content-Type-Options header`)
      }

      // Check for frame protection
      if (headers['x-frame-options'] === 'MISSING' && 
          !headers['content-security-policy']?.includes('frame-ancestors')) {
        console.warn(`⚠️ ${url}: Missing frame protection (X-Frame-Options or CSP frame-ancestors)`)
      }

      // HSTS for HTTPS
      if (url.startsWith('https://') && headers['strict-transport-security'] === 'MISSING') {
        console.warn(`⚠️ ${url}: Missing Strict-Transport-Security header`)
      }
    }
  })

  test('CSP allows necessary resources', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    if (response) {
      const csp = response.headers()['content-security-policy']
      
      if (csp) {
        // Check if CSP is not too restrictive
        expect(csp).toContain("'self'") // Should allow same-origin
        
        // If using inline scripts/styles (Next.js often does)
        if (csp.includes("'unsafe-inline'")) {
          console.warn("⚠️ CSP allows 'unsafe-inline' - consider using nonces")
        }
        
        // Check for upgrade-insecure-requests
        if (!csp.includes('upgrade-insecure-requests')) {
          console.warn("⚠️ CSP missing upgrade-insecure-requests directive")
        }
      } else {
        console.warn('⚠️ No Content-Security-Policy header found')
      }
    }
  })

  test('validates API security headers', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/api/auth/session',
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint)
      const headers = response.headers()

      // API should not be frameable
      const frameProtection = headers['x-frame-options'] || 
                             (headers['content-security-policy']?.includes('frame-ancestors'))
      
      if (!frameProtection) {
        console.warn(`⚠️ API ${endpoint}: Missing frame protection`)
      }

      // Should have content type options
      if (!headers['x-content-type-options']) {
        console.warn(`⚠️ API ${endpoint}: Missing X-Content-Type-Options`)
      }

      // Check for information disclosure
      if (headers['x-powered-by']) {
        console.warn(`⚠️ API ${endpoint}: Exposes X-Powered-By header`)
      }

      if (headers['server'] && headers['server'] !== 'Vercel') {
        console.warn(`⚠️ API ${endpoint}: Exposes detailed Server header: ${headers['server']}`)
      }
    }
  })

  test('cookies have secure attributes', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Trigger cookie creation
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    const cookies = await page.context().cookies()
    
    for (const cookie of cookies) {
      if (cookie.name.includes('session') || cookie.name.includes('auth')) {
        // Session cookies should be httpOnly
        if (!cookie.httpOnly) {
          console.warn(`⚠️ Cookie ${cookie.name} is not httpOnly`)
        }
        
        // Should have SameSite attribute
        if (!cookie.sameSite) {
          console.warn(`⚠️ Cookie ${cookie.name} missing SameSite attribute`)
        }
        
        // Should be Secure in production
        if (process.env.NODE_ENV === 'production' && !cookie.secure) {
          console.warn(`⚠️ Cookie ${cookie.name} is not Secure in production`)
        }
      }
    }
  })

  test('no sensitive data in response headers', async ({ page }) => {
    const response = await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    
    if (response) {
      const headers = response.headers()
      
      // Check for sensitive information leakage
      const sensitivePatterns = [
        /database/i,
        /password/i,
        /secret/i,
        /key/i,
        /token/i,
        /internal/i,
      ]
      
      for (const [name, value] of Object.entries(headers)) {
        for (const pattern of sensitivePatterns) {
          if (pattern.test(name) || pattern.test(value)) {
            // Exclude expected headers like 'set-cookie'
            if (!name.toLowerCase().includes('cookie') && 
                !name.toLowerCase().includes('key') &&
                !name.toLowerCase().includes('token')) {
              console.warn(`⚠️ Potential sensitive data in header ${name}: ${value}`)
            }
          }
        }
      }
    }
  })

  test('validates CORS configuration', async ({ request }) => {
    // Test CORS preflight
    const response = await request.fetch('/api/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://evil.com',
        'Access-Control-Request-Method': 'POST',
      },
    })
    
    const headers = response.headers()
    
    // Check CORS headers
    const allowOrigin = headers['access-control-allow-origin']
    
    if (allowOrigin === '*') {
      console.warn('⚠️ CORS allows all origins (*) - consider restricting')
    } else if (allowOrigin === 'https://evil.com') {
      console.warn('⚠️ CORS allows unauthorized origin')
    }
    
    // Check credentials
    if (headers['access-control-allow-credentials'] === 'true' && allowOrigin === '*') {
      console.error('❌ CRITICAL: CORS allows credentials with wildcard origin')
    }
  })

  test('checks for clickjacking protection', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    if (response) {
      const headers = response.headers()
      
      const hasFrameOptions = headers['x-frame-options']
      const hasCSPFrameAncestors = headers['content-security-policy']?.includes('frame-ancestors')
      
      if (!hasFrameOptions && !hasCSPFrameAncestors) {
        console.error('❌ No clickjacking protection (missing X-Frame-Options and CSP frame-ancestors)')
      } else if (hasFrameOptions) {
        const value = hasFrameOptions.toLowerCase()
        if (value !== 'deny' && value !== 'sameorigin') {
          console.warn(`⚠️ Weak X-Frame-Options value: ${hasFrameOptions}`)
        }
      }
    }
  })

  test('validates referrer policy', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
    
    if (response) {
      const referrerPolicy = response.headers()['referrer-policy']
      
      if (!referrerPolicy) {
        console.warn('⚠️ No Referrer-Policy header')
      } else if (referrerPolicy === 'unsafe-url') {
        console.warn('⚠️ Unsafe Referrer-Policy: may leak sensitive URLs')
      }
    }
  })

  test('checks for security.txt', async ({ request }) => {
    const response = await request.get('/.well-known/security.txt', {
      failOnStatusCode: false,
    })
    
    if (response.status() === 404) {
      console.info('ℹ️ No security.txt file (optional but recommended)')
    } else if (response.ok()) {
      const text = await response.text()
      if (!text.includes('Contact:')) {
        console.warn('⚠️ security.txt missing Contact field')
      }
    }
  })
})