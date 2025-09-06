"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);

  const triggerHapticFeedback = useCallback(() => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) return;
    
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    
    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, threshold * 1.5);
      setPullDistance(distance);
      
      // Haptic feedback at threshold
      if (distance >= threshold && pullDistance < threshold) {
        triggerHapticFeedback();
      }
    }
  }, [isDragging, disabled, isRefreshing, threshold, pullDistance, triggerHapticFeedback]);

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHapticFeedback();
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [isDragging, disabled, pullDistance, threshold, isRefreshing, onRefresh, triggerHapticFeedback]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 20 || isRefreshing;

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${isDragging ? pullDistance * 0.3 : 0}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 ease-out",
          showIndicator ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          transform: `translateY(-${showIndicator ? 0 : 20}px)`,
        }}
      >
        <div className="flex flex-col items-center justify-center space-y-1">
          <div
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full bg-accent/10 transition-all duration-200",
              isRefreshing && "animate-spin",
              pullProgress >= 1 && !isRefreshing && "bg-accent text-white"
            )}
            style={{
              transform: `rotate(${pullProgress * 180}deg)`,
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </div>
          <span className="text-xs text-ink-muted font-medium">
            {isRefreshing 
              ? "Refreshing..." 
              : pullProgress >= 1 
                ? "Release to refresh" 
                : "Pull to refresh"
            }
          </span>
        </div>
      </div>

      {children}
    </div>
  );
}