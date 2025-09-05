import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Loading } from '@/components/common';

export default function IndexPage() {
  const { isAuthenticated, isLoading, checkAuth } = useAuth();

  useEffect(() => {
    // Double-check auth status on app start
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Loading message="Loading HPCI ChMS..." size="large" />
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/signin" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});