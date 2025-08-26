# VIP Team / First Timer Management

## Overview

The VIP Team feature enables church volunteers and staff to effectively manage and track first-time visitors. When a VIP team member logs a first timer, the system automatically:

1. Creates a full Member account with all privileges (check-in, events, lifegroups, etc.)
2. Auto-enrolls them in the ROOTS pathway for new believers
3. Creates a linked FirstTimer record for follow-up tracking

## Key Concepts

### First Timers as Members
Unlike traditional visitor tracking systems, first timers in HPCI-ChMS are immediately created as full members. This approach ensures:
- First timers can immediately participate in church activities
- They receive member privileges from day one
- Their journey is tracked from the very beginning
- No duplicate records when they "convert" from visitor to member

### Auto-enrollment in ROOTS
All first timers are marked as new believers (`isNewBeliever=true`) and automatically enrolled in the ROOTS pathway, which is the foundational discipleship track for new believers.

## Role Permissions

The VIP role sits between LEADER and ADMIN in the hierarchy:

| Role | Can View | Can Create | Can Edit | Can Delete | Can Assign |
|------|----------|------------|----------|------------|------------|
| MEMBER | ❌ | ❌ | ❌ | ❌ | ❌ |
| LEADER | ❌ | ❌ | ❌ | ❌ | ❌ |
| VIP | ✅ | ✅ | ✅ | ❌ | ✅ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |
| PASTOR | ✅ | ✅ | ✅ | ✅ | ✅ |
| SUPER_ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |

## Features

### 1. First Timer Dashboard (`/vip/firsttimers`)

The main dashboard provides:
- List view of all first timers with believer status badges
- Quick status indicators (Gospel Shared, ROOTS Completed, Believer Status)
- Assignment management
- Filtering capabilities
- Notes management
- Set Inactive action for marking believers who have stopped engaging
- Visual distinction for inactive believers (gray background)

### 2. Creating First Timers

When creating a first timer, VIP team members provide:
- **Name** (required)
- **Email** (required, must be unique)
- **Phone** (optional)
- **Assigned VIP** (optional, for follow-up responsibility)
- **Initial Notes** (optional)

The system then:
1. Creates a User with `role=MEMBER` and `isNewBeliever=true`
2. Auto-enrolls in ROOTS pathway
3. Creates FirstTimer tracking record
4. Links to assigned VIP if specified

### 3. Status Tracking

Three key statuses are tracked:

#### Gospel Shared
- Indicates whether the gospel has been shared with this first timer
- Can be toggled directly from the dashboard
- Helps VIP team prioritize follow-up

#### ROOTS Completed
- Tracks completion of the ROOTS pathway
- When marked complete, automatically updates the pathway enrollment
- Indicates the first timer has completed foundational discipleship

#### Believer Status (NEW)
- Tracks the overall status of new believers: ACTIVE, INACTIVE, or COMPLETED
- VIP role can mark believers as INACTIVE when they stop attending or engaging
- INACTIVE believers are visually distinguished with gray background and reduced opacity
- ROOTS progress is preserved when marking as INACTIVE
- Status badge colors:
  - ACTIVE: Green outline badge
  - INACTIVE: Gray secondary badge
  - COMPLETED: Blue default badge

### 4. Assignment Management

- First timers can be assigned to specific VIP team members
- Assignments can be changed at any time
- Unassigned first timers are visible to all VIP team members
- Helps distribute follow-up responsibilities

### 5. Notes and Follow-up

- Detailed notes can be added and edited for each first timer
- Notes persist across sessions
- Useful for tracking conversations, prayer requests, and follow-up actions

### 6. Filtering and Search

The dashboard supports filtering by:
- Gospel Shared status (Yes/No/All)
- ROOTS Completed status (Yes/No/All)
- Assigned VIP (specific person or unassigned)

## Database Schema

### FirstTimer Model

```prisma
model FirstTimer {
  id              String   @id @default(cuid())
  memberId        String   @unique
  member          User     @relation(fields: [memberId], references: [id])
  gospelShared    Boolean  @default(false)
  rootsCompleted  Boolean  @default(false)
  assignedVipId   String?
  assignedVip     User?    @relation(fields: [assignedVipId], references: [id])
  notes           String?  @db.Text
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Membership Model Extensions

The Membership model includes:
- `isNewBeliever` boolean field
- `believerStatus` enum field (ACTIVE | INACTIVE | COMPLETED)
- Default believer status is ACTIVE

### User Model Extensions

The User model includes:
- `isNewBeliever` boolean field
- Relations to FirstTimer records (both as member and as assigned VIP)

## Technical Implementation

### Server Actions

All FirstTimer operations are handled through server actions in `/app/actions/firsttimers.ts`:
- `getFirstTimers()` - Fetch all first timers with RBAC filtering and believer status
- `createFirstTimer()` - Create new first timer and member account
- `updateFirstTimer()` - Update status, assignment, or notes
- `deleteFirstTimer()` - Remove FirstTimer record (member account remains)
- `getVipTeamMembers()` - Get list of VIP+ users for assignment
- `markBelieverInactive()` - Mark a believer as INACTIVE (VIP+ roles only)

### Multi-tenancy

FirstTimer records respect tenant boundaries:
- VIP users only see first timers within their tenant
- SUPER_ADMIN can see all first timers across all tenants
- Tenant isolation is enforced at the data layer

### Security

- All actions require authentication
- Role-based access control enforced on all operations
- Input validation using Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection through React's built-in escaping

## Testing

### Unit Tests
Located in `/app/actions/firsttimers.test.ts`:
- RBAC enforcement
- FirstTimer creation with auto-enrollment
- Status updates and pathway completion
- Tenant isolation

### E2E Tests
Located in `/e2e/vip-firsttimers.spec.ts`:
- Access control for different roles
- Complete first timer management flow
- Filtering and search functionality
- UI interactions and validations

## Admin Reports Integration

The believer status feature integrates with the Admin Reports dashboard (`/admin/reports`):
- **New Believers Card**: Displays total count of new believers with breakdown by status
- **Status Breakdown**: Shows counts for ACTIVE, INACTIVE, and COMPLETED believers
- **Visual Indicators**: Color-coded status counts (green for active, gray for inactive, blue for completed)
- **Real-time Metrics**: Updates automatically as VIP team marks believers inactive

## Best Practices

1. **Immediate Follow-up**: Assign first timers to VIP team members promptly
2. **Notes Documentation**: Keep detailed notes of interactions and prayer requests
3. **Status Updates**: Update Gospel Shared, ROOTS, and Believer status in real-time
4. **Regular Review**: Use filters to identify first timers needing attention
5. **Team Coordination**: Distribute assignments evenly among VIP team members
6. **Inactive Management**: Mark believers as inactive when they stop attending for accurate reporting
7. **Progress Preservation**: ROOTS progress is maintained even when marking inactive

## Future Enhancements

Potential improvements for future iterations:
- Bulk import of first timers from CSV
- Automated follow-up reminders
- Integration with messaging system for direct communication
- Analytics dashboard for first timer conversion metrics
- Mobile app for on-the-go first timer logging