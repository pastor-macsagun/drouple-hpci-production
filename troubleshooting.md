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

## Support
File issues at: https://github.com/your-org/hpci-chms/issues