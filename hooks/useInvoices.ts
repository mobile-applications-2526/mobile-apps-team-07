import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { Invoice } from '@/types';
import { invoiceService, documentService, API_URL } from '@/services';
import { mapBackendInvoice } from '@/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceKeys } from './queries';
import * as db from '@/lib/database';

export function useInvoices(vesselId: number | undefined) {
    const queryClient = useQueryClient();
    const [processingMap, setProcessingMap] = useState<Record<string, boolean>>({});

    // Use React Query for invoices - persists across navigation
    const { data: invoicesData, isLoading, refetch } = useQuery({
        queryKey: invoiceKeys.byVessel(vesselId!),
        queryFn: async (): Promise<Invoice[]> => {
            try {
                const raw = await invoiceService.fetchInvoicesByVesselNetwork(vesselId!);
                return (raw || []).map(mapBackendInvoice);
            } catch (err) {
                console.warn('Network failed for invoices, using cache:', err);
                const cachedRaw = await db.getCacheValue<any[]>(db.CACHE_KEYS.INVOICES_BY_VESSEL(vesselId!));
                if (cachedRaw) return cachedRaw.map(mapBackendInvoice);
                throw err;
            }
        },
        enabled: !!vesselId,
        placeholderData: () => queryClient.getQueryData(invoiceKeys.byVessel(vesselId!)),
    });

    const invoices = invoicesData ?? [];

    const loadInvoices = useCallback(async () => {
        await refetch();
    }, [refetch]);

    const setProcessing = (id: string, value: boolean) => {
        setProcessingMap(prev => ({ ...prev, [id]: value }));
    };

    // Optimistic update helper
    const optimisticUpdate = useCallback((updater: (prev: Invoice[]) => Invoice[]) => {
        queryClient.setQueryData<Invoice[]>(invoiceKeys.byVessel(vesselId!), (old) => updater(old ?? []));
    }, [vesselId, queryClient]);

    // Optimistic create - instantly add to UI
    const createInvoice = useCallback((newInv: Invoice) => {
        optimisticUpdate(prev => [newInv, ...prev]);
        // Background refetch to sync with server
        queryClient.invalidateQueries({ queryKey: invoiceKeys.byVessel(vesselId!) });
    }, [vesselId, queryClient, optimisticUpdate]);

    // Optimistic update - instantly show changes in UI
    const updateInvoiceLocal = useCallback((updatedInv: Invoice) => {
        optimisticUpdate(prev => prev.map(i => i.id === updatedInv.id ? updatedInv : i));
    }, [optimisticUpdate]);

    const downloadPdf = useCallback(async (inv: Invoice) => {
        try {
            setProcessing(inv.id, true);

            // Get the PDF URL from invoice or fetch latest
            let pdfUrl = inv.pdfUrl || inv.fileUrl;

            if (!pdfUrl) {
                // Fetch latest invoice to get PDF URL
                const fresh = await invoiceService.getInvoiceById(Number(inv.id));
                pdfUrl = (fresh as any)?.fileUrl ?? (fresh as any)?.pdfUrl ?? null;

                if (pdfUrl) {
                    // Invalidate to update cache with PDF URL
                    queryClient.invalidateQueries({ queryKey: invoiceKeys.byVessel(vesselId!) });
                }
            }

            if (!pdfUrl) {
                Alert.alert('PDF not available', 'PDF is still being generated. Please try again later.');
                return;
            }

            // Ensure full URL construction (backend returns relative URL like /api/invoices/{id}/download)
            const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `${API_URL}${pdfUrl}`;

            // Generate a proper filename for the invoice
            const filename = `Invoice_${inv.number.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;

            // Use the document download service to properly download and share the file
            await documentService.downloadDocument(fullUrl, filename);
        } catch (err: any) {
            console.error('Download failed', err);
            Alert.alert('Download failed', err?.message || 'An error occurred while downloading the invoice.');
        } finally {
            setProcessing(inv.id, false);
        }
    }, [vesselId, queryClient]);

    const deleteInvoice = useCallback(async (inv: Invoice) => {
        Alert.alert(
            'Delete invoice',
            `Are you sure you want to delete ${inv.number}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        // Optimistic delete - remove from UI immediately
                        const previousData = queryClient.getQueryData<Invoice[]>(invoiceKeys.byVessel(vesselId!));
                        optimisticUpdate(prev => prev.filter(i => i.id !== inv.id));

                        try {
                            setProcessing(inv.id, true);
                            await invoiceService.deleteInvoice(Number(inv.id));
                            Alert.alert('Deleted', `${inv.number} has been deleted.`);
                        } catch (err) {
                            console.error('Delete failed', err);
                            // Rollback on error
                            if (previousData) {
                                queryClient.setQueryData(invoiceKeys.byVessel(vesselId!), previousData);
                            }
                            Alert.alert('Delete failed', 'Could not delete invoice.');
                        } finally {
                            setProcessing(inv.id, false);
                        }
                    }
                }
            ]
        );
    }, [vesselId, queryClient, optimisticUpdate]);

    const changeStatus = useCallback(async (inv: Invoice, newStatus: Invoice['status']) => {
        // Optimistic status change - show new status immediately
        const previousData = queryClient.getQueryData<Invoice[]>(invoiceKeys.byVessel(vesselId!));
        optimisticUpdate(prev => prev.map(i => i.id === inv.id ? { ...i, status: newStatus } : i));

        try {
            setProcessing(inv.id, true);
            await invoiceService.updateInvoiceStatus(Number(inv.id), newStatus);
        } catch (err) {
            console.error('Failed to update status', err);
            // Rollback on error
            if (previousData) {
                queryClient.setQueryData(invoiceKeys.byVessel(vesselId!), previousData);
            }
            Alert.alert('Update failed', 'Could not update invoice status.');
        } finally {
            setProcessing(inv.id, false);
        }
    }, [vesselId, queryClient, optimisticUpdate]);

    // Update invoice (full edit)
    const updateInvoice = useCallback(async (original: Invoice, payload: any) => {
        try {
            setProcessing(original.id, true);
            const updated = await invoiceService.updateInvoice(Number(original.id), payload);

            // Fallback: fetch again to be sure
            const fresh = await invoiceService.getInvoiceById(Number(original.id));
            const newDetails = mapBackendInvoice(fresh || updated);

            // Refetch to show updated invoice (wait for data to be available)
            await queryClient.refetchQueries({ queryKey: invoiceKeys.byVessel(vesselId!) });
            return true;
        } catch (err) {
            console.error('Failed to update invoice', err);
            Alert.alert('Save failed', 'Could not save invoice changes.');
            return false;
        } finally {
            setProcessing(original.id, false);
        }
    }, [vesselId, queryClient]);

    const sortedInvoices = useMemo(() =>
        [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [invoices]);

    return {
        invoices: sortedInvoices,
        isLoading,
        processingMap,
        actions: {
            refresh: loadInvoices,
            create: createInvoice,
            updateLocal: updateInvoiceLocal,
            update: updateInvoice,
            delete: deleteInvoice,
            changeStatus,
            downloadPdf,
        }
    };
}

