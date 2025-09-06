"use client";

import { ReactNode, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { MobileButton } from "./mobile-button";
import { triggerHapticFeedback } from "@/lib/mobile-utils";

interface FormStep {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  validation?: () => boolean | Promise<boolean>;
  optional?: boolean;
}

interface MobileStepperFormProps {
  steps: FormStep[];
  onComplete: () => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
  showProgress?: boolean;
}

export function MobileStepperForm({
  steps,
  onComplete,
  onCancel,
  className,
  showProgress = true,
}: MobileStepperFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = useCallback(async () => {
    const step = steps[currentStep];
    
    // Validate current step
    if (step.validation) {
      const isValid = await step.validation();
      if (!isValid) {
        triggerHapticFeedback('heavy');
        return;
      }
    }
    
    // Mark step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    triggerHapticFeedback('light');
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - submit form
      setIsSubmitting(true);
      try {
        await onComplete();
        triggerHapticFeedback('medium');
      } catch (error) {
        triggerHapticFeedback('heavy');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [currentStep, steps, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      triggerHapticFeedback('light');
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepIndex: number) => {
    // Allow jumping to previous steps or next step if current is completed
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex);
      triggerHapticFeedback('light');
    }
  }, [currentStep, completedSteps]);

  const isLastStep = currentStep === steps.length - 1;
  const canGoNext = currentStep < steps.length;
  const canGoPrevious = currentStep > 0;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Progress Indicator */}
      {showProgress && (
        <div className="px-4 py-4 bg-bg border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-ink-muted">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-elevated rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-3">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 min-h-[32px] min-w-[32px]",
                  index === currentStep
                    ? "bg-accent text-white"
                    : completedSteps.has(index)
                      ? "bg-green-500 text-white"
                      : index < currentStep
                        ? "bg-elevated text-ink hover:bg-elevated/80"
                        : "bg-elevated/50 text-ink-muted"
                )}
                disabled={index > currentStep && !completedSteps.has(index - 1)}
              >
                {completedSteps.has(index) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-ink mb-2">
              {steps[currentStep].title}
            </h2>
            {steps[currentStep].description && (
              <p className="text-sm text-ink-muted">
                {steps[currentStep].description}
              </p>
            )}
          </div>
          
          <div className="space-y-4">
            {steps[currentStep].content}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 bg-bg border-t border-border">
        <div className="flex justify-between gap-3">
          <div className="flex gap-2">
            {canGoPrevious && (
              <MobileButton
                variant="outline"
                onClick={handlePrevious}
                className="flex items-center gap-2"
                touchTarget="large"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </MobileButton>
            )}
            
            {onCancel && (
              <MobileButton
                variant="ghost"
                onClick={onCancel}
                className="text-ink-muted"
              >
                Cancel
              </MobileButton>
            )}
          </div>

          <MobileButton
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2"
            touchTarget="large"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : isLastStep ? (
              "Complete"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </MobileButton>
        </div>
      </div>
    </div>
  );
}

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helper?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  touched?: boolean;
}

export function MobileInput({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  touched = false,
  className,
  ...props
}: MobileInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const hasError = touched && error;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-ink block">
        {label}
      </label>
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
            {leftIcon}
          </div>
        )}
        
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "w-full h-12 px-4 rounded-xl border bg-bg text-ink placeholder:text-ink-muted",
            "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent",
            "transition-colors duration-200",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            hasError
              ? "border-red-500 focus:ring-red-500/50 focus:border-red-500"
              : "border-border",
            isFocused && !hasError && "border-accent",
            className
          )}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
            {rightIcon}
          </div>
        )}
      </div>
      
      {hasError && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {helper && !hasError && (
        <p className="text-sm text-ink-muted">{helper}</p>
      )}
    </div>
  );
}