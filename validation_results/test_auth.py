#!/usr/bin/env python3
import requests
import json
import time
from datetime import datetime

BASE_URL = "https://drouple-hpci-prod.vercel.app"
TEST_ACCOUNTS = [
    {"email": "superadmin@test.com", "password": "password123", "role": "SUPER_ADMIN", "expected_redirect": "/super"},
    {"email": "admin.manila@test.com", "password": "password123", "role": "ADMIN", "expected_redirect": "/admin"},
    {"email": "leader.manila@test.com", "password": "password123", "role": "LEADER", "expected_redirect": "/dashboard"},
    {"email": "member1@test.com", "password": "password123", "role": "MEMBER", "expected_redirect": "/dashboard"},
    {"email": "vip.manila@test.com", "password": "password123", "role": "VIP", "expected_redirect": "/vip/firsttimers"}
]

results = []

def test_login(account):
    session = requests.Session()
    print(f"\nTesting {account['role']} login with {account['email']}...")
    
    # Get CSRF token first
    login_page = session.get(f"{BASE_URL}/auth/login", allow_redirects=True)
    
    # Attempt login
    login_data = {
        "email": account["email"],
        "password": account["password"]
    }
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    login_response = session.post(
        f"{BASE_URL}/api/auth/callback/credentials",
        json=login_data,
        headers=headers,
        allow_redirects=False
    )
    
    # Check response
    success = False
    redirect_url = ""
    
    if login_response.status_code in [200, 302, 303]:
        # Check session
        dashboard_check = session.get(f"{BASE_URL}{account['expected_redirect']}", allow_redirects=False)
        if dashboard_check.status_code == 200:
            success = True
            redirect_url = account['expected_redirect']
        elif dashboard_check.status_code in [302, 303]:
            redirect_url = dashboard_check.headers.get('Location', '')
            
    # Test logout
    logout_success = False
    if success:
        logout_response = session.post(f"{BASE_URL}/api/auth/signout", allow_redirects=False)
        if logout_response.status_code in [200, 302]:
            logout_success = True
    
    result = {
        "role": account["role"],
        "email": account["email"],
        "login_success": success,
        "logout_success": logout_success,
        "expected_redirect": account["expected_redirect"],
        "actual_redirect": redirect_url,
        "status": "PASS" if success and logout_success else "FAIL"
    }
    
    results.append(result)
    print(f"  Login: {'✅' if success else '❌'}")
    print(f"  Logout: {'✅' if logout_success else '❌'}")
    return result

# Run tests
print("=" * 60)
print("GLOBAL SMOKE TESTS - Authentication")
print("=" * 60)

for account in TEST_ACCOUNTS:
    test_login(account)
    time.sleep(1)  # Rate limit respect

# Generate summary
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

passed = sum(1 for r in results if r["status"] == "PASS")
failed = sum(1 for r in results if r["status"] == "FAIL")

print(f"Total Tests: {len(results)}")
print(f"Passed: {passed}")
print(f"Failed: {failed}")

# Save results
with open("auth_test_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\nResults saved to auth_test_results.json")