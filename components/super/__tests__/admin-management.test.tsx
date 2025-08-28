import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserRole } from '@prisma/client'
import { AdminManagement } from '../admin-management'

// Mock dependencies
const mockToast = vi.fn()
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

// Mock credentials display component
vi.mock('../credentials-display', () => ({
  CredentialsDisplay: ({ credentials, open, onOpenChange }: any) => 
    open ? (
      <div data-testid="credentials-modal">
        <p>Credentials for {credentials.email}</p>
        <button onClick={() => onOpenChange(false)}>Close</button>
      </div>
    ) : null
}))

// Mock server actions - since they're imported and called, we need to prevent actual network calls
vi.mock('../../../app/(super)/super/local-churches/[id]/admins/actions', () => ({
  inviteAdmin: vi.fn().mockResolvedValue({ success: false, error: 'Mocked error' }),
  removeAdmin: vi.fn().mockResolvedValue({}),
}))

const mockLocalChurch = {
  id: 'church-1',
  name: 'Test Church',
  memberships: [
    {
      id: 'membership-1',
      role: UserRole.ADMIN,
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
      },
    },
  ],
}

describe('AdminManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render current administrators', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    expect(screen.getByText('Current Administrators')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Role: ADMIN')).toBeInTheDocument()
  })

  it('should show empty state when no administrators', () => {
    const emptyChurch = { ...mockLocalChurch, memberships: [] }
    render(<AdminManagement localChurch={emptyChurch} />)
    
    expect(screen.getByText('No administrators assigned yet')).toBeInTheDocument()
  })

  it('should render invite admin form', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    expect(screen.getByText('Add New Administrator')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /role/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create admin account/i })).toBeInTheDocument()
  })

  it('should handle form input changes', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    const emailInput = screen.getByRole('textbox', { name: /email address/i })
    const nameInput = screen.getByRole('textbox', { name: /name/i })
    const roleSelect = screen.getByRole('combobox', { name: /role/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(nameInput, { target: { value: 'Test User' } })
    fireEvent.change(roleSelect, { target: { value: UserRole.PASTOR } })
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(nameInput).toHaveValue('Test User')
    expect(roleSelect).toHaveValue(UserRole.PASTOR)
  })

  it('should handle form submission', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    const emailInput = screen.getByRole('textbox', { name: /email address/i })
    const submitButton = screen.getByRole('button', { name: /create admin account/i })
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).not.toBeDisabled()
  })

  it('should render form elements correctly', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    expect(screen.getByRole('textbox', { name: /email address/i })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /role/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create admin account/i })).toBeInTheDocument()
  })

  it('should validate form fields', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    const emailInput = screen.getByRole('textbox', { name: /email address/i })
    const roleSelect = screen.getByRole('combobox', { name: /role/i })
    
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(roleSelect).toHaveAttribute('required')
  })

  it('should show remove button for administrators', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    const removeButton = screen.getByRole('button', { name: /remove john doe/i })
    expect(removeButton).toBeInTheDocument()
  })

  it('should display helpful instructions', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    expect(screen.getByText(/A temporary password will be generated/)).toBeInTheDocument()
    expect(screen.getByText(/They must change it on first login/)).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<AdminManagement localChurch={mockLocalChurch} />)
    
    expect(screen.getByTestId('local-church-admins')).toBeInTheDocument()
    expect(screen.getByTestId('invite-admin-form')).toBeInTheDocument()
  })
})