import { View, ViewProps } from 'react-native';

export function Card({ style, className, children, ...props }: ViewProps) {
    return (
        <View
            className={`bg-white dark:bg-[#1c1c1e] rounded-xl p-4 shadow-sm ${className || ''}`}
            style={style}
            {...props}
        >
            {children}
        </View>
    );
}
