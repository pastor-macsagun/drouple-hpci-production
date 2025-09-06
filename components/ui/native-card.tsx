"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

export interface NativeCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  variant?: "default" | "elevated" | "glass";
  hapticFeedback?: boolean;
  pressable?: boolean;
}

const NativeCard = forwardRef<HTMLDivElement, NativeCardProps>(
  ({
    className,
    interactive = false,
    variant = "default",
    hapticFeedback = true,
    pressable = false,
    children,
    onClick,
    ...props
  }, ref) => {
    const [isPressed, setIsPressed] = useState(false);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!interactive && !pressable) return;
      
      // Trigger haptic feedback
      if (hapticFeedback) {
        triggerHapticFeedback("tap");
      }
      
      // Call original onClick
      onClick?.(e);
    };

    const handleTouchStart = () => {
      if (!interactive && !pressable) return;
      setIsPressed(true);
    };

    const handleTouchEnd = () => {
      setIsPressed(false);
    };

    const variants = {
      default: [
        "bg-elevated border border-border/50",
        "shadow-sm hover:shadow-md"
      ],
      elevated: [
        "bg-elevated border border-border/30",
        "shadow-md hover:shadow-lg"
      ],
      glass: [
        "glass-native"
      ]
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "rounded-2xl p-6 transition-all duration-200 ease-standard",
          
          // Variants
          variants[variant],
          
          // Interactive states
          (interactive || pressable) && [
            "cursor-pointer",
            "hover:transform hover:-translate-y-1",
            "active:scale-98 active:shadow-sm",
            isPressed && "scale-98"
          ],
          
          className
        )}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        {...props}
      >
        {children}
      </div>
    );
  }
);

NativeCard.displayName = "NativeCard";

const NativeCardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
NativeCardHeader.displayName = "NativeCardHeader";

const NativeCardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-ink",
      className
    )}
    {...props}
  >
    {children}
  </h3>
));
NativeCardTitle.displayName = "NativeCardTitle";

const NativeCardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-ink-muted leading-relaxed", className)}
    {...props}
  />
));
NativeCardDescription.displayName = "NativeCardDescription";

const NativeCardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4", className)}
    {...props}
  />
));
NativeCardContent.displayName = "NativeCardContent";

const NativeCardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between pt-4", className)}
    {...props}
  />
));
NativeCardFooter.displayName = "NativeCardFooter";

export {
  NativeCard,
  NativeCardHeader,
  NativeCardTitle,
  NativeCardDescription,
  NativeCardContent,
  NativeCardFooter,
};