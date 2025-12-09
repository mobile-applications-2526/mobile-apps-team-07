/**
 * VesselCard Component
 * 
 * Card component displaying vessel information in a list.
 */

import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ship, Navigation, Pencil, Trash2, Anchor } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/common';
import { useHaptics } from '@/hooks';
import { Vessel, VesselStatus, Voyage } from '@/types';
import { VESSEL_NAME_TRUNCATE_LENGTH } from '@/constants';

interface VesselCardProps {
  vessel: Vessel;
  voyage: Voyage | null;
  status: VesselStatus | null;
  onDeletePress: (vessel: Vessel) => void;
}

export function VesselCard({ vessel, voyage, status, onDeletePress }: VesselCardProps) {
  const router = useRouter();
  const { lightImpact, mediumImpact } = useHaptics();
  

  // Truncate vessel vesselName
  const displayName = vessel.vesselName.length > VESSEL_NAME_TRUNCATE_LENGTH 
    ? `${vessel.vesselName.substring(0, VESSEL_NAME_TRUNCATE_LENGTH)}...` 
    : vessel.vesselName;

  const hasActiveVoyage = voyage != null;

  const formatETA = (distanceNm: number, speedKnots: number): string => {
    const hours = distanceNm / speedKnots;
    const etaDate = new Date();
    etaDate.setHours(etaDate.getHours() + hours);
    
    const monthAbbr = etaDate.toLocaleString('en-US', { month: 'short' });
    const day = etaDate.getDate();
    
    return `${monthAbbr} ${day}`;
  };

  const renderETAContent = () => {
    // No voyage - show idle state
    if (!voyage) {
      return (
        <>
          <Anchor size={12} color="#9ca3af" />
          <ThemedText className="text-xs text-gray-400 dark:text-gray-500 ml-1.5" numberOfLines={1}>
            No Active Voyage
          </ThemedText>
        </>
      );
    }

    const portname = voyage.voyageStatus === 'Laden'
      ? voyage.dischargeRegion
      : voyage.loadRegion;

    // Has voyage with tracking status - show ETA
    if (status) {
      return (
        <>
          <Navigation size={12} color="#3b82f6" />
          <ThemedText className="text-xs text-blue-600 dark:text-blue-400 ml-1.5 font-medium" numberOfLines={1}>
            ETA {formatETA(status.distanceToGoNm, status.averageSpeedKnots)}
          </ThemedText>
          <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mx-1" numberOfLines={1}>
            →
          </ThemedText>
          <ThemedText className="text-xs text-gray-600 dark:text-gray-300 flex-1" numberOfLines={1}>
            {portname}
          </ThemedText>
        </>
      );
    }

    // Has voyage but no status - show port activity
    const message = voyage.voyageStatus === 'Loading'
      ? `Ship is Loading at port ${voyage.loadRegion}`
      : voyage.voyageStatus === 'Discharging'
      ? `Ship is Discharging at port ${voyage.dischargeRegion}`
      : `Voyage ${voyage.voyageStatus}`;

    return (
      <>
        <Anchor size={12} color="#9ca3af" />
        <ThemedText className="text-xs text-gray-400 dark:text-gray-500 ml-1.5" numberOfLines={1}>
          {message}
        </ThemedText>
      </>
    );
  };

  const handlePress = async () => {
    await lightImpact();
    router.push(`/vessel/${vessel.id}` as any);
  };

  const handleDeletePress = async () => {
    await mediumImpact();
    onDeletePress(vessel);
  };

  return (
    <TouchableOpacity
      className="bg-white dark:bg-[#1c1c1e] rounded-xl mb-2.5 overflow-hidden"
      activeOpacity={0.7}
      onPress={handlePress}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View className="flex-row items-start px-3 py-2.5">
        {/* Ship Icon */}
        <View className="w-10 h-10 rounded-lg mr-3 items-center justify-center bg-blue-50 dark:bg-blue-900/20">
          <Ship size={20} color="#3b82f6" />
        </View>

        {/* Vessel Info */}
        <View className="flex-1 mr-2 justify-center h-10">
          <View className="flex-row items-center">
            <ThemedText type="defaultSemiBold" className="text-[15px] flex-shrink" numberOfLines={1}>
              {displayName}
            </ThemedText>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 ml-2" numberOfLines={1}>
              {vessel.imoNumber}
            </ThemedText>
          </View>
          <ThemedText className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
            {vessel.vesselType} • {vessel.vesselSubtype}
          </ThemedText>
        </View>

        {/* Action Icons */}
        <View className="items-center justify-center h-10">
          <TouchableOpacity 
            className="p-1.5" 
            activeOpacity={0.6} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={handleDeletePress}
          >
            <Trash2 size={16} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="p-1.5 mt-1" 
            activeOpacity={0.6} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Pencil size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ETA Strip */}
      <View className={`flex-row items-center px-3 py-1.5 ${hasActiveVoyage ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
        {renderETAContent()}
      </View>
    </TouchableOpacity>
  );
}
