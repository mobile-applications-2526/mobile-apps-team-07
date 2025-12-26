import React from 'react';
import { View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { ThemedText } from '@/components/common/ThemedText';
import { ThemedView } from '@/components/common/ThemedView';

interface LockedScreenProps {
    type: 'gas' | 'standard';
}

export function LockedScreen({ type }: LockedScreenProps) {
    return (
        <ThemedView className="flex-1 items-center justify-center px-6">
            <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
                <Lock size={40} color="#9ca3af" />
            </View>
            <ThemedText className="text-xl font-semibold mb-2">Section Locked</ThemedText>
            <ThemedText className="text-center text-gray-500 dark:text-gray-400">
                {type === 'gas'
                    ? 'Please upload Q88 and Form C in the Specs section to unlock this page.'
                    : 'Please upload Q88 in the Specs section to unlock this page.'}
            </ThemedText>
        </ThemedView>
    );
}
