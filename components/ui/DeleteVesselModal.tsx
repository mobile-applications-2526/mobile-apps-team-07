import React, { useEffect, useRef } from 'react';
import { Modal, View, TouchableOpacity, ActivityIndicator, Platform, ActionSheetIOS } from 'react-native';
import { AlertTriangle } from 'lucide-react-native';
import { ThemedText } from '@/components/common';

interface DeleteVesselModalProps {
  visible: boolean;
  vesselName: string;
  hasActiveVoyage: boolean;
  isDeleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onRetry?: () => void;
  hasError?: boolean;
}

export function DeleteVesselModal({
  visible,
  vesselName,
  hasActiveVoyage,
  isDeleting = false,
  onCancel,
  onConfirm,
  onRetry,
  hasError = false,
}: DeleteVesselModalProps) {
  // On iOS use native ActionSheet for a more native feel
  const shownRef = useRef(false);

  useEffect(() => {
    if (Platform.OS === 'ios' && visible && !shownRef.current) {
      shownRef.current = true;

      const options = hasError ? ['Retry', 'Cancel'] : ['Delete', 'Cancel'];
      const destructiveButtonIndex = 0;
      const cancelButtonIndex = 1;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: `Delete ${vesselName}?`,
          message: hasError
            ? 'Failed to delete previously. Would you like to retry?'
            : hasActiveVoyage
            ? 'This will permanently remove all associated voyages, noon reports, and documents.'
            : 'This will permanently remove all associated voyages, noon reports, and documents.',
          options,
          cancelButtonIndex,
          destructiveButtonIndex,
        },
        (buttonIndex: number) => {
          shownRef.current = false;
          if (buttonIndex === destructiveButtonIndex) {
            if (hasError && onRetry) onRetry();
            else onConfirm();
          } else {
            onCancel();
          }
        }
      );
    }

    // Reset shownRef when modal becomes hidden so it can show again next time
    if (!visible) shownRef.current = false;
  }, [visible, vesselName, hasActiveVoyage, hasError, onCancel, onConfirm, onRetry]);

  // For iOS we rely on the native ActionSheet — render nothing here
  if (Platform.OS === 'ios') return null;

  // Android / Web / Others: keep existing custom modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white dark:bg-[#2c2c2e] rounded-2xl w-full max-w-sm overflow-hidden">
          {/* Header with Icon */}
          <View className="items-center pt-6 pb-4 px-6">
            <View className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center mb-4">
              <AlertTriangle size={28} color="#ef4444" />
            </View>
            <ThemedText type="defaultSemiBold" className="text-lg text-center">
              Delete {vesselName}?
            </ThemedText>
          </View>

          {/* Content */}
          <View className="px-6 pb-6">
            {hasError ? (
              <ThemedText className="text-sm text-center text-gray-600 dark:text-gray-400">
                Failed to delete vessel. Please check your connection and try again.
              </ThemedText>
            ) : (
              <>
                <ThemedText className="text-sm text-center text-gray-600 dark:text-gray-400">
                  This will permanently remove all associated voyages, noon reports, and documents.
                </ThemedText>
                {hasActiveVoyage && (
                  <View className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <ThemedText className="text-sm text-center text-amber-700 dark:text-amber-400 font-medium">
                      ⚠️ This vessel has an active voyage. Deleting will remove all voyage history.
                    </ThemedText>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Buttons */}
          <View className="flex-row border-t border-gray-200 dark:border-gray-700">
            <TouchableOpacity
              className="flex-1 py-4 items-center justify-center border-r border-gray-200 dark:border-gray-700"
              onPress={onCancel}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              <ThemedText className="text-base font-semibold text-blue-500">
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 py-4 items-center justify-center"
              onPress={hasError ? onRetry : onConfirm}
              disabled={isDeleting}
              activeOpacity={0.7}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <ThemedText className="text-base font-semibold text-red-500">
                  {hasError ? 'Retry' : 'Delete'}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
