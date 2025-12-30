import { ActivityIndicator, View, Text } from 'react-native';

export function Loader({ text }: { text?: string }) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#3b82f6" />
      {text && <Text className="mt-4 text-gray-500 dark:text-gray-400 font-medium">{text}</Text>}
    </View>
  );
}
