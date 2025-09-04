/**
 * Input Validation & Sanitization
 * Comprehensive validation for all user inputs to prevent XSS and injection attacks
 */

import DOMPurify from 'isomorphic-dompurify';
import type { ValidationRules } from './types';

export class InputValidator {
  private static instance: InputValidator;
  private rules: ValidationRules;

  private constructor(rules: ValidationRules) {
    this.rules = rules;
  }

  public static getInstance(rules: ValidationRules): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator(rules);
    }
    return InputValidator.instance;
  }

  /**
   * Validate email address
   */
  public validateEmail(email: string): {
    isValid: boolean;
    errors: string[];
    sanitized: string;
  } {
    const errors: string[] = [];
    const trimmedEmail = email.trim().toLowerCase();

    // Required check
    if (this.rules.email.required && !trimmedEmail) {
      errors.push('Email is required');
    }

    // Length check
    if (trimmedEmail.length > this.rules.email.maxLength) {
      errors.push(
        `Email must be less than ${this.rules.email.maxLength} characters`
      );
    }

    // Format check
    if (trimmedEmail && !this.rules.email.pattern.test(trimmedEmail)) {
      errors.push('Please enter a valid email address');
    }

    // XSS prevention
    const sanitized = this.sanitizeInput(trimmedEmail);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate password strength
   */
  public validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong' | 'very-strong';
    score: number;
  } {
    const errors: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.rules.password.minLength) {
      errors.push(
        `Password must be at least ${this.rules.password.minLength} characters long`
      );
    } else if (password.length >= this.rules.password.minLength) {
      score += 1;
    }

    if (password.length > this.rules.password.maxLength) {
      errors.push(
        `Password must be less than ${this.rules.password.maxLength} characters`
      );
    }

    // Uppercase check
    if (this.rules.password.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // Lowercase check
    if (this.rules.password.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    // Number check
    if (this.rules.password.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 1;
    }

    // Special character check
    if (
      this.rules.password.requireSpecialChars &&
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    }

    // Additional strength checks
    if (password.length >= 12) score += 1;
    if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
    if (this.isCommonPassword(password)) score -= 2;

    const strength = this.getPasswordStrength(score);

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score: Math.max(0, score),
    };
  }

  /**
   * Validate phone number
   */
  public validatePhone(phone: string): {
    isValid: boolean;
    errors: string[];
    sanitized: string;
    formatted: string;
  } {
    const errors: string[] = [];
    const sanitized = phone.replace(/\D/g, ''); // Remove non-digits

    // Required check
    if (this.rules.phone.required && !sanitized) {
      errors.push('Phone number is required');
    }

    // Format check
    if (sanitized && !this.rules.phone.pattern.test(sanitized)) {
      errors.push('Please enter a valid phone number');
    }

    // Format phone number for display
    const formatted = this.formatPhoneNumber(sanitized);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
      formatted,
    };
  }

  /**
   * Validate and sanitize text input
   */
  public validateText(
    text: string,
    fieldName: string = 'Field'
  ): {
    isValid: boolean;
    errors: string[];
    sanitized: string;
  } {
    const errors: string[] = [];

    // Length check
    if (text.length > this.rules.text.maxLength) {
      errors.push(
        `${fieldName} must be less than ${this.rules.text.maxLength} characters`
      );
    }

    // Character validation
    if (!this.rules.text.allowedCharacters.test(text)) {
      errors.push(`${fieldName} contains invalid characters`);
    }

    // Sanitize input
    const sanitized = this.rules.text.sanitize
      ? this.sanitizeInput(text)
      : text.trim();

    return {
      isValid: errors.length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Validate required fields
   */
  public validateRequired(
    value: string,
    fieldName: string
  ): {
    isValid: boolean;
    error?: string;
  } {
    const trimmed = value.trim();

    if (!trimmed) {
      return {
        isValid: false,
        error: `${fieldName} is required`,
      };
    }

    return { isValid: true };
  }

  /**
   * Validate URL
   */
  public validateUrl(url: string): {
    isValid: boolean;
    errors: string[];
    sanitized: string;
  } {
    const errors: string[] = [];
    const trimmed = url.trim();

    if (!trimmed) {
      return { isValid: true, errors: [], sanitized: '' };
    }

    try {
      new URL(trimmed);

      // Check for allowed protocols
      if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
        errors.push('URL must start with http:// or https://');
      }

      // Sanitize URL
      const sanitized = this.sanitizeInput(trimmed);

      return {
        isValid: errors.length === 0,
        errors,
        sanitized,
      };
    } catch {
      errors.push('Please enter a valid URL');
      return {
        isValid: false,
        errors,
        sanitized: trimmed,
      };
    }
  }

  /**
   * Validate age
   */
  public validateAge(age: string | number): {
    isValid: boolean;
    errors: string[];
    parsed: number;
  } {
    const errors: string[] = [];
    const parsed = typeof age === 'string' ? parseInt(age, 10) : age;

    if (isNaN(parsed)) {
      errors.push('Please enter a valid age');
    } else {
      if (parsed < 0 || parsed > 120) {
        errors.push('Please enter a valid age between 0 and 120');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      parsed: parsed || 0,
    };
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  public sanitizeInput(input: string): string {
    if (!input) return '';

    // Basic HTML sanitization
    let sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });

    // Additional sanitization for mobile
    sanitized = sanitized
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
      .trim();

    return sanitized;
  }

  /**
   * Validate form data in batch
   */
  public validateForm(
    data: Record<string, string>,
    schema: Record<
      string,
      {
        type: 'email' | 'password' | 'text' | 'phone' | 'url' | 'required';
        required?: boolean;
        fieldName?: string;
      }
    >
  ): {
    isValid: boolean;
    errors: Record<string, string[]>;
    sanitized: Record<string, string>;
  } {
    const errors: Record<string, string[]> = {};
    const sanitized: Record<string, string> = {};

    Object.entries(schema).forEach(([key, rules]) => {
      const value = data[key] || '';
      const fieldName = rules.fieldName || key;

      let result;

      switch (rules.type) {
        case 'email':
          result = this.validateEmail(value);
          break;
        case 'password':
          result = this.validatePassword(value);
          break;
        case 'text':
          result = this.validateText(value, fieldName);
          break;
        case 'phone':
          result = this.validatePhone(value);
          break;
        case 'url':
          result = this.validateUrl(value);
          break;
        case 'required':
          const reqResult = this.validateRequired(value, fieldName);
          result = {
            isValid: reqResult.isValid,
            errors: reqResult.error ? [reqResult.error] : [],
            sanitized: value.trim(),
          };
          break;
        default:
          result = { isValid: true, errors: [], sanitized: value };
      }

      if (!result.isValid) {
        errors[key] = result.errors;
      }

      sanitized[key] = result.sanitized || value;
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitized,
    };
  }

  /**
   * Check if password is commonly used
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password',
      '123456',
      '12345678',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      '123123',
      'password1',
      '1234567890',
      'iloveyou',
      'princess',
      'rockyou',
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Get password strength based on score
   */
  private getPasswordStrength(
    score: number
  ): 'weak' | 'medium' | 'strong' | 'very-strong' {
    if (score <= 2) return 'weak';
    if (score <= 3) return 'medium';
    if (score <= 4) return 'strong';
    return 'very-strong';
  }

  /**
   * Format phone number for display
   */
  private formatPhoneNumber(phone: string): string {
    if (!phone) return '';

    if (phone.length === 10) {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }

    if (phone.length === 11 && phone.startsWith('1')) {
      return phone.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '$1 ($2) $3-$4');
    }

    return phone;
  }
}
