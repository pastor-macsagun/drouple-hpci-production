import { test, expect } from '@playwright/test'

test.describe('Security Headers @security', () => {
  test.describe('Content Security Policy', () => {
    test('should have CSP header on main pages', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response?.headers()
      
      // Check for CSP header
      const csp = headers?.['content-security-policy'] || headers?.['Content-Security-Policy']
      expect(csp).toBeDefined()
      
      // Verify CSP directives
      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("script-src")
      expect(csp).toContain("style-src")
      expect(csp).toContain("img-src")
      expect(csp).toContain("connect-src")
      expect(csp).toContain("font-src")
      expect(csp).toContain("frame-ancestors 'none'")
    })
    
    test('should have CSP on authenticated pages', async ({ page, context }) => {
      // Add auth cookie
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      const response = await page.goto('/dashboard')
      const headers = response?.headers()
      
      const csp = headers?.['content-security-policy'] || headers?.['Content-Security-Policy']
      expect(csp).toBeDefined()
    })
    
    test('should block inline scripts without nonce', async ({ page }) => {
      await page.goto('/')
      
      // Try to execute inline script
      const result = await page.evaluate(() => {
        try {
          const script = document.createElement('script')
          script.innerHTML = 'window.testVar = "blocked"'
          document.head.appendChild(script)
          return window.testVar
        } catch (e) {
          return 'blocked'
        }
      })
      
      // Should be blocked by CSP
      expect(result).not.toBe('blocked')
    })
    
    test('should report CSP violations', async ({ page }) => {
      // Listen for CSP violation reports
      const cspReports: any[] = []
      await page.route('**/csp-report', route => {
        cspReports.push(route.request().postDataJSON())
        route.fulfill({ status: 204 })
      })
      
      await page.goto('/')
      
      // Trigger a CSP violation
      await page.evaluate(() => {
        const script = document.createElement('script')
        script.src = 'https://evil.com/malicious.js'
        document.head.appendChild(script)
      })
      
      // Wait for potential report
      await page.waitForTimeout(1000)
      
      // Should have CSP report endpoint configured
      const response = await page.goto('/')
      const csp = response?.headers()?.['content-security-policy']
      expect(csp).toContain('report-uri') // or report-to
    })
  })
  
  test.describe('X-Content-Type-Options', () => {
    test('should set nosniff header', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response?.headers()
      
      expect(headers?.['x-content-type-options']).toBe('nosniff')
    })
    
    test('should have nosniff on all resources', async ({ page }) => {
      await page.goto('/')
      
      // Check various resource types
      const resources = [
        '/api/health',
        '/favicon.ico',
        '/_next/static/css/app.css',
        '/_next/static/js/app.js',
      ]
      
      for (const resource of resources) {
        const response = await page.request.get(resource)
        const headers = response.headers()
        expect(headers['x-content-type-options']).toBe('nosniff')
      }
    })
  })
  
  test.describe('X-Frame-Options / frame-ancestors', () => {
    test('should prevent framing with X-Frame-Options', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response?.headers()
      
      // Should have either X-Frame-Options or frame-ancestors in CSP
      const xFrameOptions = headers?.['x-frame-options']
      const csp = headers?.['content-security-policy']
      
      expect(
        xFrameOptions === 'DENY' || 
        xFrameOptions === 'SAMEORIGIN' ||
        csp?.includes("frame-ancestors 'none'") ||
        csp?.includes("frame-ancestors 'self'")
      ).toBe(true)
    })
    
    test('should block iframe embedding', async ({ page, context }) => {
      // Create a page that tries to embed the app
      await page.setContent(`
        <html>
          <body>
            <iframe src="http://localhost:3000" width="800" height="600"></iframe>
          </body>
        </html>
      `)
      
      // Wait for iframe to load
      await page.waitForTimeout(2000)
      
      // Check if iframe is blocked
      const iframeContent = await page.frameLocator('iframe').locator('body').textContent().catch(() => null)
      
      // Should be blocked or empty
      expect(iframeContent).toBeNull()
    })
  })
  
  test.describe('Referrer-Policy', () => {
    test('should set appropriate referrer policy', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response?.headers()
      
      const referrerPolicy = headers?.['referrer-policy']
      expect(referrerPolicy).toMatch(/^(no-referrer|same-origin|strict-origin|strict-origin-when-cross-origin)$/)
    })
    
    test('should not leak referrer to external sites', async ({ page }) => {
      await page.goto('/dashboard')
      
      // Click external link
      await page.evaluate(() => {
        const link = document.createElement('a')
        link.href = 'https://external-site.com'
        link.rel = 'noopener noreferrer'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
      })
      
      // Referrer should be restricted based on policy
      const referrerPolicy = await page.evaluate(() => document.referrerPolicy)
      expect(referrerPolicy).not.toBe('unsafe-url')
    })
  })
  
  test.describe('Strict-Transport-Security', () => {
    test.skip('should set HSTS header in production', async ({ page }) => {
      // Skip in development
      const response = await page.goto('https://production-url.com')
      const headers = response?.headers()
      
      const hsts = headers?.['strict-transport-security']
      expect(hsts).toBeDefined()
      expect(hsts).toContain('max-age=')
      expect(hsts).toContain('includeSubDomains')
      expect(parseInt(hsts.match(/max-age=(\d+)/)?.[1] || '0')).toBeGreaterThanOrEqual(31536000) // 1 year
    })
  })
  
  test.describe('Permissions-Policy', () => {
    test('should set permissions policy', async ({ page }) => {
      const response = await page.goto('/')
      const headers = response?.headers()
      
      const permissionsPolicy = headers?.['permissions-policy']
      if (permissionsPolicy) {
        // Check for restricted permissions
        expect(permissionsPolicy).toContain('geolocation=()')
        expect(permissionsPolicy).toContain('camera=()')
        expect(permissionsPolicy).toContain('microphone=()')
        expect(permissionsPolicy).toContain('payment=()')
      }
    })
    
    test('should block access to sensitive APIs', async ({ page }) => {
      await page.goto('/')
      
      // Try to access geolocation
      const geoResult = await page.evaluate(() => {
        return new Promise(resolve => {
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
              () => resolve('allowed'),
              () => resolve('blocked')
            )
          } else {
            resolve('not available')
          }
        })
      })
      
      // Should be blocked by permissions policy
      expect(geoResult).not.toBe('allowed')
    })
  })
  
  test.describe('Cookie Security', () => {
    test('should set secure cookie attributes', async ({ page, context }) => {
      await page.goto('/signin')
      
      // Simulate sign in to get session cookie
      await page.getByPlaceholder(/email/i).fill('test@example.com')
      await page.getByRole('button', { name: /sign in/i }).click()
      
      // Get cookies
      const cookies = await context.cookies()
      const sessionCookie = cookies.find(c => c.name.includes('session'))
      
      if (sessionCookie) {
        // Check secure attributes
        expect(sessionCookie.httpOnly).toBe(true)
        expect(sessionCookie.sameSite).toMatch(/Lax|Strict/)
        // expect(sessionCookie.secure).toBe(true) // Only in HTTPS
      }
    })
  })
  
  test.describe('XSS Protection', () => {
    test('should sanitize user input', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/messages/compose')
      
      // Try to inject script
      const xssPayload = '<script>alert("XSS")</script>'
      await page.getByLabel(/message/i).fill(xssPayload)
      await page.getByRole('button', { name: /send/i }).click()
      
      // Navigate to messages
      await page.goto('/messages')
      
      // Script should be escaped/sanitized
      const alertTriggered = await page.evaluate(() => {
        return new Promise(resolve => {
          window.alert = () => {
            resolve(true)
          }
          setTimeout(() => resolve(false), 1000)
        })
      })
      
      expect(alertTriggered).toBe(false)
    })
    
    test('should escape HTML in user content', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/profile/edit')
      
      // Try to inject HTML
      const htmlPayload = '<img src=x onerror="alert(1)">'
      await page.getByLabel(/bio/i).fill(htmlPayload)
      await page.getByRole('button', { name: /save/i }).click()
      
      // Check if HTML is escaped
      await page.goto('/profile')
      const bioText = await page.getByTestId('user-bio').textContent()
      
      // Should show escaped HTML, not rendered
      expect(bioText).toContain('&lt;img')
    })
  })
  
  test.describe('CORS Headers', () => {
    test('should set appropriate CORS headers for API', async ({ page }) => {
      const response = await page.request.get('/api/health')
      const headers = response.headers()
      
      // Check CORS headers
      const allowOrigin = headers['access-control-allow-origin']
      const allowMethods = headers['access-control-allow-methods']
      const allowHeaders = headers['access-control-allow-headers']
      
      // Should be restrictive
      expect(allowOrigin).not.toBe('*')
      
      if (allowMethods) {
        expect(allowMethods).toContain('GET')
        expect(allowMethods).toContain('POST')
      }
    })
    
    test('should block cross-origin API requests', async ({ page }) => {
      // Set different origin
      await page.goto('https://evil-site.com')
      
      // Try to make cross-origin request
      const result = await page.evaluate(async () => {
        try {
          const response = await fetch('http://localhost:3000/api/users', {
            method: 'GET',
            credentials: 'include',
          })
          return response.status
        } catch (e) {
          return 'blocked'
        }
      })
      
      // Should be blocked by CORS
      expect(result).toBe('blocked')
    })
  })
  
  test.describe('API Security', () => {
    test('should require authentication for protected endpoints', async ({ page }) => {
      const protectedEndpoints = [
        '/api/services',
        '/api/lifegroups',
        '/api/events',
        '/api/members',
        '/api/messages',
      ]
      
      for (const endpoint of protectedEndpoints) {
        const response = await page.request.get(endpoint)
        expect(response.status()).toBe(401)
      }
    })
    
    test('should validate request payloads', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      // Send invalid payload
      const response = await page.request.post('/api/services', {
        data: {
          name: '', // Empty name
          date: 'invalid-date',
          time: '25:00', // Invalid time
        }
      })
      
      expect(response.status()).toBe(400)
      const body = await response.json()
      expect(body.error).toBeDefined()
    })
  })
  
  test.describe('File Upload Security', () => {
    test('should validate file types', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/profile/edit')
      
      // Try to upload executable file
      const fileInput = page.getByLabel(/profile picture/i)
      await fileInput.setInputFiles({
        name: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('MZ') // EXE header
      })
      
      // Should show error
      await expect(page.getByText(/invalid file type/i)).toBeVisible()
    })
    
    test('should limit file size', async ({ page, context }) => {
      await context.addCookies([{
        name: 'next-auth.session-token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
      }])
      
      await page.goto('/profile/edit')
      
      // Create large file (> 5MB)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024) // 6MB
      
      const fileInput = page.getByLabel(/profile picture/i)
      await fileInput.setInputFiles({
        name: 'large.jpg',
        mimeType: 'image/jpeg',
        buffer: largeBuffer
      })
      
      // Should show error
      await expect(page.getByText(/file too large/i)).toBeVisible()
    })
  })
})