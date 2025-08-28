#!/bin/bash

# Domain Setup Verification Script
# Verifies that drouple.app domain is properly configured

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
DOMAIN="drouple.app"
STAGING_DOMAIN="staging.drouple.app"
WWW_DOMAIN="www.drouple.app"

echo -e "${BLUE}🔍 Verifying drouple.app domain setup${NC}"
echo -e "${BLUE}====================================${NC}"

# Function to check DNS resolution
check_dns() {
    local domain=$1
    local record_type=$2
    
    echo -e "\n${YELLOW}🔍 Checking DNS for ${domain} (${record_type})...${NC}"
    
    if command -v dig &> /dev/null; then
        result=$(dig +short $domain $record_type)
        if [ -n "$result" ]; then
            echo -e "${GREEN}✅ ${domain} resolves to: ${result}${NC}"
            return 0
        else
            echo -e "${RED}❌ ${domain} does not resolve${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ dig command not available, using nslookup...${NC}"
        if nslookup $domain &> /dev/null; then
            echo -e "${GREEN}✅ ${domain} resolves${NC}"
            return 0
        else
            echo -e "${RED}❌ ${domain} does not resolve${NC}"
            return 1
        fi
    fi
}

# Function to check HTTP response
check_http() {
    local url=$1
    local expected_status=$2
    
    echo -e "\n${YELLOW}🌐 Checking HTTP response for ${url}...${NC}"
    
    if command -v curl &> /dev/null; then
        status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 "$url" || echo "000")
        
        if [ "$status" = "$expected_status" ]; then
            echo -e "${GREEN}✅ ${url} returns status ${status}${NC}"
            return 0
        elif [ "$status" = "000" ]; then
            echo -e "${RED}❌ ${url} - Connection failed${NC}"
            return 1
        else
            echo -e "${YELLOW}⚠️ ${url} returns status ${status} (expected ${expected_status})${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ curl command not available${NC}"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl() {
    local domain=$1
    
    echo -e "\n${YELLOW}🔒 Checking SSL certificate for ${domain}...${NC}"
    
    if command -v openssl &> /dev/null; then
        # Extract certificate info
        cert_info=$(echo | timeout 10 openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null || echo "failed")
        
        if [ "$cert_info" != "failed" ] && [ -n "$cert_info" ]; then
            echo -e "${GREEN}✅ Valid SSL certificate found${NC}"
            echo -e "${BLUE}   Certificate details:${NC}"
            echo "$cert_info" | sed 's/^/   /'
            return 0
        else
            echo -e "${RED}❌ SSL certificate check failed${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ openssl command not available, skipping SSL check${NC}"
        return 0
    fi
}

# Function to check security headers
check_security_headers() {
    local url=$1
    
    echo -e "\n${YELLOW}🛡️ Checking security headers for ${url}...${NC}"
    
    if command -v curl &> /dev/null; then
        headers=$(curl -s -I "$url" --connect-timeout 10 2>/dev/null || echo "failed")
        
        if [ "$headers" != "failed" ]; then
            # Check for important security headers
            if echo "$headers" | grep -qi "strict-transport-security"; then
                echo -e "${GREEN}✅ HSTS header present${NC}"
            else
                echo -e "${YELLOW}⚠️ HSTS header missing${NC}"
            fi
            
            if echo "$headers" | grep -qi "x-frame-options"; then
                echo -e "${GREEN}✅ X-Frame-Options header present${NC}"
            else
                echo -e "${YELLOW}⚠️ X-Frame-Options header missing${NC}"
            fi
            
            if echo "$headers" | grep -qi "content-security-policy"; then
                echo -e "${GREEN}✅ Content-Security-Policy header present${NC}"
            else
                echo -e "${YELLOW}⚠️ Content-Security-Policy header missing${NC}"
            fi
            
            if echo "$headers" | grep -qi "x-content-type-options"; then
                echo -e "${GREEN}✅ X-Content-Type-Options header present${NC}"
            else
                echo -e "${YELLOW}⚠️ X-Content-Type-Options header missing${NC}"
            fi
        else
            echo -e "${RED}❌ Failed to retrieve headers${NC}"
        fi
    else
        echo -e "${RED}❌ curl command not available${NC}"
    fi
}

# Start verification
echo -e "${BLUE}Starting comprehensive domain verification...${NC}"

# DNS checks
dns_success=0
check_dns "$DOMAIN" "A" && ((dns_success++))
check_dns "$WWW_DOMAIN" "A" && ((dns_success++))
check_dns "$STAGING_DOMAIN" "CNAME" && ((dns_success++))

# HTTP checks
http_success=0
check_http "https://$DOMAIN" "200" && ((http_success++))
check_http "https://$WWW_DOMAIN" "200" && ((http_success++))
check_http "https://$STAGING_DOMAIN" "200" && ((http_success++))

# SSL checks  
ssl_success=0
check_ssl "$DOMAIN" && ((ssl_success++))
check_ssl "$WWW_DOMAIN" && ((ssl_success++))
check_ssl "$STAGING_DOMAIN" && ((ssl_success++))

# Security headers check
check_security_headers "https://$DOMAIN"

# Health check
echo -e "\n${YELLOW}🏥 Checking application health...${NC}"
if check_http "https://$DOMAIN/api/health" "200"; then
    # Try to get health response
    if command -v curl &> /dev/null; then
        health_data=$(curl -s "https://$DOMAIN/api/health" 2>/dev/null || echo "{}")
        if echo "$health_data" | grep -q '"status":"healthy"'; then
            echo -e "${GREEN}✅ Application health check passed${NC}"
        else
            echo -e "${YELLOW}⚠️ Application health check returned unexpected response${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Application health check failed${NC}"
fi

# Authentication page check
echo -e "\n${YELLOW}🔐 Checking authentication pages...${NC}"
check_http "https://$DOMAIN/auth/signin" "200"

# Summary
echo -e "\n${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo -e "${BLUE}======================${NC}"
echo -e "DNS Resolution: ${dns_success}/3 domains"
echo -e "HTTP Response: ${http_success}/3 domains"
echo -e "SSL Certificates: ${ssl_success}/3 domains"

if [ $dns_success -eq 3 ] && [ $http_success -eq 3 ] && [ $ssl_success -eq 3 ]; then
    echo -e "\n${GREEN}🎉 Domain setup verification PASSED!${NC}"
    echo -e "${GREEN}✅ drouple.app is ready for production${NC}"
    
    echo -e "\n${YELLOW}📋 Next steps:${NC}"
    echo -e "  1. Deploy to production: ${BLUE}vercel --prod${NC}"
    echo -e "  2. Run production tests: ${BLUE}./scripts/test-production-deployment.sh${NC}"
    echo -e "  3. Monitor deployment: ${BLUE}vercel logs --follow${NC}"
    
    exit 0
else
    echo -e "\n${YELLOW}⚠️ Domain setup verification has issues${NC}"
    echo -e "${YELLOW}Please check the failed items above and try again${NC}"
    
    echo -e "\n${YELLOW}💡 Common fixes:${NC}"
    echo -e "  • Wait longer for DNS propagation (up to 48 hours)"
    echo -e "  • Verify DNS records with your domain registrar"
    echo -e "  • Check Vercel domain configuration"
    echo -e "  • Ensure SSL certificates have been provisioned"
    
    exit 1
fi