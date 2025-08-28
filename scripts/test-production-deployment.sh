#!/bin/bash

# Production Deployment Test Script for drouple.app
# Comprehensive testing after deployment

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DOMAIN="drouple.app"
BASE_URL="https://$DOMAIN"
TEST_REPORT="production-test-report-$(date +%Y%m%d-%H%M%S).md"

echo -e "${BLUE}🧪 Testing production deployment: $BASE_URL${NC}"
echo -e "${BLUE}================================================${NC}"

# Initialize test report
cat > "$TEST_REPORT" << EOF
# Production Deployment Test Report

**Domain:** $DOMAIN  
**Base URL:** $BASE_URL  
**Date:** $(date)  
**Test Suite:** Automated Production Validation

## Test Results

EOF

# Test counters
tests_passed=0
tests_failed=0
tests_total=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    ((tests_total++))
    echo -e "\n${YELLOW}🔍 Test: ${test_name}${NC}"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS: ${test_name}${NC}"
        echo "- ✅ **$test_name**: PASS" >> "$TEST_REPORT"
        ((tests_passed++))
        return 0
    else
        echo -e "${RED}❌ FAIL: ${test_name}${NC}"
        echo "- ❌ **$test_name**: FAIL" >> "$TEST_REPORT"
        ((tests_failed++))
        return 1
    fi
}

# Test functions
test_health_endpoint() {
    local response=$(curl -s "$BASE_URL/api/health" --max-time 10)
    echo "$response" | grep -q '"status":"healthy"'
}

test_signin_page() {
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/signin" --max-time 10)
    [ "$status" = "200" ]
}

test_public_pages() {
    local pages=("/checkin" "/auth/signin" "/")
    for page in "${pages[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page" --max-time 10)
        if [ "$status" != "200" ] && [ "$status" != "307" ] && [ "$status" != "302" ]; then
            echo "Page $page returned status $status"
            return 1
        fi
    done
    return 0
}

test_security_headers() {
    local headers=$(curl -sI "$BASE_URL" --max-time 10)
    echo "$headers" | grep -qi "strict-transport-security" && \
    echo "$headers" | grep -qi "x-frame-options" && \
    echo "$headers" | grep -qi "x-content-type-options"
}

test_protected_endpoints() {
    local endpoints=("/api/admin/members" "/api/admin/services" "/admin" "/super")
    for endpoint in "${endpoints[@]}"; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" --max-time 10)
        # Should return 401, 403, or redirect (302/307) for protected endpoints
        if [ "$status" != "401" ] && [ "$status" != "403" ] && [ "$status" != "302" ] && [ "$status" != "307" ]; then
            echo "Protected endpoint $endpoint returned unexpected status $status"
            return 1
        fi
    done
    return 0
}

test_rate_limiting() {
    local rate_limited=false
    for i in {1..15}; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" \
            -X POST "$BASE_URL/api/auth/signin" \
            -H "Content-Type: application/json" \
            -d '{"email":"invalid@test.com","password":"wrong"}' \
            --max-time 5)
        
        if [ "$status" = "429" ]; then
            rate_limited=true
            break
        fi
        sleep 0.1
    done
    [ "$rate_limited" = true ]
}

test_ssl_certificate() {
    if command -v openssl &> /dev/null; then
        # Check if SSL certificate is valid and not expired
        local cert_check=$(echo | timeout 10 openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -checkend 0 2>/dev/null)
        [ $? -eq 0 ]
    else
        # Fallback: just check if HTTPS works
        local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" --max-time 10)
        [ "$status" = "200" ]
    fi
}

test_database_connection() {
    # Health endpoint should return database status
    local response=$(curl -s "$BASE_URL/api/health" --max-time 10)
    echo "$response" | grep -q '"database":"connected"'
}

test_static_assets() {
    # Test if static assets are loading
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/favicon.ico" --max-time 10)
    [ "$status" = "200" ] || [ "$status" = "304" ]
}

