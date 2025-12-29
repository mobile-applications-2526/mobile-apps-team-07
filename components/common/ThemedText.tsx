/**
 * ThemedText Component
 * 
 * @deprecated Use `Text` from '@/components/ui/Text' instead.
 * This wrapper is maintained for backward compatibility.
 */

import { Text } from '@/components/ui/Text';
import type { ComponentProps } from 'react';

export type ThemedTextProps = Omit<ComponentProps<typeof Text>, 'variant'> & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  type = 'default',
  ...rest
}: ThemedTextProps) {
  return <Text variant={type} {...rest} />;
}
