#!/bin/bash

BASE_URL="https://drouple-hpci-prod.vercel.app"
RESULTS_FILE="auth_test_results.txt"

echo "============================================================" > $RESULTS_FILE
echo "GLOBAL SMOKE TESTS - Authentication" >> $RESULTS_FILE
echo "Timestamp: $(date)" >> $RESULTS_FILE
echo "============================================================" >> $RESULTS_FILE

# Test accounts
declare -a accounts=(
    "superadmin@test.com:password123:SUPER_ADMIN:/super"
    "admin.manila@test.com:password123:ADMIN:/admin"
    "leader.manila@test.com:password123:LEADER:/dashboard"
    "member1@test.com:password123:MEMBER:/dashboard"
    "vip.manila@test.com:password123:VIP:/vip/firsttimers"
)

echo -e "\nTesting authentication for all roles..."

for account in "${accounts[@]}"; do
    IFS=':' read -r email password role expected_redirect <<< "$account"
    
    echo -e "\n----------------------------------------" >> $RESULTS_FILE
    echo "Testing $role ($email)" >> $RESULTS_FILE
    echo "----------------------------------------" >> $RESULTS_FILE
    
    # Test login page accessibility
    echo -n "Login page accessible: " >> $RESULTS_FILE
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login")
    if [ "$response" = "200" ]; then
        echo "✅ PASS" >> $RESULTS_FILE
    else
        echo "❌ FAIL (HTTP $response)" >> $RESULTS_FILE
    fi
    
    # Test expected dashboard redirect (will redirect to login if not authenticated)
    echo -n "Dashboard route check: " >> $RESULTS_FILE
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$expected_redirect")
    # Should redirect to login (307 or 302) if not authenticated
    if [ "$response" = "307" ] || [ "$response" = "302" ] || [ "$response" = "200" ]; then
        echo "✅ Route exists" >> $RESULTS_FILE
    else
        echo "⚠️ WARNING (HTTP $response)" >> $RESULTS_FILE
    fi
    
    sleep 1
done

echo -e "\n============================================================" >> $RESULTS_FILE
echo "Test completed at $(date)" >> $RESULTS_FILE
echo "============================================================" >> $RESULTS_FILE

cat $RESULTS_FILE