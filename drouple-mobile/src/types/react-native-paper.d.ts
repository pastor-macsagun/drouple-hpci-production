// Type declarations for React Native Paper compatibility with React 19
declare module 'react-native-paper' {
  import { ComponentType, ReactElement } from 'react';
  import {
    ViewProps,
    TextInputProps,
    TouchableOpacityProps,
  } from 'react-native';

  // Fix JSX component types for React 19 compatibility
  export interface ButtonProps extends TouchableOpacityProps {
    mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
    dark?: boolean;
    compact?: boolean;
    color?: string;
    buttonColor?: string;
    textColor?: string;
    rippleColor?: string;
    selected?: boolean;
    loading?: boolean;
    icon?: string | ((props: { size: number; color: string }) => ReactElement);
    disabled?: boolean;
    children: React.ReactNode;
    uppercase?: boolean;
    onPress?: () => void;
    contentStyle?: object;
    style?: object;
    labelStyle?: object;
  }

  export interface PaperTextInputProps {
    mode?: 'flat' | 'outlined';
    label?: string;
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    onBlur?: () => void;
    onFocus?: () => void;
    error?: boolean;
    disabled?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoComplete?: string;
    textContentType?: string;
    render?: (props: any) => ReactElement;
    left?: ReactElement;
    right?: ReactElement;
    style?: object;
    theme?: object;
  }

  export interface IconButtonProps extends TouchableOpacityProps {
    icon: string | ((props: { size: number; color: string }) => ReactElement);
    iconColor?: string;
    size?: number;
    disabled?: boolean;
    onPress?: () => void;
    style?: object;
    theme?: object;
  }

  export interface CardProps extends ViewProps {
    mode?: 'flat' | 'outlined' | 'contained';
    children: React.ReactNode;
    style?: object;
    contentStyle?: object;
    theme?: object;
  }

  export interface SurfaceProps extends ViewProps {
    mode?: 'flat' | 'elevated';
    elevation?: number;
    children: React.ReactNode;
    style?: object;
    theme?: object;
  }

  export interface DividerProps extends ViewProps {
    inset?: boolean;
    leftInset?: boolean;
    bold?: boolean;
    style?: object;
    theme?: object;
  }

  export interface PaperProps extends ViewProps {
    children: React.ReactNode;
    style?: object;
    theme?: object;
  }

  export interface TextProps {
    variant?:
      | 'displayLarge'
      | 'displayMedium'
      | 'displaySmall'
      | 'headlineLarge'
      | 'headlineMedium'
      | 'headlineSmall'
      | 'titleLarge'
      | 'titleMedium'
      | 'titleSmall'
      | 'labelLarge'
      | 'labelMedium'
      | 'labelSmall'
      | 'bodyLarge'
      | 'bodyMedium'
      | 'bodySmall';
    children: React.ReactNode;
    style?: object;
    theme?: object;
  }

  export interface SnackbarProps {
    visible: boolean;
    onDismiss: () => void;
    action?: {
      label: string;
      onPress: () => void;
    };
    duration?: number;
    children: React.ReactNode;
    style?: object;
    theme?: object;
  }

  export interface ActivityIndicatorProps {
    animating?: boolean;
    size?: number | 'small' | 'large';
    color?: string;
    style?: object;
    theme?: object;
  }

  export interface ChipProps {
    mode?: 'flat' | 'outlined';
    selected?: boolean;
    showSelectedCheck?: boolean;
    showSelectedOverlay?: boolean;
    disabled?: boolean;
    icon?: string | ((props: { size: number; color: string }) => ReactElement);
    avatar?: ReactElement;
    onPress?: () => void;
    onLongPress?: () => void;
    onClose?: () => void;
    closeIcon?: string | ReactElement;
    textStyle?: object;
    style?: object;
    theme?: object;
    testID?: string;
    children: React.ReactNode;
    compact?: boolean;
  }

  export interface IconProps {
    source: string | ((props: { size: number; color: string }) => ReactElement);
    size?: number;
    color?: string;
    style?: object;
    theme?: object;
  }

