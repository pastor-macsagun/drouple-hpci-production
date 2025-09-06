import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock IntersectionObserver
beforeAll(() => {
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  }))
})

// Mock the getCurrentUser function
vi.mock('@/lib/rbac', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null)
}))

// Mock next/navigation completely for this test
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
  redirect: vi.fn(),
}))

// Import HomePage after mocks are set up
import HomePage from './page'

describe('HomePage', () => {
  it('renders the home page for unauthenticated users', async () => {
    // Need to handle async component rendering
    const Component = await HomePage()
    render(Component)
    
    // Check for key brand elements 
    expect(screen.getByText('Ministry made simple.')).toBeDefined()
    expect(screen.getAllByText('Drouple').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sign In').length).toBeGreaterThanOrEqual(1)
  })
})