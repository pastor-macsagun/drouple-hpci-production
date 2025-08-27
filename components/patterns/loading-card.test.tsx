import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { 
  LoadingCard,
  MemberLoadingCard,
  ServiceLoadingCard,
  EventLoadingCard
} from './loading-card'

describe('Loading Cards', () => {
  it('renders LoadingCard with title and description', () => {
    render(
      <LoadingCard 
        title="Test Title" 
        description="Test description"
      />
    )
    
    // Check for role="status" element with aria-label
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Test Title')
    
    // Check for visible title text
    const titleElement = screen.getByRole('status').querySelector('.text-lg.font-semibold')
    expect(titleElement).toHaveTextContent('Test Title')
    
    // Check for description text
    const descElement = screen.getByRole('status').querySelector('.text-sm.text-center')
    expect(descElement).toHaveTextContent('Test description')
  })

  it('renders LoadingCard with custom children', () => {
    render(
      <LoadingCard title="Custom">
        <div data-testid="custom-content">Custom loading content</div>
      </LoadingCard>
    )
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Custom')
  })

  it('renders LoadingCard with default skeleton when no children', () => {
    render(<LoadingCard />)
    
    // Should have default skeleton content
    expect(document.querySelector('.space-y-4')).toBeInTheDocument()
    expect(document.querySelector('.rounded-full')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content')
  })

  it('renders MemberLoadingCard', () => {
    render(<MemberLoadingCard />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading Members...')
    
    // Check for visible title
    const titleElement = screen.getByRole('status').querySelector('.text-lg.font-semibold')
    expect(titleElement).toHaveTextContent('Loading Members...')
  })

  it('renders ServiceLoadingCard', () => {
    render(<ServiceLoadingCard />)
    
    expect(screen.getByRole('status')).toBeInTheDocument() 
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading Services...')
    
    // Check for visible title
    const titleElement = screen.getByRole('status').querySelector('.text-lg.font-semibold')
    expect(titleElement).toHaveTextContent('Loading Services...')
  })

  it('renders EventLoadingCard', () => {
    render(<EventLoadingCard />)
    
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading Events...')
    
    // Check for visible title
    const titleElement = screen.getByRole('status').querySelector('.text-lg.font-semibold')
    expect(titleElement).toHaveTextContent('Loading Events...')
  })

  it('applies custom className to LoadingCard', () => {
    render(<LoadingCard className="custom-loading" />)
    expect(document.querySelector('.custom-loading')).toBeInTheDocument()
  })
})
