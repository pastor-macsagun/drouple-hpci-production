// Type declarations for modules without built-in types

declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<boolean>;
  export function hideAsync(): Promise<boolean>;
  export function setOptions(options: {
    duration?: number;
    fade?: boolean;
  }): void;
}

declare module 'expo-status-bar' {
  import { ComponentType } from 'react';
  
  interface StatusBarProps {
    style?: 'auto' | 'inverted' | 'light' | 'dark';
    backgroundColor?: string;
    translucent?: boolean;
    hidden?: boolean;
    networkActivityIndicatorVisible?: boolean;
    animated?: boolean;
  }
  
  export const StatusBar: ComponentType<StatusBarProps>;
}

declare module 'react-native-gesture-handler' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewProps } from 'react-native';
  
  export const GestureHandlerRootView: ComponentType<ViewProps>;
}

declare module 'react-native-gesture-handler/Swipeable' {
  import { ComponentType, ReactNode } from 'react';
  import { Animated, ViewStyle } from 'react-native';
  
  interface SwipeableProps {
    children: ReactNode;
    renderLeftActions?: (
      progressAnimatedValue: Animated.AnimatedValue,
      dragAnimatedValue: Animated.AnimatedValue
    ) => ReactNode;
    renderRightActions?: (
      progressAnimatedValue: Animated.AnimatedValue,
      dragAnimatedValue: Animated.AnimatedValue
    ) => ReactNode;
    onSwipeableOpen?: (direction: 'left' | 'right') => void;
    onSwipeableClose?: (direction: 'left' | 'right') => void;
    rightThreshold?: number;
    leftThreshold?: number;
    containerStyle?: ViewStyle;
    childrenContainerStyle?: ViewStyle;
  }
  
  const Swipeable: ComponentType<SwipeableProps>;
  export default Swipeable;
}

declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    type: string;
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    details: any;
  }
  
  export interface NetInfoSubscription {
    (): void;
  }
  
  const NetInfo: {
    addEventListener: (listener: (state: NetInfoState) => void) => NetInfoSubscription;
    fetch: () => Promise<NetInfoState>;
  };
  export default NetInfo;
}

declare module 'react-native-mmkv' {
  export class MMKV {
    constructor(options?: { id?: string; path?: string; encryptionKey?: string });
    
    set(key: string, value: string | number | boolean): void;
    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    delete(key: string): void;
    clearAll(): void;
    getAllKeys(): string[];
  }
  
  export const storage: MMKV;
}

declare module '@tanstack/react-query-persist-client' {
  import { QueryClient } from '@tanstack/react-query';
  import { ReactNode } from 'react';
  
  export interface Persister {
    persistClient(persistClient: PersistedClient): Promise<void>;
    restoreClient(): Promise<PersistedClient | undefined>;
    removeClient(): Promise<void>;
  }
  
  export interface PersistedClient {
    clientState: any;
    buster: string;
  }
  
  export interface PersistQueryClientProviderProps {
    client: QueryClient;
    persistOptions: {
      persister: Persister;
      maxAge?: number;
      hydrateOptions?: any;
      dehydrateOptions?: any;
    };
    children: ReactNode;
  }
  
  export const PersistQueryClientProvider: React.FC<PersistQueryClientProviderProps>;
  
  export function createSyncStoragePersister(options: {
    storage: {
      getItem: (key: string) => string | null;
      setItem: (key: string, value: string) => void;
      removeItem: (key: string) => void;
    };
    key?: string;
    serialize?: (data: PersistedClient) => string;
    deserialize?: (data: string) => PersistedClient;
  }): Persister;
}