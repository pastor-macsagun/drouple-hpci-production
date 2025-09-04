import React from 'react';
import { render } from '@testing-library/react-native';
import { ReactElement, ReactNode } from 'react';

export const renderWithProviders = (ui: ReactElement, options = {}) => {
  const AllProviders = ({ children }: { children: ReactNode }) => (
    <>{children}</>
  );

  return render(ui, { wrapper: AllProviders, ...options });
};

export * from '@testing-library/react-native';
export { renderWithProviders as render };
