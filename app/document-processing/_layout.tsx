import { Stack } from 'expo-router';

export default function DocumentProcessingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="upload" />
      <Stack.Screen name="processing" />
      <Stack.Screen name="review" />
    </Stack>
  );
}
