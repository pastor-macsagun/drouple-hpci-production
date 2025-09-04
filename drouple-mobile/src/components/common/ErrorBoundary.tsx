/**
 * Error Boundary Component
 * Catches JavaScript errors and displays fallback UI
 */

import React, { Component, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { colors } from '@/theme/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // TODO: Log to crash reporting service (Sentry, etc.)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Surface style={styles.errorSurface} elevation={2}>
            <Text variant='headlineSmall' style={styles.title}>
              Oops! Something went wrong
            </Text>

            <Text variant='bodyMedium' style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>

            <Button
              mode='contained'
              onPress={this.handleReset}
              style={styles.button}
            >
              Try Again
            </Button>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text variant='labelSmall' style={styles.debugTitle}>
                  Debug Info:
                </Text>
                <Text variant='bodySmall' style={styles.debugText}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
          </Surface>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background.main,
  },
  errorSurface: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
    color: colors.error.main,
  },
  message: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  button: {
    marginBottom: 16,
  },
  debugContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: colors.surface.variant,
    borderRadius: 8,
    width: '100%',
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text.primary,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default ErrorBoundary;
