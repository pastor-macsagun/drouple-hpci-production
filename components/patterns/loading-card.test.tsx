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
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('renders LoadingCard with custom children', () => {
    render(
      <LoadingCard title="Custom">
        <div data-testid="custom-content">Custom loading content</div>
      </LoadingCard>
    )
    
    expect(screen.getByTestId('custom-content')).toBeInTheDocument()
  })

  it('renders LoadingCard with default skeleton when no children', () => {
    render(<LoadingCard />)
    
    // Should have default skeleton content
    expect(document.querySelector('.space-y-4')).toBeInTheDocument()
    expect(document.querySelector('.rounded-full')).toBeInTheDocument()
  })

  it('renders MemberLoadingCard', () => {
    render(<MemberLoadingCard />)
    
    expect(screen.getByText('Loading Members...')).toBeInTheDocument()
    expect(screen.getByText('Fetching member data')).toBeInTheDocument()
  })

  it('renders ServiceLoadingCard', () => {
    render(<ServiceLoadingCard />)
    
    expect(screen.getByText('Loading Services...')).toBeInTheDocument()
    expect(screen.getByText('Fetching service information')).toBeInTheDocument()
  })

  it('renders EventLoadingCard', () => {
    render(<EventLoadingCard />)
    
    expect(screen.getByText('Loading Events...')).toBeInTheDocument()
    expect(screen.getByText('Fetching upcoming events')).toBeInTheDocument()
  })

  it('applies custom className to LoadingCard', () => {
    render(<LoadingCard className="custom-loading" />)
    expect(document.querySelector('.custom-loading')).toBeInTheDocument()
  })
})