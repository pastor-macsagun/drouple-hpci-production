"use client";

import { useState, useRef, useCallback, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  badge?: number;
}

interface MobileTabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  swipeable?: boolean;
  className?: string;
}

export function MobileTabs({
  tabs,
  defaultTab,
  onTabChange,
  swipeable = true,
  className,
}: MobileTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isSwipeHorizontalRef = useRef<boolean | null>(null);

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  const handleTabClick = useCallback((tabId: string) => {
    if (tabId === activeTab) return;
    
    setActiveTab(tabId);
    onTabChange?.(tabId);
    triggerHapticFeedback('light');
  }, [activeTab, onTabChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!swipeable) return;
    
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    setIsDragging(true);
    isSwipeHorizontalRef.current = null;
  }, [swipeable]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !swipeable) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    
    // Determine swipe direction on first significant movement
    if (isSwipeHorizontalRef.current === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      isSwipeHorizontalRef.current = Math.abs(deltaX) > Math.abs(deltaY);
    }
    
    // Only handle horizontal swipes
    if (isSwipeHorizontalRef.current) {
      e.preventDefault();
      const containerWidth = contentRef.current?.offsetWidth || 0;
      const maxOffset = containerWidth * 0.3; // 30% of width
      const constrainedOffset = Math.max(-maxOffset, Math.min(maxOffset, deltaX));
      setSwipeOffset(constrainedOffset);
    }
  }, [isDragging, swipeable]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    isSwipeHorizontalRef.current = null;
    
    const threshold = 80; // px
    
    if (Math.abs(swipeOffset) > threshold) {
      const direction = swipeOffset > 0 ? -1 : 1; // Opposite of swipe direction
      const newIndex = activeIndex + direction;
      
      if (newIndex >= 0 && newIndex < tabs.length) {
        const newTabId = tabs[newIndex].id;
        setActiveTab(newTabId);
        onTabChange?.(newTabId);
        triggerHapticFeedback('medium');
      }
    }
    
    setSwipeOffset(0);
  }, [isDragging, swipeOffset, activeIndex, tabs, onTabChange]);

  return (
    <div className={cn("w-full", className)}>
      {/* Tab Headers */}
      <div className="flex border-b border-border bg-bg sticky top-0 z-10">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors relative min-h-[44px]",
              "hover:bg-elevated focus:bg-elevated focus:outline-none",
              activeTab === tab.id
                ? "text-accent border-b-2 border-accent"
                : "text-ink-muted hover:text-ink"
            )}
          >
            {tab.icon && (
              <span className="flex-shrink-0">
                {tab.icon}
              </span>
            )}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {tab.badge > 99 ? '99+' : tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div
        ref={contentRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn(
            "flex transition-transform duration-300 ease-out",
            isDragging && "transition-none"
          )}
          style={{
            transform: `translateX(calc(-${activeIndex * 100}% + ${swipeOffset}px))`,
            width: `${tabs.length * 100}%`,
          }}
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className="w-full flex-shrink-0 p-4"
              style={{ width: `${100 / tabs.length}%` }}
            >
              {tab.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}