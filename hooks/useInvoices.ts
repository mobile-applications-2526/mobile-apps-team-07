import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import { Invoice } from '@/types';
import { invoiceService } from '@/services';
import { mapBackendInvoice } from '@/services';

export function useInvoices(vesselId: number | undefined) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processingMap, setProcessingMap] = useState<Record<string, boolean>>({});

    const loadInvoices = useCallback(async () => {
        if (!vesselId) return;
        try {
            setIsLoading(true);

            // Network First
            try {
                const raw = await invoiceService.fetchInvoicesByVesselNetwork(vesselId);
                const mapped = (raw || []).map(mapBackendInvoice);
                setInvoices(mapped);
            } catch (networkErr) {
                console.warn('Network failed for invoices, falling back to cache');
                // Cache Fallback
                const cachedRaw = await invoiceService.getInvoicesByVessel(vesselId);
                // Note: getInvoicesByVessel logic is "check cache, if present return it (and bg update), else fetch network".
                // Since we already failed network, getInvoicesByVessel might retry generic fetch or return cache.
                // However, my implementation of getInvoicesByVessel was: "if cache, return cache (trigger bg), else fetch network".
                // If we are offline, fetch network inside getInvoicesByVessel will fail too.
                // So checking getInvoicesByVessel is safe: if it has cache it returns it. If not it fails.

                // EXCEPT: I need to be careful not to trigger double network requests if I just failed.
                // But getInvoicesByVessel does not take an "onlyCache" param. 
                // However, standard "get...()" usually implies "get best available".

                // Let's rely on getInvoicesByVessel() correctly returning cache if present.
                const mapped = (cachedRaw || []).map(mapBackendInvoice);
                setInvoices(mapped);
            }
        } catch (err) {
            console.error('Failed to load invoices:', err);
        } finally {
            setIsLoading(false);
        }
    }, [vesselId]);

    useEffect(() => {
        loadInvoices();
    }, [loadInvoices]);

    const setProcessing = (id: string, value: boolean) => {
        setProcessingMap(prev => ({ ...prev, [id]: value }));
    };

    const createInvoice = useCallback((newInv: Invoice) => {
        setInvoices(prev => [newInv, ...prev]);
    }, []);

    const updateInvoiceLocal = useCallback((updatedInv: Invoice) => {
        setInvoices(prev => prev.map(i => i.id === updatedInv.id ? updatedInv : i));
    }, []);

    const downloadPdf = useCallback(async (inv: Invoice) => {
        try {
            setProcessing(inv.id, true);
            if (inv.pdfUrl) {
                await Linking.openURL(inv.pdfUrl);
                return;
            }
            // fetch latest
            const fresh = await invoiceService.getInvoiceById(Number(inv.id));
            const pdf = fresh?.fileUrl ?? fresh?.pdfUrl ?? null;
            if (pdf) {
                setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, pdfUrl: pdf, pdfReady: true } : i));
                await Linking.openURL(pdf);
            } else {
                Alert.alert('PDF not available', 'PDF is still being generated. Please try again later.');
            }
        } catch (err) {
            console.error('Download failed', err);
            Alert.alert('Could not open PDF', 'An error occurred while opening the PDF.');
        } finally {
            setProcessing(inv.id, false);
        }
    }, []);

    const deleteInvoice = useCallback(async (inv: Invoice) => {
        Alert.alert(
            'Delete invoice',
            `Are you sure you want to delete ${inv.number}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            setProcessing(inv.id, true);
                            await invoiceService.deleteInvoice(Number(inv.id));
                            setInvoices(prev => prev.filter(i => i.id !== inv.id));
                            Alert.alert('Deleted', `${inv.number} has been deleted.`);
                        } catch (err) {
                            console.error('Delete failed', err);
                            Alert.alert('Delete failed', 'Could not delete invoice.');
                        } finally {
                            setProcessing(inv.id, false);
                        }
                    }
                }
            ]
        );
    }, []);

    const changeStatus = useCallback(async (inv: Invoice, newStatus: Invoice['status']) => {
        try {
            setProcessing(inv.id, true);
            const updated = await invoiceService.updateInvoiceStatus(Number(inv.id), newStatus);
            const mapped = mapBackendInvoice(updated);
            setInvoices(prev => prev.map(i => i.id === inv.id ? mapped : i));
        } catch (err) {
            console.error('Failed to update status', err);
            Alert.alert('Update failed', 'Could not update invoice status.');
        } finally {
            setProcessing(inv.id, false);
        }
    }, []);

    // Update invoice (full edit)
    const updateInvoice = useCallback(async (original: Invoice, payload: any) => {
        try {
            setProcessing(original.id, true);
            const updated = await invoiceService.updateInvoice(Number(original.id), payload);

            // Fallback: fetch again to be sure
            const fresh = await invoiceService.getInvoiceById(Number(original.id));
            const newDetails = mapBackendInvoice(fresh || updated);

            setInvoices(prev => prev.map(i => i.id === original.id ? newDetails : i));
            return true;
        } catch (err) {
            console.error('Failed to update invoice', err);
            Alert.alert('Save failed', 'Could not save invoice changes.');
            return false;
        } finally {
            setProcessing(original.id, false);
        }
    }, []);

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
