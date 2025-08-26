import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the getCurrentUser function
vi.mock('@/lib/rbac', () => ({
  getCurrentUser: vi.fn().mockResolvedValue(null)
}))

// Mock the redirect function
vi.mock('next/navigation', () => ({
  redirect: vi.fn()
}))

// Import HomePage after mocks are set up
import HomePage from './page'

describe('HomePage', () => {
  it('renders the home page for unauthenticated users', async () => {
    // Need to handle async component rendering
    const Component = await HomePage()
    render(Component)
    
    expect(screen.getByText('HPCI ChMS')).toBeDefined()
    expect(screen.getByText('Church Management System')).toBeDefined()
    expect(screen.getByText('Sign In')).toBeDefined()
    expect(screen.getByText('Dashboard')).toBeDefined()
  })
})