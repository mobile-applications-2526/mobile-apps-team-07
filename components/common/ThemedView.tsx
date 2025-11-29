/**
 * ThemedView Component
 * 
 * A view component that supports theming.
 */

import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';

export type ThemedViewProps = ViewProps & {
  className?: string;
};

export function ThemedView({ className, ...otherProps }: ThemedViewProps) {
  return <View className={cn('bg-background', className)} {...otherProps} />;
}
