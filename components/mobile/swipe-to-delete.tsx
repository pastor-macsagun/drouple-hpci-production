"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void | Promise<void>;
  className?: string;
  deleteThreshold?: number;
  disabled?: boolean;
  deleteText?: string;
}

export function SwipeToDelete({
  children,
  onDelete,
  className,
  deleteThreshold = 100,
  disabled = false,
  deleteText = "Delete",
}: SwipeToDeleteProps) {
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isSwipeHorizontalRef = useRef<boolean | null>(null);

  const triggerHapticFeedback = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isDeleting) return;
    
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    setIsDragging(true);
    isSwipeHorizontalRef.current = null;
  }, [disabled, isDeleting]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled || isDeleting) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    
    // Determine swipe direction on first significant movement
    if (isSwipeHorizontalRef.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isSwipeHorizontalRef.current = Math.abs(deltaX) > Math.abs(deltaY);
    }
    
    // Only handle horizontal swipes to the left
    if (isSwipeHorizontalRef.current && deltaX < 0) {
      e.preventDefault();
      const distance = Math.min(Math.abs(deltaX), deleteThreshold * 1.5);
      setSwipeDistance(distance);
      
      // Haptic feedback at threshold
      if (distance >= deleteThreshold && swipeDistance < deleteThreshold) {
        triggerHapticFeedback();
      }
    }
  }, [isDragging, disabled, isDeleting, deleteThreshold, swipeDistance, triggerHapticFeedback]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    isSwipeHorizontalRef.current = null;
    
    if (swipeDistance >= deleteThreshold && !isDeleting) {
      setIsDeleting(true);
      triggerHapticFeedback();
      
      try {
        await onDelete();
      } catch (error) {
        console.error('Delete failed:', error);
        setIsDeleting(false);
      }
    }
    
    setSwipeDistance(0);
  }, [isDragging, disabled, swipeDistance, deleteThreshold, isDeleting, onDelete, triggerHapticFeedback]);

  const swipeProgress = Math.min(swipeDistance / deleteThreshold, 1);
  const showDeleteAction = swipeDistance > 20 || isDeleting;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Delete action background */}
      <div
        className={cn(
          "absolute top-0 right-0 bottom-0 flex items-center justify-center transition-all duration-200",
          "bg-red-500 text-white",
          showDeleteAction ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: `${Math.max(swipeDistance, 0)}px`,
          transform: `translateX(${showDeleteAction ? 0 : 20}px)`,
        }}
      >
        {swipeDistance > 40 && (
          <div className="flex flex-col items-center justify-center px-4">
            <Trash2 
              className={cn(
                "h-5 w-5 transition-all duration-200",
                isDeleting && "animate-bounce",
                swipeProgress >= 1 && "scale-110"
              )} 
            />
            <span className="text-xs font-medium mt-1">
              {isDeleting 
                ? "Deleting..." 
                : swipeProgress >= 1 
                  ? "Release" 
                  : deleteText
              }
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "relative z-10 bg-bg transition-transform duration-200",
          isDeleting && "opacity-50"
        )}
        style={{
          transform: `translateX(-${swipeDistance}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, opacity 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}