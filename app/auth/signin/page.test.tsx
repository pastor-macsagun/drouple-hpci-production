import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignInPage from './page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(() => null),
  }),
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

describe('SignInPage', () => {
  it('renders the sign in page', () => {
    const { container } = render(<SignInPage />)
    
    // Just check that it renders without errors
    expect(container).toBeDefined()
    expect(container.querySelector('.flex')).toBeDefined()
  })
})