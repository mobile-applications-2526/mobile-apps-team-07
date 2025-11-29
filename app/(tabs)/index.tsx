import React, { useState, useCallback, useEffect, useRef } from 'react';
import { FlatList, TouchableOpacity, View, Animated, ActivityIndicator } from 'react-native';
import { Ship, Navigation, Pencil, Trash2, Plus, Anchor, CheckCircle } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DeleteVesselModal } from '@/components/ui/delete-vessel-modal';
import { AddVesselModal } from '@/components/ui/add-vessel-modal';
import { Vessel } from '@/types/boat';
import { useVessels } from '@/context/VesselContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Toast item type for FlatList - no longer needed but keeping for reference
type VesselItem = Vessel & { isToast: false };

function OverlayToast({ message, onAnimationComplete }: { message: string; onAnimationComplete: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Animate in
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

    // Wait 2.5 seconds, then animate out
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete();
      });
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View 
      className="absolute left-0 right-0 items-center z-50"
      style={{
        top: 12,
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
        <CheckCircle size={16} color="#fff" />
        <ThemedText className="text-white text-sm font-medium ml-2">
          {message}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

function VesselCard({ item, onDeletePress }: { item: Vessel; onDeletePress: (vessel: Vessel) => void }) {
  const router = useRouter();

  // Truncate vessel name after 25 characters
  const displayName = item.name.length > 25 
    ? `${item.name.substring(0, 25)}...` 
    : item.name;

  const hasActiveVoyage = item.eta && item.port;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/vessel/${item.id}` as any);
  };

  const handleDeletePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDeletePress(item);
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
        {/* Compact Ship Icon */}
        <View className="w-10 h-10 rounded-lg mr-3 items-center justify-center bg-blue-50 dark:bg-blue-900/20">
          <Ship size={20} color="#3b82f6" />
        </View>

        {/* Vessel Info - Compact */}
        <View className="flex-1 mr-2 justify-center h-10">
          <View className="flex-row items-center">
            <ThemedText type="defaultSemiBold" className="text-[15px] flex-shrink" numberOfLines={1}>
              {displayName}
            </ThemedText>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 ml-2" numberOfLines={1}>
              {item.imo}
            </ThemedText>
          </View>
          <ThemedText className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
            {item.type} • {item.subtype}
          </ThemedText>
        </View>

        {/* Action Icons - Column layout */}
        <View className="items-center justify-center h-10">
          <TouchableOpacity 
            className="p-1.5" 
            activeOpacity={0.6} 
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={handleDeletePress}
          >
            <Trash2 size={16} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity className="p-1.5 mt-1" activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Pencil size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ETA Strip */}
      <View className={`flex-row items-center px-3 py-1.5 ${hasActiveVoyage ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
        {hasActiveVoyage ? (
          <>
            <Navigation size={12} color="#3b82f6" />
            <ThemedText className="text-xs text-blue-600 dark:text-blue-400 ml-1.5 font-medium" numberOfLines={1}>
              ETA {item.eta}
            </ThemedText>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mx-1" numberOfLines={1}>→</ThemedText>
            <ThemedText className="text-xs text-gray-600 dark:text-gray-300 flex-1" numberOfLines={1}>
              {item.port}
            </ThemedText>
          </>
        ) : (
          <>
            <Anchor size={12} color="#9ca3af" />
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 ml-1.5" numberOfLines={1}>
              No active voyage
            </ThemedText>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
        <Ship size={32} color="#9ca3af" />
      </View>
      <ThemedText className="text-gray-400 text-center text-sm">
        No vessels added yet{'\n'}Tap + to add your first vessel
      </ThemedText>
    </View>
  );
}

export default function Overview() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Use the vessels context instead of local state
  const { 
    vessels, 
    isLoading, 
    isInitialized,
    deleteVessel, 
    createVessel, 
    getAllImos 
  } = useVessels();
  
  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [vesselToDelete, setVesselToDelete] = useState<Vessel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  
  // Add vessel modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Calculate active voyages count for a vessel (vessels with eta and port have active voyage)
  const getActiveVoyagesCount = (vessel: Vessel): number => {
    return vessel.eta && vessel.port ? 1 : 0;
  };

  const handleDeletePress = useCallback((vessel: Vessel) => {
    setVesselToDelete(vessel);
    setDeleteError(false);
    setDeleteModalVisible(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setVesselToDelete(null);
    setDeleteError(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!vesselToDelete) return;

    setIsDeleting(true);
    setDeleteError(false);

    try {
      // Delete from database
      const success = await deleteVessel(vesselToDelete.id);
      
      if (!success) {
        throw new Error('Failed to delete vessel');
      }
      
      // Close modal
      setDeleteModalVisible(false);
      setVesselToDelete(null);
      
      // Show success toast
      setToastMessage('Vessel deleted');
      
      // Haptic feedback for success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      // Show error state in modal with retry option
      setDeleteError(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDeleting(false);
    }
  }, [vesselToDelete, deleteVessel]);

  const handleToastAnimationComplete = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Add vessel handlers
  const handleAddPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddModalVisible(true);
  }, []);

  const handleCancelAdd = useCallback(() => {
    setAddModalVisible(false);
  }, []);

  const handleCreateVessel = useCallback(async (vesselData: {
    name: string;
    imo: string;
    type: string;
    subtype: string;
    image?: string;
  }) => {
    setIsCreating(true);

    try {
      // Create vessel in database
      const newVessel = await createVessel({
        name: vesselData.name,
        imo: vesselData.imo,
        type: vesselData.type,
        subtype: vesselData.subtype,
        image: vesselData.image ?? null,
        hasQ88: false,
      });
      
      // Close modal
      setAddModalVisible(false);
      
      // Haptic feedback for success
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to vessel specs page to upload Q88
      router.push(`/vessel/${newVessel.id}/specs` as any);
      
      // Show toast after navigation (slight delay for better UX)
      setTimeout(() => {
        setToastMessage('Vessel created');
      }, 500);
    } catch (error) {
      console.error('Failed to create vessel:', error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCreating(false);
    }
  }, [router, createVessel]);

  // Get existing IMO numbers for validation
  const existingImos = getAllImos();

  // Show loading state while database initializes
  if (!isInitialized) {
    return (
      <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000] items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
        <ThemedText className="mt-4 text-gray-500">Loading vessels...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Header */}
      <View
        className="px-4 pb-3 bg-white dark:bg-[#1c1c1e] border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <ThemedText type="title" className="text-2xl font-bold">
              My Fleet
            </ThemedText>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {vessels.length} vessel{vessels.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          <TouchableOpacity 
            className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center"
            activeOpacity={0.8}
            onPress={handleAddPress}
          >
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vessel List */}
      <View className="flex-1 relative">
        <FlatList
          data={vessels}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <VesselCard item={item} onDeletePress={handleDeletePress} />}
          contentContainerStyle={{ 
            padding: 12, 
            paddingBottom: insets.bottom + 20,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
        
        {/* Toast Overlay */}
        {toastMessage && (
          <OverlayToast 
            message={toastMessage} 
            onAnimationComplete={handleToastAnimationComplete} 
          />
        )}
      </View> 

      {/* Delete Confirmation Modal */}
      <DeleteVesselModal
        visible={deleteModalVisible}
        vesselName={vesselToDelete?.name || ''}
        activeVoyagesCount={vesselToDelete ? getActiveVoyagesCount(vesselToDelete) : 0}
        isDeleting={isDeleting}
        hasError={deleteError}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        onRetry={handleConfirmDelete}
      />

      {/* Add Vessel Modal */}
      <AddVesselModal
        visible={addModalVisible}
        existingImos={existingImos}
        onCancel={handleCancelAdd}
        onCreate={handleCreateVessel}
        isCreating={isCreating}
      />
      
    </ThemedView>
  );
}
