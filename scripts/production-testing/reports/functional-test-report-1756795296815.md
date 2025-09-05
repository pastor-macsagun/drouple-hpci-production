# Drouple - Church Management System Functional Test Report
**Generated:** 2025-09-02T06:41:36.815Z
**Environment:** https://www.drouple.app
**Test Type:** Comprehensive Functionality Testing

## Executive Summary
- **Total Functional Tests:** 6
- **Passed:** 0 (0%)
- **Failed:** 6 (100%)
- **Success Rate:** 0%

## Test Categories
- **CORE:** 0/3 passed (0%)
- **ADMIN:** 0/3 passed (0%)
- **MEMBER:** 0/0 passed (0%)
- **VIP:** 0/0 passed (0%)

## Detailed Results


### Member CRUD Operations - admin.manila@test.com
- **Status:** ❌ FAILED
- **Category:** ADMIN
- **Priority:** HIGH
- **Duration:** 6856ms
- **Role:** ADMIN
- **Church:** Manila
- **Error:** page.waitForSelector: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="members-list"]') to be visible[22m

- **Steps:** 2 steps, 1 passed
- **Screenshots:** 2 captured

### Service Creation and Check-in Flow - admin.manila@test.com
- **Status:** ❌ FAILED
- **Category:** CORE
- **Priority:** HIGH
- **Duration:** 6827ms
- **Role:** ADMIN
- **Church:** Manila
- **Error:** page.waitForSelector: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="create-service-button"]') to be visible[22m

- **Steps:** 2 steps, 1 passed
- **Screenshots:** 2 captured

### Event Creation and RSVP Process - admin.manila@test.com
- **Status:** ❌ FAILED
- **Category:** CORE
- **Priority:** HIGH
- **Duration:** 6791ms
- **Role:** ADMIN
- **Church:** Manila
- **Error:** page.waitForSelector: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="create-event-button"]') to be visible[22m

- **Steps:** 2 steps, 1 passed
- **Screenshots:** 2 captured

### LifeGroup Management and Join Process - admin.manila@test.com
- **Status:** ❌ FAILED
- **Category:** CORE
- **Priority:** HIGH
- **Duration:** 7187ms
- **Role:** ADMIN
- **Church:** Manila
- **Error:** page.waitForSelector: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="create-lifegroup-button"]') to be visible[22m

- **Steps:** 2 steps, 1 passed
- **Screenshots:** 2 captured

### Tenant Isolation Verification - admin.manila@test.com
- **Status:** ❌ FAILED
- **Category:** ADMIN
- **Priority:** HIGH
- **Duration:** 6828ms
- **Role:** ADMIN
- **Church:** Manila
- **Error:** page.waitForSelector: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="member-row"]') to be visible[22m

- **Steps:** 2 steps, 1 passed
- **Screenshots:** 2 captured

### Super Admin Multi-Church Overview - superadmin@test.com
- **Status:** ❌ FAILED
- **Category:** ADMIN
- **Priority:** HIGH
- **Duration:** 1830ms
- **Role:** SUPER_ADMIN
- **Church:** N/A
- **Error:** Verification failed: Expected "System Overview" in page content
- **Steps:** 2 steps, 1 passed
- **Screenshots:** 2 captured


## Feature Coverage Analysis
- **Member Management:** ⚠️ 1 tests
- **Service Creation:** ⚠️ 1 tests
- **Event Management:** ⚠️ 1 tests
- **LifeGroup Management:** ⚠️ 1 tests
- **Pathway Tracking:** ⏭️ 0 tests
- **VIP Dashboard:** ⏭️ 0 tests
- **Tenant Isolation:** ⚠️ 1 tests
- **Role-Based Access:** ⏭️ 0 tests

## Production Readiness Assessment
🔴 **NOT READY** - Critical issues must be resolved