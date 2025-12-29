/**
 * FeatureLockScreen Component
 * 
 * A reusable component to display when a feature is locked due to missing requirements.
 */

import { View } from '@/components/ui/View';
import { Text } from '@/components/ui/Text';
import { Icon, type IconProps } from '@/components/ui/Icon';
import { Lock } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

interface FeatureLockScreenProps {
  /** Title displayed to the user */
  title?: string;
  /** Message explaining why the feature is locked */
  message: string;
  /** Optional custom icon component (defaults to Lock) */
  icon?: LucideIcon;
  /** Optional icon size (defaults to 40) */
  iconSize?: number;
  /** Optional action component to display below the message */
  action?: React.ReactNode;
}

export function FeatureLockScreen({
  title = 'Feature Locked',
  message,
  icon: IconComponent = Lock,
  iconSize = 40,
  action,
}: FeatureLockScreenProps) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
        <Icon as={IconComponent} size={iconSize} className="text-gray-400" />
      </View>
      <Text variant="h4" className="mb-2 text-center">
        {title}
      </Text>
      <Text variant="muted" className="text-center mb-4">
        {message}
      </Text>
      {action}
    </View>
  );
}
