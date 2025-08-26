import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'

/**
 * Generate a secure random password
 * @param length - Length of the password (minimum 12)
 * @returns A secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  if (length < 12) {
    throw new Error('Password must be at least 12 characters long')
  }

  // Define character sets
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  // Combine all characters
  const allChars = uppercase + lowercase + numbers + symbols
  
  // Generate random bytes
  const randomBytesBuffer = randomBytes(length)
  
  // Convert random bytes to password characters
  let password = ''
  
  // Ensure at least one character from each set
  password += uppercase[randomBytesBuffer[0] % uppercase.length]
  password += lowercase[randomBytesBuffer[1] % lowercase.length]
  password += numbers[randomBytesBuffer[2] % numbers.length]
  password += symbols[randomBytesBuffer[3] % symbols.length]
  
  // Fill the rest with random characters
  for (let i = 4; i < length; i++) {
    password += allChars[randomBytesBuffer[i] % allChars.length]
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => randomBytes(1)[0] % 3 - 1).join('')
}

/**
 * Hash a password
 * @param password - The plain text password
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Verify a password against a hash
 * @param password - The plain text password
 * @param hash - The hashed password
 * @returns True if the password matches the hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}