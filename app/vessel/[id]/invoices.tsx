import React, { useMemo } from 'react';
import { useColorScheme } from 'nativewind';
import { View, FlatList, Pressable, Alert, Image, TouchableOpacity } from 'react-native';
import { Receipt, Download, Pencil, Trash2, Plus, FileText } from 'lucide-react-native';
import { ThemedText, ThemedView, Card, Loader, LockedScreen } from '@/components/common';
import { VesselTopBar, InvoiceCard } from '@/components/vessel';
import { useVesselDetails, useInvoices } from '@/hooks';
import CreateInvoiceSheet from '@/components/vessel/CreateInvoiceSheet';
import EditInvoiceSheet from '@/components/vessel/EditInvoiceSheet';
import { Invoice } from '@/types';
import { mapBackendInvoice } from '@/lib/mappers';

export default function VesselInvoices() {
  const { vessel, hasQ88, hasFormC } = useVesselDetails();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Load invoices using hook
  const {
    invoices,
    isLoading: isLoadingInvoices,
    processingMap,
    actions: {
      create: createInvoice,
      update: updateInvoice,
      updateLocal: updateInvoiceLocal,
      delete: deleteInvoice,
      changeStatus,
      downloadPdf
    }
  } = useInvoices(vessel?.id);

  const sorted = invoices;

  const [editingInvoice, setEditingInvoice] = React.useState<Invoice | null>(null);

  // Date Picker state moved to EditInvoiceSheet
  const [tempDate, setTempDate] = React.useState<Date | null>(null);

  const [showCreateInvoice, setShowCreateInvoice] = React.useState(false);

  // Removed local bottomSheetRef for invoices
  const snapPoints = React.useMemo(() => ['60%', '90%'], []);

  // Document verification guard
  const vesselTypeRaw = (
    (vessel as any)?.vesselType ?? (vessel as any)?.type ?? (vessel as any)?.vessel_type ?? ''
  ).toString().trim().toLowerCase();
  const isGasCarrier = vesselTypeRaw.includes('gas') && vesselTypeRaw.includes('carrier');
  const missingDocs = isGasCarrier ? !(hasQ88 && hasFormC) : !hasQ88;

  // If required documents are missing, show locked state
  if (missingDocs) {
    return <LockedScreen type={isGasCarrier ? 'gas' : 'standard'} />;
  }

  function openEdit(inv: Invoice) {
    setEditingInvoice(inv);
  }

  function closeEdit() {
    setEditingInvoice(null);
  }

  function handleEdit(inv: Invoice) {
    console.log('[Invoices] Edit button pressed for:', inv.number);
    openEdit(inv);
  }

  function handleDownload(inv: Invoice) {
    downloadPdf(inv);
  }

  function handleDelete(inv: Invoice) {
    deleteInvoice(inv);
  }

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000] p-0">
      <VesselTopBar
        vesselName={vessel?.vesselName ?? ''}
        rightContent={
          <TouchableOpacity
            onPress={() => setShowCreateInvoice(true)}
            className="p-2 bg-blue-600 rounded-full"
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      <View className="flex-1 p-4">
        {isLoadingInvoices ? (
          <Loader />
        ) : sorted.length === 0 ? (
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

      <CreateInvoiceSheet
        visible={showCreateInvoice}
        onClose={() => setShowCreateInvoice(false)}
        onSuccess={(newInv) => {
          createInvoice(newInv);
          setShowCreateInvoice(false);
          Alert.alert('Success', 'Invoice created successfully.');
        }}
        vesselId={String(vessel?.id || '')}
      />

      <EditInvoiceSheet
        invoice={editingInvoice}
        onClose={() => setEditingInvoice(null)}
        onSave={(inv, payload) => updateInvoice(inv, payload) as any}
      />
    </ThemedView>
  );
}
