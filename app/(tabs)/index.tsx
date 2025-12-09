import React, { useState, useCallback } from 'react';
import { FlatList, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ThemedText, ThemedView, OverlayToast } from '@/components/common';
import { VesselCard, EmptyVesselList } from '@/components/vessel';
import { DeleteVesselModal } from '@/components/ui/delete-vessel-modal';
import { AddVesselModal } from '@/components/ui/add-vessel-modal';
import { CreateVesselInput, Vessel, VesselStatus, VesselWithStatus } from '@/types';
import { useVessels, useHaptics } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

export default function Overview() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  
  // Use the vessels context instead of local state
  const { 
    vesselsWithStatus,
    refreshVesselsWithStatus,
    isLoading, 
    isInitialized,
    deleteVessel, 
    createVessel, 
    getAllImos
  } = useVessels();

  useFocusEffect(
      useCallback(()=>{
          refreshVesselsWithStatus();

          const pollInterval = setInterval(()=>{
            refreshVesselsWithStatus();
          }, 30000)

          return ()=>{clearInterval(pollInterval)};
      }, [refreshVesselsWithStatus])
  );
  
  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [vesselToDelete, setVesselToDelete] = useState<Vessel | null>(null);
  const [vesselHasActiveVoyage, setVesselHasActiveVoyage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  
  // Add vessel modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const hasActiveVoyage = useCallback((vesselId: number): boolean => {
      const vesselWithStatus = vesselsWithStatus.find(v => v.vessel.id === vesselId);
      return vesselWithStatus?.activeVoyage !== null && vesselWithStatus?.activeVoyage !== undefined;
  }, [vesselsWithStatus]);

  const handleDeletePress = useCallback(async (vessel: Vessel) => {
    setVesselToDelete(vessel);
    setDeleteError(false);
    
    //Check if vessel has active voyage
    const hasActive = hasActiveVoyage(vessel.id);
    setVesselHasActiveVoyage(hasActive);
    
    setDeleteModalVisible(true);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteModalVisible(false);
    setVesselToDelete(null);
    setVesselHasActiveVoyage(false);
    setDeleteError(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!vesselToDelete) return;

    setIsDeleting(true);
    setDeleteError(false);

    try {
      // Delete from service
      const success = await deleteVessel(vesselToDelete.id);
      
      if (!success) {
        throw new Error('Failed to delete vessel');
      }
      
      // Close modal
      setDeleteModalVisible(false);
      setVesselToDelete(null);
      setVesselHasActiveVoyage(false);

      refreshVesselsWithStatus();
      
      // Show success toast
      setToastMessage('Vessel deleted');
      
      // Haptic feedback for success
      await haptics.successNotification();
    } catch (error) {
      // Show error state in modal with retry option
      setDeleteError(true);
      await haptics.errorNotification();
    } finally {
      setIsDeleting(false);
    }
  }, [vesselToDelete, deleteVessel, haptics, refreshVesselsWithStatus]);

  const handleToastAnimationComplete = useCallback(() => {
    setToastMessage(null);
  }, []);

  // Add vessel handlers
  const handleAddPress = useCallback(async () => {
    await haptics.lightImpact();
    setAddModalVisible(true);
  }, [haptics]);

  const handleCancelAdd = useCallback(() => {
    setAddModalVisible(false);
  }, []);

  const handleCreateVessel = useCallback(async (vesselInput: CreateVesselInput) => {
    setIsCreating(true);

    try {
      // Create vessel in database
      const newVessel = await createVessel(vesselInput);
      
      // Close modal
      setAddModalVisible(false);
      
      // Haptic feedback for success
      await haptics.successNotification();
      
      // Navigate to vessel specs page to upload Q88
      router.push(`/vessel/${newVessel.id}/specs` as any);
    } catch (error) {
      console.error('Failed to create vessel:', error);
      await haptics.errorNotification();
    } finally {
      setIsCreating(false);
    }
  }, [router, createVessel, haptics]);

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
              {vesselsWithStatus.length} vessel{vesselsWithStatus.length !== 1 ? 's' : ''}
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
          data={vesselsWithStatus}
          keyExtractor={(item) => item.vessel.id.toString()}
          renderItem={({ item }) => 
              <VesselCard 
              vessel={item.vessel} 
              voyage={item.activeVoyage} 
              status={item.latestStatus}
              onDeletePress={handleDeletePress} />
          }
          contentContainerStyle={{ 
            padding: 12, 
            paddingBottom: insets.bottom + 20,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyVesselList />}
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
        vesselName={vesselToDelete?.vesselName || ''}
        isDeleting={isDeleting}
        hasActiveVoyage={vesselHasActiveVoyage}
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
