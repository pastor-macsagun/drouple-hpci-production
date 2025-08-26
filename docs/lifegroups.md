# LifeGroups Management System

## Overview

The LifeGroups system provides comprehensive small group management with member request/approval workflows, attendance tracking, and leader dashboards.

## Features

### For Members
- **Browse Groups**: View available life groups at `/lifegroups`
- **Join Requests**: Request to join groups with optional message
- **My Groups**: View groups you're currently part of
- **Leave Groups**: Self-service group departure

### For Group Leaders
- **Member Management**: View and manage group roster
- **Request Approval**: Approve/reject join requests
- **Attendance Tracking**: Mark member attendance by session
- **CSV Export**: Download member roster and attendance history
- **Capacity Management**: Monitor group capacity limits

### For Church Administrators
- **Create Groups**: Set up new life groups with leaders
- **Capacity Setting**: Define maximum group sizes
- **Leader Assignment**: Designate group leaders
- **Multi-group Support**: Members can join multiple groups
- **Group Analytics**: View participation metrics

## Database Schema

### LifeGroup Model
```prisma
model LifeGroup {
  id            String       @id @default(cuid())
  name          String
  description   String?
  capacity      Int
  leaderId      String
  localChurchId String
  isActive      Boolean      @default(true)
  
  leader           User                      @relation("LifeGroupLeader")
  localChurch      LocalChurch               @relation()
  memberships      LifeGroupMembership[]
  memberRequests   LifeGroupMemberRequest[]
  attendanceSessions LifeGroupAttendanceSession[]
}
```

### LifeGroupMembership Model
```prisma
model LifeGroupMembership {
  id           String            @id @default(cuid())
  lifeGroupId  String
  userId       String
  status       MembershipStatus  @default(ACTIVE)
  joinedAt     DateTime          @default(now())
  leftAt       DateTime?
}
```

### LifeGroupMemberRequest Model  
```prisma
model LifeGroupMemberRequest {
  id           String        @id @default(cuid())
  lifeGroupId  String
  userId       String
  status       RequestStatus @default(PENDING)
  message      String?
  requestedAt  DateTime      @default(now())
  processedAt  DateTime?
  processedBy  String?
}
```

## API/Server Actions

### Member Actions
- `getMyLifeGroups()`: Get user's active life groups
- `getAvailableLifeGroups()`: Browse joinable groups
- `requestJoinLifeGroup(lifeGroupId, message?)`: Submit join request
- `leaveLifeGroup(lifeGroupId)`: Leave a group

### Leader Actions
- `getLifeGroupMembers(lifeGroupId)`: View group roster
- `getLifeGroupRequests(lifeGroupId)`: View pending requests
- `approveRequest(requestId)`: Approve member request
- `rejectRequest(requestId)`: Reject member request

### Admin Actions
- `createLifeGroup(data)`: Create new life group
- `updateLifeGroup(id, data)`: Update group details
- `assignLeader(groupId, leaderId)`: Change group leader

## User Flows

### Member Join Flow
1. Member navigates to `/lifegroups`
2. Clicks "Available Groups" tab
3. Views groups with available capacity
4. Clicks "Request to Join" on desired group
5. Optionally adds message for leader
6. Submits request
7. Sees "Request Pending" status
8. Leader approves request
9. Member appears in "My Groups" tab

### Leader Management Flow
1. Leader navigates to `/lifegroups`
2. Sees "Groups You Lead" section
3. Views Members and Requests tabs
4. Reviews pending requests with messages
5. Approves or rejects requests
6. Exports member list as needed

### Attendance Tracking Flow
1. Leader creates attendance session
2. Marks present/absent for each member
3. Adds optional session notes
4. System tracks attendance history
5. Reports available for export

## Security & Permissions

### Role-based Access
- **Members**: View groups, submit requests, leave groups
- **Leaders**: Manage their assigned groups only
- **Admins**: Full group management across church
- **Super Admin**: Access all churches' groups

### Data Privacy
- Member contact info visible to leaders only
- Request messages private between member and leader
- Attendance data restricted to leaders/admins

## Technical Implementation

### Real-time Features
- Live member count updates
- Instant request notifications
- Capacity tracking with visual indicators

### Performance Optimizations
- Indexed queries on groupId, userId
- Eager loading of related data
- Pagination for large member lists

### CSV Export Format
```csv
Name,Email,Phone,Joined Date,Status
John Doe,john@example.com,555-0123,2025-01-15,Active
Jane Smith,jane@example.com,555-0124,2025-01-16,Active
```

## Testing

### Unit Tests
- Membership status transitions
- Capacity enforcement
- Request approval workflow
- RBAC permissions

### E2E Tests
- Complete join request flow
- Leader approval process  
- Member leaving group
- CSV export functionality
- Empty state handling

## User Interface

### Member View
- Tabbed interface (My Groups / Available Groups)
- Card-based group display
- Visual capacity indicators
- Request status badges

### Leader Dashboard
- Tabbed sections (Members / Requests)
- DataTable for member list
- Action buttons for requests
- Export controls

## Future Enhancements

- Group meeting scheduler
- Automated reminder emails
- Group chat/messaging
- Resource sharing
- Attendance analytics dashboard
- Group multiplication tracking