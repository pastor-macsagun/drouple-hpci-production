/**
 * Simple Connectivity Integration Test
 * Verifies core mobile-to-backend connectivity without complex testing setup
 */

// Mock React Native modules
global.fetch = require('node-fetch');
process.env.NODE_ENV = 'test';

describe('Mobile-Backend Integration', () => {
  const CONFIG = {
    API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
    API_MOBILE_URL: process.env.EXPO_PUBLIC_MOBILE_API_URL || 'http://localhost:3000/api/mobile',
    TIMEOUT_MS: 10000,
  };

  let testResults = {};

  beforeAll(() => {
    console.log('🚀 Starting Mobile-Backend Integration Tests');
    console.log('📡 API Base URL:', CONFIG.API_BASE_URL);
    console.log('📱 Mobile API URL:', CONFIG.API_MOBILE_URL);
  });

  afterAll(() => {
    console.log('\n📊 Integration Test Results Summary:');
    Object.entries(testResults).forEach(([test, result]) => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${test}: ${result.message}`);
      if (result.details) console.log(`   └─ ${result.details}`);
    });
  });

  test('A) API Health Check - Backend Connectivity', async () => {
    const testName = 'API Health Check';
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}/api/health`, {
        method: 'GET',
        timeout: CONFIG.TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        testResults[testName] = {
          success: true,
          message: `Backend API is reachable (${response.status})`,
          details: `Status: ${data.status}, Environment: ${data.environment || 'unknown'}`
        };
      } else {
        testResults[testName] = {
          success: false,
          message: `Backend API returned ${response.status}`,
          details: `Status: ${response.statusText}`
        };
      }

      expect(response.ok).toBe(true);
    } catch (error) {
      testResults[testName] = {
        success: false,
        message: 'Backend API is not reachable',
        details: error.message
      };
      throw error;
    }
  }, CONFIG.TIMEOUT_MS);

  test('B) Mobile API Endpoints - Mobile-Specific Connectivity', async () => {
    const testName = 'Mobile API Endpoints';
    try {
      // Test mobile health endpoint
      const response = await fetch(`${CONFIG.API_MOBILE_URL}/health`, {
        method: 'GET',
        timeout: CONFIG.TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        testResults[testName] = {
          success: true,
          message: `Mobile API endpoints accessible (${response.status})`,
          details: `Version: ${data.version || 'unknown'}, Mobile: ${data.mobile || false}`
        };
      } else {
        testResults[testName] = {
          success: false,
          message: `Mobile API returned ${response.status}`,
          details: `Status: ${response.statusText}`
        };
      }

      expect(response.ok).toBe(true);
    } catch (error) {
      testResults[testName] = {
        success: false,
        message: 'Mobile API endpoints not reachable',
        details: error.message
      };
      throw error;
    }
  }, CONFIG.TIMEOUT_MS);

  test('C) Authentication Flow - Login & Token Validation', async () => {
    const testName = 'Authentication Flow';
    try {
      // Test login endpoint with test credentials
      const loginResponse = await fetch(`${CONFIG.API_MOBILE_URL}/auth/login`, {
        method: 'POST',
        timeout: CONFIG.TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'member1@test.com',
          password: 'Hpci!Test2025'
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        if (loginData.success && loginData.data?.accessToken) {
          testResults[testName] = {
            success: true,
            message: 'Authentication successful',
            details: `Token type: ${typeof loginData.data.accessToken}, Has refresh: ${!!loginData.data.refreshToken}`
          };
        } else {
          testResults[testName] = {
            success: false,
            message: 'Authentication failed - no token in response',
            details: `Response: ${JSON.stringify(loginData).substring(0, 100)}...`
          };
        }
      } else {
        const errorData = await loginResponse.json().catch(() => ({}));
        testResults[testName] = {
          success: false,
          message: `Authentication request failed (${loginResponse.status})`,
          details: `Error: ${errorData.error || loginResponse.statusText}`
        };
      }

      expect(loginResponse.ok).toBe(true);
    } catch (error) {
      testResults[testName] = {
        success: false,
        message: 'Authentication flow error',
        details: error.message
      };
      throw error;
    }
  }, CONFIG.TIMEOUT_MS);

  test('D) Data Fetching - Services & Check-in Data', async () => {
    const testName = 'Data Fetching';
    try {
      // First authenticate to get token
      const loginResponse = await fetch(`${CONFIG.API_MOBILE_URL}/auth/login`, {
        method: 'POST',
        timeout: CONFIG.TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'member1@test.com',
          password: 'Hpci!Test2025'
        })
      });

      expect(loginResponse.ok).toBe(true);
      const loginData = await loginResponse.json();
      const token = loginData.data?.accessToken;

      // Test services endpoint
      const servicesResponse = await fetch(`${CONFIG.API_MOBILE_URL}/checkin/services`, {
        method: 'GET',
        timeout: CONFIG.TIMEOUT_MS,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        testResults[testName] = {
          success: true,
          message: 'Data fetching successful',
          details: `Services found: ${servicesData.data?.length || 0}, Has data: ${!!servicesData.success}`
        };
      } else {
        testResults[testName] = {
          success: false,
          message: `Data fetching failed (${servicesResponse.status})`,
          details: `Status: ${servicesResponse.statusText}`
        };
      }

      expect(servicesResponse.ok).toBe(true);
    } catch (error) {
      testResults[testName] = {
        success: false,
        message: 'Data fetching error',
        details: error.message
      };
      throw error;
    }
  }, CONFIG.TIMEOUT_MS);

  test('E) Configuration Validation - Environment & Endpoints', async () => {
    const testName = 'Configuration Validation';
    try {
      const config = {
        API_BASE_URL: CONFIG.API_BASE_URL,
        API_MOBILE_URL: CONFIG.API_MOBILE_URL,
        NODE_ENV: process.env.NODE_ENV,
        hasBaseUrl: !!CONFIG.API_BASE_URL,
        hasMobileUrl: !!CONFIG.API_MOBILE_URL,
        urlsMatch: CONFIG.API_BASE_URL && CONFIG.API_MOBILE_URL && CONFIG.API_MOBILE_URL.startsWith(CONFIG.API_BASE_URL)
      };

      const isValid = config.hasBaseUrl && config.hasMobileUrl && config.urlsMatch;
      
      testResults[testName] = {
        success: isValid,
        message: isValid ? 'Configuration is valid' : 'Configuration validation failed',
        details: `Base URL valid: ${config.hasBaseUrl}, Mobile URL valid: ${config.hasMobileUrl}, URLs consistent: ${config.urlsMatch}`
      };

      expect(isValid).toBe(true);
    } catch (error) {
      testResults[testName] = {
        success: false,
        message: 'Configuration validation error',
        details: error.message
      };
      throw error;
    }
  });

  test('F) Error Handling - Network & Auth Errors', async () => {
    const testName = 'Error Handling';
    try {
      // Test with invalid credentials
      const invalidAuthResponse = await fetch(`${CONFIG.API_MOBILE_URL}/auth/login`, {
        method: 'POST',
        timeout: CONFIG.TIMEOUT_MS,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid@test.com',
          password: 'wrongpassword'
        })
      });

      // Should get a 401 or 400 response for invalid credentials
      const isExpectedError = invalidAuthResponse.status === 401 || invalidAuthResponse.status === 400;
      const errorData = await invalidAuthResponse.json().catch(() => ({}));
      
      testResults[testName] = {
        success: isExpectedError,
        message: isExpectedError ? 'Error handling works correctly' : 'Unexpected error response',
        details: `Status: ${invalidAuthResponse.status}, Has error message: ${!!errorData.error}`
      };

      expect(isExpectedError).toBe(true);
    } catch (error) {
      testResults[testName] = {
        success: false,
        message: 'Error handling test failed',
        details: error.message
      };
      throw error;
    }
  }, CONFIG.TIMEOUT_MS);
});