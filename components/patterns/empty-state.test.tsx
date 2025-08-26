import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState 
        title="No items found"
        description="Try adjusting your filters"
      />
    )
    
    expect(screen.getByText('No items found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    const TestIcon = () => <svg data-testid="test-icon" />
    
    render(
      <EmptyState 
        title="No items"
        icon={<TestIcon />}
      />
    )
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('renders action button with onClick handler', () => {
    const handleClick = vi.fn()
    
    render(
      <EmptyState 
        title="No items"
        action={{
          label: 'Create Item',
          onClick: handleClick
        }}
      />
    )
    
    const button = screen.getByRole('button', { name: 'Create Item' })
    expect(button).toBeInTheDocument()
    
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders action link with href', () => {
    render(
      <EmptyState 
        title="No items"
        action={{
          label: 'Create Item',
          href: '/create'
        }}
      />
    )
    
    const link = screen.getByRole('link', { name: 'Create Item' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/create')
  })

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState 
        title="No items"
        className="custom-class"
      />
    )
    
    const emptyState = container.querySelector('.empty-state')
    expect(emptyState).toHaveClass('custom-class')
  })

  it('renders without optional props', () => {
    render(<EmptyState title="No items" />)
    
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})