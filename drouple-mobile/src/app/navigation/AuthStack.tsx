/**
 * Authentication Stack Navigator
 * Handles sign-in and onboarding flows
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SignInScreen, OnboardingScreen } from '@/features/auth/screens';
import { useAuthStore } from '@/lib/store/authStore';

const Stack = createNativeStackNavigator();

export const AuthStack: React.FC = () => {
  const { isAuthenticated, hasCompletedOnboarding, signIn } = useAuthStore();

  const handleSignInSuccess = async (user: any, tokens: any) => {
    await signIn(user, tokens);
  };

  const handleOnboardingComplete = () => {
    // Navigation will automatically switch to AppTabs due to hasCompletedOnboarding change
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        <Stack.Screen name='SignIn'>
          {props => (
            <SignInScreen {...props} onSignInSuccess={handleSignInSuccess} />
          )}
        </Stack.Screen>
      ) : !hasCompletedOnboarding ? (
        <Stack.Screen name='Onboarding'>
          {props => (
            <OnboardingScreen
              {...props}
              onComplete={handleOnboardingComplete}
            />
          )}
        </Stack.Screen>
      ) : null}
    </Stack.Navigator>
  );
};

export default AuthStack;
