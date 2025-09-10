'use client'

import { useCallback, useState, useEffect } from 'react'
import { useHaptic } from './use-haptic'

// Payment Request API types
interface PaymentMethodData {
  supportedMethods: string
  data?: any
}

interface PaymentDetailsInit {
  total: PaymentItem
  displayItems?: PaymentItem[]
  shippingOptions?: PaymentShippingOption[]
  modifiers?: PaymentDetailsModifier[]
}

interface PaymentItem {
  label: string
  amount: PaymentCurrencyAmount
  pending?: boolean
}

interface PaymentCurrencyAmount {
  currency: string
  value: string
}

interface PaymentShippingOption {
  id: string
  label: string
  amount: PaymentCurrencyAmount
  selected?: boolean
}

interface PaymentDetailsModifier {
  supportedMethods: string | string[]
  total?: PaymentItem
  additionalDisplayItems?: PaymentItem[]
  data?: any
}

interface PaymentOptions {
  requestPayerName?: boolean
  requestPayerEmail?: boolean
  requestPayerPhone?: boolean
  requestShipping?: boolean
  shippingType?: 'shipping' | 'delivery' | 'pickup'
}

interface PaymentResponse {
  requestId?: string
  methodName: string
  details: any
  payerName?: string
  payerEmail?: string
  payerPhone?: string
  shippingAddress?: PaymentAddress
  shippingOption?: string
  complete(result?: PaymentComplete): Promise<void>
  retry(errorFields: PaymentValidationErrors): Promise<void>
}

interface PaymentAddress {
  addressLine: string[]
  city: string
  country: string
  dependentLocality: string
  languageCode: string
  organization: string
  phone: string
  postalCode: string
  recipient: string
  region: string
  sortingCode: string
}

type PaymentComplete = 'fail' | 'success' | 'unknown'

interface PaymentValidationErrors {
  error?: string
  payer?: PayerErrors
  shippingAddress?: AddressErrors
}

interface PayerErrors {
  email?: string
  name?: string
  phone?: string
}

interface AddressErrors {
  addressLine?: string
  city?: string
  country?: string
  dependentLocality?: string
  languageCode?: string
  organization?: string
  phone?: string
  postalCode?: string
  recipient?: string
  region?: string
  sortingCode?: string
}

declare global {
  interface Window {
    PaymentRequest?: {
      new (
        methodData: PaymentMethodData[],
        details: PaymentDetailsInit,
        options?: PaymentOptions
      ): PaymentRequest
    }
  }
}

declare class PaymentRequest extends EventTarget {
  constructor(
    methodData: PaymentMethodData[],
    details: PaymentDetailsInit,
    options?: PaymentOptions
  )
  
  show(): Promise<PaymentResponse>
  abort(): Promise<void>
  canMakePayment(): Promise<boolean>
  
  readonly shippingAddress: PaymentAddress | null
  readonly shippingOption: string | null
  readonly shippingType: 'shipping' | 'delivery' | 'pickup' | null
  readonly id: string
  
  onshippingaddresschange: ((event: Event) => void) | null
  onshippingoptionchange: ((event: Event) => void) | null
  onpaymentmethodchange: ((event: Event) => void) | null
}

interface PaymentRequestItem {
  label: string
  amount: number
  currency?: string
  pending?: boolean
}

interface PaymentRequestOptions {
  total: PaymentRequestItem
  displayItems?: PaymentRequestItem[]
  requestPayerName?: boolean
  requestPayerEmail?: boolean
  requestPayerPhone?: boolean
  supportedMethods?: string[]
  merchantName?: string
}

interface PaymentResult {
  success: boolean
  response?: PaymentResponse
  error?: string
  payerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
}

