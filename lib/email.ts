import { Resend } from 'resend'
import { generateSecurePassword } from './password'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export async function sendPasswordResetEmail(
  userEmail: string,
  userName: string,
  newPassword: string,
  fromEmail: string = 'noreply@drouple.app'
) {
  if (!process.env.RESEND_API_KEY || !resend) {
    console.warn('RESEND_API_KEY not configured - email not sent')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: userEmail,
      subject: 'Your Drouple Password Has Been Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e7ce8; margin: 0;">Drouple</h1>
            <p style="color: #666; margin-top: 5px;">Church Management System</p>
          </div>
          
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Hello ${userName},
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Your church administrator has reset your Drouple password. Here are your new login credentials:
          </p>
          
          <div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #333;"><strong>Email:</strong> ${userEmail}</p>
            <p style="margin: 0; color: #333;"><strong>New Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace;">${newPassword}</code></p>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong> You'll be required to change this password when you first sign in. Please choose a strong, unique password for your account.
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            You can sign in at: <a href="${process.env.NEXTAUTH_URL || 'https://drouple.app'}/auth/signin" style="color: #1e7ce8; text-decoration: none;">${process.env.NEXTAUTH_URL || 'https://drouple.app'}/auth/signin</a>
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            If you have any questions or need assistance, please contact your church administrator.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 30px 0;">
          
          <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
            This email was sent automatically by the Drouple church management system.
          </p>
        </div>
      `
    })

    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function generateAndSendPasswordReset(
  userEmail: string,
  userName: string,
  fromEmail?: string
) {
  const newPassword = generateSecurePassword(12)
  const emailResult = await sendPasswordResetEmail(userEmail, userName, newPassword, fromEmail)
  
  return {
    ...emailResult,
    newPassword: emailResult.success ? newPassword : undefined
  }
}