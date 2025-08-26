-- Create announcements table
CREATE TABLE IF NOT EXISTS "announcements" (
  "id" TEXT NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "content" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "localChurchId" TEXT NOT NULL,
  "scope" VARCHAR(20) NOT NULL DEFAULT 'MEMBERS',
  "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "announcements_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "announcements_localChurchId_fkey" FOREIGN KEY ("localChurchId") REFERENCES "local_churches"("id") ON DELETE CASCADE
);

-- Create messages table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "subject" VARCHAR(255),
  "content" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP,
  "parentMessageId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "messages_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "messages"("id") ON DELETE CASCADE
);

-- Add indexes for announcements
CREATE INDEX IF NOT EXISTS "announcements_localChurchId_idx" ON "announcements"("localChurchId");
CREATE INDEX IF NOT EXISTS "announcements_authorId_idx" ON "announcements"("authorId");
CREATE INDEX IF NOT EXISTS "announcements_publishedAt_idx" ON "announcements"("publishedAt");
CREATE INDEX IF NOT EXISTS "announcements_scope_idx" ON "announcements"("scope");
CREATE INDEX IF NOT EXISTS "announcements_isActive_publishedAt_idx" ON "announcements"("isActive", "publishedAt");

-- Add indexes for messages
CREATE INDEX IF NOT EXISTS "messages_senderId_idx" ON "messages"("senderId");
CREATE INDEX IF NOT EXISTS "messages_recipientId_idx" ON "messages"("recipientId");
CREATE INDEX IF NOT EXISTS "messages_recipientId_isRead_idx" ON "messages"("recipientId", "isRead");
CREATE INDEX IF NOT EXISTS "messages_createdAt_idx" ON "messages"("createdAt");
CREATE INDEX IF NOT EXISTS "messages_parentMessageId_idx" ON "messages"("parentMessageId");