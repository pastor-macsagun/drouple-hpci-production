// Type declarations for react-native-safe-area-context
declare module 'react-native-safe-area-context' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface SafeAreaViewProps extends ViewProps {
    children?: React.ReactNode;
    edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
    mode?: 'padding' | 'margin';
  }

  export const SafeAreaView: ComponentType<SafeAreaViewProps>;
  export const SafeAreaProvider: ComponentType<{ children: React.ReactNode }>;
  export const useSafeAreaInsets: () => {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}
