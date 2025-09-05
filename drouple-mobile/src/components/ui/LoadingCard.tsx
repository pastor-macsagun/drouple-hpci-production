/**
 * Loading Card - Skeleton loading state
 */

import React from 'react';
import { View } from 'react-native';

interface LoadingCardProps {
  height?: number;
  className?: string;
}

export function LoadingCard({ height = 100, className = '' }: LoadingCardProps) {
  return (
    <View 
      className={`bg-gray-200 rounded-lg animate-pulse ${className}`}
      style={{ height }}
    />
  );
}