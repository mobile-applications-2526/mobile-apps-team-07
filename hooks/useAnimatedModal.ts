/**
 * useAnimatedModal Hook
 * 
 * Provides animation and gesture handling for draggable modals.
 */

import { useRef, useEffect } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import { MODAL_DISMISS_THRESHOLD, ANIMATION_DURATION } from '@/constants';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UseAnimatedModalOptions {
  visible: boolean;
  onDismiss: () => void;
}

export function useAnimatedModal({ visible, onDismiss }: UseAnimatedModalOptions) {
  const translateY = useRef(new Animated.Value(0)).current;

  // Reset animation when modal becomes visible
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > MODAL_DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: ANIMATION_DURATION.normal,
            useNativeDriver: true,
          }).start(() => {
            onDismiss();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  return {
    translateY,
    panResponder,
  };
}
