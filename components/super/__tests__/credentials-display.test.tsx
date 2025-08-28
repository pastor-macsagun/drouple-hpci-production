import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CredentialsDisplay } from '../credentials-display'

// Mock useToast
const mockToast = vi.fn()
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}))

// Mock clipboard API
const mockWriteText = vi.fn()
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
})

const defaultProps = {
  credentials: {
    email: 'test@example.com',
    password: 'TestPass123',
  },
  open: true,
  onOpenChange: vi.fn(),
}

describe('CredentialsDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockWriteText.mockResolvedValue(undefined)
  })

  it('should render with credentials', () => {
    render(<CredentialsDisplay {...defaultProps} />)
    
    expect(screen.getByText('Admin Account Created Successfully')).toBeInTheDocument()
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('TestPass123')).toBeInTheDocument()
  })

  it('should show password as hidden by default', () => {
    render(<CredentialsDisplay {...defaultProps} />)
    
    const passwordInput = screen.getByDisplayValue('TestPass123')
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should toggle password visibility', () => {
    render(<CredentialsDisplay {...defaultProps} />)
    
    const passwordInput = screen.getByDisplayValue('TestPass123')
    const toggleButton = screen.getByRole('button', { name: 'Show password' })
    
    // Initially hidden
    expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click to show
    fireEvent.click(toggleButton)
    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument()
    
    // Click to hide again
    const hideButton = screen.getByRole('button', { name: 'Hide password' })
    fireEvent.click(hideButton)
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('should copy individual credentials to clipboard', async () => {
    render(<CredentialsDisplay {...defaultProps} />)
    
    const emailCopyButton = screen.getByRole('button', { name: 'Copy email' })
    const passwordCopyButton = screen.getByRole('button', { name: 'Copy password' })
    
    // Copy email
    fireEvent.click(emailCopyButton)
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('test@example.com')
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Copied to clipboard',
        description: 'Email copied successfully',
      })
    })
    
    vi.clearAllMocks()
    
    // Copy password
    fireEvent.click(passwordCopyButton)
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('TestPass123')
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Copied to clipboard',
        description: 'Password copied successfully',
      })
    })
  })

  it('should copy both credentials', async () => {
    render(<CredentialsDisplay {...defaultProps} />)
    
    const copyBothButton = screen.getByRole('button', { name: /copy both/i })
    fireEvent.click(copyBothButton)
    
    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('test@example.com')
      )
      expect(mockWriteText).toHaveBeenCalledWith(
        expect.stringContaining('TestPass123')
      )
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Copied to clipboard',
        description: 'Credentials copied successfully',
      })
    })
  })

  it('should handle copy failures gracefully', async () => {
    mockWriteText.mockRejectedValue(new Error('Copy failed'))
    
    render(<CredentialsDisplay {...defaultProps} />)
    
    const emailCopyButton = screen.getByRole('button', { name: 'Copy email' })
    fireEvent.click(emailCopyButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard. Please copy manually.',
        variant: 'destructive',
      })
    })
  })

  it('should call onOpenChange when Done button is clicked', () => {
    const mockOnOpenChange = vi.fn()
    render(<CredentialsDisplay {...defaultProps} onOpenChange={mockOnOpenChange} />)
    
    const doneButton = screen.getByRole('button', { name: /done/i })
    fireEvent.click(doneButton)
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should display security warning', () => {
    render(<CredentialsDisplay {...defaultProps} />)
    
    expect(screen.getByText(/save these credentials securely/i)).toBeInTheDocument()
    expect(screen.getByText(/the user must change their password/i)).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<CredentialsDisplay {...defaultProps} />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'credentials-description')
  })
})