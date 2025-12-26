import React, { useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { View, FlatList, Pressable, Alert, Image, Linking, TextInput, StyleSheet, ScrollView, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Receipt, Download, Pencil, Trash2, PlusCircle, FileText, Calendar, Lock } from 'lucide-react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useVesselDetails } from '@/hooks';
import { invoiceService } from '@/services';
import TCInvoiceFormSheet from '@/components/vessel/TCInvoiceFormSheet';

type Invoice = {
  id: string;
  number: string;
  type: 'TC Hire' | 'VC Freight' | string;
  date: string; // ISO string
  dueDate?: string; // optional ISO
  amount: number;
  currency: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  pdfUrl?: string | null;
  pdfReady?: boolean;
};

function formatCurrency(amount: number, currency = 'USD') {
  try {
    // Force en-US style grouping and decimal separator so we get: "USD 427,500.00"
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency} ${formatted}`;
  } catch (e) {
    // Fallback
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

function StatusBadge({ status }: { status: Invoice['status'] }) {
  const base = 'px-1 py-0.5 rounded-full text-xs font-medium mr-2';
  if (status === 'Paid') return <ThemedText className={`${base} bg-green-50 text-green-700 border border-green-100`}>Paid</ThemedText>;
  if (status === 'Overdue') return <ThemedText className={`${base} bg-red-50 text-red-700 border border-red-100`}>Overdue</ThemedText>;
  return <ThemedText className={`${base} bg-yellow-50 text-yellow-700 border border-yellow-100`}>Pending</ThemedText>;
}

function TypeBadge({ type }: { type: string }) {
  return <ThemedText className="px-0.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium uppercase">{type}</ThemedText>;
}

function InvoiceCard({
  invoice,
  onDownload,
  onEdit,
  onDelete,
  processing
}: {
  invoice: Invoice;
  onDownload: (i: Invoice) => void;
  onEdit: (i: Invoice) => void;
  onDelete: (i: Invoice) => void;
  processing?: boolean
}) {
  // small helper for status color accent
  const statusColor = invoice.status === 'Paid' ? '#10b981' : invoice.status === 'Overdue' ? '#ef4444' : '#f59e0b';

  return (
    <View className="bg-white dark:bg-[#071217] border border-gray-100 dark:border-gray-800 rounded-lg p-3 mb-3 w-full flex-row items-center">
      {/* left accent */}
      <View style={{ width: 4, height: 40, backgroundColor: statusColor, borderRadius: 4, marginRight: 2 }} />

      {/* Left: thumbnail */}
      <View className="w-10 items-center">
        {invoice.pdfReady ? (
          <Image source={{ uri: invoice.pdfUrl ?? '' }} style={{ width: 36, height: 36, borderRadius: 6 }} resizeMode="contain" />
        ) : (
          <View className="w-10 h-10 rounded items-center justify-center">
            <FileText size={24} color="#9ca3af" />
          </View>
        )}
      </View>

      {/* Middle: content */}
      <View className="flex-1">
        <ThemedText className="text-sm font-semibold text-gray-800 dark:text-gray-100" numberOfLines={1} ellipsizeMode="tail">{invoice.number}</ThemedText>
        <View className="flex-row items-center gap-2 space-x-2 mt-1">
          <TypeBadge type={invoice.type} />
          <ThemedText className="text-xs text-gray-500 dark:text-gray-400">{new Date(invoice.date).toLocaleDateString()}</ThemedText>
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <ThemedText className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(invoice.amount, invoice.currency)}</ThemedText>
          <StatusBadge status={invoice.status} />
        </View>
      </View>

      {/* Right: actions */}
      <View className="items-end justify-between">
        <Pressable onPress={() => onDownload(invoice)} accessibilityLabel="Download invoice" className="p-1 rounded-full" disabled={!!processing}>
          <Download size={16} color={processing ? '#9ca3af' : '#374151'} />
        </Pressable>
        <Pressable onPress={() => onEdit(invoice)} className="mt-2 p-1 rounded-full" disabled={!!processing}>
          <Pencil size={16} color={processing ? '#9ca3af' : '#374151'} />
        </Pressable>
        <Pressable onPress={() => onDelete(invoice)} className="mt-2 p-1 rounded-full" disabled={!!processing}>
          <Trash2 size={16} color={processing ? '#9ca3af' : '#374151'} />
        </Pressable>
      </View>
    </View>
  );
}

export default function VesselInvoices() {
  const { vessel, hasQ88, hasFormC } = useVesselDetails();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Load invoices from backend because the vessel object does not include them by default
  const [invoicesState, setInvoicesState] = React.useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = React.useState(false);
  const [processingMap, setProcessingMap] = React.useState<Record<string, boolean>>({});

  const [editingInvoice, setEditingInvoice] = React.useState<Invoice | null>(null);
  const [formState, setFormState] = React.useState({
    number: '',
    type: '',
    date: '',
    dueDate: '',
    amount: '',
    currency: '',
    status: ''
  });
  const [showDatePickerFor, setShowDatePickerFor] = React.useState<null | 'date' | 'dueDate'>(null);
  const [tempDate, setTempDate] = React.useState<Date | null>(null);

  const [showCreateTC, setShowCreateTC] = React.useState(false);

  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['60%', '90%'], []);

  // Document verification guard
  const vesselTypeRaw = (
    (vessel as any)?.vesselType ?? (vessel as any)?.type ?? (vessel as any)?.vessel_type ?? ''
  ).toString().trim().toLowerCase();
  const isGasCarrier = vesselTypeRaw.includes('gas') && vesselTypeRaw.includes('carrier');
  const missingDocs = isGasCarrier ? !(hasQ88 && hasFormC) : !hasQ88;

  // If required documents are missing, show locked state
  if (missingDocs) {
    return (
      <ThemedView className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
          <Lock size={40} color="#9ca3af" />
        </View>
        <ThemedText className="text-xl font-semibold mb-2">Invoices Locked</ThemedText>
        <ThemedText className="text-center text-gray-500 dark:text-gray-400">
          {isGasCarrier
            ? 'Please upload Q88 and Form C in the Specs section to unlock this page.'
            : 'Please upload Q88 in the Specs section to unlock this page.'}
        </ThemedText>
      </ThemedView>
    );
  }

  function setProcessing(id: string, value: boolean) {
    setProcessingMap(prev => ({ ...prev, [id]: value }));
  }

  // --- Effects and Memo (Moved before Return) ---
  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!vessel?.id) return;
      try {
        setIsLoadingInvoices(true);
        const raw = await invoiceService.getInvoicesByVessel(vessel.id);
        if (!mounted) return;
        const mapped: Invoice[] = (raw || []).map((i: any) => {
          let t = i.invoiceType ?? i.invoice_type ?? i.type ?? 'TC Hire';
          if (t === 'Hire') t = 'TC Hire';
          if (t === 'Freight') t = 'VC Freight';

          return {
            id: String(i.invoiceId ?? i.id ?? i.invoice_id ?? i.id),
            number: i.invoiceNumber ?? i.invoice_number ?? i.number ?? 'UNKNOWN',
            type: t,
            date: i.invoiceDate ?? i.invoice_date ?? i.date ?? new Date().toISOString(),
            dueDate: i.periodTo ?? i.dueDate ?? i.due_date,
            amount: Number(i.totalAmount ?? i.total_amount ?? i.amount ?? 0),
            currency: i.currency ?? 'USD',
            status: i.paymentStatus ?? i.payment_status ?? i.status ?? 'Pending',
            pdfUrl: i.fileUrl ?? i.pdfUrl ?? null,
            pdfReady: !!(i.pdfReady ?? i.pdf_ready ?? i.fileUrl)
          } as Invoice;
        });
        setInvoicesState(mapped);
      } catch (err) {
        console.error('Failed to load invoices:', err);
      } finally {
        if (mounted) setIsLoadingInvoices(false);
      }
    }
    load();
    return () => { mounted = false };
  }, [vessel]);

  React.useEffect(() => {
    if (!editingInvoice) return;
    setFormState({
      number: editingInvoice.number ?? '',
      type: editingInvoice.type ?? '',
      date: editingInvoice.date ? editingInvoice.date.split('T')[0] : '',
      dueDate: editingInvoice.dueDate ? String(editingInvoice.dueDate).split('T')[0] : '',
      amount: String(editingInvoice.amount ?? ''),
      currency: editingInvoice.currency ?? 'USD',
      status: editingInvoice.status ?? 'Pending'
    });
  }, [editingInvoice]);

  // Sort newest first
  const sorted = useMemo(() => [...invoicesState].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [invoicesState]);
  // ----------------------------------------------

  function onOpenDatePicker(field: 'date' | 'dueDate') {
    const val = field === 'date' ? formState.date : formState.dueDate;
    const d = val ? new Date(val) : new Date();
    setTempDate(d);
    setShowDatePickerFor(field);
  }

  function onDateChange(event: any, selected?: Date) {
    if (Platform.OS === 'android') {
      setShowDatePickerFor(null);
    }
    if (selected) {
      const iso = selected.toISOString();
      if (showDatePickerFor === 'date') setFormState(s => ({ ...s, date: iso }));
      if (showDatePickerFor === 'dueDate') setFormState(s => ({ ...s, dueDate: iso }));
      setTempDate(null);
    }
  }

  async function saveEdit() {
    if (!editingInvoice) return;
    const payload = {
      invoiceNumber: formState.number,
      invoiceType: formState.type,
      invoiceDate: formState.date || undefined,
      dueDate: formState.dueDate || undefined,
      totalAmount: Number(formState.amount) || 0,
      currency: formState.currency || 'USD',
      paymentStatus: formState.status || 'Pending'
    };

    const proceed = async () => {
      try {
        setProcessing(editingInvoice.id, true);

        // Map frontend types back to backend types
        let backendType = formState.type;
        if (formState.type === 'TC Hire') backendType = 'Hire';
        if (formState.type === 'VC Freight') backendType = 'Freight';

        const payload = {
          invoiceNumber: formState.number,
          invoiceType: backendType,
          invoiceDate: formState.date || undefined,
          dueDate: formState.dueDate || undefined,
          totalAmount: Number(formState.amount) || 0,
          currency: formState.currency || 'USD',
          paymentStatus: formState.status || 'Pending'
        };

        const updated = await invoiceService.updateInvoice(Number(editingInvoice.id), payload);

        // Helper to normalize backend type to frontend
        const normalizeType = (t: string) => {
          if (t === 'Hire') return 'TC Hire';
          if (t === 'Freight') return 'VC Freight';
          return t;
        };

        const newDetails: Invoice = {
          id: String(updated.invoiceId ?? updated.id ?? updated.invoice_id ?? editingInvoice.id),
          number: updated.invoiceNumber ?? updated.invoice_number ?? payload.invoiceNumber,
          type: normalizeType(updated.invoiceType ?? updated.invoice_type ?? payload.invoiceType),
          date: updated.invoiceDate ?? updated.invoice_date ?? payload.invoiceDate,
          dueDate: updated.dueDate ?? updated.due_date ?? payload.dueDate,
          amount: Number((updated.totalAmount ?? updated.total_amount ?? payload.totalAmount) || 0),
          currency: updated.currency ?? payload.currency,
          status: (updated.paymentStatus ?? updated.payment_status ?? payload.paymentStatus) || 'Pending',
          pdfUrl: updated.fileUrl ?? updated.pdfUrl ?? null,
          // Only permit pdfReady if we actually have a valid URL url
          pdfReady: !!(updated.fileUrl ?? updated.pdfUrl)
        };
        setInvoicesState(prev => prev.map(i => i.id === editingInvoice.id ? newDetails : i));
        bottomSheetRef.current?.dismiss();
        setEditingInvoice(null);
      } catch (err) {
        console.error('Failed to save invoice', err);
        Alert.alert('Save failed', 'Could not save invoice changes.');
      } finally {
        setProcessing(editingInvoice.id, false);
      }
    };

    if (editingInvoice.pdfUrl) {
      Alert.alert(
        'Regenerate PDF?',
        'Saving will regenerate the invoice PDF and replace the original. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: proceed }
        ]
      );
    } else {
      await proceed();
    }
  }

  function openEdit(inv: Invoice) {
    console.log('[Invoices] openEdit called for:', inv.id);
    setEditingInvoice(inv);

    // Check if ref is set
    if (bottomSheetRef.current) {
      console.log('[Invoices] Presenting modal');
      bottomSheetRef.current.present();
    } else {
      console.error('[Invoices] bottomSheetRef is null!');
    }
  }

  function closeEdit() {
    console.log('[Invoices] closeEdit called');
    bottomSheetRef.current?.dismiss();
    setEditingInvoice(null);
  }

  function handleEdit(inv: Invoice) {
    console.log('[Invoices] Edit button pressed for:', inv.number);
    openEdit(inv);
  }

  function handleDownload(inv: Invoice) {
    // If we already have a URL open it. Otherwise try to refresh the invoice from backend and check again.
    (async () => {
      try {
        setProcessing(inv.id, true);
        if (inv.pdfUrl) {
          await Linking.openURL(inv.pdfUrl);
          return;
        }
        // fetch latest invoice from backend
        const fresh = await invoiceService.getInvoiceById(Number(inv.id));
        const pdf = fresh?.fileUrl ?? fresh?.pdfUrl ?? null;
        if (pdf) {
          // update local state with new url
          setInvoicesState(prev => prev.map(i => i.id === inv.id ? { ...i, pdfUrl: pdf, pdfReady: true } : i));
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
    })();
  }

  function handleDelete(inv: Invoice) {
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
              setInvoicesState(prev => prev.filter(i => i.id !== inv.id));
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
  }

  async function changeStatus(inv: Invoice, newStatus: Invoice['status']) {
    try {
      setProcessing(inv.id, true);
      const updated = await invoiceService.updateInvoiceStatus(Number(inv.id), newStatus);
      const mapped: Invoice = {
        id: String(updated.invoiceId ?? updated.id ?? updated.invoice_id ?? inv.id),
        number: updated.invoiceNumber ?? updated.number ?? inv.number,
        type: updated.invoiceType ?? updated.type ?? inv.type,
        date: updated.invoiceDate ?? updated.date ?? inv.date,
        dueDate: updated.dueDate ?? updated.due_date ?? inv.dueDate,
        amount: Number((updated.totalAmount ?? updated.amount ?? inv.amount) || 0),
        currency: updated.currency ?? inv.currency,
        status: updated.paymentStatus ?? updated.status ?? newStatus,
        pdfUrl: updated.fileUrl ?? updated.pdfUrl ?? inv.pdfUrl ?? null,
        pdfReady: !!(updated.pdfReady ?? updated.fileUrl ?? inv.pdfReady)
      };
      setInvoicesState(prev => prev.map(i => i.id === inv.id ? mapped : i));
    } catch (err) {
      console.error('Failed to update status', err);
      Alert.alert('Update failed', 'Could not update invoice status.');
    } finally {
      setProcessing(inv.id, false);
    }
  }

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000] p-0">
      <VesselTopBar vesselName={vessel?.vesselName ?? ''} />

      <View className="flex-1 p-3">

        {sorted.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
              <Receipt size={32} color="#9ca3af" />
            </View>
            <ThemedText className="text-gray-400 text-center text-sm">No invoices to show.</ThemedText>
          </View>
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={i => i.id}
            renderItem={({ item }) => (
              <InvoiceCard invoice={item} onDownload={handleDownload} onEdit={handleEdit} onDelete={handleDelete} processing={!!processingMap[item.id]} />
            )}
            contentContainerStyle={{ paddingBottom: 48 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Create Invoice button (bottom-right above navbar) */}
      {/* Date picker (rendered by native module when requested) */}
      {showDatePickerFor ? (
        <DateTimePicker
          value={tempDate ?? new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      ) : null}


      <Pressable
        accessibilityLabel="Create invoice"
        onPress={() => setShowCreateTC(true)}
        style={{
          position: 'absolute',
          right: 16,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#2563eb',
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 }
        }}
      >
        <PlusCircle size={28} color="#fff" />
      </Pressable>

      <TCInvoiceFormSheet
        visible={showCreateTC}
        onClose={() => setShowCreateTC(false)}
        onSuccess={(newInv) => {
          setInvoicesState(prev => [newInv, ...prev]);
          setShowCreateTC(false);
          Alert.alert('Success', 'Invoice created successfully.');
        }}
        vesselId={String(vessel?.id || '')}
      />

      {/* Edit Invoice Bottom Sheet Modal */}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={(props) => (<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />)}
        backgroundStyle={{ backgroundColor: isDark ? '#151718' : '#F2F2F7' }}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#404040' : '#e5e7eb' }}
        onDismiss={() => setEditingInvoice(null)}
      >
        <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <ThemedText className="text-xs text-gray-500 ml-1 mb-1 font-medium">Invoice Number</ThemedText>
          <TextInput
            style={[styles.iosInput, isDark && styles.iosInputDark]}
            value={formState.number}
            onChangeText={v => setFormState(s => ({ ...s, number: v }))}
            placeholder="INV-0000"
            placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
          />

          <ThemedText className="text-xs text-gray-500 mt-5 ml-1 mb-2 font-medium">Type</ThemedText>
          <View style={[styles.iosSegmentedContainer, isDark && styles.iosSegmentedContainerDark]}>
            {['TC Hire', 'VC Freight', 'Demurrage'].map((t) => {
              const isActive = formState.type === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setFormState(s => ({ ...s, type: t }))}
                  style={[styles.iosSegmentedItem, isActive && styles.iosSegmentedItemActive, isActive && isDark && styles.iosSegmentedItemActiveDark]}
                >
                  <ThemedText style={[styles.iosSegmentedText, isDark && styles.iosSegmentedTextDark, isActive && styles.iosSegmentedTextActive]}>
                    {t}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 20 }}>
            {/* Invoice Date */}
            <View>
              <ThemedText className="text-xs text-gray-500 ml-1 mb-1 font-medium">Invoice Date</ThemedText>
              <Pressable
                onPress={() => setShowDatePickerFor(showDatePickerFor === 'date' ? null : 'date')}
                style={[styles.iosInput, isDark && styles.iosInputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 0 }]}
              >
                <ThemedText style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>
                  {formState.date ? new Date(formState.date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Select Date'}
                </ThemedText>
                <Calendar size={18} color={isDark ? '#999' : '#666'} />
              </Pressable>
              {showDatePickerFor === 'date' && (
                <View style={{
                  marginTop: 8,
                  backgroundColor: isDark ? '#2C2C2E' : '#f2f2f7',
                  borderRadius: 12,
                  paddingVertical: 8,
                  overflow: 'hidden',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <DateTimePicker
                    value={formState.date ? new Date(formState.date) : new Date()}
                    mode="date"
                    display="inline"
                    onChange={(e, d) => {
                      if (d) setFormState(s => ({ ...s, date: d.toISOString() }));
                    }}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={{
                      maxWidth: '100%',
                      alignSelf: 'center'
                    }}
                  />
                </View>
              )}
            </View>

            {/* Due Date */}
            <View style={{ marginTop: 20 }}>
              <ThemedText className="text-xs text-gray-500 ml-1 mb-1 font-medium">Due Date</ThemedText>
              <Pressable
                onPress={() => setShowDatePickerFor(showDatePickerFor === 'dueDate' ? null : 'dueDate')}
                style={[styles.iosInput, isDark && styles.iosInputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 0 }]}
              >
                <ThemedText style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>
                  {formState.dueDate ? new Date(formState.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Select Due Date'}
                </ThemedText>
                <Calendar size={18} color={isDark ? '#999' : '#666'} />
              </Pressable>
              {showDatePickerFor === 'dueDate' && (
                <View style={{
                  marginTop: 8,
                  backgroundColor: isDark ? '#2C2C2E' : '#f2f2f7',
                  borderRadius: 12,
                  paddingVertical: 8,
                  overflow: 'hidden',
                  alignItems: 'center',
                  width: '100%'
                }}>
                  <DateTimePicker
                    value={formState.dueDate ? new Date(formState.dueDate) : new Date()}
                    mode="date"
                    display="inline"
                    onChange={(e, d) => {
                      if (d) setFormState(s => ({ ...s, dueDate: d.toISOString() }));
                    }}
                    themeVariant={isDark ? 'dark' : 'light'}
                    style={{
                      maxWidth: '100%',
                      alignSelf: 'center'
                    }}
                  />
                </View>
              )}
            </View>
          </View>

          <ThemedText className="text-xs text-gray-500 mt-5 ml-1 mb-1 font-medium">Amount</ThemedText>
          <TextInput
            style={[styles.iosInput, isDark && styles.iosInputDark]}
            value={formState.amount}
            keyboardType="numeric"
            onChangeText={v => setFormState(s => ({ ...s, amount: v }))}
            placeholder="0.00"
            placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
          />

          <ThemedText className="text-xs text-gray-500 mt-5 ml-1 mb-2 font-medium">Status</ThemedText>
          <View style={[styles.iosSegmentedContainer, isDark && styles.iosSegmentedContainerDark]}>
            {['Pending', 'Paid', 'Overdue'].map((st) => {
              const isActive = formState.status === st;

              return (
                <Pressable
                  key={st}
                  onPress={() => setFormState(s => ({ ...s, status: st }))}
                  style={[styles.iosSegmentedItem, isActive && styles.iosSegmentedItemActive, isActive && isDark && styles.iosSegmentedItemActiveDark]}
                >
                  <ThemedText style={[
                    styles.iosSegmentedText,
                    isDark && styles.iosSegmentedTextDark,
                    isActive && styles.iosSegmentedTextActive
                  ]}>
                    {st}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>


          <Pressable onPress={saveEdit} style={styles.iosSaveButton}>
            <ThemedText style={styles.iosSaveButtonText}>Save</ThemedText>
          </Pressable>

        </BottomSheetScrollView>
      </BottomSheetModal>
    </ThemedView >
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    width: '94%',
    maxHeight: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden'
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8,
    borderRadius: 6,
    marginTop: 6,
    backgroundColor: '#f8fafc'
  },
  modalButtonPrimary: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalButtonSecondary: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    marginTop: 6,
    overflow: 'hidden'
  },
  // iOS Styles
  iosInput: {
    backgroundColor: '#F2F2F7', // systemGray6
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    color: '#000',
    marginTop: 6,
  },
  iosInputDark: {
    backgroundColor: '#1C1C1E', // systemGray6 Dark
    color: '#FFF',
  },
  iosSegmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA', // systemGray5
    borderRadius: 8,
    padding: 2,
    height: 36, // Standard iOS height
  },
  iosSegmentedContainerDark: {
    backgroundColor: '#2C2C2E',
  },
  iosSegmentedItem: {
    flex: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosSegmentedItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  iosSegmentedItemActiveDark: {
    backgroundColor: '#636366', // systemGray3
  },
  iosSegmentedText: {
    fontSize: 13,
    fontWeight: '500',
  },
  iosSegmentedTextDark: {
    // Left empty or removed if ThemedText handles it, but keeping it empty to clear previous overrides if needed or just removing it from usage
  },
  iosSegmentedTextActive: {
    fontWeight: '600',
  },
  iosSaveButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iosSaveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  }
});
