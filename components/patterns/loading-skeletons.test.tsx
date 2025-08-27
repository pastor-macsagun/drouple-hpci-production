import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { 
  StatCardSkeleton,
  TableSkeleton,
  MobileTableSkeleton,
  ListSkeleton,
  FormSkeleton,
  PageHeaderSkeleton,
  DashboardSkeleton
} from './loading-skeletons'

describe('Loading Skeletons', () => {
  it('renders StatCardSkeleton', () => {
    render(<StatCardSkeleton />)
    expect(document.querySelector('.shadow-md')).toBeInTheDocument()
  })

  it('renders TableSkeleton with default columns and rows', () => {
    render(<TableSkeleton />)
    expect(document.querySelector('.table-container')).toBeInTheDocument()
  })

  it('renders TableSkeleton with custom columns and rows', () => {
    render(<TableSkeleton columns={3} rows={2} />)
    const rows = document.querySelectorAll('.border-b')
    expect(rows.length).toBe(3) // Header + 2 data rows
  })

  it('renders MobileTableSkeleton with default items', () => {
    render(<MobileTableSkeleton />)
    const cards = document.querySelectorAll('.rounded-xl')
    expect(cards.length).toBe(3) // Default 3 items
  })

  it('renders MobileTableSkeleton with custom items', () => {
    render(<MobileTableSkeleton items={2} />)
    const cards = document.querySelectorAll('.rounded-xl')
    expect(cards.length).toBe(2)
  })

  it('renders ListSkeleton with default items', () => {
    render(<ListSkeleton />)
    const items = document.querySelectorAll('.space-y-3 > *')
    expect(items.length).toBe(5) // Default 5 items
  })

  it('renders FormSkeleton', () => {
    render(<FormSkeleton />)
    expect(document.querySelector('.space-y-6')).toBeInTheDocument()
  })

  it('renders PageHeaderSkeleton', () => {
    render(<PageHeaderSkeleton />)
    expect(document.querySelector('.mb-6')).toBeInTheDocument()
  })

  it('renders DashboardSkeleton with all components', () => {
    render(<DashboardSkeleton />)
    
    // Should have page header skeleton
    expect(document.querySelector('.mb-6')).toBeInTheDocument()
    
    // Should have stat cards grid
    const statCards = document.querySelectorAll('.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4 .shadow-md')
    expect(statCards.length).toBe(4)
    
    // Should have quick actions and activity sections
    expect(document.querySelector('.lg\\:col-span-2')).toBeInTheDocument()
  })

  it('applies custom className to StatCardSkeleton', () => {
    render(<StatCardSkeleton className="custom-class" />)
    expect(document.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('applies custom className to TableSkeleton', () => {
    render(<TableSkeleton className="custom-table" />)
    expect(document.querySelector('.custom-table')).toBeInTheDocument()
  })
})