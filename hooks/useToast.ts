/**
 * useToast Hook
 * 
 * Provides toast notification functionality.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { TOAST_DURATION, ANIMATION_DURATION } from '@/constants';

interface ToastState {
  message: string | null;
  fadeAnim: Animated.Value;
  translateY: Animated.Value;
}

export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  const showToast = useCallback((text: string) => {
    setMessage(text);
    
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

    // Auto hide after duration
    setTimeout(() => {
      hideToast();
    }, TOAST_DURATION);
  }, [fadeAnim, translateY]);

  const hideToast = useCallback(() => {
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
      setMessage(null);
    });
  }, [fadeAnim, translateY]);

  return {
    message,
    fadeAnim,
    translateY,
    showToast,
    hideToast,
  };
}
