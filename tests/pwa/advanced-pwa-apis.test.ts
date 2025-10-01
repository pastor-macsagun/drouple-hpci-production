import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNativeFileSystem } from '@/hooks/use-native-file-system'
import { usePaymentRequest } from '@/hooks/use-payment-request'
import { useAdvancedPWA } from '@/hooks/use-advanced-pwa'

// Mock DOM APIs
const mockShowSaveFilePicker = vi.fn()
const mockShowOpenFilePicker = vi.fn()
const mockPaymentRequest = vi.fn()
const mockContacts = {
  select: vi.fn(),
  getProperties: vi.fn()
}
const mockSetAppBadge = vi.fn()
const mockClearAppBadge = vi.fn()
const mockWakeLock = {
  request: vi.fn()
}

// Mock global objects
Object.defineProperty(window, 'showSaveFilePicker', {
  value: mockShowSaveFilePicker,
  writable: true
})

Object.defineProperty(window, 'showOpenFilePicker', {
  value: mockShowOpenFilePicker,
  writable: true
})

Object.defineProperty(window, 'PaymentRequest', {
  value: mockPaymentRequest,
  writable: true
})

Object.defineProperty(navigator, 'contacts', {
  value: mockContacts,
  writable: true
})

Object.defineProperty(navigator, 'setAppBadge', {
  value: mockSetAppBadge,
  writable: true
})

Object.defineProperty(navigator, 'clearAppBadge', {
  value: mockClearAppBadge,
  writable: true
})

Object.defineProperty(navigator, 'wakeLock', {
  value: mockWakeLock,
  writable: true
})

// Mock haptic hook
vi.mock('@/hooks/use-haptic', () => ({
  useHaptic: () => ({
    triggerHaptic: vi.fn()
  })
}))

