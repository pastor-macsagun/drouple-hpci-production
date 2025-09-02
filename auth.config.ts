import { NextAuthConfig } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { getNextAuthSecret } from "./lib/env-utils"
import { authLogger } from "./lib/logger"

// Edge-compatible auth configuration for middleware
// This excludes database operations and Node.js-specific modules
export default {
  secret: getNextAuthSecret(),
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      // Use a minimal authorize function for edge compatibility
      // The full authorization logic remains in lib/auth.ts
      async authorize() {
        // This will never actually be called in middleware context
        // The full auth logic is handled in lib/auth.ts
        return null
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    // Simple JWT callback for edge compatibility
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tenantId = user.tenantId
        token.primaryLocalChurchId = user.primaryLocalChurchId
        token.mustChangePassword = user.mustChangePassword
      }
      return token
    },
    // Simple session callback for edge compatibility
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as any
        session.user.tenantId = token.tenantId as string | null
        session.user.primaryLocalChurchId = token.primaryLocalChurchId as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
} satisfies NextAuthConfig