import React, { useState, useCallback, useEffect } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ThemedText, ThemedView, OverlayToast, Loader } from '@/components/common';
import { VesselCard, EmptyVesselList } from '@/components/vessel';
import { DeleteVesselModal } from '@/components/ui/delete-vessel-modal';
import { AddVesselModal } from '@/components/ui/add-vessel-modal';
import EditVesselModal from '@/components/ui/edit-vessel-modal';
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
    updateVessel,
    isOfflineData,
    getAllImos
  } = useVessels();

  useFocusEffect(
    useCallback(() => {
      refreshVesselsWithStatus();

      const pollInterval = setInterval(() => {
        refreshVesselsWithStatus();
      }, 30000)

      return () => { clearInterval(pollInterval) };
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
  // Edit vessel modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [vesselToEdit, setVesselToEdit] = useState<Vessel | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show offline toast if context indicates cached data was used on startup
  // Only notify the user once per offline period. When we reconnect, notify once and allow future offline notifications.
  const [offlineNotified, setOfflineNotified] = useState(false);
  const prevIsOfflineRef = React.useRef<boolean | null>(null);

  useEffect(() => {
    const prev = prevIsOfflineRef.current;

    if (isOfflineData) {
      if (!offlineNotified) {
        setToastMessage('Offline: showing cached data');
        setOfflineNotified(true);
      }
    } else {
      // We just transitioned from offline -> online
      if (prev) {
        setToastMessage('Reconnected to server');
        // reset notified state so future offline periods will notify again
        setOfflineNotified(false);
      }
    }

    prevIsOfflineRef.current = isOfflineData;
    // We intentionally omit toastMessage and offlineNotified from deps to avoid re-running during toast lifecycle
  }, [isOfflineData]);

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

  // Edit handlers
  const handleEditPress = useCallback(async (vessel: Vessel) => {
    await haptics.lightImpact();
    setVesselToEdit(vessel);
    setEditModalVisible(true);
  }, [haptics]);

  const handleCancelEdit = useCallback(() => {
    setEditModalVisible(false);
    setVesselToEdit(null);
  }, []);

  const handleSaveEdit = useCallback(async (payload: { vesselName: string; imoNumber: string; vesselType: string; vesselSubtype: string; vesselPictureUrl: string | null; }) => {
    if (!vesselToEdit) return;
    setIsSaving(true);
    try {
      // Build updated vessel object (preserve other fields)
      const updated: Vessel = {
        ...vesselToEdit,
        vesselName: payload.vesselName,
        imoNumber: payload.imoNumber,
        vesselType: payload.vesselType as any,
        vesselSubtype: payload.vesselSubtype,
        vesselPictureUrl: payload.vesselPictureUrl,
      };

      const result = await updateVessel(updated);

      // After updating (optimistic update already applied), refresh vessels with status from backend
      // to ensure authoritative data (and any derived status) is pulled in.
      await refreshVesselsWithStatus();

      setEditModalVisible(false);
      setVesselToEdit(null);
      setToastMessage('Vessel updated');
      await haptics.successNotification();
    } catch (err) {
      console.error('Failed to update vessel', err);
      await haptics.errorNotification();
    } finally {
      setIsSaving(false);
    }
  }, [vesselToEdit, updateVessel, refreshVesselsWithStatus, haptics]);

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

      // Navigate to vessel page - layout will redirect to specs if docs missing, or show overview if complete
      router.push(`/vessel/${newVessel.id}` as any);
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
    return <Loader text="Loading vessels..." />;
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
              onDeletePress={handleDeletePress}
              onEditPress={handleEditPress} />
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

      {/* Edit Vessel Modal */}
      <EditVesselModal
        visible={editModalVisible}
        vessel={vesselToEdit}
        onCancel={handleCancelEdit}
        onSave={handleSaveEdit}
        isSaving={isSaving}
      />

    </ThemedView>
  );
}
