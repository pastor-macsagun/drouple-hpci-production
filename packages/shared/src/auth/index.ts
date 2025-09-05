// Export auth utilities
export * from './rbac';

// JWT token utilities
export function decodeJwt(token: string): any {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

export function getTokenTimeLeft(token: string): number {
  const decoded = decodeJwt(token);
  if (!decoded || !decoded.exp) return 0;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
}

// Token refresh threshold (refresh when 5 minutes left)
export const TOKEN_REFRESH_THRESHOLD = 300; // 5 minutes in seconds

export function shouldRefreshToken(token: string): boolean {
  const timeLeft = getTokenTimeLeft(token);
  return timeLeft > 0 && timeLeft <= TOKEN_REFRESH_THRESHOLD;
}