test_404_handling() {
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/nonexistent-page-xyz123" --max-time 10)
    [ "$status" = "404" ]
}

# Run all tests
echo -e "${BLUE}Running production test suite...${NC}"

run_test "Health Endpoint" "test_health_endpoint"
run_test "Sign-in Page Load" "test_signin_page" 
run_test "Public Pages Access" "test_public_pages"
run_test "Security Headers" "test_security_headers"
run_test "Protected Endpoints" "test_protected_endpoints"
run_test "Rate Limiting" "test_rate_limiting"
run_test "SSL Certificate" "test_ssl_certificate"
run_test "Database Connection" "test_database_connection"
run_test "Static Assets" "test_static_assets"
run_test "404 Error Handling" "test_404_handling"

# Performance test
echo -e "\n${YELLOW}⚡ Running performance test...${NC}"
if command -v curl &> /dev/null; then
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$BASE_URL")
    echo -e "${BLUE}Response time: ${response_time}s${NC}"
    echo "- 📊 **Response Time**: ${response_time}s" >> "$TEST_REPORT"
    
    if (( $(echo "$response_time < 3.0" | bc -l) )); then
        echo -e "${GREEN}✅ Response time under 3 seconds${NC}"
        echo "- ✅ **Performance**: Response time acceptable" >> "$TEST_REPORT"
        ((tests_passed++))
    else
        echo -e "${YELLOW}⚠️ Response time over 3 seconds${NC}"
        echo "- ⚠️ **Performance**: Response time slow" >> "$TEST_REPORT"
    fi
    ((tests_total++))
fi

# Generate final report
echo -e "\n## Summary\n" >> "$TEST_REPORT"
echo "- **Tests Passed**: $tests_passed/$tests_total" >> "$TEST_REPORT"
echo "- **Tests Failed**: $tests_failed" >> "$TEST_REPORT"
echo "- **Success Rate**: $(( tests_passed * 100 / tests_total ))%" >> "$TEST_REPORT"

if [ $tests_failed -eq 0 ]; then
    echo -e "\n- **Overall Status**: ✅ **PRODUCTION READY**" >> "$TEST_REPORT"
    status_message="PRODUCTION READY"
    status_color="$GREEN"
elif [ $tests_failed -le 2 ]; then
    echo -e "\n- **Overall Status**: ⚠️ **MINOR ISSUES** - Review failed tests" >> "$TEST_REPORT"
    status_message="MINOR ISSUES"
    status_color="$YELLOW"
else
    echo -e "\n- **Overall Status**: ❌ **NEEDS ATTENTION** - Multiple failures detected" >> "$TEST_REPORT"
    status_message="NEEDS ATTENTION"  
    status_color="$RED"
fi

# Display results
echo -e "\n${BLUE}📊 TEST SUMMARY${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "Tests Passed: $tests_passed/$tests_total"
echo -e "Tests Failed: $tests_failed"
echo -e "Success Rate: $(( tests_passed * 100 / tests_total ))%"
echo -e "Status: ${status_color}$status_message${NC}"

echo -e "\n${YELLOW}📋 Test report saved: $TEST_REPORT${NC}"

if [ $tests_failed -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Production deployment test PASSED!${NC}"
    echo -e "${GREEN}✅ drouple.app is ready for production use${NC}"
    
    echo -e "\n${YELLOW}🚀 Next steps:${NC}"
    echo -e "  • Monitor application: ${BLUE}vercel logs --follow${NC}"
    echo -e "  • Set up monitoring alerts"
    echo -e "  • Run periodic health checks"
    echo -e "  • Test user workflows manually"
    
    exit 0
else
    echo -e "\n${YELLOW}⚠️ Some tests failed - please review and fix issues${NC}"
    echo -e "${YELLOW}Review the test report for details: $TEST_REPORT${NC}"
    
    exit 1
fi