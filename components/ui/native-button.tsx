"use client";

import React, { forwardRef, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback, addRippleEffect } from "@/lib/mobile-utils";
import { Slot } from "@radix-ui/react-slot";

export interface NativeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "success";
  size?: "sm" | "default" | "lg" | "icon";
  asChild?: boolean;
  hapticFeedback?: boolean;
  rippleEffect?: boolean;
  loading?: boolean;
}

const NativeButton = forwardRef<HTMLButtonElement, NativeButtonProps>(
  ({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    hapticFeedback = true,
    rippleEffect = true,
    loading = false,
    children,
    onClick,
    disabled,
    ...props
  }, ref) => {
    const [isPressed, setIsPressed] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    const Comp = asChild ? Slot : "button";

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return;
      
      // Trigger haptic feedback
      if (hapticFeedback) {
        triggerHapticFeedback("tap");
      }
      
      // Add ripple effect
      if (rippleEffect && buttonRef.current) {
        addRippleEffect(buttonRef.current, e.nativeEvent);
      }
      
      // Call original onClick
      onClick?.(e);
    };

    const handleTouchStart = () => {
      if (disabled || loading) return;
      setIsPressed(true);
    };

    const handleTouchEnd = () => {
      setIsPressed(false);
    };

    const variants = {
      default: [
        "bg-accent text-accent-ink hover:bg-accent/90",
        "shadow-sm hover:shadow-md active:shadow-none",
        "border-0"
      ],
      secondary: [
        "bg-surface text-ink hover:bg-elevated",
        "shadow-sm hover:shadow-md active:shadow-none",
        "border border-border"
      ],
      ghost: [
        "bg-transparent text-ink hover:bg-surface hover:text-ink",
        "shadow-none hover:shadow-sm active:shadow-none",
        "border-0"
      ],
      destructive: [
        "bg-danger text-white hover:bg-danger/90",
        "shadow-sm hover:shadow-md active:shadow-none",
        "border-0"
      ],
      success: [
        "bg-success text-white hover:bg-success/90",
        "shadow-sm hover:shadow-md active:shadow-none",
        "border-0"
      ]
    };

    const sizes = {
      sm: "min-h-[36px] px-3 py-2 text-sm rounded-lg",
      default: "min-h-[44px] px-6 py-3 text-base rounded-xl",
      lg: "min-h-[48px] px-8 py-4 text-lg rounded-xl",
      icon: "h-10 w-10 rounded-lg"
    };

    return (
      <Comp
        ref={ref || buttonRef}
        className={cn(
          // Base styles
          "relative inline-flex items-center justify-center font-medium",
          "transition-all duration-200 ease-standard",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "overflow-hidden", // For ripple effect
          
          // Touch interactions
          "touch-target",
          "active:scale-98",
          "disabled:opacity-50 disabled:pointer-events-none",
          "disabled:cursor-not-allowed",
          
          // Hover effects (desktop)
          "hover:transform hover:-translate-y-0.5",
          "active:transform active:translate-y-0",
          
          // Pressed state (mobile)
          isPressed && "scale-98",
          
          // Loading state
          loading && "cursor-wait opacity-75",
          
          // Variants
          variants[variant],
          
          // Sizes
          sizes[size],
          
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <span className={cn(
          "flex items-center gap-2",
          loading && "opacity-0"
        )}>
          {children}
        </span>
      </Comp>
    );
  }
);

NativeButton.displayName = "NativeButton";

export { NativeButton };