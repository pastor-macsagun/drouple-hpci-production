'use client'

/**
 * Global Error Handler for HPCI-ChMS
 * 
 * This component catches React rendering errors that occur anywhere in the application
 * and reports them to Sentry. It provides a user-friendly error fallback UI.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#react-render-errors-in-app-router
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error
 */

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Report the error to Sentry with HPCI-ChMS context
    Sentry.withScope((scope) => {
      // Add application context
      scope.setTag('error_boundary', 'global')
      scope.setTag('application', 'hpci-chms')
      scope.setTag('error_type', 'react_render_error')
      
      // Add error digest if available (Next.js specific)
      if (error.digest) {
        scope.setTag('error_digest', error.digest)
      }
      
      // Set error level
      scope.setLevel('error')
      
      // Add extra context about the error
      scope.setExtra('error_name', error.name)
      scope.setExtra('error_stack', error.stack)
      scope.setExtra('error_message', error.message)
      
      // Add user agent for debugging
      if (typeof window !== 'undefined') {
        scope.setExtra('user_agent', window.navigator.userAgent)
        scope.setExtra('url', window.location.href)
      }
      
      // Capture the exception
      Sentry.captureException(error)
    })
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full px-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 mb-6 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-red-600 dark:text-red-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>

              {/* Error Message */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We&apos;re sorry, but something unexpected happened. Our team has been notified and is working to fix the issue.
              </p>

              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">
                    Development Error Details:
                  </h3>
                  <p className="text-xs text-red-700 dark:text-red-400 font-mono break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => reset()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                >
                  Go to Homepage
                </Button>
              </div>

              {/* Support Information */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  If this issue persists, please contact support with error ID: {error.digest || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}