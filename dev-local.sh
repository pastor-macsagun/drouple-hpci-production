#!/bin/bash

# Drouple - Church Management System Local Development Startup Script
# This script ensures the correct environment for local PostgreSQL development

echo "🚀 Starting Drouple - Church Management System with Local PostgreSQL..."

# Export PostgreSQL path
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# Set local database environment variables
export DATABASE_URL="postgresql://macsagun@localhost:5432/drouple_dev"
export DATABASE_URL_UNPOOLED="postgresql://macsagun@localhost:5432/drouple_dev"

# Ensure PostgreSQL is running
echo "🔧 Ensuring PostgreSQL service is running..."
brew services start postgresql@15

# Check if database exists, create if not
echo "🗄️ Checking database connection..."
if ! psql -d "$DATABASE_URL" -c '\q' 2>/dev/null; then
    echo "📦 Creating database..."
    createdb drouple_dev
fi

# Run Prisma operations
echo "🔄 Syncing database schema..."
npx prisma db push

# Start Next.js development server
echo "⚡ Starting Next.js development server..."
echo "📍 Database: Local PostgreSQL (drouple_dev)"
echo "🔐 Login: superadmin@test.com / Hpci!Test2025"
echo ""

npm run dev