interface RateLimitAttempt {
  count: number
  firstAttempt: number
  lastAttempt: number
}

const attempts = new Map<string, RateLimitAttempt>()
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_ATTEMPTS = 5

export function checkRateLimit(ip: string, email: string): { 
  allowed: boolean
  remainingAttempts: number
  resetTime?: Date
} {
  const key = `${ip}:${email.toLowerCase()}`
  const now = Date.now()
  const attempt = attempts.get(key)

  // Clean up old attempts
  if (attempt && now - attempt.firstAttempt > WINDOW_MS) {
    attempts.delete(key)
  }

  const current = attempts.get(key)
  
  if (!current) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  if (current.count >= MAX_ATTEMPTS) {
    const resetTime = new Date(current.firstAttempt + WINDOW_MS)
    return { 
      allowed: false, 
      remainingAttempts: 0,
      resetTime
    }
  }

  return { 
    allowed: true, 
    remainingAttempts: MAX_ATTEMPTS - current.count 
  }
}

export function recordAttempt(ip: string, email: string): void {
  const key = `${ip}:${email.toLowerCase()}`
  const now = Date.now()
  const attempt = attempts.get(key)

  if (!attempt || now - attempt.firstAttempt > WINDOW_MS) {
    attempts.set(key, {
      count: 1,
      firstAttempt: now,
      lastAttempt: now
    })
  } else {
    attempt.count++
    attempt.lastAttempt = now
  }
}

export function resetAttempts(ip: string, email: string): void {
  const key = `${ip}:${email.toLowerCase()}`
  attempts.delete(key)
}

// Clean up old attempts periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, attempt] of attempts.entries()) {
    if (now - attempt.firstAttempt > WINDOW_MS) {
      attempts.delete(key)
    }
  }
}, 60 * 1000) // Clean up every minute