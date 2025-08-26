-- Add check constraint for Event scope validation
-- If scope is LOCAL_CHURCH, localChurchId must not be null
ALTER TABLE "events" ADD CONSTRAINT "events_scope_local_church_check" 
CHECK (
  ("scope" != 'LOCAL_CHURCH') OR ("localChurchId" IS NOT NULL)
);