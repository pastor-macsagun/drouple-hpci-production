import { NextResponse } from 'next/server'

const APP_VERSION = '2025.01.05'
const CACHE_VERSION = '3'

// Release notes for this version
const RELEASE_NOTES = [
  'Enhanced offline capabilities with better sync',
  'Improved caching strategies for faster loading', 
  'Better update management and notifications',
  'Enhanced security for offline data'
]

export async function GET() {
  try {
    return NextResponse.json({
      version: APP_VERSION,
      cacheVersion: CACHE_VERSION,
      releaseNotes: RELEASE_NOTES,
      timestamp: new Date().toISOString(),
      buildNumber: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
      environment: process.env.NODE_ENV
    })
  } catch (error) {
    console.error('Error getting version info:', error)
    return NextResponse.json(
      { error: 'Failed to get version info' },
      { status: 500 }
    )
  }
}

export async function HEAD() {
  // Support HEAD requests for quick version checks
  return new NextResponse(null, {
    status: 200,
    headers: {
      'X-App-Version': APP_VERSION,
      'X-Cache-Version': CACHE_VERSION,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}