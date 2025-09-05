/**
 * Secure Storage Wrapper using Expo SecureStore
 */

import * as SecureStore from 'expo-secure-store';

export async function setSecureItem(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.error(`Failed to store secure item ${key}:`, error);
    throw error;
  }
}

export async function getSecureItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error(`Failed to retrieve secure item ${key}:`, error);
    return null;
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (error) {
    console.error(`Failed to delete secure item ${key}:`, error);
    throw error;
  }
}

export async function clearAllSecureItems(): Promise<void> {
  const keys = ['auth_token', 'refresh_token', 'user_id'];
  await Promise.all(keys.map(key => deleteSecureItem(key)));
}