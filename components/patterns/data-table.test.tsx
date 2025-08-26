import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataTable } from './data-table'

interface TestItem {
  id: number
  name: string
  email: string
  role: string
}

describe('DataTable', () => {
  const testData: TestItem[] = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User' },
  ]

  const columns = [
    { key: 'name', header: 'Name', cell: (item: TestItem) => item.name },
    { key: 'email', header: 'Email', cell: (item: TestItem) => item.email },
    { key: 'role', header: 'Role', cell: (item: TestItem) => item.role },
  ]

  it('renders table headers', () => {
    render(<DataTable data={testData} columns={columns} />)
    
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
  })

  it('renders table data', () => {
    render(<DataTable data={testData} columns={columns} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('renders empty state when no data and emptyState provided', () => {
    const emptyState = <div>No data available</div>
    
    render(
      <DataTable 
        data={[]} 
        columns={columns} 
        emptyState={emptyState}
      />
    )
    
    expect(screen.getByText('No data available')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('renders empty table when no data and no emptyState', () => {
    render(<DataTable data={[]} columns={columns} />)
    
    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
    
    // Headers should still be rendered
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    
    // But no data rows
    const tbody = table.querySelector('tbody')
    expect(tbody?.children.length).toBe(0)
  })

  it('applies custom className to container', () => {
    const { container } = render(
      <DataTable 
        data={testData} 
        columns={columns} 
        className="custom-table"
      />
    )
    
    const tableContainer = container.querySelector('.table-container')
    expect(tableContainer).toHaveClass('custom-table')
  })

  it('applies column className', () => {
    const columnsWithClass = [
      { 
        key: 'name', 
        header: 'Name', 
        cell: (item: TestItem) => item.name,
        className: 'font-bold'
      },
    ]
    
    render(<DataTable data={testData} columns={columnsWithClass} />)
    
    const nameCells = screen.getAllByText(/John Doe|Jane Smith/)
    nameCells.forEach(cell => {
      expect(cell.closest('td')).toHaveClass('font-bold')
    })
  })

  it('handles items without id by using index', () => {
    const dataWithoutId = [
      { name: 'Item 1', value: 'Value 1' },
      { name: 'Item 2', value: 'Value 2' },
    ]
    
    const simpleColumns = [
      { key: 'name', header: 'Name', cell: (item: any) => item.name },
      { key: 'value', header: 'Value', cell: (item: any) => item.value },
    ]
    
    render(<DataTable data={dataWithoutId as any} columns={simpleColumns as any} />)
    
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('renders custom cell content with ReactNode', () => {
    const columnsWithCustomCell = [
      { 
        key: 'name', 
        header: 'Name', 
        cell: (item: TestItem) => (
          <span data-testid={`name-${item.id}`}>
            <strong>{item.name}</strong>
          </span>
        )
      },
    ]
    
    render(<DataTable data={testData} columns={columnsWithCustomCell} />)
    
    expect(screen.getByTestId('name-1')).toBeInTheDocument()
    expect(screen.getByTestId('name-2')).toBeInTheDocument()
  })
})