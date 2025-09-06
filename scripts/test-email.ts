#!/usr/bin/env npx tsx
/**
 * Simple script to test Resend email integration
 * Usage: npm run test-email -- your@email.com
 */

import { sendPasswordResetEmail } from '../lib/email'

async function testEmail() {
  const testEmail = process.argv[2]
  
  if (!testEmail) {
    console.error('❌ Please provide an email address as argument')
    console.log('Usage: npm run test-email -- your@email.com')
    process.exit(1)
  }

  console.log('🧪 Testing Resend email integration...')
  console.log(`📧 Sending test email to: ${testEmail}`)
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables')
    console.log('Please add RESEND_API_KEY to your .env.local file')
    process.exit(1)
  }

  const result = await sendPasswordResetEmail(
    testEmail,
    'Test User',
    'TempPassword123!'
  )

  if (result.success) {
    console.log('✅ Email sent successfully!')
    console.log('Check your inbox for the password reset email')
  } else {
    console.error('❌ Email failed to send:', result.error)
  }
}

testEmail().catch(console.error)