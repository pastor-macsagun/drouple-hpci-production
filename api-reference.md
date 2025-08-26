# API Reference

## Authentication

### Login Endpoint
```typescript
POST /api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

email=user@example.com&password=yourPassword
```

Returns JWT token with user session. All subsequent API calls require authentication via NextAuth session.

### Rate Limiting
- Login attempts: 5 per 15 minutes per IP+email combination
- Returns 429 with `Retry-After` header when rate limited

## Server Actions

### Events
- `getEvents()`: List events (tenant-scoped)
- `rsvpToEvent(eventId)`: RSVP to event
- `cancelRsvp(eventId)`: Cancel RSVP
- `getEventDetails(eventId)`: Get event with attendees

### Check-in
- `getActiveServices()`: Get today's services
- `checkIn(serviceId, isNewBeliever)`: Check in to service
- `getServiceAttendance(serviceId)`: Get attendance list

### Life Groups
- `getLifeGroups()`: List life groups
- `requestToJoin(groupId)`: Request membership
- `markAttendance(groupId, memberIds[], notes)`: Record attendance

### Pathways
- `getPathways()`: List available pathways
- `enrollInPathway(pathwayId)`: Enroll in pathway
- `markStepComplete(stepId, userId, notes)`: Complete step

## Rate Limits
- Registration: 3 per hour
- Check-in: 1 per 5 minutes per service
- General API: 100 per minute

## Error Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden (RBAC)
- 404: Not Found
- 429: Rate Limited
- 500: Server Error