  export interface BottomNavigationProps {
    navigationState: {
      index: number;
      routes: Array<{
        key: string;
        title?: string;
        focusedIcon?: string;
        unfocusedIcon?: string;
      }>;
    };
    onIndexChange: (index: number) => void;
    renderScene?: ({
      route,
      jumpTo,
    }: {
      route: any;
      jumpTo: (key: string) => void;
    }) => ReactElement;
    renderIcon?: ({
      route,
      focused,
      color,
    }: {
      route: any;
      focused: boolean;
      color: string;
    }) => ReactElement;
    renderLabel?: ({
      route,
      focused,
      color,
    }: {
      route: any;
      focused: boolean;
      color: string;
    }) => ReactElement;
    renderTouchable?: (props: any) => ReactElement;
    getLabelText?: ({ route }: { route: any }) => string;
    getColor?: ({ route }: { route: any }) => string;
    getBadge?: ({ route }: { route: any }) => boolean | number | string;
    getAccessibilityLabel?: ({ route }: { route: any }) => string;
    getTestID?: ({ route }: { route: any }) => string;
    onTabPress?: ({
      route,
      preventDefault,
    }: {
      route: any;
      preventDefault: () => void;
    }) => void;
    activeColor?: string;
    inactiveColor?: string;
    keyboardHidesNavigationBar?: boolean;
    barStyle?: object;
    style?: object;
    theme?: object;
    safeAreaInsets?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
    labeled?: boolean;
    shifting?: boolean;
    compact?: boolean;
  }

  // Declare components as proper JSX components
  export const Button: ComponentType<ButtonProps>;
  export const TextInput: ComponentType<PaperTextInputProps> & {
    Icon: ComponentType<{
      name: string;
      size?: number;
      color?: string;
      icon?: string;
    }>;
  };
  export const IconButton: ComponentType<IconButtonProps>;
  export const Card: ComponentType<CardProps> & {
    Content: ComponentType<ViewProps & { children: React.ReactNode }>;
    Actions: ComponentType<ViewProps & { children: React.ReactNode }>;
  };
  export const Surface: ComponentType<SurfaceProps>;
  export const Divider: ComponentType<DividerProps>;
  export const Paper: ComponentType<PaperProps>;
  export const Text: ComponentType<TextProps>;
  export const Snackbar: ComponentType<SnackbarProps>;
  export const ActivityIndicator: ComponentType<ActivityIndicatorProps>;
  export const Chip: ComponentType<ChipProps>;
  export const Icon: ComponentType<IconProps>;
  export const BottomNavigation: ComponentType<BottomNavigationProps> & {
    Bar: ComponentType<BottomNavigationProps>;
    Icon: ComponentType<IconProps>;
  };

  // Provider and theme types
  export interface ThemeType {
    colors: {
      primary: string;
      onPrimary: string;
      primaryContainer: string;
      onPrimaryContainer: string;
      secondary: string;
      onSecondary: string;
      secondaryContainer: string;
      onSecondaryContainer: string;
      tertiary: string;
      onTertiary: string;
      tertiaryContainer: string;
      onTertiaryContainer: string;
      error: string;
      onError: string;
      errorContainer: string;
      onErrorContainer: string;
      background: string;
      onBackground: string;
      surface: string;
      onSurface: string;
      surfaceVariant: string;
      onSurfaceVariant: string;
      outline: string;
      outlineVariant: string;
      shadow: string;
      scrim: string;
      inverseSurface: string;
      inverseOnSurface: string;
      inversePrimary: string;
      elevation: {
        level0: string;
        level1: string;
        level2: string;
        level3: string;
        level4: string;
        level5: string;
      };
      surfaceDisabled: string;
      onSurfaceDisabled: string;
      backdrop: string;

      // Legacy colors for compatibility
      accent?: string;
      text?: string;
      disabled?: string;
      placeholder?: string;
      notification?: string;
    };
  }

  export interface PaperProviderProps {
    theme?: ThemeType;
    children: React.ReactNode;
  }

  export const PaperProvider: ComponentType<PaperProviderProps>;
  export const DefaultTheme: ThemeType;
  export const MD3LightTheme: ThemeType;
  export const MD3DarkTheme: ThemeType;

  // Theme configuration
  export interface MD3Theme extends ThemeType {
    fonts: any;
  }

  export function configureFonts(config: any): any;
}
