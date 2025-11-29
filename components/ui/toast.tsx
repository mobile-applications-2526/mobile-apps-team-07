import React, { useEffect, useRef } from 'react';
import { Animated, View, TouchableOpacity } from 'react-native';
import { X, CheckCircle, AlertCircle } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error';
  onDismiss: () => void;
  duration?: number;
}

export function Toast({
  visible,
  message,
  type = 'success',
  onDismiss,
  duration = 3000,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const isSuccess = type === 'success';
  const IconComponent = isSuccess ? CheckCircle : AlertCircle;
  const iconColor = isSuccess ? '#22c55e' : '#ef4444';
  const bgColor = isSuccess 
    ? 'bg-green-50 dark:bg-green-900/30' 
    : 'bg-red-50 dark:bg-red-900/30';
  const borderColor = isSuccess
    ? 'border-green-200 dark:border-green-800'
    : 'border-red-200 dark:border-red-800';

  return (
    <Animated.View
      className={`absolute left-4 right-4 ${bgColor} ${borderColor} border rounded-xl overflow-hidden`}
      style={{
        top: insets.top + 8,
        opacity: fadeAnim,
        transform: [{ translateY }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 9999,
      }}
    >
      <View className="flex-row items-center px-4 py-3">
        <IconComponent size={20} color={iconColor} />
        <ThemedText className="flex-1 ml-3 text-sm font-medium">
          {message}
        </ThemedText>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <X size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
