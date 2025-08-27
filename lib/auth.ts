import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient, UserRole } from "@prisma/client"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { authLogger } from "./logger"
import { checkRateLimit, recordAttempt, resetAttempts } from "./auth-rate-limit"

const prisma = new PrismaClient()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authOptions: any = {
  adapter: PrismaAdapter(prisma),
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
          authLogger.error("Login error", { error, email })
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
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.primaryLocalChurchId = user.primaryLocalChurchId
        token.mustChangePassword = user.mustChangePassword
      }
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: any) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.tenantId = token.tenantId
        session.user.primaryLocalChurchId = token.primaryLocalChurchId
        session.user.mustChangePassword = token.mustChangePassword
      }
      return session
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async redirect({ url, baseUrl }: any) {
      // Always redirect to root to let app/page.tsx handle role-based routing
      if (url.startsWith(baseUrl)) {
        return baseUrl
      }
      
      // Redirect external URLs to home
      return baseUrl
    }
  },
  session: {
    strategy: "jwt",
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
    }
  }
  
  interface User {
    role: UserRole
    tenantId: string | null
    primaryLocalChurchId?: string
  }
}