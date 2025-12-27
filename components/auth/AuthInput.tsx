import React from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { ThemedText } from '@/components/common';

interface AuthInputProps extends TextInputProps {
    label: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, className, ...props }) => {
    return (
        <View className="w-full">
            <ThemedText type="defaultSemiBold" className="mb-2 ml-1 text-sm">
                {label}
            </ThemedText>
            <TextInput
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-3 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                placeholderTextColor="#9ca3af"
                {...props}
            />
        </View>
    );
};
