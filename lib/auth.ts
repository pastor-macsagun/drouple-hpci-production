import NextAuth from "next-auth"
import { PrismaClient, UserRole } from "@prisma/client"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authLogger } from "./logger"
import { checkRateLimit, recordAttempt, resetAttempts } from "./auth-rate-limit"
import { logEnvironmentValidation } from "./env-validation"
import { getNextAuthSecret } from "./env-utils"

const prisma = new PrismaClient()

// Validate environment on module load
const envValidation = logEnvironmentValidation()
if (!envValidation.valid) {
  console.error('[AUTH] Critical environment issues detected - authentication may not work properly')
}

// Check for AUTH_SECRET with fallback to NEXTAUTH_SECRET
// Clean any trailing newlines that Vercel CLI might add
const AUTH_SECRET = getNextAuthSecret()
if (!AUTH_SECRET) {
  console.warn('[Auth] Missing AUTH_SECRET/NEXTAUTH_SECRET. JWT sessions will fail.')
} else {
  console.log('[Auth] Using AUTH_SECRET for JWT signing and verification')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: any = {
  // Remove adapter when using credentials provider with JWT strategy
  // adapter: PrismaAdapter(prisma),
  secret: AUTH_SECRET,
  trustHost: true, // Required for NextAuth v5 in production with custom domains
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async authorize(credentials: any, req: any) {
        const email = credentials?.email as string
        const password = credentials?.password as string
        
        if (!email || !password) {
          return null
        }

        // Get client IP for rate limiting
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ip = (req as any).headers?.["x-forwarded-for"] || 
                   // eslint-disable-next-line @typescript-eslint/no-explicit-any
                   (req as any).headers?.["x-real-ip"] || 
                   "unknown"
        const ipAddress = Array.isArray(ip) ? ip[0] : ip.split(",")[0].trim()

        // Check rate limit
        const { allowed, remainingAttempts, resetTime } = checkRateLimit(ipAddress, email)
        
        if (!allowed) {
          authLogger.warn("Login rate limit exceeded", { 
            email, 
            ip: ipAddress,
            resetTime 
          })
          throw new Error("Too many login attempts. Please try again later.")
        }

        // Record the attempt
        recordAttempt(ipAddress, email)

        try {
          // Find user by email (case-insensitive)
          const user = await prisma.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: "insensitive"
              }
            }
          })
          
          if (!user) {
            authLogger.warn("Login attempt for non-existent user", { 
              email,
              remainingAttempts: remainingAttempts - 1
            })
            return null
          }

          // Get memberships separately
          const memberships = await prisma.membership.findMany({
            where: { userId: user.id },
            include: { localChurch: true }
          })

          if (!user.passwordHash) {
            authLogger.warn("Login attempt for user without password", { 
              userId: user.id, 
              email: user.email 
            })
            return null
          }

          const isValid = await bcrypt.compare(password, user.passwordHash)
          
          if (!isValid) {
            authLogger.warn("Invalid password attempt", { 
              userId: user.id, 
              email: user.email,
              remainingAttempts: remainingAttempts - 1
            })
            return null
          }

          // Reset rate limit on successful login
          resetAttempts(ipAddress, email)

          // Get primary local church ID (first membership or most recent)
          const primaryMembership = memberships
            .filter((m) => !m.leftAt)
            .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())[0]

          authLogger.info("Successful login", { 
            userId: user.id, 
            email: user.email,
            role: user.role,
            primaryLocalChurchId: primaryMembership?.localChurchId
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: primaryMembership?.localChurchId || user.tenantId,
            primaryLocalChurchId: primaryMembership?.localChurchId,
            mustChangePassword: user.mustChangePassword
          }
        } catch (error) {
          authLogger.error("Login error", { 
            error: error instanceof Error ? { 
              message: error.message, 
              stack: error.stack,
              name: error.name 
            } : error, 
            email,
            timestamp: new Date().toISOString(),
            userAgent: req?.headers?.["user-agent"] || "unknown",
            ip: ipAddress
          })
          throw error
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: any) {
      try {
        if (user) {
          token.id = user.id
          token.role = user.role
          token.tenantId = user.tenantId
          token.primaryLocalChurchId = user.primaryLocalChurchId
          token.mustChangePassword = user.mustChangePassword
        }
        return token
      } catch (error) {
        authLogger.error("JWT callback error", { 
          error: error instanceof Error ? { 
            message: error.message, 
            stack: error.stack,
            name: error.name 
          } : error,
          userId: user?.id,
          timestamp: new Date().toISOString()
        })
        // Return a minimal token to prevent complete auth failure
        return token
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      try {
        if (token && session.user) {
          session.user.id = token.id
          session.user.role = token.role
          session.user.tenantId = token.tenantId
          session.user.primaryLocalChurchId = token.primaryLocalChurchId
          session.user.mustChangePassword = token.mustChangePassword
        }
        return session
      } catch (error) {
        authLogger.error("Session callback error", { 
          error: error instanceof Error ? { 
            message: error.message, 
            stack: error.stack,
            name: error.name 
          } : error,
          tokenId: token?.id,
          timestamp: new Date().toISOString()
        })
        // Return session without additional fields to prevent complete failure
        return session
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // If it's a relative URL that starts with our base URL, use it
      if (url.startsWith(baseUrl)) {
        return url
      }
      
      // If it's a relative path (starts with /), append to base URL  
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }
      
      // For external URLs, redirect to home
      return baseUrl
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days (consistent with original requirement)
  },
  // Remove useSecureCookies - Auth.js v5 handles this automatically
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days (consistent with session)
    // Add error handling for JWT issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    encode: async (params: any) => {
      try {
        const { encode } = await import('next-auth/jwt')
        return await encode(params)
      } catch (error) {
        authLogger.error('JWT encode error', { 
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
        throw error
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    decode: async (params: any) => {
      try {
        const { decode } = await import('next-auth/jwt')
        return await decode(params)
      } catch (error) {
        authLogger.warn('JWT decode error - clearing invalid token', { 
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
        // Return null for decode errors to trigger re-authentication
        return null
      }
    }
  },
  events: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signIn(message: any) {
      authLogger.info("User signed in successfully", {
        userId: message.user?.id,
        email: message.user?.email,
        timestamp: new Date().toISOString()
      })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async signOut(message: any) {
      authLogger.info("User signed out", {
        userId: message.token?.id,
        email: message.token?.email,
        timestamp: new Date().toISOString()
      })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session(message: any) {
      // Only log session events in development to avoid spam
      if (process.env.NODE_ENV === 'development') {
        authLogger.debug("Session accessed", {
          userId: message.session?.user?.id,
          timestamp: new Date().toISOString()
        })
      }
    }
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth(authOptions)
export const getServerSession = auth

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      role: UserRole
      tenantId: string | null
      primaryLocalChurchId?: string
      mustChangePassword?: boolean
    }
  }
  
  interface User {
    role: UserRole
    tenantId: string | null
    primaryLocalChurchId?: string
    mustChangePassword?: boolean
  }
}