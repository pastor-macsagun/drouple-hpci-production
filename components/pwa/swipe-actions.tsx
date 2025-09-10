'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Edit, Trash2, Archive, Star, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useHaptic } from '@/hooks/use-haptic'

interface SwipeAction {
  key: string
  label: string
  icon: React.ReactNode
  variant: 'primary' | 'secondary' | 'danger'
  onAction: () => void
}

interface SwipeActionsProps {
  children: React.ReactNode
  actions: SwipeAction[]
  disabled?: boolean
  className?: string
  threshold?: number // Minimum swipe distance to reveal actions
}

export function SwipeActions({
  children,
  actions,
  disabled = false,
  className,
  threshold = 80
}: SwipeActionsProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startTranslateRef = useRef(0)
  const { triggerHaptic } = useHaptic()

  const actionWidths = actions.length * 80 // Each action is 80px wide

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    
    const touch = e.touches[0]
    startXRef.current = touch.clientX
    startTranslateRef.current = translateX
    setIsDragging(true)
  }, [disabled, translateX])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isDragging) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - startXRef.current
    const newTranslateX = startTranslateRef.current + deltaX

    // Only allow left swipe (negative translation)
    if (newTranslateX <= 0 && newTranslateX >= -actionWidths) {
      setTranslateX(newTranslateX)
      
      // Trigger haptic feedback when threshold is reached
      if (Math.abs(newTranslateX) > threshold && !isRevealed) {
        triggerHaptic('light')
        setIsRevealed(true)
      } else if (Math.abs(newTranslateX) <= threshold && isRevealed) {
        setIsRevealed(false)
      }
    }
  }, [disabled, isDragging, actionWidths, threshold, isRevealed, triggerHaptic])

  const handleTouchEnd = useCallback(() => {
    if (disabled) return

    setIsDragging(false)
    
    // Snap to revealed or hidden state based on threshold
    if (Math.abs(translateX) > threshold) {
      setTranslateX(-actionWidths)
      setIsRevealed(true)
      triggerHaptic('medium')
    } else {
      setTranslateX(0)
      setIsRevealed(false)
    }
  }, [disabled, translateX, threshold, actionWidths, triggerHaptic])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    
    startXRef.current = e.clientX
    startTranslateRef.current = translateX
    setIsDragging(true)
    
    // Prevent text selection during drag
    e.preventDefault()
  }, [disabled, translateX])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (disabled || !isDragging) return

    const deltaX = e.clientX - startXRef.current
    const newTranslateX = startTranslateRef.current + deltaX

    // Only allow left swipe (negative translation)
    if (newTranslateX <= 0 && newTranslateX >= -actionWidths) {
      setTranslateX(newTranslateX)
      
      // Trigger haptic feedback when threshold is reached
      if (Math.abs(newTranslateX) > threshold && !isRevealed) {
        triggerHaptic('light')
        setIsRevealed(true)
      } else if (Math.abs(newTranslateX) <= threshold && isRevealed) {
        setIsRevealed(false)
      }
    }
  }, [disabled, isDragging, actionWidths, threshold, isRevealed, triggerHaptic])

  const handleMouseUp = useCallback(() => {
    if (disabled) return

    setIsDragging(false)
    
    // Snap to revealed or hidden state based on threshold
    if (Math.abs(translateX) > threshold) {
      setTranslateX(-actionWidths)
      setIsRevealed(true)
      triggerHaptic('medium')
    } else {
      setTranslateX(0)
      setIsRevealed(false)
    }
  }, [disabled, translateX, threshold, actionWidths, triggerHaptic])

  // Add mouse event listeners for desktop support
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Close actions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) && isRevealed) {
        setTranslateX(0)
        setIsRevealed(false)
      }
    }

    if (isRevealed) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isRevealed])

  const handleActionClick = useCallback((action: SwipeAction) => {
    triggerHaptic('medium')
    action.onAction()
    // Reset swipe state after action
    setTranslateX(0)
    setIsRevealed(false)
  }, [triggerHaptic])

  const getActionVariantStyles = (variant: SwipeAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-500 text-white hover:bg-blue-600'
      case 'secondary':
        return 'bg-gray-500 text-white hover:bg-gray-600'
      case 'danger':
        return 'bg-red-500 text-white hover:bg-red-600'
      default:
        return 'bg-gray-500 text-white hover:bg-gray-600'
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden touch-pan-y",
        className
      )}
    >
      {/* Main content */}
      <div
        className={cn(
          "transition-transform duration-200 ease-out",
          isDragging && "transition-none"
        )}
        style={{
          transform: `translateX(${translateX}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {children}
      </div>

      {/* Action buttons */}
      <div
        className="absolute inset-y-0 right-0 flex"
        style={{
          width: `${actionWidths}px`,
          transform: `translateX(${Math.max(0, translateX + actionWidths)}px)`
        }}
      >
        {actions.map((action, index) => (
          <button
            key={action.key}
            onClick={() => handleActionClick(action)}
            className={cn(
              "w-20 flex flex-col items-center justify-center gap-1 transition-colors duration-150",
              "text-xs font-medium border-r border-white/20 last:border-r-0",
              getActionVariantStyles(action.variant),
              "focus:outline-none focus:ring-2 focus:ring-white/30"
            )}
            style={{
              transform: `translateX(${isDragging ? 0 : Math.min(0, (translateX + actionWidths) * 0.1 * (index + 1))}px)`
            }}
            aria-label={action.label}
          >
            <span className="text-base">{action.icon}</span>
            <span className="leading-none">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Overlay for dimming when actions are revealed */}
      {isRevealed && (
        <div
          className="absolute inset-0 bg-black/10 pointer-events-none"
          style={{
            opacity: Math.abs(translateX) / actionWidths * 0.3
          }}
        />
      )}
    </div>
  )
}

// Predefined action creators for common use cases
export const createEditAction = (onEdit: () => void): SwipeAction => ({
  key: 'edit',
  label: 'Edit',
  icon: <Edit className="w-4 h-4" />,
  variant: 'primary',
  onAction: onEdit
})

export const createDeleteAction = (onDelete: () => void): SwipeAction => ({
  key: 'delete',
  label: 'Delete',
  icon: <Trash2 className="w-4 h-4" />,
  variant: 'danger',
  onAction: onDelete
})

export const createArchiveAction = (onArchive: () => void): SwipeAction => ({
  key: 'archive',
  label: 'Archive',
  icon: <Archive className="w-4 h-4" />,
  variant: 'secondary',
  onAction: onArchive
})

export const createStarAction = (onStar: () => void): SwipeAction => ({
  key: 'star',
  label: 'Star',
  icon: <Star className="w-4 h-4" />,
  variant: 'secondary',
  onAction: onStar
})

export const createMoreAction = (onMore: () => void): SwipeAction => ({
  key: 'more',
  label: 'More',
  icon: <MoreHorizontal className="w-4 h-4" />,
  variant: 'secondary',
  onAction: onMore
})