#!/usr/bin/env node

/**
 * Auth Endpoint Test - Direct API Testing
 */

const PRODUCTION_URL = 'https://www.drouple.app';

async function testAuthEndpoints() {
  console.log('🔍 Testing Auth Endpoints Directly...');
  console.log('=====================================');

  try {
    // Test 1: Get CSRF Token
    console.log('➤ Test 1: Getting CSRF Token...');
    const csrfResponse = await fetch(`${PRODUCTION_URL}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    
    if (!csrfData.csrfToken) {
      throw new Error('No CSRF token returned');
    }
    
    console.log('✅ CSRF Token retrieved:', csrfData.csrfToken.substring(0, 20) + '...');

    // Test 2: Session endpoint (should return null when not authenticated)
    console.log('➤ Test 2: Checking session endpoint...');
    const sessionResponse = await fetch(`${PRODUCTION_URL}/api/auth/session`);
    const sessionData = await sessionResponse.json();
    
    console.log('✅ Session endpoint status:', sessionResponse.status);
    console.log('✅ Session data:', sessionData);

    // Test 3: Providers endpoint
    console.log('➤ Test 3: Checking providers endpoint...');
    const providersResponse = await fetch(`${PRODUCTION_URL}/api/auth/providers`);
    const providersData = await providersResponse.json();
    
    console.log('✅ Providers endpoint status:', providersResponse.status);
    console.log('✅ Available providers:', Object.keys(providersData));

    // Test 4: Attempt credential authentication
    console.log('➤ Test 4: Testing credential authentication...');
    
    const authBody = new URLSearchParams({
      csrfToken: csrfData.csrfToken,
      email: 'admin.manila@test.com',
      password: 'Hpci!Test2025',
      callbackUrl: '/',
      json: 'true'
    });

    const authResponse = await fetch(`${PRODUCTION_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: authBody.toString(),
      redirect: 'manual' // Don't follow redirects automatically
    });

    console.log('✅ Auth response status:', authResponse.status);
    console.log('✅ Auth response headers:');
    for (const [key, value] of authResponse.headers.entries()) {
      if (key.toLowerCase().includes('cookie') || key.toLowerCase().includes('location')) {
        console.log(`   ${key}: ${value}`);
      }
    }

    const authResponseText = await authResponse.text();
    console.log('✅ Auth response body (first 200 chars):', authResponseText.substring(0, 200));

    // Test 5: Check if session was created (using cookies from auth response)
    console.log('➤ Test 5: Checking post-auth session...');
    
    // Extract cookies from the auth response
    const setCookieHeaders = authResponse.headers.get('set-cookie');
    let cookieHeader = '';
    
    if (setCookieHeaders) {
      // Parse cookies and create cookie header
      const cookies = setCookieHeaders.split(', ').map(cookie => {
        return cookie.split(';')[0]; // Get just the name=value part
      }).join('; ');
      cookieHeader = cookies;
    }

    const postAuthSessionResponse = await fetch(`${PRODUCTION_URL}/api/auth/session`, {
      headers: cookieHeader ? { 'Cookie': cookieHeader } : {}
    });
    
    const postAuthSessionData = await postAuthSessionResponse.json();
    console.log('✅ Post-auth session status:', postAuthSessionResponse.status);
    console.log('✅ Post-auth session data:', postAuthSessionData);

    // Determine overall success
    const authSuccess = authResponse.status === 302 || authResponse.status === 200;
    const hasValidSession = postAuthSessionData && postAuthSessionData.user;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 ENDPOINT TEST RESULTS');
    console.log('='.repeat(50));
    console.log('CSRF Token:', '✅ PASS');
    console.log('Session Endpoint:', '✅ PASS');
    console.log('Providers Endpoint:', '✅ PASS');
    console.log('Authentication:', authSuccess ? '✅ PASS' : '❌ FAIL');
    console.log('Session Creation:', hasValidSession ? '✅ PASS' : '❌ FAIL');
    
    const overallSuccess = authSuccess && hasValidSession;
    console.log('\n🎯 OVERALL RESULT:', overallSuccess ? '✅ SUCCESS' : '❌ FAILURE');

    return overallSuccess;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testAuthEndpoints()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });