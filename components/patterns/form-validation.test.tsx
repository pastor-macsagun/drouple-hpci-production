import React from 'react'
import { render, screen } from '@testing-library/react'
import { expect, test, describe } from 'vitest'
import { 
  ValidationMessage, 
  FieldValidation, 
  FormField, 
  FormSection, 
  FormSubmitButton 
} from './form-validation'
import { Input } from '@/components/ui/input'

describe('ValidationMessage', () => {
  test('renders error message with icon', () => {
    render(<ValidationMessage message="This field is required" type="error" />)
    
    expect(screen.getByText('This field is required')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  test('renders success message with correct styling', () => {
    render(<ValidationMessage message="Field is valid" type="success" />)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('text-success')
    expect(screen.getByText('Field is valid')).toBeInTheDocument()
  })

  test('does not render when no message provided', () => {
    const { container } = render(<ValidationMessage />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('FieldValidation', () => {
  test('prioritizes error over other message types', () => {
    render(
      <FieldValidation 
        error="Error message"
        success="Success message"
        warning="Warning message"
        info="Info message"
      />
    )
    
    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    expect(screen.queryByText('Warning message')).not.toBeInTheDocument()
    expect(screen.queryByText('Info message')).not.toBeInTheDocument()
  })

  test('shows warning when no error present', () => {
    render(
      <FieldValidation 
        warning="Warning message"
        success="Success message"
        info="Info message"
      />
    )
    
    expect(screen.getByText('Warning message')).toBeInTheDocument()
    expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    expect(screen.queryByText('Info message')).not.toBeInTheDocument()
  })
})

describe('FormField', () => {
  test('renders label and input with required indicator', () => {
    render(
      <FormField label="Email Address" required>
        <Input type="email" />
      </FormField>
    )
    
    const label = screen.getByText('Email Address')
    
    expect(label).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument() // Required indicator
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // Input exists
  })

  test('shows validation error message', () => {
    render(
      <FormField label="Email" error="Please enter a valid email">
        <Input type="email" />
      </FormField>
    )
    
    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  test('includes hint text', () => {
    render(
      <FormField label="Password" hint="Must be at least 8 characters">
        <Input type="password" />
      </FormField>
    )
    
    const hint = screen.getByText('Must be at least 8 characters')
    
    expect(hint).toBeInTheDocument()
  })
})

describe('FormSection', () => {
  test('renders section with title and description', () => {
    render(
      <FormSection title="Account Information" description="Update your account details">
        <div>Form content</div>
      </FormSection>
    )
    
    expect(screen.getByText('Account Information')).toBeInTheDocument()
    expect(screen.getByText('Update your account details')).toBeInTheDocument()
    expect(screen.getByText('Form content')).toBeInTheDocument()
  })

  test('renders without title or description', () => {
    render(
      <FormSection>
        <div>Form content only</div>
      </FormSection>
    )
    
    expect(screen.getByText('Form content only')).toBeInTheDocument()
  })
})

describe('FormSubmitButton', () => {
  test('shows loading state with spinner', () => {
    render(
      <FormSubmitButton loading loadingText="Saving...">
        Save Changes
      </FormSubmitButton>
    )
    
    expect(screen.getByText('Saving...')).toBeInTheDocument()
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument()
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  test('renders normal state', () => {
    render(
      <FormSubmitButton>Save Changes</FormSubmitButton>
    )
    
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
    
    const button = screen.getByRole('button')
    expect(button).not.toBeDisabled()
    expect(button).toHaveAttribute('type', 'submit')
  })
})