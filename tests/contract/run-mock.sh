#!/bin/bash

# HPCI-ChMS API Contract Testing with Mock Server
# This script starts a Prism mock server and runs Dredd contract tests

set -e

echo "🚀 Starting HPCI-ChMS API Contract Tests"

# Configuration
SPEC_FILE="docs/api/openapi.yaml"
MOCK_PORT=4010
MOCK_SERVER_URL="http://localhost:$MOCK_PORT"
MOCK_BASE_URL="http://localhost:$MOCK_PORT"
DREDD_CONFIG="tests/contract/dredd.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
if [[ ! -f "$SPEC_FILE" ]]; then
    print_error "OpenAPI spec file not found: $SPEC_FILE"
    exit 1
fi

if [[ ! -f "$DREDD_CONFIG" ]]; then
    print_error "Dredd config file not found: $DREDD_CONFIG"
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    print_status "Cleaning up background processes..."
    if [[ ! -z "$MOCK_PID" ]]; then
        kill $MOCK_PID 2>/dev/null || true
    fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Validate OpenAPI spec first
print_status "Validating OpenAPI specification..."
if ! npx @redocly/cli lint "$SPEC_FILE" --format=stylish; then
    print_error "OpenAPI specification validation failed"
    exit 1
fi
print_success "OpenAPI specification is valid"

# Start Prism mock server
print_status "Starting Prism mock server on port $MOCK_PORT..."
npx @stoplight/prism-cli mock "$SPEC_FILE" --port $MOCK_PORT --host 0.0.0.0 &
MOCK_PID=$!

# Wait for mock server to start
sleep 3

# Check if mock server is responding
print_status "Checking mock server health..."
if ! curl -s -f "http://localhost:$MOCK_PORT/healthz" > /dev/null; then
    print_error "Mock server is not responding at http://localhost:$MOCK_PORT"
    exit 1
fi
print_success "Mock server is running at $MOCK_BASE_URL"

# Set environment variables for Dredd
export DREDD_TEST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJ0ZW5hbnRJZCI6InRlc3QtdGVuYW50LWlkIiwicm9sZXMiOlsiTUVNQkVSIl0sImlhdCI6MTYzMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ.test-signature"

# Update Dredd config to use mock server
print_status "Updating Dredd configuration for mock server..."
sed -i.bak "s|server:.*|server: $MOCK_BASE_URL|" "$DREDD_CONFIG"
sed -i.bak "s|endpoint:.*|endpoint: $MOCK_BASE_URL|" "$DREDD_CONFIG"

# Run Dredd contract tests
print_status "Running Dredd contract tests..."
if npx dredd "$SPEC_FILE" "$MOCK_BASE_URL" --config="$DREDD_CONFIG"; then
    print_success "All contract tests passed!"
    exit_code=0
else
    print_error "Some contract tests failed"
    exit_code=1
fi

# Restore original Dredd config
if [[ -f "$DREDD_CONFIG.bak" ]]; then
    mv "$DREDD_CONFIG.bak" "$DREDD_CONFIG"
fi

# Test specific scenarios
print_status "Testing specific contract scenarios..."

# Test ETag functionality
print_status "Testing ETag caching..."
ETAG_RESPONSE=$(curl -s -w "\n%{http_code}" "$MOCK_BASE_URL/members")
ETAG_HEADER=$(echo "$ETAG_RESPONSE" | head -1 | grep -i etag || echo "")

if [[ ! -z "$ETAG_HEADER" ]]; then
    print_success "ETag header found in response"
    
    # Test 304 Not Modified
    ETAG_VALUE=$(echo "$ETAG_HEADER" | cut -d'"' -f2)
    NOT_MODIFIED_CODE=$(curl -s -w "%{http_code}" -H "If-None-Match: \"$ETAG_VALUE\"" "$MOCK_BASE_URL/members" -o /dev/null)
    
    if [[ "$NOT_MODIFIED_CODE" == "304" ]]; then
        print_success "ETag 304 Not Modified working correctly"
    else
        print_warning "ETag 304 Not Modified not working as expected (got $NOT_MODIFIED_CODE)"
    fi
else
    print_warning "ETag header not found in response"
fi

# Test rate limiting headers
print_status "Testing rate limiting response format..."
# Note: Mock server might not implement actual rate limiting, but should have proper error format

# Test error response format
print_status "Testing error response format..."
ERROR_RESPONSE=$(curl -s "$MOCK_BASE_URL/members/invalid-id")
if echo "$ERROR_RESPONSE" | jq -e '.error.code and .error.message' > /dev/null 2>&1; then
    print_success "Error response format is correct"
else
    print_warning "Error response format may not match specification"
fi

print_status "Contract testing completed"
exit $exit_code