import { authenticator } from 'otplib'
import QRCode from 'qrcode'

/**
 * Two-Factor Authentication utilities using TOTP
 */

export function generate2FASecret(): string {
  return authenticator.generateSecret()
}

export function generateQRCodeURL(email: string, secret: string): string {
  const service = 'HPCI ChMS'
  const otpauthURL = authenticator.keyuri(email, service, secret)
  return otpauthURL
}

export async function generateQRCodeDataURL(otpauthURL: string): Promise<string> {
  return await QRCode.toDataURL(otpauthURL)
}

export function verify2FAToken(token: string, secret: string): boolean {
  // Remove any spaces or formatting from token
  const cleanToken = token.replace(/\s/g, '')
  
  // Validate token format (6 digits)
  if (!/^\d{6}$/.test(cleanToken)) {
    return false
  }
  
  return authenticator.verify({
    token: cleanToken,
    secret: secret
  })
}

export function is2FARequired(userRole: string): boolean {
  const requiredRoles = ['PASTOR', 'ADMIN']
  return requiredRoles.includes(userRole)
}

export function is2FAEnabled(): boolean {
  return process.env.ENABLE_2FA === 'true'
}