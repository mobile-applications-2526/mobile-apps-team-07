import React, { createContext, useContext } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Slot, useLocalSearchParams, useRouter, usePathname } from 'expo-router';
import { Ship, Route, FileText, Receipt, Home, Lock } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import DUMMY_BOATS from '@/data/dummy_boat_data.json';
import Boat from '@/types/boat';

// Context to share vessel data with child routes
const VesselContext = createContext<Boat | null>(null);
export const useVessel = () => useContext(VesselContext);

type TabItem = {
  name: string;
  route: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  requiresQ88: boolean;
  isCenter?: boolean;
};

const tabs: TabItem[] = [
  { name: 'Overview', route: 'index', icon: Ship, requiresQ88: false },
  { name: 'Voyages', route: 'voyages', icon: Route, requiresQ88: true },
  { name: 'Home', route: 'home', icon: Home, requiresQ88: false, isCenter: true },
  { name: 'Specs', route: 'specs', icon: FileText, requiresQ88: false },
  { name: 'Invoices', route: 'invoices', icon: Receipt, requiresQ88: true },
];

function TabBarItem({ 
  tab, 
  isActive, 
  isLocked, 
  onPress 
}: { 
  tab: TabItem; 
  isActive: boolean; 
  isLocked: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const activeColor = '#3b82f6';
  const inactiveColor = isDark ? '#6b7280' : '#9ca3af';
  const lockedColor = isDark ? '#4b5563' : '#d1d5db';
  
  const IconComponent = tab.icon;
  const iconColor = isLocked ? lockedColor : (isActive ? activeColor : inactiveColor);
  const textColor = isLocked ? lockedColor : (isActive ? activeColor : inactiveColor);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isLocked) {
      onPress();
    } else {
      // Show tooltip feedback for locked tabs
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  if (tab.isCenter) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        className="items-center justify-center -mt-4"
      >
        <View 
          className={`w-14 h-14 rounded-2xl items-center justify-center ${
            isActive ? 'bg-blue-500' : 'bg-white dark:bg-[#2c2c2e]'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 5,
          }}
        >
          <IconComponent size={26} color={isActive ? '#fff' : inactiveColor} />
        </View>
        <ThemedText 
          className="text-[10px] mt-1 font-medium"
          style={{ color: textColor }}
        >
          {tab.name}
        </ThemedText>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="flex-1 items-center justify-center py-2"
    >
      <View className="relative">
        <IconComponent size={24} color={iconColor} />
        {isLocked && (
          <View className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 dark:bg-gray-600 rounded-full items-center justify-center">
            <Lock size={8} color="#fff" />
          </View>
        )}
      </View>
      <ThemedText 
        className="text-[10px] mt-0.5 font-medium"
        style={{ color: textColor }}
        numberOfLines={1}
      >
        {tab.name}
      </ThemedText>
    </TouchableOpacity>
  );
}

export default function VesselLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  const boat = (DUMMY_BOATS as Boat[]).find((b) => b.id === id);
  const hasQ88 = boat?.hasQ88 ?? false;

  // Determine current active tab from pathname
  const getCurrentTab = () => {
    if (pathname.includes('/voyages')) return 'voyages';
    if (pathname.includes('/specs')) return 'specs';
    if (pathname.includes('/invoices')) return 'invoices';
    // Default to index (Overview) for vessel/[id] base route
    return 'index';
  };
  
  const currentTab = getCurrentTab();

  const handleTabPress = (tab: TabItem) => {
    if (tab.route === 'home') {
      // Navigate back to fleet list (main home screen)
      router.push('/(tabs)' as any);
    } else if (tab.route === 'index') {
      // Navigate to vessel overview (index)
      router.push(`/vessel/${id}` as any);
    } else {
      router.push(`/vessel/${id}/${tab.route}` as any);
    }
  };

  if (!boat) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ThemedText>Vessel not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <VesselContext.Provider value={boat}>
      <ThemedView className="flex-1">
        {/* Content */}
        <Slot />

        {/* Bottom Navigation Bar */}
        <View 
          className="bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-gray-800"
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="flex-row items-end justify-around h-16 px-2">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.route;
              const isLocked = tab.requiresQ88 && !hasQ88 && tab.route !== 'specs';
              
              return (
                <TabBarItem
                  key={tab.route}
                  tab={tab}
                  isActive={isActive}
                  isLocked={isLocked}
                  onPress={() => handleTabPress(tab)}
                />
              );
            })}
          </View>
        </View>
      </ThemedView>
    </VesselContext.Provider>
  );
}
