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
  ariaLabel?: string;
  ariaDescription?: string;
  announceAction?: boolean;
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({
    className,
    hapticFeedback = true,
    rippleEffect = true,
    touchTarget = "default",
    ariaLabel,
    ariaDescription,
    announceAction = false,
    onClick,
    children,
    ...props
  }, ref) => {
    const triggerHapticFeedback = useCallback(() => {
      if (hapticFeedback && typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }, [hapticFeedback]);

    const announceToScreenReader = useCallback((message: string) => {
      if (typeof window !== 'undefined' && announceAction) {
        const announcement = document.createElement('div')
        announcement.setAttribute('aria-live', 'polite')
        announcement.setAttribute('aria-atomic', 'true')
        announcement.className = 'sr-only'
        announcement.textContent = message
        document.body.appendChild(announcement)
        setTimeout(() => document.body.removeChild(announcement), 1000)
      }
    }, [announceAction])

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      triggerHapticFeedback();

      if (announceAction && children) {
        announceToScreenReader(`Button pressed: ${typeof children === 'string' ? children : 'Action performed'}`)
      }

      onClick?.(e);
    }, [onClick, triggerHapticFeedback, announceAction, announceToScreenReader, children]);

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
          "touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent", // Improves touch response and accessibility
          className
        )}
        onClick={handleClick}
        aria-label={ariaLabel}
        aria-describedby={ariaDescription ? `${props.id}-description` : undefined}
        {...props}
      >
        {children}
        {ariaDescription && (
          <span id={`${props.id}-description`} className="sr-only">
            {ariaDescription}
          </span>
        )}
      </Button>
    );
  }
);

MobileButton.displayName = "MobileButton";