# Environment Variables Configuration

This document describes all environment variables used by Drouple Web Application, their purposes, and recommended values for different environments.

## Database Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Primary database connection string (pooled) | `postgresql://user:pass@host:5432/dbname` |
| `DATABASE_URL_UNPOOLED` | Direct database connection for migrations | `postgresql://user:pass@host:5432/dbname?sslmode=disable` |

**Production Notes:**
- Use pooled connection for `DATABASE_URL` (e.g., Neon, PlanetScale)
- Use direct connection for `DATABASE_URL_UNPOOLED` for migrations and admin tasks
- For local development, both can point to the same database

## Authentication Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Base URL of your application | `https://drouple.app` |
| `NEXTAUTH_SECRET` | Secret for JWT token signing | Generate with `openssl rand -base64 32` |

**Security Notes:**
- `NEXTAUTH_SECRET` must be unique and secure in production
- `NEXTAUTH_URL` should match your actual domain in production

## Email Configuration

### Required Variables (Email Provider)

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_SERVER_HOST` | SMTP server hostname | `smtp.resend.com` |
| `EMAIL_SERVER_PORT` | SMTP server port | `465` |
| `EMAIL_SERVER_USER` | SMTP username | `resend` |
| `EMAIL_SERVER_PASSWORD` | SMTP password | `your-smtp-password` |
| `EMAIL_FROM` | Default from email address | `hello@drouple.app` |

### Optional Variables (Resend Integration)

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend service API key | `re_123abc...` |
| `RESEND_FROM_EMAIL` | Resend from email address | `hello@drouple.app` |

**Email Provider Notes:**
- Choose either generic SMTP or Resend-specific configuration
- For development, use placeholder values or email testing services

## Rate Limiting Configuration

All rate limiting variables are optional with sensible defaults.

### Authentication Rate Limits

| Variable | Description | Default | Purpose |
|----------|-------------|---------|---------|
| `RL_AUTH_MIN_REQUESTS` | Login attempts per minute | `5` | Prevent brute force |
| `RL_AUTH_MIN_WINDOW` | Minute window for login attempts | `1m` | Time window |
| `RL_AUTH_HOUR_REQUESTS` | Login attempts per hour | `20` | Extended protection |
| `RL_AUTH_HOUR_WINDOW` | Hour window for login attempts | `1h` | Time window |

### Registration Rate Limits

| Variable | Description | Default | Purpose |
|----------|-------------|---------|---------|
| `RL_REGISTER_REQUESTS` | Registration attempts per window | `3` | Prevent spam accounts |
| `RL_REGISTER_WINDOW` | Registration window | `1h` | Time window |

### Application Rate Limits

| Variable | Description | Default | Purpose |
|----------|-------------|---------|---------|
| `RL_CHECKIN_REQUESTS` | Check-ins per window | `1` | Prevent duplicate check-ins |
| `RL_CHECKIN_WINDOW` | Check-in window | `5m` | Time window |
| `RL_API_REQUESTS` | General API calls per window | `100` | Prevent API abuse |
| `RL_API_WINDOW` | API rate limit window | `15m` | Time window |
| `RL_EXPORT_REQUESTS` | CSV export requests per window | `10` | Prevent resource abuse |
| `RL_EXPORT_WINDOW` | Export window | `1h` | Time window |

**Rate Limiting Notes:**
- Values are per IP address unless specified otherwise
- Authentication limits also consider email addresses
- Set to higher values for development/testing environments

## Application Configuration

### Optional Variables

| Variable | Description | Default | Purpose |
|----------|-------------|---------|---------|
| `APP_ENV` | Application environment | `development` | Environment detection |
| `NODE_ENV` | Node.js environment | `development` | Build optimization |
| `RATE_LIMIT_ENABLED` | Enable/disable rate limiting | `true` | Feature toggle |

## Environment-Specific Examples

### Development (.env.local)

```env
# Database (Local PostgreSQL)
DATABASE_URL="postgresql://test:test123@localhost:5432/hpci_chms?sslmode=disable"
DATABASE_URL_UNPOOLED="postgresql://test:test123@localhost:5432/hpci_chms?sslmode=disable"

# Auth (Development)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="development-secret-key-please-change-in-production"

# Email (Development - use testing service)
EMAIL_SERVER_HOST="smtp.mailtrap.io"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-mailtrap-user"
EMAIL_SERVER_PASSWORD="your-mailtrap-password"
EMAIL_FROM="dev@hpci-chms.local"

# Rate Limiting (Relaxed for development)
RL_AUTH_MIN_REQUESTS=20
RL_API_REQUESTS=500
RATE_LIMIT_ENABLED=false
```

### Production (.env.production)

```env
# Database (Neon/Production)
DATABASE_URL="postgresql://user:pass@pooled-host.neon.tech:5432/hpci_chms?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:pass@direct-host.neon.tech:5432/hpci_chms?sslmode=require"

# Auth (Production)
NEXTAUTH_URL="https://drouple.app"
NEXTAUTH_SECRET="[GENERATE-SECURE-SECRET-32-CHARS]"

# Email (Production - Resend)
RESEND_API_KEY="re_[YOUR-RESEND-API-KEY]"
RESEND_FROM_EMAIL="hello@drouple.app"
EMAIL_FROM="hello@drouple.app"

# Application
APP_ENV="production"
NODE_ENV="production"
RATE_LIMIT_ENABLED="true"

# Rate Limiting (Strict for production)
RL_AUTH_MIN_REQUESTS=3
RL_AUTH_HOUR_REQUESTS=10
RL_REGISTER_REQUESTS=2
RL_API_REQUESTS=50
```

### Staging (.env.staging)

```env
# Database (Staging)
DATABASE_URL="postgresql://staging-user:pass@staging-host:5432/hpci_chms_staging"
DATABASE_URL_UNPOOLED="postgresql://staging-user:pass@staging-host:5432/hpci_chms_staging"

# Auth (Staging)
NEXTAUTH_URL="https://staging.drouple.app"
NEXTAUTH_SECRET="[STAGING-SPECIFIC-SECRET]"

# Email (Staging - can use development SMTP)
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT="465"
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="[STAGING-SMTP-PASSWORD]"
EMAIL_FROM="hello@drouple.app"

# Rate Limiting (Moderate for staging)
RL_AUTH_MIN_REQUESTS=10
RL_API_REQUESTS=200
RATE_LIMIT_ENABLED="true"
```

## Environment Validation

To validate your environment configuration, run:

```bash
npm run env:sanity
```

This command checks for:
- Required variables presence
- Database connectivity
- Email configuration validity
- Rate limiting configuration

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** in production
4. **Limit database permissions** to minimum required
5. **Use connection pooling** for serverless deployments
6. **Monitor rate limiting** effectiveness in production

## Troubleshooting

### Common Issues

**Database Connection Fails:**
- Verify `DATABASE_URL` format and credentials
- Check network connectivity and firewall settings
- Ensure database server is running

**Authentication Not Working:**
- Verify `NEXTAUTH_SECRET` is set and unique
- Check `NEXTAUTH_URL` matches your domain
- Ensure HTTPS in production

**Email Not Sending:**
- Test SMTP credentials with external tools
- Verify firewall allows outbound SMTP connections
- Check email provider rate limits

**Rate Limiting Too Strict:**
- Adjust rate limiting variables for your use case
- Consider disabling in development: `RATE_LIMIT_ENABLED=false`
- Monitor logs for rate limit violations