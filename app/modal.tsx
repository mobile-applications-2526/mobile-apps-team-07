import { Link } from 'expo-router';
import { ThemedText, ThemedView } from '@/components/common';

export default function ModalScreen() {
  return (
    <ThemedView className="flex-1 items-center justify-center p-5">
      <ThemedText type="title">This is a modal</ThemedText>
      <Link href="/" dismissTo className="mt-4 py-4">
        <ThemedText type="link">Go to home screen</ThemedText>
      </Link>
    </ThemedView>
  );
}
