import React from 'react';
import { View, Pressable } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter, usePathname, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ship, Route, Home, FileText, Receipt, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHaptics } from '@/hooks';
import { useVesselDetails } from '@/context/VesselDetailsContext';
import { ThemedText } from '@/components/common';

export type TabItem = {
    route: string;
    label: string;
    icon: any;
    isCenter?: boolean;
};

export const tabs: TabItem[] = [
    { route: 'index', label: 'Overview', icon: Ship },
    { route: 'voyages', label: 'Voyages', icon: Route },
    { route: 'home', label: 'Home', icon: Home, isCenter: true },
    { route: 'specs', label: 'Specs', icon: FileText },
    { route: 'invoices', label: 'Invoices', icon: Receipt },
];

function TabBarItem({
    tab,
    isActive,
    isLocked,
    onPress,
    haptics
}: {
    tab: TabItem;
    isActive: boolean;
    isLocked: boolean;
    onPress: () => void;
    haptics: any;
}) {
    const Icon = tab.icon;
    const color = isActive ? '#3b82f6' : isLocked ? '#9ca3af' : '#6b7280';

    const handlePressIn = () => {
        if (!isLocked && !isActive) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (isLocked) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
    };

    if (tab.route === 'home') {
        return (
            <View className="flex-1 items-center justify-end pb-2 relative">
                <Pressable
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    className="items-center absolute bottom-7"
                    style={{ zIndex: 50 }}
                >
                    <View
                        className="w-12 h-12 rounded-[22px] items-center justify-center bg-white dark:bg-[#2c2c2e] border-[4px] border-gray-100 dark:border-[#000]"
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.2,
                            shadowRadius: 8,
                            elevation: 8,
                        }}
                    >
                        <Icon size={24} color={isActive ? '#3b82f6' : (color === '#3b82f6' ? '#3b82f6' : color)} />
                    </View>
                </Pressable>

                <ThemedText
                    className="text-[10px] font-medium"
                    style={{ color }}
                    numberOfLines={1}
                >
                    {tab.label}
                </ThemedText>
            </View>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            className="flex-1 items-center justify-end h-full pb-2"
            style={{ opacity: isLocked ? 0.5 : 1 }}
        >
            <View className="items-center justify-center mb-1">
                {isLocked ? (
                    <View className="relative">
                        <Icon size={24} color={color} />
                        <View className="absolute -top-1 -right-2 bg-gray-100 dark:bg-gray-800 rounded-full p-0.5">
                            <Lock size={10} color={color} />
                        </View>
                    </View>
                ) : (
                    <Icon size={24} color={color} />
                )}
            </View>
            <ThemedText
                className="text-[10px] font-medium"
                style={{ color }}
            >
                {tab.label}
            </ThemedText>
        </Pressable>
    );
}

export function VesselTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const haptics = useHaptics();
    const pathname = usePathname();

    const {
        vessel,
        isLoading,
        isLocked: missingDocs
    } = useVesselDetails();


    // Screen Redirect Logic
    // Only redirect to specs if documents are missing and we are trying to view a locked tab (like index/Overview)
    // Since we are inside the TabBar, we can check the current index.
    React.useEffect(() => {
        if (!id || isLoading || !vessel) return;

        // If documents are missing, and we are on the 'index' (Overview) tab (which is index 0 usually, or find by name),
        // we should redirect to 'specs'.
        const currentRouteName = state.routes[state.index]?.name;

        // If we are on Overview (index), Voyages, or Invoices, and docs are missing -> go to Specs.
        if (missingDocs && ['index', 'voyages', 'invoices'].includes(currentRouteName)) {
            navigation.navigate('specs');
        }
    }, [id, missingDocs, isLoading, vessel, state.index, state.routes, navigation]);

    if (isLoading) {
        return (
            <View className="h-[55px] bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-gray-800" style={{ marginBottom: insets.bottom }} />
        );
    }

    return (
        <View
            className="bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-gray-800"
            style={{ paddingBottom: insets.bottom }}
        >
            <View className="flex-row items-end justify-around h-[55px] px-2">
                {tabs.map((tab) => {
                    // Find if this tab corresponds to a route in the navigator
                    const route = state.routes.find(r => r.name === tab.route);
                    const isFocused = route ? state.routes[state.index].key === route.key : false;

                    // 'home' isn't in state.routes, so it's never focused by nav state.
                    const isActive = tab.route === 'home' ? false : isFocused;

                    // Lock Overview, Voyages, and Invoices tabs until required documents are uploaded
                    const isLocked = missingDocs && !tab.isCenter && tab.route !== 'specs';

                    const handlePress = () => {
                        // Handle Home specially
                        if (tab.route === 'home') {
                            router.dismissTo('/(tabs)');
                            return;
                        }

                        // If locked, TabBarItem handles the warning haptic, we just don't navigate.
                        if (isLocked) return;

                        // If already active, don't navigate (haptics handled by TabBarItem)
                        if (isActive) return;

                        // Navigate to the tab
                        if (route) {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name, route.params);
                            }
                        }
                    };

                    return (
                        <TabBarItem
                            key={tab.route}
                            tab={tab}
                            isActive={isActive}
                            isLocked={isLocked}
                            onPress={handlePress}
                            haptics={haptics}
                        />
                    );
                })}
            </View>
        </View>
    );
}
