# Troubleshooting Guide

## Common Issues

### Database Connection Errors
**Error**: `User was denied access on the database`
**Solution**: Check DATABASE_URL in .env file

### Build Failures
**Error**: TypeScript or lint errors
**Solution**: Run `npm run typecheck` and `npm run lint` to identify issues

### Login Issues
**Error**: "Invalid email or password"
**Solution**: 
1. Verify the password meets requirements (8+ chars, mixed case, number, symbol)
2. Check if user has passwordHash set in database
3. For seeded users, default password is `Hpci!Test2025`

**Error**: "Too many login attempts"
**Solution**: 
1. Wait 15 minutes for rate limit to reset
2. Check Retry-After header for exact reset time
3. Verify different IP or email allows login

**Error**: "Password not set"
**Solution**: 
1. User was created before password migration
2. Admin needs to set password via database update
3. Or user can re-register with new account

### Rate Limiting Issues
**Error**: 429 Too Many Requests
**Solution**: Wait for Retry-After header duration

### Authentication Problems
**Error**: Session not persisting
**Solution**:
1. Check NEXTAUTH_SECRET is set
2. Verify NEXTAUTH_URL matches deployment
3. Clear cookies and retry

## Debug Commands
```bash
npm run env:sanity       # Check environment
npm run seed:verify      # Verify seed data
npm run test:unit        # Run unit tests
npm run test:e2e         # Run e2e tests
npm run ship:verify      # Full verification
```

## Automated Testing Issues

### UI Selector Strategies
**Issue**: Playwright tests fail with element not found errors
**Solution**: 
1. Use ID selectors when available (`input#email` vs `input[name="email"]`)
2. Check actual HTML structure with browser dev tools
3. Add `data-testid` attributes for reliable automation
4. Use more specific selectors to avoid multiple matches

**Example**:
```typescript
// Instead of generic selector that might match multiple elements
await page.click('button[type="submit"]')

// Use specific text or test ID
await page.click('button:has-text("Sign In")')
await page.click('[data-testid="signin-submit"]')
```

### Data-Dependent UI Elements
**Issue**: Export buttons or form elements not found during tests
**Solution**:
1. Ensure test database has sufficient data for UI elements to appear
2. Check for conditional rendering based on data presence
3. Create active test data (services, events) before testing dependent features
4. Use `page.waitForSelector()` with appropriate timeouts

### Authentication Flow Validation
**Issue**: Login redirects not working as expected in tests
**Solution**:
1. Use `page.waitForLoadState('networkidle')` after form submission
2. Check for intermediate loading states
3. Verify session storage/cookies are properly set
4. Test with actual user credentials from seed data

**Expected Login Flows**:
```typescript
// Super Admin may redirect to dashboard instead of /super
// This is acceptable behavior - verify actual landing page
const currentUrl = page.url()
const isValidLanding = currentUrl.includes('/super') || currentUrl.includes('/dashboard')
```

### Multi-Context Testing
**Issue**: Session bleeding between different user roles
**Solution**:
1. Use separate browser contexts for each role test
2. Clear storage between tests: `await page.evaluate(() => localStorage.clear())`
3. Create fresh page instances for each test case
4. Verify logout before switching users

## Support
File issues at: https://github.com/your-org/hpci-chms/issues