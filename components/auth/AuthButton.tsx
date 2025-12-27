import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/common';

interface AuthButtonProps extends TouchableOpacityProps {
    title: string;
    isLoading?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ title, isLoading, className, disabled, ...props }) => {
    return (
        <TouchableOpacity
            className={`w-full bg-blue-600 rounded-lg py-3 items-center justify-center shadow-sm shadow-blue-200 dark:shadow-none ${disabled || isLoading ? 'opacity-70' : ''} ${className}`}
            activeOpacity={0.8}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color="white" size="small" />
            ) : (
                <ThemedText className="text-white font-bold text-base">{title}</ThemedText>
            )}
        </TouchableOpacity>
    );
};
