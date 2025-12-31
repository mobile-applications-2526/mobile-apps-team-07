import React, { useState } from 'react';
import { View, Image, Pressable } from 'react-native';
import { Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VesselTopBarProps {
  vesselName: string;
  vesselImage?: string | null;
  rightContent?: React.ReactNode;
  testID?: string;
}

export function VesselTopBar({ vesselName, vesselImage, rightContent, testID }: VesselTopBarProps) {
  const insets = useSafeAreaInsets();
  const [showImageViewer, setShowImageViewer] = useState(false);

  return (
    <View
      testID={testID || "vessel-top-bar"}
      className="px-4 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800 flex-row items-center justify-between"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
      }}
    >
      <View className="flex-1 mr-4">
        <ThemedText testID={testID ? `${testID}-name` : "vessel-top-bar-name"} type="title" className="text-xl font-bold" numberOfLines={1}>
          {vesselName}
        </ThemedText>
      </View>

      <View className="flex-row items-center">
        {rightContent && (
          <View className="mr-3">
            {rightContent}
          </View>
        )}

        {/* Vessel Image */}
        <Pressable
          testID={testID ? `${testID}-image` : "vessel-top-bar-image"}
          onLongPress={() => vesselImage && setShowImageViewer(true)}
          delayLongPress={300}
        >
          <View className="w-10 h-10 rounded-lg overflow-hidden bg-blue-50 dark:bg-blue-900/20 items-center justify-center">
            {vesselImage ? (
              <Image
                source={{
                  uri: (vesselImage.startsWith('http') || vesselImage.startsWith('data:') || vesselImage.startsWith('file:'))
                    ? vesselImage
                    : `data:image/jpeg;base64,${vesselImage}`
                }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ship size={20} color="#3b82f6" />
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <ImageViewerModal
        visible={showImageViewer}
        imageUri={vesselImage ?? null}
        onClose={() => setShowImageViewer(false)}
      />
    </View>
  );
}
