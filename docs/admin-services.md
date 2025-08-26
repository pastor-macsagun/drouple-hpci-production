# Admin Services Documentation

## Overview
The Admin Services page (`/admin/services`) provides church administrators with comprehensive tools to manage Sunday services, track attendance, and export reports.

## Access Control
- **Allowed Roles**: `ADMIN`, `PASTOR`, `SUPER_ADMIN`
- **Tenant Isolation**: Admins can only view/manage services for their assigned church
- **Super Admin**: Can view and manage services across all churches

## Features

### 1. Service Management

#### Create Service
- Click "Create Service" button
- Fill in required fields:
  - **Date**: Service date (required)
  - **Time**: Service time (required)
  - **Church**: Local church selection (SUPER_ADMIN only)
- System prevents duplicate services for the same date/church combination

#### View Services
- Services displayed in a table with columns:
  - Date
  - Time
  - Church
  - Attendance Count
  - Actions
- Pagination with "Load More" for large datasets
- Sorted by date (most recent first)

#### Delete Service
- Click "Delete" button in the Actions column
- Confirm deletion in the dialog
- **Warning**: Deleting a service removes all associated check-in records

### 2. Attendance Tracking

#### View Service Details
- Click "View" button to open the details drawer
- Displays:
  - Total attendance count
  - Recent check-ins (last 10)
  - Check-in times
  - New believer indicators

#### Export Attendance
- Click "Export CSV" to download attendance report
- CSV includes:
  - Service information (date, church, total count)
  - Attendee details (name, email, phone, check-in time, new believer status)

### 3. Empty State
When no services exist:
- Displays "No services yet" message
- Prominent "Create Service" CTA button

## Technical Implementation

### Server Actions
Located in `/app/admin/services/actions.ts`:
- `listServices()` - Paginated service listing with tenant filtering
- `createService()` - Create new service with duplicate prevention
- `deleteService()` - Remove service and all check-ins
- `getServiceAttendance()` - Fetch attendance details
- `exportAttendanceCsv()` - Generate CSV download
- `getLocalChurches()` - Fetch churches for dropdown

### Components
- **Page Component** (`page.tsx`): Server component with data fetching
- **ServicesManager** (`services-manager.tsx`): Client component for interactions
- **ServiceDetailsDrawer** (`service-details-drawer.tsx`): Attendance details view

### Database Schema
```prisma
model Service {
  id            String       @id @default(cuid())
  date          DateTime
  localChurchId String
  localChurch   LocalChurch  @relation(...)
  checkins      Checkin[]
  
  @@unique([localChurchId, date])
}

model Checkin {
  id            String   @id @default(cuid())
  serviceId     String
  userId        String
  isNewBeliever Boolean  @default(false)
  checkedInAt   DateTime @default(now())
  
  @@unique([serviceId, userId])
}
```

## User Workflows

### Creating a Sunday Service
1. Navigate to `/admin/services`
2. Click "Create Service"
3. Select date and time
4. (SUPER_ADMIN) Select target church
5. Click "Create"
6. Service appears in the table

### Viewing Attendance
1. Find service in the table
2. Click "View" to open details
3. Review attendance count and recent check-ins
4. Close drawer when done

### Exporting Reports
1. Locate desired service
2. Click "Export CSV"
3. File downloads automatically
4. Open in spreadsheet application for analysis

## Error Handling
- **Duplicate Service**: "Service already exists for this date"
- **Unauthorized Access**: Redirects to dashboard
- **Missing Required Fields**: Form validation prevents submission
- **Network Errors**: Toast notifications with error messages

## Performance Considerations
- Cursor-based pagination for large datasets
- Server-side data fetching with Next.js App Router
- Optimistic UI updates for better perceived performance
- CSV generation happens server-side for security

## Testing
- **Unit Tests**: `/app/admin/services/actions.test.ts`
- **E2E Tests**: `/e2e/admin-services.spec.ts`
- **Test Coverage**: CRUD operations, RBAC, tenant isolation, CSV export

## Related Documentation
- [RBAC Documentation](./rbac.md)
- [Tenancy Documentation](./tenancy.md)
- [Check-in System](./attendance.md)