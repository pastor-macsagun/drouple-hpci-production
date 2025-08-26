-- Add missing index on Membership.localChurchId
CREATE INDEX IF NOT EXISTS "memberships_localChurchId_idx" ON "memberships"("localChurchId");

-- Add composite index on EventRsvp(eventId, userId) for better query performance
CREATE INDEX IF NOT EXISTS "event_rsvps_eventId_userId_idx" ON "event_rsvps"("eventId", "userId");