#!/bin/bash

# Production database setup script
echo "Setting up production database..."

# Export production URLs (matching schema.prisma)
export DATABASE_URL='postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
export DATABASE_URL_UNPOOLED='postgresql://neondb_owner:npg_GKaWA3zDOZ6n@ep-flat-glade-ad7dfexu.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

# Push schema to production
echo "Pushing schema to production database..."
npx prisma db push --accept-data-loss --skip-generate

# Run the admin creation script
echo "Creating super admin account..."
npx tsx scripts/create-prod-admin.ts

echo "Setup complete!"