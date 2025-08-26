import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './header'

describe('Header', () => {
  it('renders the logo', () => {
    render(<Header />)
    expect(screen.getByText('HPCI ChMS')).toBeInTheDocument()
  })

  it('does not render navigation links', () => {
    render(<Header />)
    // Navigation links should not be in header anymore (moved to sidebar)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText('Events')).not.toBeInTheDocument()
    expect(screen.queryByText('LifeGroups')).not.toBeInTheDocument()
    expect(screen.queryByText('Pathways')).not.toBeInTheDocument()
  })

  it('displays user information when provided', () => {
    const user = {
      email: 'test@example.com',
      name: 'Test User',
      role: 'MEMBER' as const,
    }
    
    render(<Header user={user} />)
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('MEMBER')).toBeInTheDocument()
  })

  it('shows email when name is not provided', () => {
    const user = {
      email: 'test@example.com',
      role: 'MEMBER' as const,
    }
    
    render(<Header user={user} />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('does not have a mobile navigation menu', () => {
    render(<Header />)
    
    // There should be no mobile menu with navigation links
    const navElement = screen.queryByRole('navigation')
    expect(navElement).not.toBeInTheDocument()
  })

  it('calls onMenuClick when sidebar menu button is clicked', () => {
    const onMenuClick = vi.fn()
    render(<Header showMenuButton={true} onMenuClick={onMenuClick} />)
    
    const sidebarButton = screen.getByRole('button', { name: /toggle sidebar/i })
    fireEvent.click(sidebarButton)
    
    expect(onMenuClick).toHaveBeenCalledTimes(1)
  })

  it('only shows sidebar toggle button when showMenuButton is true', () => {
    const { rerender } = render(<Header showMenuButton={false} />)
    expect(screen.queryByRole('button', { name: /toggle sidebar/i })).not.toBeInTheDocument()
    
    rerender(<Header showMenuButton={true} />)
    expect(screen.getByRole('button', { name: /toggle sidebar/i })).toBeInTheDocument()
  })
})