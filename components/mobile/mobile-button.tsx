"use client";

import { ButtonHTMLAttributes, forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MobileButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  touchTarget?: "default" | "large";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    className, 
    hapticFeedback = true,
    rippleEffect = true,
    touchTarget = "default",
    onClick,
    children,
    ...props 
  }, ref) => {
    const triggerHapticFeedback = useCallback(() => {
      if (hapticFeedback && typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }, [hapticFeedback]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHapticFeedback();
      onClick?.(e);
    }, [onClick, triggerHapticFeedback]);

    const touchTargetClass = touchTarget === "large" 
      ? "min-h-[44px] min-w-[44px]" 
      : "";

    const rippleClass = rippleEffect 
      ? "relative overflow-hidden active:scale-95 transition-transform duration-75" 
      : "";

    return (
      <Button
        ref={ref}
        className={cn(
          touchTargetClass,
          rippleClass,
          "touch-manipulation", // Improves touch response
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

MobileButton.displayName = "MobileButton";