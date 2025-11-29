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
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  // --- CENTER (HOME) TAB ---
  if (tab.isCenter) {
    return (
      <View className="flex-1 items-center justify-end pb-2 relative z-10">
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          // Absolute positioning here pulls the button UP out of the navbar flow
          // bottom-6 pushes it 24px up from the text label
          className="items-center absolute bottom-7"
          style={{
            zIndex: 50,
          }}
        >
          <View 
            // Made significantly bigger (w-16 h-16)
            className="w-12 h-12 rounded-[22px] items-center justify-center bg-white dark:bg-[#2c2c2e] border-[4px] border-gray-100 dark:border-[#000]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <IconComponent size={24} color={isActive ? activeColor : inactiveColor} />
          </View>
        </TouchableOpacity>
        
        {/* Label stays in the flow to maintain alignment with other tabs */}
        <ThemedText 
          className="text-[10px] font-medium mt-1"
          style={{ color: isActive ? activeColor : inactiveColor }}
          numberOfLines={1}
        >
          {tab.name}
        </ThemedText>
      </View>
    );
  }

  // --- STANDARD TAB ---
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      // Ensure flex-1, justify-end, and pb-2 match the Center tab's container
      // to keep text vertically aligned
      className="flex-1 items-center justify-end pb-2"
    >
      <View className="relative mb-1">
        <IconComponent size={24} color={iconColor} />
        {isLocked && (
          <View className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 dark:bg-gray-600 rounded-full items-center justify-center">
            <Lock size={8} color="#fff" />
          </View>
        )}
      </View>
      <ThemedText 
        className="text-[10px] font-medium"
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

  const getCurrentTab = () => {
    if (pathname.includes('/voyages')) return 'voyages';
    if (pathname.includes('/specs')) return 'specs';
    if (pathname.includes('/invoices')) return 'invoices';
    return 'index';
  };
  
  const currentTab = getCurrentTab();

  const handleTabPress = (tab: TabItem) => {
    if (tab.route === 'home') {
      router.dismissTo('/');
    } else if (tab.route === 'index') {
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
        <Slot />

        <View 
          className="bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-gray-800"
          style={{ paddingBottom: insets.bottom }}
        >
          {/* Shrunk height from h-16 (64px) to h-[55px] */}
          <View className="flex-row items-end justify-around h-[55px] px-2">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.route;
              // 'home' isn't a route inside the vessel ID, so it's only active if explicitly handled, 
              // but visually we might want it neutral unless we are actually on a "Home" screen inside here.
              // For now, Home is just a navigation action button.
              const isCenterActive = tab.route === 'home' ? false : isActive; 
              
              const isLocked = tab.requiresQ88 && !hasQ88 && tab.route !== 'specs';
              
              return (
                <TabBarItem
                  key={tab.route}
                  tab={tab}
                  isActive={isCenterActive}
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
