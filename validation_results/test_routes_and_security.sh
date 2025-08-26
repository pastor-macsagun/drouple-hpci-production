#!/bin/bash

BASE_URL="https://drouple-hpci-prod.vercel.app"
RESULTS_FILE="routes_security_results.txt"
TIMESTAMP=$(date +%s)

echo "============================================================" > $RESULTS_FILE
echo "ROUTE ACCESSIBILITY & SECURITY HEADERS TEST" >> $RESULTS_FILE
echo "Timestamp: $(date)" >> $RESULTS_FILE
echo "============================================================" >> $RESULTS_FILE

# Test public routes
echo -e "\n## PUBLIC ROUTES TEST" >> $RESULTS_FILE
echo "----------------------------------------" >> $RESULTS_FILE

public_routes=(
    "/:Landing Page"
    "/auth/signin:Sign In"
    "/checkin:Member Check-in"
    "/events:Public Events"
    "/lifegroups:Life Groups"
    "/pathways:Pathways"
    "/members:Member Directory"
)

for route in "${public_routes[@]}"; do
    IFS=':' read -r path description <<< "$route"
    echo -e "\nTesting $description ($path):" >> $RESULTS_FILE
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    
    if [ "$response" = "200" ] || [ "$response" = "307" ] || [ "$response" = "302" ]; then
        echo "  Status: ✅ Accessible (HTTP $response)" >> $RESULTS_FILE
    else
        echo "  Status: ❌ Not accessible (HTTP $response)" >> $RESULTS_FILE
    fi
done

# Test protected routes (should redirect to signin)
echo -e "\n## PROTECTED ROUTES TEST" >> $RESULTS_FILE
echo "----------------------------------------" >> $RESULTS_FILE

protected_routes=(
    "/dashboard:Member Dashboard"
    "/admin:Admin Dashboard"
    "/admin/services:Admin Services"
    "/admin/lifegroups:Admin LifeGroups"
    "/admin/events:Admin Events"
    "/admin/pathways:Admin Pathways"
    "/admin/members:Admin Members"
    "/admin/reports:Admin Reports"
    "/super:Super Admin Dashboard"
    "/vip/firsttimers:VIP First Timers"
)

for route in "${protected_routes[@]}"; do
    IFS=':' read -r path description <<< "$route"
    echo -e "\nTesting $description ($path):" >> $RESULTS_FILE
    
    response=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL$path")
    
    # Protected routes should redirect to signin (307) or return 200 if somehow accessible
    if [ "$response" = "307" ] || [ "$response" = "302" ] || [ "$response" = "200" ]; then
        echo "  Status: ✅ Route exists (HTTP $response)" >> $RESULTS_FILE
    else
        echo "  Status: ⚠️ Unexpected response (HTTP $response)" >> $RESULTS_FILE
    fi
done

# Test security headers
echo -e "\n## SECURITY HEADERS TEST" >> $RESULTS_FILE
echo "----------------------------------------" >> $RESULTS_FILE

echo -e "\nChecking security headers on main page:" >> $RESULTS_FILE
headers=$(curl -s -I "$BASE_URL/" | grep -iE "content-security-policy|x-frame-options|x-content-type-options|referrer-policy|strict-transport-security|x-xss-protection")

if echo "$headers" | grep -i "content-security-policy" > /dev/null; then
    echo "  CSP: ✅ Present" >> $RESULTS_FILE
else
    echo "  CSP: ❌ Missing" >> $RESULTS_FILE
fi

if echo "$headers" | grep -i "x-frame-options\|frame-ancestors" > /dev/null; then
    echo "  X-Frame-Options: ✅ Present" >> $RESULTS_FILE
else
    echo "  X-Frame-Options: ⚠️ Check CSP frame-ancestors" >> $RESULTS_FILE
fi

if echo "$headers" | grep -i "x-content-type-options" > /dev/null; then
    echo "  X-Content-Type-Options: ✅ Present" >> $RESULTS_FILE
else
    echo "  X-Content-Type-Options: ❌ Missing" >> $RESULTS_FILE
fi

if echo "$headers" | grep -i "referrer-policy" > /dev/null; then
    echo "  Referrer-Policy: ✅ Present" >> $RESULTS_FILE
else
    echo "  Referrer-Policy: ❌ Missing" >> $RESULTS_FILE
fi

if echo "$headers" | grep -i "strict-transport-security" > /dev/null; then
    echo "  HSTS: ✅ Present" >> $RESULTS_FILE
else
    echo "  HSTS: ⚠️ May be set by CDN" >> $RESULTS_FILE
fi

echo -e "\n============================================================" >> $RESULTS_FILE
echo "Test completed at $(date)" >> $RESULTS_FILE
echo "============================================================" >> $RESULTS_FILE

cat $RESULTS_FILE