'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{
    error?: Error
    resetError: () => void
  }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Call optional error reporting callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error)
      console.error('Error info:', errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ 
  error, 
  resetError 
}: { 
  error?: Error
  resetError: () => void 
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/10 dark:border-destructive/40 dark:bg-destructive/15">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive dark:text-destructive">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          Something went wrong
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-foreground dark:text-foreground">
          An unexpected error occurred while loading this section. Please try again or contact support if the problem persists.
        </p>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-xs bg-muted/50 p-3 rounded border">
            <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground">
              Error details (development mode)
            </summary>
            <pre className="mt-2 whitespace-pre-wrap text-destructive">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}
        
        <div className="flex gap-2">
          <Button 
            onClick={resetError}
            variant="outline" 
            size="sm"
            className="h-9 mobile-btn"
            aria-label="Try to reload the failed component"
          >
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm"
            className="h-9 mobile-btn"
            aria-label="Refresh the entire page"
          >
            Refresh Page
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Specialized error boundaries for common scenarios
export function DataFetchErrorBoundary({ 
  children,
  onError
}: {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-destructive">Failed to load data</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Unable to fetch the requested information. Please check your connection and try again.
                </p>
              </div>
              <Button onClick={resetError} variant="outline" size="sm" className="h-9">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

export function FormErrorBoundary({ 
  children,
  onError
}: {
  children: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-destructive/10 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-destructive">Form Error</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  There was a problem with the form. Please refresh the page and try again.
                </p>
              </div>
              <div className="flex justify-center gap-2">
                <Button onClick={resetError} variant="outline" size="sm" className="h-9">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset Form
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="default" 
                  size="sm"
                  className="h-9"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook for error reporting
export function useErrorHandler() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error in ${context || 'component'}:`, error)
    }
    
    // Here you could integrate with error reporting service like Sentry
    // reportToSentry(error, { context })
  }, [])

  return { reportError }
}