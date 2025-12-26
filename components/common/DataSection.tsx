import React from 'react';
import { View } from 'react-native';
import { ThemedText } from './ThemedText';
import { Card } from './Card';

interface DataSectionProps {
    title: string;
    children: React.ReactNode;
    rightContent?: React.ReactNode;
    className?: string;
}

export function DataSection({ title, children, rightContent, className }: DataSectionProps) {
    return (
        <Card className={`mb-3 ${className || ''}`}>
            <View className="flex-row items-center justify-between mb-2">
                <ThemedText type="defaultSemiBold" className="text-base">
                    {title}
                </ThemedText>
                {rightContent}
            </View>
            {children}
        </Card>
    );
}
