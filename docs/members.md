# Member Management System

## Overview

The Member Management System provides comprehensive tools for church administrators to manage their congregation members, including creation, editing, activation/deactivation, and bulk operations.

## Access Control

### Route Access
- **URL**: `/admin/members`
- **Allowed Roles**: SUPER_ADMIN, PASTOR, ADMIN
- **VIP Role**: Read-only access for member follow-up
- **Unauthorized Redirect**: `/dashboard`

### Role-Based Permissions

#### SUPER_ADMIN
- View all members across all churches
- Create members in any church
- Edit any member's details
- Transfer members between churches
- Assign any role including SUPER_ADMIN
- Perform bulk operations on any members
- Export members from all churches

#### PASTOR
- View members in their church only
- Create new members in their church
- Edit members in their church
- Assign roles up to PASTOR level
- Cannot transfer members to other churches
- Perform bulk operations on church members
- Export members from their church

#### ADMIN
- View members in their church only
- Create new members in their church
- Edit members in their church
- Assign roles up to ADMIN level
- Cannot transfer members to other churches
- Perform bulk operations on church members
- Export members from their church

#### VIP
- Read-only access to member list
- View member details for follow-up
- Search and filter members
- Cannot perform any modifications
- Export functionality available

## Features

### Member List View
- Paginated table display (20 per page)
- Shows: Name, Email, Role, Church, Status
- Visual indicators for new believers
- Role badges with color coding
- Active/Inactive status toggle

### Search and Filtering
- Real-time search by name or email
- Church filter (SUPER_ADMIN only)
- Server-side filtering for performance
- Maintains search state during operations

### Create Member
- Manual member account creation
- Required fields: Name, Email, Role, Church
- Optional: Set as active/inactive on creation
- Email uniqueness validation
- Automatic membership record creation

### Edit Member
- Update name, email, and role
- Church reassignment (SUPER_ADMIN only)
- Role assignment restrictions by user role
- Email change with uniqueness check
- Real-time validation

### Status Management
- Individual member activation/deactivation
- Toggle switch for quick status changes
- Updates both User and Membership records
- Visual feedback for status changes

### Bulk Operations
- Select multiple members via checkboxes
- Select all/deselect all functionality
- Bulk activate members
- Bulk deactivate members
- Operation count display
- Confirmation before execution

### Export to CSV
- Export current filtered list
- Includes: Name, Email, Role, Status, Church, Phone, City, Join Date
- Excel/Google Sheets compatible format
- Respects current search/filter criteria
- Automatic file download

## Technical Implementation

### Server Actions
All operations are implemented as server actions with proper validation:
- `listMembers`: Paginated member retrieval
- `createMember`: New member creation with Zod validation
- `updateMember`: Member detail updates
- `toggleMemberStatus`: Individual status changes
- `bulkUpdateStatus`: Batch status operations
- `exportMembers`: CSV generation
- `getLocalChurches`: Church list for filtering

### Database Schema
```typescript
User {
  id: string
  email: string (unique)
  name: string?
  role: UserRole
  tenantId: string? // Church assignment
  emailVerified: DateTime? // Active status
  isNewBeliever: boolean
  joinedAt: DateTime
}

Membership {
  userId: string
  localChurchId: string
  status: MembershipStatus
  believerStatus: BelieverStatus
}
```

### Multi-Tenancy
- All queries filtered by `tenantId`
- SUPER_ADMIN bypasses tenant filtering
- Church isolation enforced at database level
- Cross-church operations prevented

### Validation
- Zod schemas for all input validation
- Email format and uniqueness checks
- Role hierarchy enforcement
- Required field validation
- Error messages displayed to user

## UI Components

### DataTable
- Built with shadcn/ui Table component
- Responsive design
- Hover states for rows
- Checkbox column for selection
- Action buttons per row

### Modals
- Create Member Dialog
- Edit Member Dialog
- Form validation feedback
- Loading states during operations
- Cancel/Submit actions

### Status Indicators
- Switch component for active/inactive
- Badge components for roles
- Color-coded role badges
- New Believer badge

## Best Practices

### Performance
- Server-side pagination (20 items default)
- Debounced search input
- Optimistic UI updates where appropriate
- Lazy loading for large datasets

### Security
- Server-side authorization checks
- Input sanitization via Zod
- SQL injection prevention via Prisma
- XSS protection built into React
- Audit logging for all operations

### User Experience
- Clear action buttons and labels
- Confirmation for destructive actions
- Toast notifications for feedback
- Loading indicators during operations
- Keyboard navigation support

## Integration Points

### With VIP Team System
- VIP role users have read-only access
- Can view new believers for follow-up
- Access to contact information
- Cannot modify member records

### With Check-In System
- Member accounts used for check-in
- Active status required for check-in
- New believer auto-creation on first check-in

### With LifeGroups
- Members can join life groups
- Leaders assigned from member list
- Membership status affects participation

### With Events
- Members can RSVP to events
- Role-based event visibility
- Payment tracking for members

## Error Handling

### Common Errors
- "Email already registered" - Duplicate email
- "Cannot create member for another church" - Tenant violation
- "Member not found" - Invalid ID
- "Failed to update member status" - Database error

### Recovery Strategies
- Retry operations on network failure
- Rollback on partial failures
- Clear error messages to user
- Maintain form state on errors

## Testing Coverage

### Unit Tests
- CRUD operation validation
- Role permission checks
- Multi-tenant isolation
- Validation schema tests

### E2E Tests
- Complete member creation flow
- Edit and update operations
- Bulk selection and operations
- Export functionality
- RBAC enforcement