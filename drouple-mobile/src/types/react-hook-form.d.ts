/**
 * React Hook Form compatibility with React 19
 */

declare module 'react-hook-form' {
  import { ComponentType, ReactNode } from 'react';

  export interface ControllerRenderProps<TFieldValue = any> {
    onChange: (...event: any[]) => void;
    onBlur: () => void;
    value: TFieldValue;
  }

  export interface ControllerFieldState {
    invalid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    error?: any;
  }

  export interface ControllerProps<
    TFieldValues = any,
    TName extends string = string,
  > {
    name: TName;
    control?: any;
    render: (props: {
      field: ControllerRenderProps;
      fieldState: ControllerFieldState;
    }) => ReactNode;
    defaultValue?: unknown;
    rules?: any;
    shouldUnregister?: boolean;
  }

  export const Controller: ComponentType<ControllerProps>;

  export interface UseFormOptions<TFieldValues = any> {
    resolver?: any;
    mode?: 'onChange' | 'onBlur' | 'onSubmit';
    defaultValues?: Partial<TFieldValues>;
  }

  export interface UseFormReturn<TFieldValues = any> {
    control: any;
    handleSubmit: (
      callback: (data: TFieldValues) => void
    ) => (e?: React.BaseSyntheticEvent) => void;
    formState: {
      errors: any;
      isValid: boolean;
    };
    reset: () => void;
  }

  export function useForm<TFieldValues = any>(
    options?: UseFormOptions<TFieldValues>
  ): UseFormReturn<TFieldValues>;
}
