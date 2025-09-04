/**
 * SignIn Screen
 * Authentication entry point with email/password login
 * Includes form validation, biometric quick-unlock, and error handling
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Button,
  Card,
  IconButton,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { authApi } from '@/lib/api';
import { colors } from '@/theme/colors';
import type { LoginCredentials } from '@/types/auth';

// Validation schema
const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

type SignInFormData = z.infer<typeof signInSchema>;

interface SignInScreenProps {
  onSignInSuccess: (user: any, tokens: any) => void;
  onBiometricLogin?: () => void;
  biometricAvailable?: boolean;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onSignInSuccess,
  onBiometricLogin,
  biometricAvailable = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema as any),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
        deviceInfo: {
          deviceId: 'mobile-device-id', // TODO: Get actual device ID
          deviceName: 'Mobile App',
          platform: Platform.OS as 'ios' | 'android',
          version: '1.0.0',
        },
      });

      if (response.success && response.data) {
        // Clear form
        reset();

        // Call success handler with user and token data
        onSignInSuccess(response.data.user, {
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: new Date(response.data.expiresAt).getTime(),
          tokenType: 'Bearer' as const,
        });
      } else {
        const errorMsg = response.message || response.error || 'Login failed';
        setErrorMessage(errorMsg);

        // Show alert for critical errors
        if (response.error === 'INVALID_CREDENTIALS') {
          Alert.alert(
            'Invalid Credentials',
            'Please check your email and password and try again.',
            [{ text: 'OK' }]
          );
        } else if (response.error === 'ACCOUNT_INACTIVE') {
          Alert.alert(
            'Account Inactive',
            'Your account has been deactivated. Please contact your administrator.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Network error occurred';
      setErrorMessage(errorMsg);

      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    if (onBiometricLogin) {
      try {
        setIsLoading(true);
        await onBiometricLogin();
      } catch (error) {
        Alert.alert(
          'Biometric Authentication Failed',
          'Please try signing in with your email and password.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant='headlineMedium' style={styles.title}>
              Welcome to Drouple
            </Text>
            <Text variant='bodyLarge' style={styles.subtitle}>
              Sign in to your church account
            </Text>
          </View>

          {/* Sign In Form */}
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              {/* Email Field */}
              <Controller
                control={control}
                name='email'
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder='Email Address'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode='outlined'
                    keyboardType='email-address'
                    autoCapitalize='none'
                    autoComplete='email'
                    textContentType='emailAddress'
                    error={!!errors.email}
                    disabled={isLoading}
                    style={styles.input}
                    left={<TextInput.Icon name='email' />}
                  />
                )}
              />
              {errors.email && (
                <Text variant='bodySmall' style={styles.errorText}>
                  {errors.email.message}
                </Text>
              )}

              {/* Password Field */}
              <Controller
                control={control}
                name='password'
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    placeholder='Password'
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode='outlined'
                    secureTextEntry={!showPassword}
                    autoComplete='current-password'
                    textContentType='password'
                    error={!!errors.password}
                    disabled={isLoading}
                    style={styles.input}
                    left={<TextInput.Icon name='lock' />}
                    right={
                      <IconButton
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                )}
              />
              {errors.password && (
                <Text variant='bodySmall' style={styles.errorText}>
                  {errors.password.message}
                </Text>
              )}

              {/* Sign In Button */}
              <Button
                mode='contained'
                onPress={handleSubmit(onSubmit)}
                disabled={isLoading || !isValid}
                style={styles.signInButton}
                contentStyle={styles.buttonContent}
                loading={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>

              {/* Biometric Login */}
              {biometricAvailable && (
                <View style={styles.biometricContainer}>
                  <Text variant='bodySmall' style={styles.dividerText}>
                    or
                  </Text>
                  <IconButton
                    icon='fingerprint'
                    size={32}
                    onPress={handleBiometricLogin}
                    disabled={isLoading}
                    style={styles.biometricButton}
                  />
                  <Text variant='bodySmall' style={styles.biometricText}>
                    Use biometric authentication
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant='bodySmall' style={styles.footerText}>
              Need help signing in? Contact your church administrator.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!errorMessage}
        onDismiss={() => setErrorMessage(null)}
        duration={4000}
        style={styles.snackbar}
      >
        {errorMessage}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    color: colors.primary.main,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: colors.error.main,
    marginBottom: 12,
    marginLeft: 4,
  },
  signInButton: {
    marginTop: 16,
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 4,
  },
  biometricContainer: {
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.main,
  },
  dividerText: {
    color: colors.text.secondary,
    marginBottom: 12,
  },
  biometricButton: {
    marginBottom: 8,
  },
  biometricText: {
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerText: {
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  snackbar: {
    backgroundColor: colors.error.main,
  },
});

export default SignInScreen;
