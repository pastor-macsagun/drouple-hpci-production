-- Add unique constraints for Checkin
CREATE UNIQUE INDEX IF NOT EXISTS "checkins_serviceId_userId_key" ON "checkins"("serviceId", "userId");

-- Add unique constraints for EventRsvp
CREATE UNIQUE INDEX IF NOT EXISTS "event_rsvps_eventId_userId_key" ON "event_rsvps"("eventId", "userId");