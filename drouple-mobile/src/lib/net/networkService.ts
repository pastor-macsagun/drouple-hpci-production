/**
 * Network Service
 * Monitors network connectivity and manages connection state
 * Provides utilities for handling offline/online scenarios
 */

import * as Network from 'expo-network';
import NetInfo from '@react-native-community/netinfo';

export interface NetworkState {
  isConnected: boolean;
  type: string;
  isWiFi: boolean;
  isCellular: boolean;
  isInternetReachable: boolean | null;
}

export interface ConnectionChangeListener {
  (isConnected: boolean, networkState: NetworkState): void;
}

export class NetworkService {
  private static listeners: ConnectionChangeListener[] = [];
  private static lastState: NetworkState | null = null;
  private static unsubscribeNetInfo?: () => void;

  /**
   * Initialize network monitoring
   */
  static async initialize(): Promise<void> {
    try {
      // Set up NetInfo listener for real-time updates
      this.unsubscribeNetInfo = NetInfo.addEventListener(state => {
        const networkState: NetworkState = {
          isConnected: !!state.isConnected,
          type: state.type || 'unknown',
          isWiFi: state.type === 'wifi',
          isCellular: state.type === 'cellular',
          isInternetReachable: state.isInternetReachable,
        };

        // Only notify if state changed
        if (
          !this.lastState ||
          this.lastState.isConnected !== networkState.isConnected ||
          this.lastState.type !== networkState.type
        ) {
          console.log('Network state changed:', networkState);
          this.lastState = networkState;

          // Notify all listeners
          this.listeners.forEach(listener => {
            try {
              listener(networkState.isConnected, networkState);
            } catch (error) {
              console.error('Error in network change listener:', error);
            }
          });
        }
      });

      // Get initial state
      const initialState = await NetInfo.fetch();
      this.lastState = {
        isConnected: !!initialState.isConnected,
        type: initialState.type || 'unknown',
        isWiFi: initialState.type === 'wifi',
        isCellular: initialState.type === 'cellular',
        isInternetReachable: initialState.isInternetReachable,
      };

      console.log('NetworkService initialized with state:', this.lastState);
    } catch (error) {
      console.error('Failed to initialize NetworkService:', error);
      // Fallback to basic connectivity check
      this.lastState = {
        isConnected: true, // Assume connected if we can't check
        type: 'unknown',
        isWiFi: false,
        isCellular: false,
        isInternetReachable: null,
      };
    }
  }

  /**
   * Check if device is currently connected to internet
   */
  static async isConnected(): Promise<boolean> {
    try {
      // Use cached state if available and recent
      if (this.lastState) {
        return this.lastState.isConnected;
      }

      // Fall back to fresh network check
      const networkState = await Network.getNetworkStateAsync();
      return (
        networkState.isConnected === true &&
        networkState.isInternetReachable === true
      );
    } catch (error) {
      console.error('Error checking network connectivity:', error);
      // Conservative approach: assume not connected if check fails
      return false;
    }
  }

  /**
   * Get detailed network state
   */
  static async getNetworkState(): Promise<NetworkState> {
    try {
      if (this.lastState) {
        return this.lastState;
      }

      // Fresh check if no cached state
      const state = await NetInfo.fetch();

      const networkState: NetworkState = {
        isConnected: !!state.isConnected,
        type: state.type || 'unknown',
        isWiFi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isInternetReachable: state.isInternetReachable,
      };

      this.lastState = networkState;
      return networkState;
    } catch (error) {
      console.error('Error getting network state:', error);
      return {
        isConnected: false,
        type: 'unknown',
        isWiFi: false,
        isCellular: false,
        isInternetReachable: false,
      };
    }
  }

  /**
   * Add listener for connection changes
   */
  static addConnectionChangeListener(listener: ConnectionChangeListener): void {
    this.listeners.push(listener);

    // If we have a current state, notify the new listener immediately
    if (this.lastState) {
      try {
        listener(this.lastState.isConnected, this.lastState);
      } catch (error) {
        console.error('Error in connection change listener:', error);
      }
    }
  }

  /**
   * Remove specific connection change listener
   */
  static removeConnectionChangeListener(
    listener: ConnectionChangeListener
  ): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Remove all connection change listeners
   */
  static removeAllConnectionChangeListeners(): void {
    this.listeners = [];
  }

  /**
   * Test internet connectivity by making a request
   */
  static async testInternetConnectivity(timeout = 5000): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Internet connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Check if connection is metered (cellular/limited data)
   */
  static async isMeteredConnection(): Promise<boolean> {
    try {
      const state = await this.getNetworkState();
      return state.isCellular;
    } catch (error) {
      console.error('Error checking metered connection:', error);
      return false;
    }
  }

  /**
   * Check if WiFi is available
   */
  static async isWiFiConnected(): Promise<boolean> {
    try {
      const state = await this.getNetworkState();
      return state.isWiFi;
    } catch (error) {
      console.error('Error checking WiFi connection:', error);
      return false;
    }
  }

  /**
   * Get connection type string for logging/analytics
   */
  static getConnectionTypeString(networkState?: NetworkState): string {
    const state = networkState || this.lastState;
    if (!state) return 'unknown';

    if (!state.isConnected) return 'offline';
    if (state.isWiFi) return 'wifi';
    if (state.isCellular) return 'cellular';
    return state.type || 'unknown';
  }

  /**
   * Wait for internet connection
   */
  static async waitForConnection(timeout = 30000): Promise<boolean> {
    return new Promise(resolve => {
      const startTime = Date.now();

      const checkConnection = async () => {
        if (Date.now() - startTime > timeout) {
          resolve(false);
          return;
        }

        const isConnected = await this.isConnected();
        if (isConnected) {
          resolve(true);
          return;
        }

        // Check again in 1 second
        setTimeout(checkConnection, 1000);
      };

      checkConnection();
    });
  }

  /**
   * Cleanup network monitoring
   */
  static cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = undefined;
    }

    this.listeners = [];
    this.lastState = null;

    console.log('NetworkService cleanup complete');
  }

  /**
   * Get network statistics (for debugging)
   */
  static getStats() {
    return {
      listenerCount: this.listeners.length,
      lastState: this.lastState,
      hasNetInfoListener: !!this.unsubscribeNetInfo,
    };
  }
}

// Auto-initialize when module loads
NetworkService.initialize().catch(error => {
  console.error('Failed to auto-initialize NetworkService:', error);
});

export default NetworkService;
