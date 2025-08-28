import { randomBytes } from 'crypto'

/**
 * Generate a secure temporary password for new admin/pastor accounts
 * Format: Word-Word-Number (e.g., "River-Sky-347")
 */
export function generateTemporaryPassword(): string {
  // Simple word lists for readable passwords
  const adjectives = [
    'Swift', 'Bright', 'Clear', 'Strong', 'Wise', 'Bold', 'True', 'Kind',
    'Pure', 'Deep', 'High', 'Calm', 'Fair', 'Quick', 'Safe', 'Free',
    'Great', 'Noble', 'Brave', 'Sharp', 'Grace', 'Hope', 'Faith', 'Light'
  ]
  
  const nouns = [
    'River', 'Mountain', 'Eagle', 'Lion', 'Tree', 'Stone', 'Star', 'Moon',
    'Sun', 'Ocean', 'Cloud', 'Fire', 'Wind', 'Rain', 'Snow', 'Wave',
    'Bridge', 'Tower', 'Castle', 'Garden', 'Dawn', 'Dusk', 'Spring', 'Valley'
  ]

  // Generate random selections
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 900) + 100 // 3-digit number

  return `${adjective}-${noun}-${number}`
}

/**
 * Generate a cryptographically secure random password
 * For higher security needs
 */
export function generateSecurePassword(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  const bytes = randomBytes(length)
  let result = ''
  
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length]
  }
  
  return result
}

/**
 * Validate password meets minimum requirements
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' }
  }
  
  return { valid: true }
}