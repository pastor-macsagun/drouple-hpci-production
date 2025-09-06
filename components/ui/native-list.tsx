"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/mobile-utils";
import { ChevronRight } from "lucide-react";

export interface NativeListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "inset";
}

const NativeList = forwardRef<HTMLDivElement, NativeListProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-elevated border border-border/30 rounded-2xl overflow-hidden",
      inset: "bg-transparent space-y-1"
    };

    return (
      <div
        ref={ref}
        className={cn(
          "divide-y divide-border/30",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

NativeList.displayName = "NativeList";

export interface NativeListItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  hapticFeedback?: boolean;
  showArrow?: boolean;
  showChevron?: boolean;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  variant?: "default" | "inset";
}

const NativeListItem = forwardRef<HTMLDivElement, NativeListItemProps>(
  ({
    className,
    children,
    interactive = false,
    hapticFeedback = true,
    showArrow = false,
    showChevron = false,
    title,
    subtitle,
    icon,
    leftContent,
    rightContent,
    variant = "default",
    onClick,
    ...props
  }, ref) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive && !onClick) return;
      
      // Trigger haptic feedback
      if (hapticFeedback) {
        triggerHapticFeedback("tap");
      }
      
      // Call original onClick
      onClick?.(e);
    };

    const handleTouchStart = () => {
      if (!interactive && !onClick) return;
      setIsPressed(true);
    };

    const handleTouchEnd = () => {
      setIsPressed(false);
    };

    const variants = {
      default: "bg-elevated hover:bg-surface",
      inset: "bg-elevated hover:bg-surface rounded-xl mx-4 mb-1"
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "min-h-[48px] px-4 py-3 flex items-center gap-3",
          "transition-all duration-150 ease-standard",
          
          // Variants
          variants[variant],
          
          // Interactive states
          (interactive || onClick) && [
            "cursor-pointer",
            "active:scale-98 active:bg-surface/80",
            isPressed && "scale-98 bg-surface/80"
          ],
          
          // Last child styling for default variant
          variant === "default" && "last:border-b-0",
          
          className
        )}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        {...props}
      >
        {(icon || leftContent) && (
          <div className="flex-shrink-0">
            {icon || leftContent}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-ink font-medium truncate">
                {title || children}
              </div>
              {subtitle && (
                <div className="text-sm text-ink-muted truncate">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {rightContent && (
          <div className="flex-shrink-0 ml-3">
            {rightContent}
          </div>
        )}
        
        {(showArrow || showChevron || (interactive && !rightContent)) && (
          <ChevronRight 
            className="flex-shrink-0 w-5 h-5 text-ink-muted ml-2" 
          />
        )}
      </div>
    );
  }
);

NativeListItem.displayName = "NativeListItem";

export { NativeList, NativeListItem };