import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getApiVersion, responseTransformers, addDeprecationHeaders } from '@/lib/api-version'
import { ApplicationError, handleActionError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      throw new ApplicationError('UNAUTHORIZED', 'Authentication required')
    }

    // Get API version from URL
    const apiVersion = getApiVersion(request.nextUrl.pathname)
    if (!apiVersion) {
      return NextResponse.json(
        { error: 'Invalid API version' },
        { status: 400 }
      )
    }

    // Fetch user data with related information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        memberships: {
          include: {
            localChurch: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!user) {
      throw new ApplicationError('NOT_FOUND', 'User not found')
    }

    // Transform response based on API version
    const transformer = responseTransformers[apiVersion]
    const transformedUser = transformer.user({
      ...user,
      currentAttendees: 0 // placeholder for capacity calculation
    })

    // Create response with versioning headers
    const response = NextResponse.json({
      success: true,
      data: transformedUser,
      version: apiVersion
    })

    // Add deprecation headers if applicable
    addDeprecationHeaders(response.headers, apiVersion)

    return response
  } catch (error) {
    const appError = handleActionError(error)
    
    const statusCode = error instanceof ApplicationError ? error.code === 'UNAUTHORIZED' ? 401 : 
                      error.code === 'FORBIDDEN' ? 403 :
                      error.code === 'NOT_FOUND' ? 404 : 400 : 500

    return NextResponse.json(
      {
        success: false,
        error: appError.message,
        code: appError.code
      },
      { status: statusCode }
    )
  }
}