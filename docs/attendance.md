# Sunday Service Attendance System

## Overview

The Sunday Service Attendance system provides a comprehensive solution for tracking church attendance with real-time analytics and member self-service check-in capabilities.

## Features

### For Members
- **Self Check-in**: Members can check themselves in at `/checkin`
- **First-time Visitor Flag**: Option to identify as a new believer
- **Duplicate Prevention**: System prevents multiple check-ins for the same service

### For Church Administrators
- **Service Management**: Create and manage Sunday services at `/admin/services`
- **Real-time Analytics**: Live attendance counts updated every 5 seconds
- **Attendance Metrics**:
  - Total check-ins
  - First-time visitors count
  - Hourly breakdown
  - Recent check-ins list
- **CSV Export**: Download attendance data for reporting

## Database Schema

### Service Model
```prisma
model Service {
  id            String       @id @default(cuid())
  date          DateTime
  localChurchId String
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  
  localChurch   LocalChurch  @relation(fields: [localChurchId], references: [id])
  checkins      Checkin[]
}
```

### Checkin Model
```prisma
model Checkin {
  id              String       @id @default(cuid())
  serviceId       String
  userId          String
  isNewBeliever   Boolean      @default(false)
  checkedInAt     DateTime     @default(now())
  
  service         Service      @relation(fields: [serviceId], references: [id])
  user            User         @relation(fields: [userId], references: [id])
}
```

## API/Server Actions

### Service Management
- `createServiceAction(formData)`: Create a new service
- `getActiveServiceAction(localChurchId)`: Get today's active service
- `getServicesAction(localChurchId)`: List all services for a church

### Check-in Operations  
- `checkInAction(formData)`: Process member check-in
- `getMyCheckinStatus(serviceId)`: Check if user already checked in
- `getServiceStatsAction(serviceId)`: Get real-time attendance statistics
- `exportCheckinsAction(serviceId)`: Generate CSV export

## User Flows

### Member Check-in Flow
1. Member navigates to `/checkin`
2. System verifies church membership
3. System checks for active service today
4. If not checked in, member sees check-in form
5. Member optionally marks "first time visitor"
6. Member clicks "Check In"
7. System creates check-in record
8. Member sees confirmation

### Admin Service Creation Flow
1. Admin navigates to `/admin/services`
2. Admin selects date for new service
3. Admin clicks "Create Service"
4. Service appears in list

### Admin Analytics Flow
1. Admin navigates to `/admin/services`
2. Admin clicks on specific service
3. Dashboard shows real-time stats
4. Stats update every 5 seconds via polling
5. Admin can export CSV anytime

## Security & Permissions

### Role-based Access
- **Members**: Can only check themselves in
- **Leaders/Church Admins**: Can create services and view analytics
- **Super Admin**: Full access across all churches

### Rate Limiting
- Built-in duplicate check-in prevention
- One check-in per user per service enforced at database level

## Technical Implementation

### Real-time Updates
- Client polls server every 5 seconds for updated stats
- Optimized queries to minimize database load
- Only fetches changed data

### Performance Optimizations
- Database indexes on serviceId, userId, checkedInAt
- Compound unique constraint prevents duplicates
- Pooled database connections for serverless

### CSV Export Format
```csv
Name,Email,Check-in Time,New Believer,Service Date,Church
John Doe,john@example.com,2025-01-19T10:30:00Z,No,2025-01-19,Main Campus
Jane Smith,jane@example.com,2025-01-19T10:32:00Z,Yes,2025-01-19,Main Campus
```

## Testing

### Unit Tests
- Service creation validation
- Check-in business logic
- Duplicate prevention
- Stats calculation

### E2E Tests
- Complete member check-in flow
- Admin service management
- Real-time stats updates
- CSV export functionality

## Future Enhancements

- QR code check-in support
- Family check-in grouping
- Check-in kiosk mode
- Automated attendance reports
- Integration with communication tools