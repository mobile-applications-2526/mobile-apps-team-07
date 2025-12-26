/**
 * OverlayToast Component
 * 
 * A toast notification that overlays on top of content.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle } from 'lucide-react-native';
import { ThemedText } from './ThemedText';
import { TOAST_DURATION, ANIMATION_DURATION } from '@/constants';

interface OverlayToastProps {
  message: string;
  icon?: React.ReactNode;
  onAnimationComplete: () => void;
}

export function OverlayToast({ message, icon, onAnimationComplete }: OverlayToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.fast,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ANIMATION_DURATION.fast,
        useNativeDriver: true,
      }),
    ]).start();

    // Wait then animate out
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION.slow,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: ANIMATION_DURATION.slow,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete();
      });
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [fadeAnim, translateY, onAnimationComplete]);

  return (
    <Animated.View
      className="absolute left-0 right-0 items-center z-50"
      style={{
        top: insets.top + 68,
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
      pointerEvents="none"
    >
      <View
        className="flex-row items-center bg-green-500 rounded-full px-4 py-2.5"
        style={{
          shadowColor: '#22c55e',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {icon ? icon : <CheckCircle size={16} color="#fff" />}
        <ThemedText className="text-white text-sm font-medium ml-2">
          {message}
        </ThemedText>
      </View>
    </Animated.View>
  );
}
