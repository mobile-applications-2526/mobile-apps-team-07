import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Switch, Platform, ActionSheetIOS, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText, ThemedView } from '@/components/common';
import { useSession } from '@/context/AuthContext';
import { ChevronLeft, LogOut, User, Mail, Shield, Globe, Moon, Sun, Check, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function SettingsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { session, signOut, user } = useSession();
    const { colorScheme, setColorScheme } = useColorScheme();
    const [language, setLanguage] = useState<'en' | 'ar'>('en');

    // Theme toggle
    const toggleTheme = () => {
        setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            // Force navigation state to reset
            if (router.canGoBack()) {
                router.dismissAll();
            }
            router.replace('/');
        } catch (error) {
            console.error('Failed to sign out:', error);
            // Even if api fails, force navigation
            router.replace('/');
        }
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <ThemedView className="flex-1 bg-gray-50 dark:bg-black">
            {/* Header */}
            <View
                className="px-4 pb-4 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800"
                style={{ paddingTop: insets.top + 10 }}
            >
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="mr-3 -ml-2 p-2"
                    >
                        <ChevronLeft size={24} className="text-gray-900 dark:text-white" color="#888" />
                    </TouchableOpacity>
                    <ThemedText type="title" className="text-xl font-bold">
                        Settings
                    </ThemedText>
                </View>
            </View>

            <ScrollView className="flex-1">

                {/* User Profile Section */}
                <View className="mt-6 mx-4 mb-2">
                    <ThemedText className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                        Account
                    </ThemedText>
                    <View className="bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">

                        <View className="p-4 flex-row items-center border-b border-gray-100 dark:border-gray-800">
                            <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
                                <User size={20} className="text-blue-600 dark:text-blue-400" color="#3b82f6" />
                            </View>
                            <View className="flex-1">
                                <ThemedText type="defaultSemiBold">User Profile</ThemedText>
                                <ThemedText className="text-gray-500 text-sm">Active</ThemedText>
                            </View>
                        </View>

                        <View className="p-4 flex-row items-center">
                            <View className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mr-3">
                                <Mail size={16} className="text-gray-600 dark:text-gray-400" color="#888" />
                            </View>
                            <View className="flex-1">
                                <ThemedText className="text-sm text-gray-500 dark:text-gray-400">Email</ThemedText>
                                <ThemedText type="default">{user?.email || 'No email'}</ThemedText>
                            </View>
                        </View>

                    </View>
                </View>

                {/* Preferences Section */}
                <View className="mt-4 mx-4 mb-2">
                    <ThemedText className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                        Preferences
                    </ThemedText>
                    <View className="bg-white dark:bg-[#1c1c1e] rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">

                        {/* Theme Toggle */}
                        <TouchableOpacity
                            onPress={() => {
                                const options = ['System Default', 'Light', 'Dark', 'Cancel'];
                                const cancelButtonIndex = 3;

                                if (Platform.OS === 'ios') {
                                    ActionSheetIOS.showActionSheetWithOptions(
                                        {
                                            options,
                                            cancelButtonIndex,
                                            title: 'Select Theme',
                                        },
                                        (buttonIndex) => {
                                            if (buttonIndex === 0) setColorScheme('system');
                                            if (buttonIndex === 1) setColorScheme('light');
                                            if (buttonIndex === 2) setColorScheme('dark');
                                        }
                                    );
                                } else {
                                    Alert.alert('Select Theme', undefined, [
                                        { text: 'System Default', onPress: () => setColorScheme('system') },
                                        { text: 'Light', onPress: () => setColorScheme('light') },
                                        { text: 'Dark', onPress: () => setColorScheme('dark') },
                                        { text: 'Cancel', style: 'cancel' },
                                    ]);
                                }
                            }}
                            className="p-4 flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-[#2c2c2e]"
                        >
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 items-center justify-center mr-3">
                                    {colorScheme === 'dark' ?
                                        <Moon size={16} color="#a855f7" /> :
                                        <Sun size={16} color="#a855f7" />
                                    }
                                </View>
                                <ThemedText type="defaultSemiBold">Theme</ThemedText>
                            </View>
                            <View className="flex-row items-center">
                                <ThemedText className="text-gray-500 mr-2 capitalize">
                                    {(colorScheme as string) === 'system' ? 'System' : colorScheme}
                                </ThemedText>
                                <ChevronRight size={16} color="#9ca3af" />
                            </View>
                        </TouchableOpacity>

                        {/* Language Selector */}
                        <TouchableOpacity
                            onPress={() => {
                                const options = ['English', 'Arabic', 'Cancel'];
                                const cancelButtonIndex = 2;

                                if (Platform.OS === 'ios') {
                                    ActionSheetIOS.showActionSheetWithOptions(
                                        {
                                            options,
                                            cancelButtonIndex,
                                            title: 'Select Language',
                                        },
                                        (buttonIndex) => {
                                            if (buttonIndex === 0) setLanguage('en');
                                            if (buttonIndex === 1) setLanguage('ar');
                                        }
                                    );
                                } else {
                                    Alert.alert('Select Language', undefined, [
                                        { text: 'English', onPress: () => setLanguage('en') },
                                        { text: 'Arabic', onPress: () => setLanguage('ar') },
                                        { text: 'Cancel', style: 'cancel' },
                                    ]);
                                }
                            }}
                            className="p-4 flex-row items-center justify-between active:bg-gray-50 dark:active:bg-[#2c2c2e]"
                        >
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 items-center justify-center mr-3">
                                    <Globe size={16} color="#6366f1" />
                                </View>
                                <ThemedText type="defaultSemiBold">Language</ThemedText>
                            </View>
                            <View className="flex-row items-center">
                                <ThemedText className="text-gray-500 mr-2">
                                    {language === 'en' ? 'English' : 'Arabic'}
                                </ThemedText>
                                <ChevronRight size={16} color="#9ca3af" />
                            </View>
                        </TouchableOpacity>

                    </View>
                </View>

                {/* Security Section */}
                {/* <View className="mt-4 mx-4 mb-2">
                    <ThemedText className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                        Security
                    </ThemedText>
                    <TouchableOpacity
                        className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex-row items-center active:opacity-70"
                        activeOpacity={0.7}
                    >
                        <View className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mr-3">
                            <Shield size={16} color="#22c55e" />
                        </View>
                        <View className="flex-1">
                            <ThemedText type="defaultSemiBold">Biometric Login</ThemedText>
                            <ThemedText className="text-gray-500 text-xs">Enabled</ThemedText>
                        </View>
                        <View className="w-12 h-6 bg-green-500 rounded-full items-end justify-center px-1">
                            <View className="w-4 h-4 bg-white rounded-full shadow-sm" />
                        </View>
                    </TouchableOpacity>
                </View> */}


                {/* Actions Section */}
                <View className="mt-8 mx-4">
                    <TouchableOpacity
                        className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 border border-red-100 dark:border-red-900/30 flex-row items-center justify-center active:bg-red-50 dark:active:bg-red-900/20"
                        onPress={handleSignOut}
                        activeOpacity={0.7}
                    >
                        <LogOut size={20} color="#ef4444" className="mr-2" />
                        <ThemedText className="text-red-500 font-semibold">
                            Sign Out
                        </ThemedText>
                    </TouchableOpacity>

                    <ThemedText className="text-center text-xs text-gray-400 mt-4 h-20">
                        Version 1.0.0
                    </ThemedText>
                </View>

            </ScrollView>
        </ThemedView>
    );
}
