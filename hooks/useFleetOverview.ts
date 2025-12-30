import { useState, useCallback, createElement } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Vessel, CreateVesselInput } from '@/types';
import * as FileSystem from 'expo-file-system/legacy';
import { useVessels } from '@/context/VesselContext';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useHaptics } from './useHaptics';
import { useToast } from './useToast';
import { Alert } from 'react-native';
import { getFriendlyErrorMessage } from '@/lib/errorUtils';
import { CircleCheckBig } from 'lucide-react-native';

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
        getAllImos,
    } = useVessels();

    // Polling logic
    useFocusEffect(
        useCallback(() => {
            refreshVesselsWithStatus(true); // Initial load can be silent if we rely on initializing state, or non-silent if we want spinner

            const pollInterval = setInterval(() => {
                refreshVesselsWithStatus(true); // Silent polling
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
    const { resetNetworkToast } = useNetworkStatus();

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
            // Process image if local
            let vesselPicture = vesselInput.vesselPicture;

            if (vesselPicture && (vesselPicture.startsWith('file:') || vesselPicture.startsWith('content:'))) {
                try {
                    const fileInfo = await FileSystem.getInfoAsync(vesselPicture);
                    if (fileInfo.exists) {
                        // 10MB Limit Check
                        const MAX_SIZE = 10 * 1024 * 1024; // 10MB
                        if (fileInfo.size > MAX_SIZE) {
                            throw new Error('Image size exceeds 10MB limit');
                        }

                        const base64 = await FileSystem.readAsStringAsync(vesselPicture, {
                            encoding: 'base64'
                        });
                        vesselPicture = base64;
                    }
                } catch (err: any) {
                    console.warn('Image processing failed:', err);
                    const msg = err.message || 'Failed to process image';
                    showToast(msg.length > 50 ? msg.substring(0, 50) + '...' : msg, undefined);
                    // Fallback: send null or original URI (which won't work on backend but saves crash)
                    // Let's send null if processing fails so we don't save bad data
                    vesselPicture = null;
                }
            }

            // Strip data URI prefix if present (backend expects raw base64)
            if (vesselPicture && vesselPicture.startsWith('data:image')) {
                vesselPicture = vesselPicture.replace(/^data:image\/[a-z]+;base64,/, '');
            }

            const inputWithImage = {
                ...vesselInput,
                vesselPicture: vesselPicture
            };

            const newVessel = await createVessel(inputWithImage);

            if (!newVessel) throw new Error('Failed to create vessel on backend');

            setAddModalVisible(false);
            await haptics.successNotification();
            router.push(`/vessel/${newVessel.id}` as any);
        } catch (error) {
            console.error('Failed to create vessel:', error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Creation Failed', getFriendlyErrorMessage(msg));
            await haptics.errorNotification();
        } finally {
            setIsCreating(false);
        }
    }, [router, createVessel, haptics, showToast]);

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
            let finalUpdates = { ...updates };

            // Check if image update exists and handle local file
            if (finalUpdates.vesselPicture && (finalUpdates.vesselPicture.startsWith('file:') || finalUpdates.vesselPicture.startsWith('content:'))) {
                try {
                    const fileInfo = await FileSystem.getInfoAsync(finalUpdates.vesselPicture);
                    if (fileInfo.exists) {
                        // 10MB Limit Check
                        const MAX_SIZE = 10 * 1024 * 1024;
                        if (fileInfo.size > MAX_SIZE) {
                            throw new Error('Image size exceeds 10MB limit');
                        }

                        const base64 = await FileSystem.readAsStringAsync(finalUpdates.vesselPicture, {
                            encoding: 'base64'
                        });
                        finalUpdates.vesselPicture = base64;
                    }
                } catch (err: any) {
                    console.warn('Image processing failed:', err);
                    const msg = err.message || 'Image processing failed';
                    showToast(msg.length > 50 ? msg.substring(0, 50) + '...' : msg);
                    delete finalUpdates.vesselPicture; // Don't save broken image
                }
            }

            // Strip data URI prefix if present (backend expects raw base64)
            if (finalUpdates.vesselPicture && finalUpdates.vesselPicture.startsWith('data:image')) {
                finalUpdates.vesselPicture = finalUpdates.vesselPicture.replace(/^data:image\/[a-z]+;base64,/, '');
            }

            const updated: Vessel = {
                ...vesselToEdit,
                ...finalUpdates,
                vesselType: (finalUpdates.vesselType || vesselToEdit.vesselType) as any, // Ensure enum compatibility
            };
            const result = await updateVessel(updated);

            if (!result) {
                throw new Error('Failed to update vessel on backend');
            }

            await refreshVesselsWithStatus();
            setEditModalVisible(false);
            setVesselToEdit(null);
            showToast('Vessel updated', createElement(CircleCheckBig, { size: 20, color: 'white' }));
            await haptics.successNotification();
        } catch (err) {
            console.error('Failed to update vessel', err);
            const msg = err instanceof Error ? err.message : 'Unknown error';
            Alert.alert('Update Failed', getFriendlyErrorMessage(msg));
            await haptics.errorNotification();
        } finally {
            setIsSaving(false);
        }
    }, [vesselToEdit, updateVessel, refreshVesselsWithStatus, haptics, showToast]);

    const handleToastAnimationComplete = useCallback(() => {
        // No-op or remove if not needed by UI anymore (global toast handles its own animation)
    }, []);

    const onRefresh = useCallback(async () => {
        resetNetworkToast();
        await refreshVesselsWithStatus(false); // Manual refresh: show spinner
    }, [refreshVesselsWithStatus, resetNetworkToast]);

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
            onRefresh,
        }
    };
}
