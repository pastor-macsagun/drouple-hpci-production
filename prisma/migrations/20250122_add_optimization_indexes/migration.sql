-- Database Optimization: Add critical indexes for performance

-- User indexes for multi-tenancy and auth
CREATE INDEX IF NOT EXISTS "users_tenantId_idx" ON "users"("tenantId");
CREATE INDEX IF NOT EXISTS "users_tenantId_role_idx" ON "users"("tenantId", "role");
CREATE INDEX IF NOT EXISTS "users_email_tenantId_idx" ON "users"("email", "tenantId");
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");
CREATE INDEX IF NOT EXISTS "users_isNewBeliever_idx" ON "users"("isNewBeliever");

-- Account indexes for auth performance
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");
CREATE INDEX IF NOT EXISTS "accounts_provider_idx" ON "accounts"("provider");

-- Session indexes for session management
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS "sessions_expires_idx" ON "sessions"("expires");

-- Compound indexes for date-range queries
CREATE INDEX IF NOT EXISTS "checkins_serviceId_checkedInAt_idx" ON "checkins"("serviceId", "checkedInAt");
CREATE INDEX IF NOT EXISTS "life_group_attendances_userId_markedAt_idx" ON "life_group_attendances"("userId", "markedAt");
CREATE INDEX IF NOT EXISTS "pathway_progress_userId_completedAt_idx" ON "pathway_progress"("userId", "completedAt");

-- Status + foreign key combinations
CREATE INDEX IF NOT EXISTS "life_group_memberships_lifeGroupId_status_idx" ON "life_group_memberships"("lifeGroupId", "status");
CREATE INDEX IF NOT EXISTS "life_group_memberships_userId_status_idx" ON "life_group_memberships"("userId", "status");
CREATE INDEX IF NOT EXISTS "event_rsvps_eventId_status_idx" ON "event_rsvps"("eventId", "status");
CREATE INDEX IF NOT EXISTS "event_rsvps_status_rsvpAt_idx" ON "event_rsvps"("status", "rsvpAt");
CREATE INDEX IF NOT EXISTS "pathway_enrollments_pathwayId_status_idx" ON "pathway_enrollments"("pathwayId", "status");
CREATE INDEX IF NOT EXISTS "pathway_enrollments_userId_status_idx" ON "pathway_enrollments"("userId", "status");

-- Event filtering indexes
CREATE INDEX IF NOT EXISTS "events_localChurchId_startDateTime_idx" ON "events"("localChurchId", "startDateTime");
CREATE INDEX IF NOT EXISTS "events_localChurchId_isActive_idx" ON "events"("localChurchId", "isActive");
CREATE INDEX IF NOT EXISTS "events_scope_startDateTime_idx" ON "events"("scope", "startDateTime");

-- LifeGroup management indexes
CREATE INDEX IF NOT EXISTS "life_groups_localChurchId_isActive_idx" ON "life_groups"("localChurchId", "isActive");

-- Pathway management indexes
CREATE INDEX IF NOT EXISTS "pathways_tenantId_type_isActive_idx" ON "pathways"("tenantId", "type", "isActive");

-- Audit log time-based indexes
CREATE INDEX IF NOT EXISTS "audit_logs_localChurchId_createdAt_idx" ON "audit_logs"("localChurchId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_actorId_createdAt_idx" ON "audit_logs"("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");