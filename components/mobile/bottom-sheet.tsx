"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface BottomSheetProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  snapPoints?: number[]; // Percentage heights: [50, 100]
  initialSnapPoint?: number;
  showHandle?: boolean;
  allowSwipeDown?: boolean;
  className?: string;
}

export function BottomSheet({
  children,
  isOpen,
  onClose,
  title,
  snapPoints = [50, 90],
  initialSnapPoint = 0,
  showHandle = true,
  allowSwipeDown = true,
  className,
}: BottomSheetProps) {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  const currentHeight = snapPoints[currentSnapPoint];
  const actualHeight = currentHeight + dragOffset;

  useEffect(() => {
    if (isOpen && initialSnapPoint < snapPoints.length) {
      setCurrentSnapPoint(initialSnapPoint);
      setDragOffset(0);
    }
  }, [isOpen, initialSnapPoint, snapPoints.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!allowSwipeDown) return;
    
    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    startHeightRef.current = currentHeight;
    setIsDragging(true);
  }, [allowSwipeDown, currentHeight]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !allowSwipeDown) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - startYRef.current;
    
    // Convert pixels to percentage (assuming screen height)
    const screenHeight = window.innerHeight;
    const deltaPercentage = (deltaY / screenHeight) * 100;
    
    // Only allow downward dragging (positive delta reduces height)
    const newOffset = Math.max(-deltaPercentage, -currentHeight + 10); // Min 10% height
    setDragOffset(newOffset);
  }, [isDragging, allowSwipeDown, currentHeight]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const finalHeight = actualHeight;
    
    // Close if dragged below 25%
    if (finalHeight < 25) {
      triggerHapticFeedback('impact-medium');
      onClose();
      return;
    }
    
    // Snap to nearest snap point
    let closestSnapIndex = 0;
    let closestDistance = Math.abs(snapPoints[0] - finalHeight);
    
    snapPoints.forEach((snapPoint, index) => {
      const distance = Math.abs(snapPoint - finalHeight);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSnapIndex = index;
      }
    });
    
    setCurrentSnapPoint(closestSnapIndex);
    setDragOffset(0);
    
    triggerHapticFeedback('impact-light');
  }, [isDragging, actualHeight, snapPoints, onClose]);

  const handleBackdropClick = useCallback(() => {
    triggerHapticFeedback('impact-light');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const sheet = (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleBackdropClick}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full bg-bg rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out",
          isDragging ? "transition-none" : "",
          className
        )}
        style={{
          height: `${Math.max(actualHeight, 10)}vh`,
          transform: isDragging ? 'none' : 'translateY(0)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-ink-muted/30 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-elevated transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}