import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { VesselProvider } from '@/context/VesselContext';
import { databaseService } from '@/services';
import { ToastProvider } from '@/context/ToastContext';
import { NetworkStatusProvider } from '@/context/NetworkStatusContext';
import { AuthProvider } from '@/context/AuthContext';
import { useEffect } from 'react';
import 'react-native-reanimated';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  // Initialize database on app startup
  useEffect(() => {
    databaseService.initializeDatabase().catch(err => {
      console.error('Failed to initialize database:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <ToastProvider>
            <NetworkStatusProvider>
              <AuthProvider>
                <VesselProvider>
                  <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
                    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                    <Stack initialRouteName="index">
                      <Stack.Screen name="index" options={{ headerShown: false }} />
                      <Stack.Screen name="sign-in" options={{ headerShown: false, presentation: 'card' }} />
                      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                      <Stack.Screen name="vessel/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
                      <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
                      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                    </Stack>
                    <PortalHost />
                  </ThemeProvider>
                </VesselProvider>
              </AuthProvider>
            </NetworkStatusProvider>
          </ToastProvider>
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
