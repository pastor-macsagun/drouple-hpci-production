#!/bin/bash

BASE_URL="https://drouple-hpci-prod.vercel.app"
RESULTS_FILE="performance_results.txt"

echo "============================================================" > $RESULTS_FILE
echo "PERFORMANCE & LOAD TIME TEST" >> $RESULTS_FILE
echo "Timestamp: $(date)" >> $RESULTS_FILE
echo "============================================================" >> $RESULTS_FILE

# Test key page load times
echo -e "\n## PAGE LOAD TIME TEST" >> $RESULTS_FILE
echo "----------------------------------------" >> $RESULTS_FILE

pages=(
    "/:Landing Page"
    "/events:Events Page"
    "/auth/signin:Sign In Page"
    "/dashboard:Dashboard"
    "/admin/services:Admin Services"
    "/admin/lifegroups:Admin LifeGroups"
)

for page in "${pages[@]}"; do
    IFS=':' read -r path description <<< "$page"
    echo -e "\nTesting $description ($path):" >> $RESULTS_FILE
    
    # Measure total time including DNS, connection, and transfer
    time_total=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL$path")
    time_connect=$(curl -s -o /dev/null -w "%{time_connect}" "$BASE_URL$path")
    time_ttfb=$(curl -s -o /dev/null -w "%{time_starttransfer}" "$BASE_URL$path")
    size=$(curl -s -o /dev/null -w "%{size_download}" "$BASE_URL$path")
    
    echo "  Total Time: ${time_total}s" >> $RESULTS_FILE
    echo "  Time to First Byte: ${time_ttfb}s" >> $RESULTS_FILE
    echo "  Page Size: $((size / 1024))KB" >> $RESULTS_FILE
    
    # Performance rating
    if (( $(echo "$time_total < 2" | bc -l) )); then
        echo "  Rating: ✅ Good (<2s)" >> $RESULTS_FILE
    elif (( $(echo "$time_total < 4" | bc -l) )); then
        echo "  Rating: ⚠️ Acceptable (2-4s)" >> $RESULTS_FILE
    else
        echo "  Rating: ❌ Slow (>4s)" >> $RESULTS_FILE
    fi
done

# Test API endpoints
echo -e "\n## API ENDPOINT PERFORMANCE TEST" >> $RESULTS_FILE
echo "----------------------------------------" >> $RESULTS_FILE

apis=(
    "/api/health:Health Check"
)

for api in "${apis[@]}"; do
    IFS=':' read -r path description <<< "$api"
    echo -e "\nTesting $description ($path):" >> $RESULTS_FILE
    
    time_total=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL$path")
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    
    echo "  Response Time: ${time_total}s" >> $RESULTS_FILE
    echo "  HTTP Status: $http_code" >> $RESULTS_FILE
    
    if (( $(echo "$time_total < 0.5" | bc -l) )) && [ "$http_code" = "200" ]; then
        echo "  Rating: ✅ Good" >> $RESULTS_FILE
    else
        echo "  Rating: ⚠️ Check performance" >> $RESULTS_FILE
    fi
done

echo -e "\n============================================================" >> $RESULTS_FILE
echo "Test completed at $(date)" >> $RESULTS_FILE
echo "============================================================" >> $RESULTS_FILE

cat $RESULTS_FILE