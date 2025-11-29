/**
 * ThemedText Component
 * 
 * A text component that supports theming and various text styles.
 */

import { Text, type TextProps } from 'react-native';
import { cn } from '@/lib/utils';

export type ThemedTextProps = TextProps & {
  className?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  className,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      className={cn(
        'text-foreground',
        type === 'default' && 'text-base leading-6',
        type === 'title' && 'text-[32px] font-bold leading-8',
        type === 'defaultSemiBold' && 'text-base leading-6 font-semibold',
        type === 'subtitle' && 'text-xl font-bold',
        type === 'link' && 'text-base leading-[30px] text-[#0a7ea4]',
        className
      )}
      {...rest}
    />
  );
}
