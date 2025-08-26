import { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function getSession(req: NextRequest) {
  try {
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    })
    return token
  } catch {
    return null
  }
}