# Admin/Pastor Invitation Workflow - Updated System

## Overview

The admin/pastor invitation system has been completely updated to generate temporary passwords instead of sending email invitations. This provides better security control and simplifies the onboarding process.

## New Workflow

### 1. Admin Creation Process

**Super Admin Action:**
1. Navigate to `/super/local-churches/[id]/admins`
2. Fill out the invitation form:
   - Email (required)
   - Role (ADMIN or PASTOR)
   - Name (optional)
3. Click "Create Admin Account"

**System Response:**
1. **Password Generation**: A secure, readable temporary password is generated (format: `Word-Word-Number`, e.g., `Swift-Mountain-847`)
2. **User Creation**: Creates user account with:
   - Hashed password
   - `mustChangePassword: true` flag
   - Assigned role and tenant
3. **Membership Creation**: Links user to the local church with specified role
4. **Credentials Display**: Shows generated credentials in a secure modal:
   - Email address
   - Temporary password
   - Copy functionality for both individual fields and combined credentials
   - Security warning about password change requirement

### 2. First Login Experience

**User receives credentials manually** from Super Admin:
- Email: `admin@church.com`
- Password: `Swift-Mountain-847`

**Login Process:**
1. User goes to `/auth/signin`
2. Enters provided credentials
3. **Automatic Redirect**: Middleware detects `mustChangePassword: true` and redirects to `/auth/change-password`
4. **Forced Password Change**: User cannot access any other part of the system until password is changed
5. **Password Requirements**:
   - At least 8 characters
   - Contains uppercase letter
   - Contains lowercase letter  
   - Contains at least one number

**After Password Change:**
1. `mustChangePassword` flag is set to `false`
2. User is redirected to appropriate dashboard based on role:
   - SUPER_ADMIN → `/super`
   - ADMIN/PASTOR → `/admin`
   - VIP → `/vip`
   - Others → `/dashboard`

## Technical Implementation

### Password Generation (`lib/password-generator.ts`)

```typescript
// Generates readable passwords like: "Swift-Mountain-847"
export function generateTemporaryPassword(): string {
  const adjectives = ['Swift', 'Bright', 'Clear', 'Strong', ...]
  const nouns = ['River', 'Mountain', 'Eagle', 'Lion', ...]
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 900) + 100
  return `${adjective}-${noun}-${number}`
}
```

### Updated Server Action (`inviteAdmin`)

```typescript
export async function inviteAdmin(localChurchId: string, formData: FormData): Promise<{
  success: boolean
  credentials?: { email: string; password: string }
  error?: string
}>
```

**Key Changes:**
- Generates temporary password using `generateTemporaryPassword()`
- Hashes password with bcrypt (strength: 12)
- Sets `mustChangePassword: true`
- Returns credentials object instead of sending email
- Maintains audit logging with password generation flag

### Middleware Integration

```typescript
// Force password change for users who need it
if (mustChangePassword && !pathname.startsWith("/auth/change-password")) {
  return NextResponse.redirect(new URL("/auth/change-password", req.url))
}
```

**Security Features:**
- Users cannot access any protected routes until password is changed
- Change password page is only accessible to users who need to change passwords
- Automatic role-based redirect after password change

### UI Components

**Credentials Display Modal** (`components/super/credentials-display.tsx`):
- Secure display of generated credentials
- Individual copy buttons for email and password
- "Copy Both" functionality with formatted text
- Password visibility toggle
- Security warnings and instructions
- One-time display (credentials not shown again)

**Admin Management Interface** (`components/super/admin-management.tsx`):
- Client-side form handling
- Loading states during account creation
- Integration with credentials display modal
- Form reset after successful creation

## Security Benefits

### Previous System Issues:
- Email delivery dependency
- Token expiration complexity  
- Email security vulnerabilities
- User confusion with email links

### New System Advantages:
- **Direct Control**: Super Admin has full control over credential distribution
- **No Email Dependency**: Eliminates email delivery issues and spam filters
- **Immediate Access**: Credentials available immediately upon account creation
- **Forced Security**: Password change is mandatory, ensuring users set secure passwords
- **Readable Passwords**: Generated passwords are secure but easy to communicate
- **Audit Trail**: Complete logging of password generation and role assignments

## Workflow Comparison

| Aspect | Old System | New System |
|--------|------------|------------|
| **Credential Delivery** | Email invitation | Manual distribution |
| **Password Security** | User-set during activation | Generated + forced change |
| **Time to Access** | Depends on email delivery | Immediate |
| **Dependencies** | Email service, DNS, tokens | None |
| **User Experience** | Complex email flow | Simple login + password change |
| **Security Control** | Limited | Full admin control |
| **Audit Visibility** | Token-based | Direct credential tracking |

## Usage Instructions for Super Admins

### Creating Admin Accounts

1. **Navigate**: Go to Super Admin → Local Churches → [Select Church] → Manage
2. **Fill Form**: 
   - Enter admin's email address
   - Select role (Admin or Pastor)
   - Optionally add their name
3. **Create Account**: Click "Create Admin Account"
4. **Save Credentials**: Copy the generated credentials from the modal
5. **Distribute Securely**: Provide credentials to the admin through secure channels

### Security Best Practices

- **Secure Distribution**: Share credentials through secure channels (encrypted email, secure messaging, in-person)
- **Temporary Nature**: Emphasize that the password is temporary and must be changed immediately
- **Documentation**: Keep record of created accounts for administrative purposes
- **Role Verification**: Double-check the assigned role matches the person's responsibilities

## Developer Notes

### Database Schema

The existing `User` model already includes:
```prisma
model User {
  mustChangePassword Boolean @default(true)
  passwordHash       String?
  // ... other fields
}
```

### Configuration

No additional environment variables required. The system uses:
- Existing bcrypt for password hashing
- Built-in crypto module for secure randomization
- Existing auth middleware patterns

### Testing

Run the test script to verify functionality:
```bash
npx tsx scripts/test-admin-invitation.ts
```

This validates:
- Password generation variety
- Bcrypt hashing and verification
- User object creation structure