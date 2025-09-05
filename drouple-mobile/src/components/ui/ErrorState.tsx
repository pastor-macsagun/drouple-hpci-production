/**
 * Error State - Gentle error handling with retry
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-6xl mb-4">😔</Text>
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
        Something went wrong
      </Text>
      <Text className="text-gray-600 text-center mb-6 leading-6">
        {message}
      </Text>
      
      {onRetry && (
        <Pressable
          onPress={onRetry}
          className="px-6 py-3 bg-blue-600 rounded-lg active:bg-blue-700"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </Pressable>
      )}
      
      <Text className="text-gray-500 text-sm text-center mt-4">
        If this continues, please contact your church tech team
      </Text>
    </View>
  );
}