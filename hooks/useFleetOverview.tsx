import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Vessel, CreateVesselInput } from '@/types';
import { useVessels } from '@/context/VesselContext';
import { useNetworkStatus } from '@/context/NetworkStatusContext';
import { useHaptics } from './useHaptics';
import { useToast } from './useToast';
import { CircleCheckBig } from 'lucide-react-native';

export function useFleetOverview() {
    const router = useRouter();
    const haptics = useHaptics();

    const {
        vesselsWithStatus,
        refreshVesselsWithStatus,
        isLoading,
        isInitialized,
        createVessel,
        updateVessel,
        isOfflineData,
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

    // --- EVENT HANDLERS ---

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
            showToast('Vessel updated', <CircleCheckBig size={20} color="white" />);
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
