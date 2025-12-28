import React, { useState, useCallback, useEffect } from 'react';
import { FlatList, TouchableOpacity, View, RefreshControl } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ThemedText, ThemedView, Loader } from '@/components/common';
import { VesselCard, EmptyVesselList } from '@/components/vessel';
import { DeleteVesselModal } from '@/components/ui/DeleteVesselModal';
import { AddVesselModal } from '@/components/ui/AddVesselModal';
import EditVesselModal from '@/components/ui/EditVesselModal';
import { useFleetOverview } from '@/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function Overview() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    state,
    actions
  } = useFleetOverview();

  // Show loading state while database initializes
  if (!state.isInitialized) {
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
              {state.vesselsWithStatus.length} vessel{state.vesselsWithStatus.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center"
            activeOpacity={0.8}
            onPress={actions.handleAddPress}
          >
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vessel List */}
      <View className="flex-1 relative">
        <FlatList
          data={state.vesselsWithStatus}
          keyExtractor={(item) => item.vessel.id.toString()}
          renderItem={({ item }) =>
            <VesselCard
              vessel={item.vessel}
              voyage={item.activeVoyage}
              status={item.latestStatus}
              onDeletePress={actions.handleDeletePress}
              onEditPress={actions.handleEditPress} />
          }
          contentContainerStyle={{
            padding: 12,
            paddingBottom: insets.bottom + 20,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyVesselList />}
          refreshControl={
            <RefreshControl
              refreshing={state.isLoading}
              onRefresh={actions.onRefresh}
              tintColor="#007AFF" // Optional: iOS spinner color
            />
          }
        />


      </View>

      {/* Delete Confirmation Modal */}
      <DeleteVesselModal
        visible={state.deleteModalVisible}
        vesselName={state.vesselToDelete?.vesselName || ''}
        isDeleting={state.isDeleting}
        hasActiveVoyage={state.vesselHasActiveVoyage}
        hasError={state.deleteError}
        onCancel={actions.handleCancelDelete}
        onConfirm={actions.handleConfirmDelete}
        onRetry={actions.handleConfirmDelete}
      />

      {/* Add Vessel Modal */}
      <AddVesselModal
        visible={state.addModalVisible}
        existingImos={state.existingImos}
        onCancel={actions.handleCancelAdd}
        onCreate={actions.handleCreateVessel}
        isCreating={state.isCreating}
      />

      {/* Edit Vessel Modal */}
      <EditVesselModal
        visible={state.editModalVisible}
        vessel={state.vesselToEdit}
        onCancel={actions.handleCancelEdit}
        onSave={actions.handleSaveEdit}
        isSaving={state.isSaving}
      />

    </ThemedView>
  );
}
