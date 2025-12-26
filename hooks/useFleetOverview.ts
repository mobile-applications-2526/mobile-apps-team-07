import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Vessel, CreateVesselInput } from '@/types';
import { useVessels } from '@/context/VesselContext';
import { useHaptics } from './useHaptics';

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
            }, 30000);

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
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [offlineNotified, setOfflineNotified] = useState(false);
    const prevIsOfflineRef = useRef<boolean | null>(null);

    // Offline toast logic
    useEffect(() => {
        const prev = prevIsOfflineRef.current;
        if (isOfflineData) {
            if (!offlineNotified) {
                setToastMessage('Offline: showing cached data');
                setOfflineNotified(true);
            }
        } else {
            if (prev) {
                setToastMessage('Reconnected to server');
                setOfflineNotified(false);
            }
        }
        prevIsOfflineRef.current = isOfflineData;
    }, [isOfflineData, offlineNotified]);

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
            setToastMessage('Vessel deleted');
            await haptics.successNotification();
        } catch (error) {
            setDeleteError(true);
            await haptics.errorNotification();
        } finally {
            setIsDeleting(false);
        }
    }, [vesselToDelete, deleteVessel, haptics, refreshVesselsWithStatus]);

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
            setToastMessage('Vessel updated');
            await haptics.successNotification();
        } catch (err) {
            console.error('Failed to update vessel', err);
            await haptics.errorNotification();
        } finally {
            setIsSaving(false);
        }
    }, [vesselToEdit, updateVessel, refreshVesselsWithStatus, haptics]);

    const handleToastAnimationComplete = useCallback(() => {
        setToastMessage(null);
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
            toastMessage,
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
