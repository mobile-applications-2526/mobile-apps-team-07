/**
 * ThemedView Component
 * 
 * @deprecated Use `View` from '@/components/ui/View' instead.
 * This wrapper is maintained for backward compatibility.
 */

import { View } from '@/components/ui/View';
import type { ComponentProps } from 'react';

export type ThemedViewProps = ComponentProps<typeof View>;

export function ThemedView(props: ThemedViewProps) {
  return <View {...props} />;
}
