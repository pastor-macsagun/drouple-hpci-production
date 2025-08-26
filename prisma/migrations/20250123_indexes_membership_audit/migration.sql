-- Add indexes for Membership queries
CREATE INDEX IF NOT EXISTS "memberships_localChurchId_role_idx" ON "memberships"("localChurchId", "role");

-- Add indexes for AuditLog queries
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- Add indexes for common tenant scoping queries
CREATE INDEX IF NOT EXISTS "services_localChurchId_date_idx" ON "services"("localChurchId", "date" DESC);
CREATE INDEX IF NOT EXISTS "life_groups_localChurchId_isActive_idx" ON "life_groups"("localChurchId", "isActive");
CREATE INDEX IF NOT EXISTS "events_localChurchId_startDateTime_idx" ON "events"("localChurchId", "startDateTime");
CREATE INDEX IF NOT EXISTS "events_scope_isActive_idx" ON "events"("scope", "isActive");