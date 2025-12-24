import React, {useMemo} from 'react';
import { View, FlatList, Pressable, Alert, Image, Linking } from 'react-native';
import { Receipt, Download, Pencil, Trash2, PlusCircle, FileText } from 'lucide-react-native';
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
    // Force en-US style grouping and decimal separator so we get: "USD 427,500.00"
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency} ${formatted}`;
  } catch (e) {
    // Fallback
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

function StatusBadge({status}: {status: Invoice['status']}){
  const base = 'px-1 py-0.5 rounded-full text-xs font-medium mr-2';
  if(status === 'Paid') return <ThemedText className={`${base} bg-green-50 text-green-700 border border-green-100`}>Paid</ThemedText>;
  if(status === 'Overdue') return <ThemedText className={`${base} bg-red-50 text-red-700 border border-red-100`}>Overdue</ThemedText>;
  return <ThemedText className={`${base} bg-yellow-50 text-yellow-700 border border-yellow-100`}>Pending</ThemedText>;
}

function TypeBadge({type}:{type:string}){
  return <ThemedText className="px-0.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium uppercase">{type}</ThemedText>;
}

function InvoiceCard({invoice, onDownload, onEdit, onDelete}:{invoice:Invoice; onDownload:(i:Invoice)=>void; onEdit:(i:Invoice)=>void; onDelete:(i:Invoice)=>void}){
  // small helper for status color accent
  const statusColor = invoice.status === 'Paid' ? '#10b981' : invoice.status === 'Overdue' ? '#ef4444' : '#f59e0b';

  return (
    <View className="bg-white dark:bg-[#071217] border border-gray-100 dark:border-gray-800 rounded-lg p-3 mb-3 w-full flex-row items-center">
      {/* left accent */}
      <View style={{ width: 4, height: 40, backgroundColor: statusColor, borderRadius: 4, marginRight: 10 }} />

      {/* Left: thumbnail */}
      <View className="w-10 items-center">
        {invoice.pdfReady ? (
          <Image source={{uri: invoice.pdfUrl ?? ''}} style={{width:36,height:36, borderRadius:6}} resizeMode="contain" />
        ) : (
          <View className="w-10 h-10 rounded items-left justify-center">
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
        <Pressable onPress={()=>onDownload(invoice)} accessibilityLabel="Download invoice" className="p-1 rounded-full">
          <Download size={16} color="#374151" />
        </Pressable>
        <Pressable onPress={()=>onEdit(invoice)} className="mt-2 p-1 rounded-full">
          <Pencil size={16} color="#374151" />
        </Pressable>
        <Pressable onPress={()=>onDelete(invoice)} className="mt-2 p-1 rounded-full">
          <Trash2 size={16} color="#374151" />
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

      <View className="flex-1 p-3">
        <View className="flex-row items-center justify-end mb-3">
          {/* Create button remains visible but the 'Invoices' page heading was removed per request */}
          <Pressable onPress={()=>Alert.alert('Create invoice','Open invoice creation (stub)')} accessibilityLabel="Create invoice">
            <PlusCircle size={28} color="#2563eb" />
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

