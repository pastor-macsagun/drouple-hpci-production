import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignInPage from './page'

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
  usePathname: vi.fn(() => '/auth/signin'),
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  getCsrfToken: vi.fn(() => Promise.resolve('test-token')),
}))

describe('SignInPage', () => {
  it('renders the sign in page', () => {
    const { container } = render(<SignInPage />)
    
    // Just check that it renders without errors
    expect(container).toBeDefined()
    expect(container.querySelector('.flex')).toBeDefined()
  })
})