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
    
    // Check for key brand elements
    expect(screen.getByText('Ministry made')).toBeDefined()
    expect(screen.getByText(/Stop wrestling with spreadsheets and disconnected tools/)).toBeDefined()
    expect(screen.getAllByText('Sign In').length).toBeGreaterThanOrEqual(1)
  })
})