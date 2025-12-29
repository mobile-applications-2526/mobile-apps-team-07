import { cn } from '@/lib/utils';
import * as Slot from '@rn-primitives/slot';
import * as React from 'react';
import { View as RNView } from 'react-native';

interface ViewProps extends React.ComponentProps<typeof RNView> {
  asChild?: boolean;
}

function View({ className, asChild = false, ...props }: ViewProps) {
  const Component = asChild ? Slot.View : RNView;
  return <Component className={cn('bg-background', className)} {...props} />;
}

export { View };
