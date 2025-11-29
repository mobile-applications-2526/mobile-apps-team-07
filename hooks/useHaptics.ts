/**
 * useHaptics Hook
 * 
 * Provides haptic feedback utilities.
 */

import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';

export function useHaptics() {
  const lightImpact = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const mediumImpact = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const heavyImpact = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const successNotification = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const errorNotification = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const warningNotification = useCallback(async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const selectionFeedback = useCallback(async () => {
    await Haptics.selectionAsync();
  }, []);

  return {
    lightImpact,
    mediumImpact,
    heavyImpact,
    successNotification,
    errorNotification,
    warningNotification,
    selectionFeedback,
  };
}
