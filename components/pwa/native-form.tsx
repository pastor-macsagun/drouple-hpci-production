'use client'

import React, { useState, useCallback } from 'react'
import { Check, ChevronDown, X, Calendar, Clock, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileButton } from '@/components/mobile/mobile-button'
import { BottomSheet } from '@/components/mobile/bottom-sheet'
import { useHaptic } from '@/hooks/use-haptic'

interface FormField {
  key: string
  type: 'text' | 'email' | 'number' | 'select' | 'multiselect' | 'date' | 'time' | 'textarea' | 'switch'
  label: string
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  validation?: (value: any) => string | null
  description?: string
}

interface NativeFormProps {
  fields: FormField[]
  initialValues?: Record<string, any>
  onSubmit: (values: Record<string, any>) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  title?: string
  className?: string
  loading?: boolean
}

export function NativeForm({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  title,
  className,
  loading = false
}: NativeFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeSheet, setActiveSheet] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { triggerHaptic } = useHaptic()

  const updateValue = useCallback((key: string, value: any) => {
    setValues(prev => ({ ...prev, [key]: value }))
    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }))
    }
  }, [errors])

  const validateField = useCallback((field: FormField, value: any): string | null => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return `${field.label} is required`
    }
    
    if (field.validation) {
      return field.validation(value)
    }
    
    // Built-in validations
    if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
      return 'Please enter a valid email address'
    }
    
    return null
  }, [])

  const handleSubmit = useCallback(async () => {
    triggerHaptic('medium')
    
    // Validate all fields
    const newErrors: Record<string, string> = {}
    fields.forEach(field => {
      const error = validateField(field, values[field.key])
      if (error) {
        newErrors[field.key] = error
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      triggerHaptic('error')
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(values)
      triggerHaptic('success')
    } catch (error) {
      triggerHaptic('error')
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [values, fields, validateField, onSubmit, triggerHaptic])

  const renderField = useCallback((field: FormField) => {
    const value = values[field.key]
    const error = errors[field.key]

    const baseFieldClasses = cn(
      "w-full min-h-[44px] px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-base",
      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
      error ? "border-red-500" : "border-gray-200 dark:border-gray-700"
    )

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => updateValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseFieldClasses}
            disabled={loading || isSubmitting}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => updateValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={cn(baseFieldClasses, "resize-none")}
            disabled={loading || isSubmitting}
          />
        )

      case 'select':
        const selectedOption = field.options?.find(opt => opt.value === value)
        return (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              setActiveSheet(field.key)
            }}
            className={cn(
              baseFieldClasses,
              "flex items-center justify-between text-left",
              !selectedOption && "text-gray-500"
            )}
            disabled={loading || isSubmitting}
          >
            <span>{selectedOption?.label || field.placeholder || 'Select option'}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        )

      case 'multiselect':
        const selectedOptions = field.options?.filter(opt => 
          Array.isArray(value) && value.includes(opt.value)
        ) || []
        return (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light')
              setActiveSheet(field.key)
            }}
            className={cn(
              baseFieldClasses,
              "flex items-center justify-between text-left min-h-[44px] py-2"
            )}
            disabled={loading || isSubmitting}
          >
            <div className="flex-1">
              {selectedOptions.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map(opt => (
                    <span
                      key={opt.value}
                      className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded"
                    >
                      {opt.label}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-gray-500">{field.placeholder || 'Select options'}</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
          </button>
        )

      case 'date':
        return (
          <div className="relative">
            <input
              type="date"
              value={value || ''}
              onChange={(e) => updateValue(field.key, e.target.value)}
              className={cn(baseFieldClasses, "pr-10")}
              disabled={loading || isSubmitting}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )

      case 'time':
        return (
          <div className="relative">
            <input
              type="time"
              value={value || ''}
              onChange={(e) => updateValue(field.key, e.target.value)}
              className={cn(baseFieldClasses, "pr-10")}
              disabled={loading || isSubmitting}
            />
            <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )

      case 'switch':
        return (
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-gray-700 dark:text-gray-300">{field.label}</span>
            <div
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                value ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              )}
              onClick={() => {
                triggerHaptic('light')
                updateValue(field.key, !value)
              }}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  value ? "translate-x-6" : "translate-x-1"
                )}
              />
            </div>
          </label>
        )

      default:
        return null
    }
  }, [values, errors, updateValue, triggerHaptic, loading, isSubmitting])

  const renderBottomSheet = useCallback((field: FormField) => {
    if (field.type === 'select') {
      return (
        <BottomSheet
          isOpen={activeSheet === field.key}
          onClose={() => setActiveSheet(null)}
          title={`Select ${field.label}`}
        >
          <div className="space-y-1">
            {field.options?.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  triggerHaptic('medium')
                  updateValue(field.key, option.value)
                  setActiveSheet(null)
                }}
                className={cn(
                  "w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg",
                  values[field.key] === option.value && "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                )}
              >
                <span>{option.label}</span>
                {values[field.key] === option.value && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </BottomSheet>
      )
    }

    if (field.type === 'multiselect') {
      const currentValues = Array.isArray(values[field.key]) ? values[field.key] : []
      return (
        <BottomSheet
          isOpen={activeSheet === field.key}
          onClose={() => setActiveSheet(null)}
          title={`Select ${field.label}`}
        >
          <div className="space-y-1">
            {field.options?.map((option) => {
              const isSelected = currentValues.includes(option.value)
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    triggerHaptic('light')
                    const newValues = isSelected
                      ? currentValues.filter((v: string) => v !== option.value)
                      : [...currentValues, option.value]
                    updateValue(field.key, newValues)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg",
                    isSelected && "bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
                  )}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4" />}
                </button>
              )
            })}
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <MobileButton
              variant="default"
              onClick={() => setActiveSheet(null)}
              className="w-full"
              hapticFeedback
            >
              Done ({currentValues.length} selected)
            </MobileButton>
          </div>
        </BottomSheet>
      )
    }

    return null
  }, [activeSheet, values, updateValue, triggerHaptic])

  return (
    <div className={cn("space-y-6", className)}>
      {title && (
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
      )}

      <form className="space-y-4">
        {fields.map((field) => {
          const error = errors[field.key]
          
          return (
            <div key={field.key} className="space-y-1">
              {field.type !== 'switch' && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}
              
              {renderField(field)}
              
              {field.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {field.description}
                </p>
              )}
              
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
              
              {renderBottomSheet(field)}
            </div>
          )
        })}
      </form>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <MobileButton
            variant="outline"
            onClick={() => {
              triggerHaptic('light')
              onCancel()
            }}
            disabled={loading || isSubmitting}
            className="flex-1"
            hapticFeedback
          >
            {cancelLabel}
          </MobileButton>
        )}
        <MobileButton
          variant="default"
          onClick={handleSubmit}
          disabled={loading || isSubmitting}
          className="flex-1"
          hapticFeedback
        >
          {submitLabel}
        </MobileButton>
      </div>
    </div>
  )
}