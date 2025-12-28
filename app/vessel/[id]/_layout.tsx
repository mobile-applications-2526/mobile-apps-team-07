import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VesselDetailsProvider, { useVesselDetails } from '@/context/VesselDetailsContext';
import { VesselTabBar } from '@/components/navigation/VesselTabBar';



function VesselTabsContent() {
  const { isLoading, isInitialized, isLocked } = useVesselDetails();
  const insets = useSafeAreaInsets();

  // Wait for data to be initialized before rendering tabs
  // This ensures we know the correct initial route based on document status
  if (!isInitialized || isLoading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-gray-100 dark:bg-[#000]"
        style={{ paddingTop: insets.top }}
      >
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const missingDocs = isLocked;

  // Set initial route name based on document status
  const initialRouteName = missingDocs ? 'specs' : 'index';

  return (
    <Tabs
      tabBar={props => <VesselTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
      // @ts-ignore - initialRouteName is valid but types may not reflect it
      initialRouteName={initialRouteName}
    >
      <Tabs.Screen name="index" options={{ title: 'Overview' }} />
      <Tabs.Screen name="voyages" options={{ title: 'Voyages' }} />
      <Tabs.Screen name="specs" options={{ title: 'Specs' }} />
      <Tabs.Screen name="invoices" options={{ title: 'Invoices' }} />
      {/* Home is not a screen here */}
    </Tabs>
  );
}

export default function VesselLayout() {
  return (
    <VesselDetailsProvider>
      <VesselTabsContent />
    </VesselDetailsProvider>
  );
}
