"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, X, Info } from "lucide-react";

interface ValidationMessageProps {
  message?: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  className?: string;
}

export function ValidationMessage({ message, type = 'error', className }: ValidationMessageProps) {
  if (!message) return null;

  const icons = {
    error: <X className="h-4 w-4" />,
    success: <Check className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  };

  const styles = {
    error: 'text-destructive border-destructive/20 bg-destructive/5',
    success: 'text-success border-success/20 bg-success/5',
    warning: 'text-warning border-warning/20 bg-warning/5',
    info: 'text-info border-info/20 bg-info/5',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-2 p-3 text-sm rounded-lg border',
        styles[type],
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="mt-0.5 flex-shrink-0">
        {icons[type]}
      </div>
      <div className="flex-1 font-medium">
        {message}
      </div>
    </div>
  );
}

interface FieldValidationProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  className?: string;
}

export function FieldValidation({ error, success, warning, info, className }: FieldValidationProps) {
  // Priority order: error > warning > success > info
  if (error) {
    return <ValidationMessage message={error} type="error" className={className} />;
  }
  if (warning) {
    return <ValidationMessage message={warning} type="warning" className={className} />;
  }
  if (success) {
    return <ValidationMessage message={success} type="success" className={className} />;
  }
  if (info) {
    return <ValidationMessage message={info} type="info" className={className} />;
  }
  return null;
}

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  required?: boolean;
  hint?: string;
  className?: string;
  id?: string;
}

export function FormField({
  label,
  children,
  error,
  success,
  warning,
  info,
  required,
  hint,
  className,
  id,
}: FormFieldProps) {
  const fieldId = id || `field-${Math.random().toString(36).substr(2, 9)}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const validationId = (error || success || warning || info) ? `${fieldId}-validation` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label
        htmlFor={fieldId}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
      </label>
      
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      
      <div className="space-y-2">
        {React.cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement>>, {
          id: fieldId,
          'aria-describedby': [hintId, validationId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          className: cn(
            'mobile-form', // Apply mobile-friendly styles
            error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
            success && 'border-success focus:border-success focus:ring-success/20',
            (children as React.ReactElement<React.HTMLAttributes<HTMLElement>>).props?.className
          ),
        })}
        
        {validationId && (
          <div id={validationId}>
            <FieldValidation 
              error={error}
              success={success}
              warning={warning}
              info={info}
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('form-section', className)}>
      {(title || description) && (
        <div className="pb-4 border-b border-border">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="form-group">
        {children}
      </div>
    </div>
  );
}

// Real-time validation hook
export function useFieldValidation() {
  const [validations, setValidations] = React.useState<Record<string, {
    error?: string;
    success?: string;
    warning?: string;
    info?: string;
  }>>({});

  const setFieldValidation = React.useCallback((
    field: string, 
    validation: { error?: string; success?: string; warning?: string; info?: string }
  ) => {
    setValidations(prev => ({
      ...prev,
      [field]: validation
    }));
  }, []);

  const clearFieldValidation = React.useCallback((field: string) => {
    setValidations(prev => {
      const newValidations = { ...prev };
      delete newValidations[field];
      return newValidations;
    });
  }, []);

  const getFieldValidation = React.useCallback((field: string) => {
    return validations[field] || {};
  }, [validations]);

  return {
    setFieldValidation,
    clearFieldValidation,
    getFieldValidation,
  };
}

// Form submission states
interface FormSubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function FormSubmitButton({ 
  loading, 
  loadingText = 'Submitting...', 
  children, 
  disabled,
  className,
  ...props 
}: FormSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        'mobile-btn w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2 transition-colors rounded-lg',
        className
      )}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {loading ? loadingText : children}
    </button>
  );
}