describe('Advanced PWA APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('useNativeFileSystem', () => {
    it('detects API support correctly', () => {
      const { result } = renderHook(() => useNativeFileSystem())
      
      expect(result.current.isSupported).toBe(true)
    })

    it('saves files using native API', async () => {
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn()
      }
      const mockFileHandle = {
        createWritable: vi.fn().mockResolvedValue(mockWritable)
      }
      
      mockShowSaveFilePicker.mockResolvedValue(mockFileHandle)
      
      const { result } = renderHook(() => useNativeFileSystem())
      
      await act(async () => {
        const success = await result.current.saveFile('test content', {
          fileName: 'test.txt',
          type: 'text/plain'
        })
        
        expect(success).toBe(true)
      })
      
      expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
        suggestedName: 'test.txt',
        types: [{
          description: 'File',
          accept: { 'text/plain': [] }
        }]
      })
      expect(mockWritable.write).toHaveBeenCalledWith('test content')
      expect(mockWritable.close).toHaveBeenCalled()
    })

    it('falls back to traditional download when API fails', async () => {
      mockShowSaveFilePicker.mockRejectedValue(new Error('API not available'))
      
      // Mock traditional download elements
      const mockLink = document.createElement('a')
      const clickSpy = vi.spyOn(mockLink, 'click').mockImplementation(() => undefined)
      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName.toLowerCase() === 'a') {
          return mockLink
        }
        return originalCreateElement(tagName)
      })
      const originalAppendChild = document.body.appendChild.bind(document.body)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((element: Node) => {
        return originalAppendChild(element)
      })
      const originalRemoveChild = document.body.removeChild.bind(document.body)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((element: Node) => {
        return originalRemoveChild(element)
      })
      
      // Mock URL methods
      Object.defineProperty(URL, 'createObjectURL', {
        value: vi.fn().mockReturnValue('blob:test'),
        writable: true
      })
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: vi.fn(),
        writable: true
      })
      
      const { result } = renderHook(() => useNativeFileSystem())
      
      await act(async () => {
        const success = await result.current.saveFile('test content', {
          fileName: 'test.txt'
        })
        
        expect(success).toBe(true)
      })
      
      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickSpy).toHaveBeenCalled()
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalled()

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })

    it('opens files using native API', async () => {
      const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' })
      const mockFileHandle = {
        getFile: vi.fn().mockResolvedValue(mockFile)
      }
      
      mockShowOpenFilePicker.mockResolvedValue([mockFileHandle])
      
      const { result } = renderHook(() => useNativeFileSystem())
      
      await act(async () => {
        const files = await result.current.openFile({
          accept: ['text/plain'],
          multiple: false
        })
        
        expect(files).toEqual([mockFile])
      })
      
      expect(mockShowOpenFilePicker).toHaveBeenCalledWith({
        types: [{
          description: 'Files',
          accept: { 'text/plain': [] }
        }],
        multiple: false
      })
    })

    it('saves CSV data correctly', async () => {
      const mockWritable = {
        write: vi.fn(),
        close: vi.fn()
      }
      const mockFileHandle = {
        createWritable: vi.fn().mockResolvedValue(mockWritable)
      }
      
      mockShowSaveFilePicker.mockResolvedValue(mockFileHandle)
      
      const { result } = renderHook(() => useNativeFileSystem())
      const testData = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ]
      
      await act(async () => {
        const success = await result.current.saveCSV(testData, 'users.csv')
        expect(success).toBe(true)
      })
      
      expect(mockWritable.write).toHaveBeenCalledWith(
        expect.stringContaining('"name","age"')
      )
      expect(mockWritable.write).toHaveBeenCalledWith(
        expect.stringContaining('"John","30"')
      )
    })
  })

  describe('usePaymentRequest', () => {
    it('detects API support correctly', () => {
      const { result } = renderHook(() => usePaymentRequest())
      
      expect(result.current.isSupported).toBe(true)
    })

    it('creates payment request with correct parameters', async () => {
      const mockCanMakePayment = vi.fn().mockResolvedValue(true)
      const mockShow = vi.fn().mockResolvedValue({
        methodName: 'basic-card',
        details: { cardNumber: '**** 1234' },
        payerName: 'John Doe',
        payerEmail: 'john@example.com',
        complete: vi.fn()
      })
      
      const mockPaymentRequestInstance = {
        canMakePayment: mockCanMakePayment,
        show: mockShow
      }
      
      mockPaymentRequest.mockImplementation(() => mockPaymentRequestInstance)
      
      const { result } = renderHook(() => usePaymentRequest())
      
      await act(async () => {
        const paymentResult = await result.current.requestPayment({
          total: { label: 'Test Payment', amount: 10.00 },
          requestPayerEmail: true,
          requestPayerName: true
        })
        
        expect(paymentResult.success).toBe(true)
        expect(paymentResult.payerInfo?.name).toBe('John Doe')
        expect(paymentResult.payerInfo?.email).toBe('john@example.com')
      })
      
      expect(mockPaymentRequest).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            supportedMethods: expect.stringMatching(/google\.com\/pay|apple\.com\/apple-pay|basic-card/)
          })
        ]),
        expect.objectContaining({
          total: {
            label: 'Test Payment',
            amount: {
              currency: 'USD',
              value: '10.00'
            }
          }
        }),
        expect.objectContaining({
          requestPayerName: true,
          requestPayerEmail: true
        })
      )
    })

    it('handles payment failure gracefully', async () => {
      const mockCanMakePayment = vi.fn().mockResolvedValue(true)
      const mockShow = vi.fn().mockRejectedValue(new Error('Payment failed'))
      
      const mockPaymentRequestInstance = {
        canMakePayment: mockCanMakePayment,
        show: mockShow
      }
      
      mockPaymentRequest.mockImplementation(() => mockPaymentRequestInstance)
      
      const { result } = renderHook(() => usePaymentRequest())
      
      await act(async () => {
        const paymentResult = await result.current.requestPayment({
          total: { label: 'Test Payment', amount: 10.00 }
        })
        
        expect(paymentResult.success).toBe(false)
        expect(paymentResult.error).toBe('Payment failed')
      })
    })

    it('handles donation requests', async () => {
      const mockCanMakePayment = vi.fn().mockResolvedValue(true)
      const mockShow = vi.fn().mockResolvedValue({
        methodName: 'basic-card',
        details: {},
        complete: vi.fn()
      })
      
      const mockPaymentRequestInstance = {
        canMakePayment: mockCanMakePayment,
        show: mockShow
      }
      
      mockPaymentRequest.mockImplementation(() => mockPaymentRequestInstance)
      
      const { result } = renderHook(() => usePaymentRequest())
      
      await act(async () => {
        const paymentResult = await result.current.requestDonation(25.00, 'Church Donation')
        
        expect(paymentResult.success).toBe(true)
      })
      
      expect(mockPaymentRequest).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          total: expect.objectContaining({
            label: 'Church Donation',
            amount: expect.objectContaining({
              value: '25.00'
            })
          })
        }),
        expect.objectContaining({
          requestPayerEmail: true,
          requestPayerName: true
        })
      )
    })
  })

  describe('useAdvancedPWA', () => {
    it('selects contacts when API is supported', async () => {
      const mockContacts = [
        { name: ['John Doe'], email: ['john@example.com'] }
      ]
      
      navigator.contacts!.select.mockResolvedValue(mockContacts)
      
      const { result } = renderHook(() => useAdvancedPWA())
      
      await act(async () => {
        const contacts = await result.current.selectContacts({
          multiple: false,
          properties: ['name', 'email']
        })
        
        expect(contacts).toEqual(mockContacts)
      })
      
      expect(navigator.contacts!.select).toHaveBeenCalledWith(
        ['name', 'email'],
        { multiple: false }
      )
    })

    it('sets and clears app badge', async () => {
      const { result } = renderHook(() => useAdvancedPWA())
      
      await act(async () => {
        await result.current.setBadge(5)
      })
      
      expect(mockSetAppBadge).toHaveBeenCalledWith(5)
      
      await act(async () => {
        await result.current.clearBadge()
      })
      
      expect(mockClearAppBadge).toHaveBeenCalled()
    })

    it('requests and releases wake lock', async () => {
      const mockSentinel = {
        released: false,
        release: vi.fn().mockResolvedValue(undefined),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      mockWakeLock.request.mockResolvedValue(mockSentinel)
      
      const { result } = renderHook(() => useAdvancedPWA())
      
      await act(async () => {
        const success = await result.current.requestWakeLock()
        expect(success).toBe(true)
      })
      
      expect(mockWakeLock.request).toHaveBeenCalledWith('screen')
      expect(result.current.wakeLock).toBeTruthy()
      
      await act(async () => {
        await result.current.releaseWakeLock()
      })
      
      expect(mockSentinel.release).toHaveBeenCalled()
    })

    it('handles notification with badge update', async () => {
      // Mock Notification API
      const mockNotification = vi.fn()
      Object.defineProperty(window, 'Notification', {
        value: mockNotification,
        writable: true
      })
      Object.defineProperty(Notification, 'permission', {
        value: 'granted',
        writable: true
      })
      
      const { result } = renderHook(() => useAdvancedPWA())
      
      await act(async () => {
        await result.current.notifyWithBadge(3, 'New Message', 'You have new messages')
      })
      
      expect(mockNotification).toHaveBeenCalledWith('New Message', {
        body: 'You have new messages'
      })
      expect(mockSetAppBadge).toHaveBeenCalledWith(3)
    })

    it('downloads with progress tracking', async () => {
      const mockResponse = {
        ok: true,
        headers: new Map([['content-length', '1000']]),
        body: {
          getReader: () => ({
            read: vi.fn()
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(500) })
              .mockResolvedValueOnce({ done: false, value: new Uint8Array(500) })
              .mockResolvedValueOnce({ done: true })
          })
        }
      }
      
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(mockResponse as any)
      
      // Mock URL and DOM methods
      Object.defineProperty(URL, 'createObjectURL', {
        value: vi.fn().mockReturnValue('blob:test'),
        writable: true
      })
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: vi.fn(),
        writable: true
      })
      const mockLink = document.createElement('a')
      const clickSpy = vi.spyOn(mockLink, 'click').mockImplementation(() => undefined)
      const originalCreateElement = document.createElement.bind(document)
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName.toLowerCase() === 'a') {
          return mockLink
        }
        return originalCreateElement(tagName)
      })
      const originalAppendChild = document.body.appendChild.bind(document.body)
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((element: Node) => {
        return originalAppendChild(element)
      })
      const originalRemoveChild = document.body.removeChild.bind(document.body)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((element: Node) => {
        return originalRemoveChild(element)
      })
      
      const { result } = renderHook(() => useAdvancedPWA())
      const onProgress = vi.fn()
      
      await act(async () => {
        const success = await result.current.downloadWithProgress(
          'https://example.com/file.zip',
          'file.zip',
          onProgress
        )
        
        expect(success).toBe(true)
      })
      
      expect(fetchSpy).toHaveBeenCalledWith('https://example.com/file.zip')
      expect(onProgress).toHaveBeenCalledWith(0.5) // First chunk
      expect(onProgress).toHaveBeenCalledWith(1.0)   // Complete
      expect(clickSpy).toHaveBeenCalled()

      // Cleanup
      fetchSpy.mockRestore()
      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
    })
  })
})
