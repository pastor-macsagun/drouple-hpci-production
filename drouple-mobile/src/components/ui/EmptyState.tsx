/**
 * Empty State - Calm, pastoral guidance when no data
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon = '📋', 
  title, 
  message, 
  actionText, 
  onAction 
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-6xl mb-4">{icon}</Text>
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
        {title}
      </Text>
      <Text className="text-gray-600 text-center mb-6 leading-6">
        {message}
      </Text>
      
      {actionText && onAction && (
        <Pressable
          onPress={onAction}
          className="px-6 py-3 bg-blue-600 rounded-lg active:bg-blue-700"
        >
          <Text className="text-white font-semibold">{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
}