import React from 'react';
import { View } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSession } from '@/context/AuthContext';
import { ThemedText } from '@/components/common';
import { AuthButton } from '@/components/auth/AuthButton';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingPage() {
    const { session, isLoading } = useSession();
    const router = useRouter();

    if (!isLoading && session) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-black">
            <View className="flex-1 items-center justify-center px-6">
                <View className="items-center mb-10">
                    {/* You can replace this with your app logo */}
                    <View className="w-16 h-16 bg-blue-600 rounded-2xl mb-4 items-center justify-center transform rotate-3">
                        <ThemedText className="text-white text-3xl font-bold">S</ThemedText>
                    </View>
                    <ThemedText type="title" className="text-3xl font-bold text-center mb-2">
                        Safarban
                    </ThemedText>
                    <ThemedText className="text-gray-500 dark:text-gray-400 text-center text-base px-4">
                        Manage your fleet efficiently from anywhere
                    </ThemedText>
                </View>

                <View className="w-full space-y-3">
                    <AuthButton
                        title="Sign In"
                        onPress={() => router.push('/sign-in')}
                        className="shadow-md shadow-blue-200 dark:shadow-none"
                    />
                </View>

                <View className="mt-8">
                    <ThemedText className="text-[10px] text-gray-400 text-center">
                        v1.0.0
                    </ThemedText>
                </View>
            </View>
        </SafeAreaView>
    );
}
