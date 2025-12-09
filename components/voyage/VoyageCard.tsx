/**
 * VesselCard Component
 * 
 * Card component displaying vessel information in a list.
 */
import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { ChevronRight, MapPin, Calendar, Package, Trash2 } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { Vessel, VesselStatus, Voyage } from '@/types';
import { useRouter } from 'expo-router';
import { useHaptics } from '@/hooks';

interface VoyageCardProps {
  vessel: Vessel;
  status: VesselStatus | null;
  voyage: Voyage;
  onDeletePress: (voyage: Voyage) => void;
}

export function VoyageCard({ vessel, status, voyage, onDeletePress }: VoyageCardProps) {
  const router = useRouter();
  const haptics = useHaptics();

  const handlePress = async () => {
    await haptics.lightImpact();
    router.push(`/vessel/${vessel.id}/voyage/${voyage.id}` as any);
  };

  const handleDeletePress = async (e: any) => {
    e.stopPropagation();
    await haptics.lightImpact();
    onDeletePress(voyage);
  };

  // Format dates
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status: Voyage['voyageStatus']) => {
    switch (status) {
      case 'Ballast':
        return 'bg-gray-500';
      case 'Loading':
        return 'bg-blue-500';
      case 'Laden':
        return 'bg-purple-500';
      case 'Discharging':
        return 'bg-orange-500';
      case 'Complete':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Calculate voyage duration
  const getDuration = () => {
    const start = new Date(voyage.voyageStartDate);
    const end = new Date(voyage.voyageEndDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      className="bg-white dark:bg-[#1c1c1e] rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Header with voyage number and status */}
      <View className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <ThemedText className="text-base font-semibold">
              {voyage.voyageNumber}
            </ThemedText>
            <View className={`px-2 py-1 rounded-full ${getStatusColor(voyage.voyageStatus)}`}>
              <ThemedText className="text-xs font-medium text-white">
                {voyage.voyageStatus}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleDeletePress}
            className="w-8 h-8 items-center justify-center"
            activeOpacity={0.6}
          >
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Route information */}
      <View className="px-4 py-3">
        <View className="flex-row items-center gap-2 mb-3">
          <MapPin size={16} color="#3b82f6" />
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <ThemedText className="text-sm font-medium flex-shrink">
                {voyage.loadRegion}
              </ThemedText>
              <ChevronRight size={14} color="#9ca3af" />
              <ThemedText className="text-sm font-medium flex-shrink">
                {voyage.dischargeRegion}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Date range */}
        <View className="flex-row items-center gap-2 mb-2">
          <Calendar size={16} color="#6b7280" />
          <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(voyage.voyageStartDate)} - {formatDate(voyage.voyageEndDate)}
          </ThemedText>
          <ThemedText className="text-xs text-gray-400 dark:text-gray-500">
            ({getDuration()} days)
          </ThemedText>
        </View>

        {/* Instructions preview (if available) */}
        {voyage.voyageInstructions && (
          <View className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <ThemedText 
              className="text-xs text-gray-600 dark:text-gray-400"
              numberOfLines={2}
            >
              {voyage.voyageInstructions}
            </ThemedText>
          </View>
        )}

        {/* Remarks indicator */}
        {voyage.remarks && (
          <View className="mt-2">
            <View className="flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                Has remarks
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      {/* Footer - tap to view more indicator */}
      <View className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-end">
          <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mr-1">
            View details
          </ThemedText>
          <ChevronRight size={14} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

