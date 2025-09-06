"use client";

import React, { forwardRef, useState } from "react";
import { cn } from "@/lib/utils";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

export interface NativeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hapticFeedback?: boolean;
  floatingLabel?: boolean;
}

const NativeInput = forwardRef<HTMLInputElement, NativeInputProps>(
  ({
    className,
    type = "text",
    label,
    error,
    hapticFeedback = true,
    floatingLabel = false,
    placeholder,
    onFocus,
    onBlur,
    onChange,
    value,
    disabled,
    ...props
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(Boolean(value));

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (hapticFeedback) {
        triggerHapticFeedback("selection");
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(Boolean(e.target.value));
      onChange?.(e);
    };

    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    if (floatingLabel && label) {
      return (
        <div className="relative">
          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              // Base styles
              "peer w-full min-h-[44px] px-4 pt-6 pb-2",
              "bg-bg border border-border rounded-xl",
              "text-ink placeholder:text-transparent",
              "transition-all duration-200 ease-standard",
              
              // Focus states
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "focus:shadow-md focus:-translate-y-0.5",
              
              // Error states
              error && "border-danger focus:ring-danger",
              
              // Disabled states
              "disabled:opacity-50 disabled:bg-surface disabled:cursor-not-allowed",
              
              className
            )}
            placeholder={placeholder || label}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            value={value}
            disabled={disabled}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              "absolute left-4 transition-all duration-200 ease-standard cursor-text",
              "text-ink-muted select-none",
              
              // Position based on focus/value state
              (isFocused || hasValue || value) 
                ? "top-2 text-xs font-medium" 
                : "top-1/2 -translate-y-1/2 text-base",
              
              // Focus color
              isFocused && "text-ring",
              
              // Error color
              error && "text-danger",
              
              // Disabled state
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
          {error && (
            <p className="mt-2 text-sm text-danger font-medium">
              {error}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {label && !floatingLabel && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium text-ink",
              error && "text-danger",
              disabled && "opacity-50"
            )}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          className={cn(
            // Base styles
            "w-full min-h-[44px] px-4 py-3",
            "bg-bg border border-border rounded-xl",
            "text-ink placeholder:text-ink-muted",
            "transition-all duration-200 ease-standard",
            
            // Focus states
            "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
            "focus:shadow-md focus:-translate-y-0.5",
            
            // Error states
            error && "border-danger focus:ring-danger",
            
            // Disabled states
            "disabled:opacity-50 disabled:bg-surface disabled:cursor-not-allowed",
            
            className
          )}
          placeholder={placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          value={value}
          disabled={disabled}
          {...props}
        />
        {error && (
          <p className="text-sm text-danger font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

NativeInput.displayName = "NativeInput";

export { NativeInput };