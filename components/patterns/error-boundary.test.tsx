import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, describe, vi, beforeAll, afterAll } from 'vitest'
import { ErrorBoundary, DataFetchErrorBoundary, FormErrorBoundary } from './error-boundary'

// Component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  // Suppress console errors during tests
  const originalConsoleError = console.error
  beforeAll(() => {
    console.error = vi.fn()
  })

  afterAll(() => {
    console.error = originalConsoleError
  })

  test('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  test('renders error UI when there is an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  test('shows try again button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
    expect(screen.getByText('Refresh Page')).toBeInTheDocument()
  })

  test('calls onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    )
  })

  test('uses custom fallback component when provided', () => {
    const CustomFallback = ({ error, resetError }: { error?: Error, resetError: () => void }) => (
      <div>
        <p>Custom error: {error?.message}</p>
        <button onClick={resetError}>Custom Reset</button>
      </div>
    )

    render(
      <ErrorBoundary fallback={CustomFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByText('Custom error: Test error')).toBeInTheDocument()
    expect(screen.getByText('Custom Reset')).toBeInTheDocument()
  })
})

describe('DataFetchErrorBoundary', () => {
  beforeAll(() => {
    console.error = vi.fn()
  })

  afterAll(() => {
    console.error = console.error
  })

  test('renders data-specific error UI', () => {
    render(
      <DataFetchErrorBoundary>
        <ThrowError shouldThrow={true} />
      </DataFetchErrorBoundary>
    )

    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    expect(screen.getByText(/Unable to fetch the requested information/)).toBeInTheDocument()
    expect(screen.getByText('Retry')).toBeInTheDocument()
  })
})

describe('FormErrorBoundary', () => {
  beforeAll(() => {
    console.error = vi.fn()
  })

  afterAll(() => {
    console.error = console.error
  })

  test('renders form-specific error UI', () => {
    render(
      <FormErrorBoundary>
        <ThrowError shouldThrow={true} />
      </FormErrorBoundary>
    )

    expect(screen.getByText('Form Error')).toBeInTheDocument()
    expect(screen.getByText(/There was a problem with the form/)).toBeInTheDocument()
    expect(screen.getByText('Reset Form')).toBeInTheDocument()
    expect(screen.getByText('Refresh Page')).toBeInTheDocument()
  })
})