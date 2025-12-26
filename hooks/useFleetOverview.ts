import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Vessel, CreateVesselInput } from '@/types';
import { useVessels } from '@/context/VesselContext';
import { useHaptics } from './useHaptics';
import { useToast } from './useToast';

export function useFleetOverview() {
    const router = useRouter();
    const haptics = useHaptics();

    const {
        vesselsWithStatus,
        refreshVesselsWithStatus,
        isLoading,
        isInitialized,
        deleteVessel,
        createVessel,
        updateVessel,
        isOfflineData,
        getAllImos,
    } = useVessels();

    // Polling logic
    useFocusEffect(
        useCallback(() => {
            refreshVesselsWithStatus();

            const pollInterval = setInterval(() => {
                refreshVesselsWithStatus();
            }, 15000);

            return () => { clearInterval(pollInterval); };
        }, [refreshVesselsWithStatus])
    );

    // --- DELETE STATE ---
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [vesselToDelete, setVesselToDelete] = useState<Vessel | null>(null);
    const [vesselHasActiveVoyage, setVesselHasActiveVoyage] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState(false);

    // --- ADD STATE ---
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // --- EDIT STATE ---
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [vesselToEdit, setVesselToEdit] = useState<Vessel | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- TOAST STATE ---
    // Removed local toast state in favor of global toast via NetworkStatusContext
    const { showToast } = useToast();

    // Helpers
    const hasActiveVoyage = useCallback((vesselId: number): boolean => {
        const vWithError = vesselsWithStatus.find(v => v.vessel.id === vesselId);
        return vWithError?.activeVoyage !== null && vWithError?.activeVoyage !== undefined;
    }, [vesselsWithStatus]);

    // --- EVENT HANDLERS ---

    // Delete
    const handleDeletePress = useCallback(async (vessel: Vessel) => {
        setVesselToDelete(vessel);
        setDeleteError(false);
        const hasActive = hasActiveVoyage(vessel.id);
        setVesselHasActiveVoyage(hasActive);
        setDeleteModalVisible(true);
    }, [hasActiveVoyage]);

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
            const success = await deleteVessel(vesselToDelete.id);
            if (!success) throw new Error('Failed to delete vessel');

            setDeleteModalVisible(false);
            setVesselToDelete(null);
            setVesselHasActiveVoyage(false);
            refreshVesselsWithStatus();
            showToast('Vessel deleted');
            await haptics.successNotification();
        } catch (error) {
            setDeleteError(true);
            await haptics.errorNotification();
        } finally {
            setIsDeleting(false);
        }
    }, [vesselToDelete, deleteVessel, haptics, refreshVesselsWithStatus, showToast]);

    // Add
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
            const newVessel = await createVessel(vesselInput);
            setAddModalVisible(false);
            await haptics.successNotification();
            router.push(`/vessel/${newVessel.id}` as any);
        } catch (error) {
            console.error('Failed to create vessel:', error);
            await haptics.errorNotification();
        } finally {
            setIsCreating(false);
        }
    }, [router, createVessel, haptics]);

    // Edit
    const handleEditPress = useCallback(async (vessel: Vessel) => {
        await haptics.lightImpact();
        setVesselToEdit(vessel);
        setEditModalVisible(true);
    }, [haptics]);

    const handleCancelEdit = useCallback(() => {
        setEditModalVisible(false);
        setVesselToEdit(null);
    }, []);

    const handleSaveEdit = useCallback(async (vesselId: number, updates: Partial<Vessel>) => {
        if (!vesselToEdit || vesselToEdit.id !== vesselId) return;
        setIsSaving(true);
        try {
            const updated: Vessel = {
                ...vesselToEdit,
                ...updates,
                vesselType: updates.vesselType as any || vesselToEdit.vesselType, // Ensure enum compatibility
            };
            await updateVessel(updated);
            await refreshVesselsWithStatus();
            setEditModalVisible(false);
            setVesselToEdit(null);
            showToast('Vessel updated');
            await haptics.successNotification();
        } catch (err) {
            console.error('Failed to update vessel', err);
            await haptics.errorNotification();
        } finally {
            setIsSaving(false);
        }
    }, [vesselToEdit, updateVessel, refreshVesselsWithStatus, haptics, showToast]);

    const handleToastAnimationComplete = useCallback(() => {
        // No-op or remove if not needed by UI anymore (global toast handles its own animation)
    }, []);

    return {
        state: {
            vesselsWithStatus,
            isInitialized,
            isLoading,
            // Modals
            deleteModalVisible,
            vesselToDelete,
            vesselHasActiveVoyage,
            isDeleting,
            deleteError,
            addModalVisible,
            isCreating,
            editModalVisible,
            vesselToEdit,
            isSaving,
            // Misc
            toastMessage: null, // Force null or remove property if type allows
            existingImos: getAllImos(),
        },
        actions: {
            handleDeletePress,
            handleCancelDelete,
            handleConfirmDelete,
            handleAddPress,
            handleCancelAdd,
            handleCreateVessel,
            handleEditPress,
            handleCancelEdit,
            handleSaveEdit,
            handleToastAnimationComplete,
        }
    };
}
