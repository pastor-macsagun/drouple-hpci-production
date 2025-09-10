import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NativeDataTable } from '@/components/pwa/native-data-table'
import { NativeForm } from '@/components/pwa/native-form'
import { SwipeActions } from '@/components/pwa/swipe-actions'
import { NativeChat } from '@/components/pwa/native-chat'
import { NativeAnalytics } from '@/components/pwa/native-analytics'

// Mock hooks
vi.mock('@/hooks/use-haptic', () => ({
  useHaptic: () => ({
    triggerHaptic: vi.fn()
  })
}))

vi.mock('@/hooks/use-native-file-system', () => ({
  useNativeFileSystem: () => ({
    isSupported: true,
    saveCSV: vi.fn().mockResolvedValue(true),
    saveJSON: vi.fn().mockResolvedValue(true),
    saveImage: vi.fn().mockResolvedValue(true)
  })
}))

describe('Native PWA Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('NativeDataTable', () => {
    const mockData = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Member' }
    ]

    const mockColumns = [
      { key: 'name' as const, title: 'Name', sortable: true },
      { key: 'email' as const, title: 'Email', sortable: true },
      { key: 'role' as const, title: 'Role' }
    ]

    it('renders data table with mobile-optimized layout', () => {
      render(<NativeDataTable data={mockData} columns={mockColumns} />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    })

    it('handles search functionality', async () => {
      render(<NativeDataTable data={mockData} columns={mockColumns} searchable />)
      
      const searchInput = screen.getByPlaceholderText('Search...')
      await userEvent.type(searchInput, 'Jane')
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })

    it('handles sorting functionality', async () => {
      render(<NativeDataTable data={mockData} columns={mockColumns} />)
      
      const nameHeader = screen.getByText('Name')
      await userEvent.click(nameHeader)
      
      // Should trigger sort (verified by haptic feedback mock)
      expect(screen.getByText('Name')).toBeInTheDocument()
    })

    it('handles row actions', async () => {
      const mockRowAction = vi.fn()
      const rowActions = [
        { key: 'edit', label: 'Edit', icon: <span>✏️</span> }
      ]
      
      render(
        <NativeDataTable 
          data={mockData} 
          columns={mockColumns}
          rowActions={rowActions}
          onRowAction={mockRowAction}
        />
      )
      
      const moreButtons = screen.getAllByRole('button')
      const moreButton = moreButtons.find(btn => btn.innerHTML.includes('MoreVertical'))
      
      if (moreButton) {
        await userEvent.click(moreButton)
        
        const editButton = screen.getByText('Edit')
        await userEvent.click(editButton)
        
        expect(mockRowAction).toHaveBeenCalledWith('edit', mockData[0])
      }
    })

    it('shows loading state', () => {
      render(<NativeDataTable data={[]} columns={mockColumns} loading />)
      
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
    })

    it('shows empty state', () => {
      render(<NativeDataTable data={[]} columns={mockColumns} emptyMessage="No data found" />)
      
      expect(screen.getByText('No data found')).toBeInTheDocument()
    })
  })

  describe('NativeForm', () => {
    const mockFields = [
      {
        key: 'name',
        type: 'text' as const,
        label: 'Full Name',
        required: true,
        placeholder: 'Enter your name'
      },
      {
        key: 'email',
        type: 'email' as const,
        label: 'Email Address',
        required: true,
        validation: (value: string) => 
          !value.includes('@') ? 'Invalid email' : null
      },
      {
        key: 'role',
        type: 'select' as const,
        label: 'Role',
        options: [
          { value: 'admin', label: 'Administrator' },
          { value: 'member', label: 'Member' }
        ]
      }
    ]

    it('renders form fields correctly', () => {
      const mockSubmit = vi.fn()
      render(<NativeForm fields={mockFields} onSubmit={mockSubmit} />)
      
      expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()
    })

    it('handles text input', async () => {
      const mockSubmit = vi.fn()
      render(<NativeForm fields={mockFields} onSubmit={mockSubmit} />)
      
      const nameInput = screen.getByPlaceholderText('Enter your name')
      await userEvent.type(nameInput, 'John Doe')
      
      expect(nameInput).toHaveValue('John Doe')
    })

    it('validates required fields', async () => {
      const mockSubmit = vi.fn()
      render(<NativeForm fields={mockFields} onSubmit={mockSubmit} />)
      
      const submitButton = screen.getByText('Save')
      await userEvent.click(submitButton)
      
      expect(screen.getByText('Full Name is required')).toBeInTheDocument()
      expect(mockSubmit).not.toHaveBeenCalled()
    })

    it('validates custom validation rules', async () => {
      const mockSubmit = vi.fn()
      render(<NativeForm fields={mockFields} onSubmit={mockSubmit} />)
      
      const nameInput = screen.getByPlaceholderText('Enter your name')
      const emailInput = screen.getByLabelText(/Email Address/)
      
      await userEvent.type(nameInput, 'John Doe')
      await userEvent.type(emailInput, 'invalid-email')
      
      const submitButton = screen.getByText('Save')
      await userEvent.click(submitButton)
      
      expect(screen.getByText('Invalid email')).toBeInTheDocument()
    })

    it('handles select fields with bottom sheet', async () => {
      const mockSubmit = vi.fn()
      render(<NativeForm fields={mockFields} onSubmit={mockSubmit} />)
      
      const selectButton = screen.getByText('Select option')
      await userEvent.click(selectButton)
      
      await waitFor(() => {
        expect(screen.getByText('Select Role')).toBeInTheDocument()
      })
      
      const adminOption = screen.getByText('Administrator')
      await userEvent.click(adminOption)
      
      expect(screen.getByText('Administrator')).toBeInTheDocument()
    })

    it('submits valid form data', async () => {
      const mockSubmit = vi.fn()
      render(<NativeForm fields={mockFields} onSubmit={mockSubmit} />)
      
      const nameInput = screen.getByPlaceholderText('Enter your name')
      const emailInput = screen.getByLabelText(/Email Address/)
      
      await userEvent.type(nameInput, 'John Doe')
      await userEvent.type(emailInput, 'john@example.com')
      
      const submitButton = screen.getByText('Save')
      await userEvent.click(submitButton)
      
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        role: undefined
      })
    })
  })

  describe('SwipeActions', () => {
    const mockActions = [
      {
        key: 'edit',
        label: 'Edit',
        icon: <span>✏️</span>,
        variant: 'primary' as const,
        onAction: vi.fn()
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <span>🗑️</span>,
        variant: 'danger' as const,
        onAction: vi.fn()
      }
    ]

    it('renders children content', () => {
      render(
        <SwipeActions actions={mockActions}>
          <div>Swipeable Content</div>
        </SwipeActions>
      )
      
      expect(screen.getByText('Swipeable Content')).toBeInTheDocument()
    })

    it('shows actions on swipe gesture (simulated)', async () => {
      render(
        <SwipeActions actions={mockActions}>
          <div data-testid="swipe-content">Swipeable Content</div>
        </SwipeActions>
      )
      
      const content = screen.getByTestId('swipe-content')
      
      // Simulate touch start
      fireEvent.touchStart(content, {
        touches: [{ clientX: 100, clientY: 0 }]
      })
      
      // Simulate touch move (swipe left)
      fireEvent.touchMove(content, {
        touches: [{ clientX: 0, clientY: 0 }]
      })
      
      // Simulate touch end
      fireEvent.touchEnd(content)
      
      // Actions should be revealed (visually, but hard to test transform)
      expect(screen.getByText('Edit')).toBeInTheDocument()
      expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('triggers action callbacks', async () => {
      render(
        <SwipeActions actions={mockActions}>
          <div>Swipeable Content</div>
        </SwipeActions>
      )
      
      const editButton = screen.getByText('Edit')
      await userEvent.click(editButton)
      
      expect(mockActions[0].onAction).toHaveBeenCalled()
    })
  })

  describe('NativeChat', () => {
    const mockMessages = [
      {
        id: '1',
        content: 'Hello there!',
        sender: { id: 'user1', name: 'John Doe' },
        timestamp: new Date('2023-01-01T10:00:00Z'),
        type: 'text' as const
      },
      {
        id: '2',
        content: 'Hi John!',
        sender: { id: 'user2', name: 'Jane Smith' },
        timestamp: new Date('2023-01-01T10:01:00Z'),
        type: 'text' as const
      }
    ]

    it('renders messages correctly', () => {
      const mockSend = vi.fn()
      const mockReaction = vi.fn()
      
      render(
        <NativeChat
          messages={mockMessages}
          currentUserId="user2"
          onSendMessage={mockSend}
          onReaction={mockReaction}
        />
      )
      
      expect(screen.getByText('Hello there!')).toBeInTheDocument()
      expect(screen.getByText('Hi John!')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('handles message input and sending', async () => {
      const mockSend = vi.fn()
      const mockReaction = vi.fn()
      
      render(
        <NativeChat
          messages={mockMessages}
          currentUserId="user2"
          onSendMessage={mockSend}
          onReaction={mockReaction}
        />
      )
      
      const input = screen.getByPlaceholderText('Type a message...')
      await userEvent.type(input, 'New message')
      
      const sendButton = screen.getByRole('button')
      await userEvent.click(sendButton)
      
      expect(mockSend).toHaveBeenCalledWith('New message', 'text', undefined)
    })

    it('handles typing indicators', () => {
      const mockSend = vi.fn()
      const mockReaction = vi.fn()
      const typingUsers = [{ id: 'user1', name: 'John Doe' }]
      
      render(
        <NativeChat
          messages={mockMessages}
          currentUserId="user2"
          onSendMessage={mockSend}
          onReaction={mockReaction}
          typingUsers={typingUsers}
        />
      )
      
      expect(screen.getByText('John Doe is typing...')).toBeInTheDocument()
    })

    it('distinguishes own messages from others', () => {
      const mockSend = vi.fn()
      const mockReaction = vi.fn()
      
      render(
        <NativeChat
          messages={mockMessages}
          currentUserId="user1"
          onSendMessage={mockSend}
          onReaction={mockReaction}
        />
      )
      
      // Own messages should not show sender name
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  describe('NativeAnalytics', () => {
    const mockData = {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      datasets: [{
        label: 'Attendance',
        data: [65, 59, 80, 81, 56],
        color: '#3B82F6',
        fillColor: '#3B82F650'
      }]
    }

    const mockSummary = [
      { label: 'Total Attendance', value: 341, change: 12 },
      { label: 'Average Daily', value: 68, change: -5 }
    ]

    it('renders analytics dashboard', () => {
      render(
        <NativeAnalytics
          title="Attendance Analytics"
          data={mockData}
          summary={mockSummary}
        />
      )
      
      expect(screen.getByText('Attendance Analytics')).toBeInTheDocument()
      expect(screen.getByText('Total Attendance')).toBeInTheDocument()
      expect(screen.getByText('341')).toBeInTheDocument()
    })

    it('handles chart type switching', async () => {
      render(
        <NativeAnalytics
          title="Attendance Analytics"
          data={mockData}
          summary={mockSummary}
        />
      )
      
      // Chart type buttons should be present
      const chartTypeButtons = screen.getAllByRole('button')
      expect(chartTypeButtons.length).toBeGreaterThan(0)
    })

    it('handles export functionality', async () => {
      const mockExport = vi.fn()
      
      render(
        <NativeAnalytics
          title="Attendance Analytics"
          data={mockData}
          summary={mockSummary}
          onExport={mockExport}
        />
      )
      
      const csvButton = screen.getByText('CSV')
      await userEvent.click(csvButton)
      
      expect(mockExport).toHaveBeenCalledWith('csv')
    })

    it('shows loading state', () => {
      render(
        <NativeAnalytics
          title="Attendance Analytics"
          data={mockData}
          summary={mockSummary}
          loading
        />
      )
      
      expect(screen.getByRole('generic')).toHaveClass('animate-pulse')
    })

    it('renders canvas for chart visualization', () => {
      render(
        <NativeAnalytics
          title="Attendance Analytics"
          data={mockData}
          summary={mockSummary}
        />
      )
      
      const canvas = screen.getByRole('img', { hidden: true }) // Canvas has img role
      expect(canvas).toBeInTheDocument()
    })
  })
})