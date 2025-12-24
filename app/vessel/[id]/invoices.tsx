import React, {useMemo} from 'react';
import { View, FlatList, Pressable, Alert, Image, Linking } from 'react-native';
import { Receipt, Download, Pencil, Trash2, PlusCircle } from 'lucide-react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useVesselDetails } from '@/hooks';
import { invoiceService } from '@/services';

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
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch (e) {
    // Fallback
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function StatusBadge({status}: {status: Invoice['status']}){
  const base = 'px-3 py-1 rounded-full text-sm';
  if(status === 'Paid') return <ThemedText className={`${base} bg-green-100 text-green-800`}>Paid</ThemedText>;
  if(status === 'Overdue') return <ThemedText className={`${base} bg-red-100 text-red-800`}>Overdue</ThemedText>;
  return <ThemedText className={`${base} bg-yellow-100 text-yellow-800`}>Pending</ThemedText>;
}

function TypeBadge({type}:{type:string}){
  return <ThemedText className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">{type}</ThemedText>;
}

function InvoiceCard({invoice, onDownload, onEdit, onDelete}:{invoice:Invoice; onDownload:(i:Invoice)=>void; onEdit:(i:Invoice)=>void; onDelete:(i:Invoice)=>void}){
  return (
    <View className="bg-white dark:bg-gray-900 rounded-xl shadow p-4 mb-4 w-full flex-row items-start">
      {/* Left: thumbnail */}
      <View className="w-14 items-center">
        {invoice.pdfReady ? (
          <Image source={{uri: invoice.pdfUrl ?? ''}} style={{width:48,height:48}} resizeMode="contain" />
        ) : (
          <View className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-800 items-center justify-center">
            <Receipt size={20} color="#9ca3af" />
          </View>
        )}
      </View>

      {/* Middle: content */}
      <View className="flex-1 px-3">
        <ThemedText className="text-xl font-bold" numberOfLines={1} ellipsizeMode="tail">{invoice.number}</ThemedText>
        <View className="flex-row items-center space-x-2 mt-2">
          <TypeBadge type={invoice.type} />
          <ThemedText className="text-gray-500">{new Date(invoice.date).toLocaleDateString()}</ThemedText>
        </View>

        <View className="flex-row items-center justify-between mt-4">
          <ThemedText className="text-2xl font-extrabold">{formatCurrency(invoice.amount, invoice.currency)}</ThemedText>
          <StatusBadge status={invoice.status} />
        </View>
      </View>

      {/* Right: actions */}
      <View className="items-end justify-between">
        <Pressable onPress={()=>onDownload(invoice)} accessibilityLabel="Download invoice">
          <Download size={20} color="#374151" />
        </Pressable>
        <Pressable onPress={()=>onEdit(invoice)} className="mt-4">
          <Pencil size={20} color="#374151" />
        </Pressable>
        <Pressable onPress={()=>onDelete(invoice)} className="mt-4">
          <Trash2 size={20} color="#374151" />
        </Pressable>
      </View>
    </View>
  );
}

export default function VesselInvoices() {
  const {vessel} = useVesselDetails();

  // Load invoices from backend because the vessel object does not include them by default
  const [invoicesState, setInvoicesState] = React.useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!vessel?.id) return;
      try {
        setIsLoadingInvoices(true);
        const raw = await invoiceService.getInvoicesByVessel(vessel.id);
        if (!mounted) return;
        const mapped: Invoice[] = (raw || []).map((i:any) => ({
          id: String(i.invoiceId ?? i.id ?? i.invoice_id ?? i.id),
          number: i.invoiceNumber ?? i.invoice_number ?? i.number ?? 'UNKNOWN',
          type: i.invoiceType ?? i.invoice_type ?? i.type ?? 'TC Hire',
          date: i.invoiceDate ?? i.invoice_date ?? i.date ?? new Date().toISOString(),
          dueDate: i.periodTo ?? i.dueDate ?? i.due_date,
          amount: Number(i.totalAmount ?? i.total_amount ?? i.amount ?? 0),
          currency: i.currency ?? 'USD',
          status: i.paymentStatus ?? i.payment_status ?? i.status ?? 'Pending',
          pdfUrl: i.fileUrl ?? i.pdfUrl ?? null,
          pdfReady: !!(i.pdfReady ?? i.pdf_ready ?? i.fileUrl)
        } as Invoice));
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

  // Sort newest first
  const sorted = useMemo(()=>[...invoicesState].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()), [invoicesState]);

  function handleDownload(inv:Invoice){
    if(!inv.pdfUrl){
      Alert.alert('PDF not available', 'PDF is still being generated. Please try again later.');
      return;
    }
    Linking.openURL(inv.pdfUrl).catch(()=>{
      Alert.alert('Could not open PDF', 'An error occurred while opening the PDF.');
    });
  }

  function handleEdit(inv:Invoice){
    // Navigation to edit screen would go here. For now, show a placeholder alert.
    Alert.alert('Edit invoice', `Edit invoice ${inv.number}`);
  }

  function handleDelete(inv:Invoice){
    Alert.alert(
      'Delete invoice',
      `Are you sure you want to delete ${inv.number}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: ()=>{
          // Replace with real deletion code (API call / state update)
          Alert.alert('Deleted', `${inv.number} has been deleted (stub).`);
        } }
      ]
    );
  }

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000] p-0">
      <VesselTopBar vesselName={vessel?.vesselName ?? ''} />

      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-end mb-4">
          {/* Create button remains visible but the 'Invoices' page heading was removed per request */}
          <Pressable onPress={()=>Alert.alert('Create invoice','Open invoice creation (stub)')} accessibilityLabel="Create invoice">
            <PlusCircle size={36} color="#2563eb" />
          </Pressable>
        </View>

        {sorted.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
              <Receipt size={32} color="#9ca3af" />
            </View>
            <ThemedText className="text-gray-400 text-center text-sm">No invoices yet. Tap + to create your first invoice.</ThemedText>
          </View>
        ) : (
          <FlatList
            data={sorted}
            keyExtractor={i=>i.id}
            renderItem={({item})=> (
              <InvoiceCard invoice={item} onDownload={handleDownload} onEdit={handleEdit} onDelete={handleDelete} />
            )}
            contentContainerStyle={{paddingBottom: 48}}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ThemedView>
  );
}

