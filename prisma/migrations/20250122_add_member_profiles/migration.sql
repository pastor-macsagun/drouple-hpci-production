-- Add member profile fields to User model
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "phone" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "dateOfBirth" DATE,
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "city" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "zipCode" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "emergencyContact" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "emergencyPhone" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "profileVisibility" VARCHAR(20) DEFAULT 'MEMBERS',
ADD COLUMN IF NOT EXISTS "allowContact" BOOLEAN DEFAULT true;

-- Add indexes for member directory queries
CREATE INDEX IF NOT EXISTS "users_name_idx" ON "users"("name");
CREATE INDEX IF NOT EXISTS "users_joinedAt_idx" ON "users"("joinedAt");
CREATE INDEX IF NOT EXISTS "users_profileVisibility_idx" ON "users"("profileVisibility");