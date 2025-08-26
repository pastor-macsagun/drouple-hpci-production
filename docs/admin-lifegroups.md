# Admin LifeGroups Documentation

## Overview
The Admin LifeGroups page (`/admin/lifegroups`) provides comprehensive management tools for church small groups, including member management, attendance tracking, and join request processing.

## Access Control
- **Allowed Roles**: `ADMIN`, `PASTOR`, `SUPER_ADMIN`
- **Tenant Isolation**: Admins can only view/manage life groups for their assigned church
- **Super Admin**: Can view and manage life groups across all churches

## Features

### 1. Life Group Management

#### Create Life Group
- Click "Create LifeGroup" button
- Required fields:
  - **Name**: Life group name
  - **Leader**: Select from available leaders
  - **Capacity**: Maximum number of members
- Optional fields:
  - **Schedule**: Meeting schedule (e.g., "Every Tuesday 7PM")
  - **Description**: Additional details about the group
  - **Church**: Local church selection (SUPER_ADMIN only)
- Leader is automatically added as first member

#### View Life Groups
- Table displays:
  - Name
  - Leader
  - Current Members count
  - Capacity
  - Schedule
  - Action buttons
- Pagination with "Load More" for large datasets
- Sorted by creation date (newest first)

#### Delete Life Group
- Click "Delete" button
- Confirm in dialog
- **Warning**: Deletes all memberships and attendance records

### 2. Member Management (Manage Drawer)

#### Roster Tab
- View all active members
- Display member name, email, and phone
- Remove members with confirmation
- Shows "No members yet" when empty

#### Join Requests Tab
- Review pending membership requests
- See requester details and message
- Approve or Reject buttons for each request
- Automatic capacity checking on approval
- Shows "No pending requests" when empty

#### Attendance Tab
- **Start Session**:
  - Select date for attendance session
  - Creates new attendance record
- **Mark Attendance**:
  - Checkbox list of all members
  - Real-time save on check/uncheck
  - Visual feedback for changes
- **End Session**: Returns to session creation view
- **Export Attendance CSV**: Download historical attendance

### 3. Data Export

#### Export Roster CSV
- Click "Export Roster CSV" button
- Includes:
  - Life group information
  - Leader details
  - Member list with contact info
  - Join dates

#### Export Attendance CSV
- Available in Manage drawer > Attendance tab
- Includes:
  - All attendance sessions
  - Date and attendee count per session
  - List of present members

### 4. Empty State
- Displays "No life groups yet" message
- Prominent "Create LifeGroup" CTA button

## Technical Implementation

### Server Actions
Located in `/app/admin/lifegroups/actions.ts`:

**CRUD Operations:**
- `listLifeGroups()` - Paginated listing with tenant filtering
- `createLifeGroup()` - Create with leader auto-enrollment
- `updateLifeGroup()` - Update group details
- `deleteLifeGroup()` - Remove group and all related data

**Member Management:**
- `listMemberships()` - Get active members
- `removeMember()` - Mark member as LEFT
- `listJoinRequests()` - Get pending requests
- `approveRequest()` - Approve with capacity check
- `rejectRequest()` - Reject membership request

**Attendance:**
- `startAttendanceSession()` - Create new session
- `markAttendance()` - Toggle member presence
- `exportAttendanceCsv()` - Generate attendance report

**Utilities:**
- `getLeaders()` - Fetch eligible leaders
- `getLocalChurches()` - Fetch churches (for SUPER_ADMIN)

### Components
- **Page Component** (`page.tsx`): Server component with initial data
- **LifeGroupsManager** (`lifegroups-manager.tsx`): Main client component
- **LifeGroupManageDrawer** (`lifegroup-manage-drawer.tsx`): Tabbed management interface

### Database Schema
```prisma
model LifeGroup {
  id            String   @id @default(cuid())
  name          String
  description   String?
  capacity      Int
  leaderId      String
  localChurchId String
  isActive      Boolean  @default(true)
  
  leader              User
  memberships         LifeGroupMembership[]
  memberRequests      LifeGroupMemberRequest[]
  attendanceSessions  LifeGroupAttendanceSession[]
}

model LifeGroupMembership {
  id          String           @id
  lifeGroupId String
  userId      String
  status      MembershipStatus @default(ACTIVE)
  joinedAt    DateTime         @default(now())
  leftAt      DateTime?
  
  @@unique([lifeGroupId, userId])
}

model LifeGroupMemberRequest {
  id          String        @id
  lifeGroupId String
  userId      String
  status      RequestStatus @default(PENDING)
  message     String?
  requestedAt DateTime      @default(now())
  processedAt DateTime?
  processedBy String?
  
  @@unique([lifeGroupId, userId, status])
}

model LifeGroupAttendanceSession {
  id          String    @id
  lifeGroupId String
  date        DateTime
  notes       String?
  attendances LifeGroupAttendance[]
  
  @@unique([lifeGroupId, date])
}

model LifeGroupAttendance {
  id        String   @id
  sessionId String
  userId    String
  present   Boolean  @default(true)
  
  @@unique([sessionId, userId])
}
```

## User Workflows

### Creating a Life Group
1. Navigate to `/admin/lifegroups`
2. Click "Create LifeGroup"
3. Fill in name, select leader, set capacity
4. Add optional schedule/description
5. (SUPER_ADMIN) Select target church
6. Click "Create"
7. Group appears in table

### Managing Members
1. Click "Manage" on a life group
2. **Roster Tab**: View/remove current members
3. **Requests Tab**: Process join requests
4. Close drawer when done

### Taking Attendance
1. Click "Manage" on a life group
2. Go to "Attendance" tab
3. Enter session date and click "Start Session"
4. Check boxes for present members
5. Changes save automatically
6. Click "End Session" when complete

### Processing Join Requests
1. Click "Manage" on a life group
2. Go to "Join Requests" tab
3. Review pending requests
4. Click "Approve" or "Reject" for each
5. System checks capacity before approval

### Exporting Data
1. **Roster**: Click "Export Roster CSV" from table
2. **Attendance**: Click "Export Attendance CSV" from Manage drawer
3. Files download automatically

## Error Handling
- **Capacity Exceeded**: "Life group is at capacity"
- **Duplicate Member**: Prevented at database level
- **Missing Required Fields**: Form validation
- **Unauthorized Access**: Redirects to dashboard
- **Network Errors**: Toast notifications

## Business Rules
1. Leaders are automatically members of their groups
2. Members can only be in ACTIVE or LEFT status
3. Capacity limits enforced on approval
4. One attendance session per day per group
5. Removing members sets status to LEFT (soft delete)

## Performance Considerations
- Cursor-based pagination for scalability
- Optimistic UI updates for attendance marking
- Server-side CSV generation
- Efficient database queries with proper indexes

## Testing
- **Unit Tests**: `/app/admin/lifegroups/actions.test.ts`
- **E2E Tests**: `/e2e/admin-lifegroups.spec.ts`
- **Coverage**: Full CRUD, member management, attendance, exports

## Related Documentation
- [LifeGroups Member View](./lifegroups.md)
- [RBAC Documentation](./rbac.md)
- [Tenancy Documentation](./tenancy.md)