export function usePaymentRequest() {
  const [isSupported, setIsSupported] = useState(() => {
    if (typeof window === 'undefined') return false
    return 'PaymentRequest' in window
  })
  const [isLoading, setIsLoading] = useState(false)
  const { triggerHaptic } = useHaptic()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('PaymentRequest' in window)
    }
  }, [])

  const requestPayment = useCallback(async (
    options: PaymentRequestOptions
  ): Promise<PaymentResult> => {
    if (!isSupported || !window.PaymentRequest) {
      return {
        success: false,
        error: 'Payment Request API is not supported'
      }
    }

    setIsLoading(true)
    triggerHaptic('light')

    try {
      // Default supported payment methods
      const supportedMethods = options.supportedMethods || [
        'https://google.com/pay',
        'https://apple.com/apple-pay',
        'basic-card'
      ]

      const methodData: PaymentMethodData[] = supportedMethods.map(method => ({
        supportedMethods: method,
        data: method === 'basic-card' ? {
          supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'],
          supportedTypes: ['debit', 'credit']
        } : undefined
      }))

      const details: PaymentDetailsInit = {
        total: {
          label: options.total.label,
          amount: {
            currency: options.total.currency || 'USD',
            value: options.total.amount.toFixed(2)
          },
          pending: options.total.pending
        },
        displayItems: options.displayItems?.map(item => ({
          label: item.label,
          amount: {
            currency: item.currency || 'USD',
            value: item.amount.toFixed(2)
          },
          pending: item.pending
        }))
      }

      const paymentOptions: PaymentOptions = {
        requestPayerName: options.requestPayerName || false,
        requestPayerEmail: options.requestPayerEmail || false,
        requestPayerPhone: options.requestPayerPhone || false
      }

      // Create payment request
      const request = new PaymentRequest(methodData, details, paymentOptions)

      // Check if payment can be made
      const canMakePayment = await request.canMakePayment()
      if (!canMakePayment) {
        return {
          success: false,
          error: 'No supported payment methods available'
        }
      }

      // Show payment sheet
      const response = await request.show()
      
      triggerHaptic('success')

      return {
        success: true,
        response,
        payerInfo: {
          name: response.payerName,
          email: response.payerEmail,
          phone: response.payerPhone
        }
      }

    } catch (error) {
      triggerHaptic('error')
      
      const errorMessage = error instanceof Error ? error.message : 'Payment failed'
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, triggerHaptic])

  const completePayment = useCallback(async (
    response: PaymentResponse,
    result: PaymentComplete = 'success'
  ): Promise<void> => {
    try {
      await response.complete(result)
      if (result === 'success') {
        triggerHaptic('success')
      } else {
        triggerHaptic('error')
      }
    } catch (error) {
      console.error('Failed to complete payment:', error)
      triggerHaptic('error')
    }
  }, [triggerHaptic])

  const retryPayment = useCallback(async (
    response: PaymentResponse,
    errors: PaymentValidationErrors
  ): Promise<void> => {
    try {
      await response.retry(errors)
      triggerHaptic('light')
    } catch (error) {
      console.error('Failed to retry payment:', error)
      triggerHaptic('error')
    }
  }, [triggerHaptic])

  // Helper for common donation payment
  const requestDonation = useCallback(async (
    amount: number,
    description: string = 'Donation'
  ): Promise<PaymentResult> => {
    return requestPayment({
      total: {
        label: description,
        amount
      },
      requestPayerEmail: true,
      requestPayerName: true
    })
  }, [requestPayment])

  // Helper for event fee payment
  const requestEventPayment = useCallback(async (
    eventName: string,
    amount: number,
    additionalFees?: Array<{ label: string; amount: number }>
  ): Promise<PaymentResult> => {
    const displayItems: PaymentRequestItem[] = [
      {
        label: `${eventName} Registration`,
        amount
      }
    ]

    if (additionalFees) {
      displayItems.push(...additionalFees)
    }

    const total = displayItems.reduce((sum, item) => sum + item.amount, 0)

    return requestPayment({
      total: {
        label: `${eventName} - Total`,
        amount: total
      },
      displayItems,
      requestPayerEmail: true,
      requestPayerName: true,
      requestPayerPhone: true
    })
  }, [requestPayment])

  return {
    isSupported,
    isLoading,
    requestPayment,
    completePayment,
    retryPayment,
    requestDonation,
    requestEventPayment
  }
}