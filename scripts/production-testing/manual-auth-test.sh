#!/bin/bash

# Manual Production Authentication Test
# Tests the auth flow using curl to verify backend functionality

PRODUCTION_URL="https://www.drouple.app"
TEST_EMAIL="admin.manila@test.com"
TEST_PASSWORD="Hpci!Test2025"

echo "🔍 Testing Production Auth Backend..."
echo "=================================="

# Step 1: Get CSRF Token
echo "➤ Getting CSRF token..."
CSRF_RESPONSE=$(curl -s "${PRODUCTION_URL}/api/auth/csrf")
CSRF_TOKEN=$(echo "$CSRF_RESPONSE" | grep -o '"csrfToken":"[^"]*' | cut -d'"' -f4)

if [ -n "$CSRF_TOKEN" ]; then
    echo "✅ CSRF Token: ${CSRF_TOKEN:0:20}..."
else
    echo "❌ Failed to get CSRF token"
    echo "Response: $CSRF_RESPONSE"
    exit 1
fi

# Step 2: Attempt Authentication
echo "➤ Testing authentication..."
AUTH_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "csrfToken=${CSRF_TOKEN}&email=${TEST_EMAIL}&password=${TEST_PASSWORD}&callbackUrl=/" \
    "${PRODUCTION_URL}/api/auth/callback/credentials")

echo "Auth response status and headers:"
curl -I -s -X POST \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "csrfToken=${CSRF_TOKEN}&email=${TEST_EMAIL}&password=${TEST_PASSWORD}&callbackUrl=/" \
    "${PRODUCTION_URL}/api/auth/callback/credentials"

# Step 3: Check Session Endpoint
echo "➤ Testing session endpoint..."
SESSION_RESPONSE=$(curl -s "${PRODUCTION_URL}/api/auth/session")
echo "Session response: $SESSION_RESPONSE"

echo "✅ Manual auth test completed"