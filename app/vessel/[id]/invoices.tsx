import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Ship, Receipt, DollarSign, Clock, CheckCircle, AlertCircle, Plus, ChevronRight } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVessel } from './_layout';

type Invoice = {
  id: string;
  number: string;
  description: string;
  amount: string;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
};

const dummyInvoices: Invoice[] = [
  { id: '1', number: 'INV-2025-001', description: 'Port Charges - Rotterdam', amount: '$12,450', date: 'Nov 28, 2025', status: 'pending' },
  { id: '2', number: 'INV-2025-002', description: 'Bunker Fuel Supply', amount: '$85,200', date: 'Nov 20, 2025', status: 'paid' },
  { id: '3', number: 'INV-2025-003', description: 'Agency Fees - Singapore', amount: '$3,800', date: 'Nov 15, 2025', status: 'overdue' },
  { id: '4', number: 'INV-2025-004', description: 'Crew Wages - November', amount: '$45,000', date: 'Nov 01, 2025', status: 'paid' },
];

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const statusConfig = {
    'paid': { icon: CheckCircle, color: '#10b981', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Paid' },
    'pending': { icon: Clock, color: '#f59e0b', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'Pending' },
    'overdue': { icon: AlertCircle, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Overdue' },
  };
  
  const config = statusConfig[invoice.status];
  const StatusIcon = config.icon;

  return (
    <TouchableOpacity 
      className="bg-white dark:bg-[#1c1c1e] rounded-xl mb-3 overflow-hidden"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center p-4">
        <View className={`w-12 h-12 rounded-xl items-center justify-center ${config.bg} mr-3`}>
          <Receipt size={24} color={config.color} />
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <ThemedText type="defaultSemiBold" className="text-base" numberOfLines={1}>
              {invoice.number}
            </ThemedText>
            <ThemedText type="defaultSemiBold" className="text-base">
              {invoice.amount}
            </ThemedText>
          </View>
          <ThemedText className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {invoice.description}
          </ThemedText>
          <View className="flex-row items-center justify-between mt-1">
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500">
              {invoice.date}
            </ThemedText>
            <View className={`flex-row items-center px-2 py-0.5 rounded-full ${config.bg}`}>
              <StatusIcon size={10} color={config.color} />
              <ThemedText className="text-[10px] font-medium ml-1" style={{ color: config.color }}>
                {config.label}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <View className="bg-white dark:bg-[#1c1c1e] rounded-xl p-3 flex-1 mx-1">
      <View className="flex-row items-center mb-1">
        <Icon size={14} color={color} />
        <ThemedText className="text-[10px] text-gray-400 dark:text-gray-500 ml-1" numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" className="text-sm" numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function VesselInvoices() {
  const insets = useSafeAreaInsets();
  const boat = useVessel();

  if (!boat) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-[#000]">
        <ThemedText>Vessel not found</ThemedText>
      </View>
    );
  }

  const totalPending = dummyInvoices
    .filter(i => i.status === 'pending')
    .reduce((sum, i) => sum + parseFloat(i.amount.replace(/[$,]/g, '')), 0);
  
  const totalOverdue = dummyInvoices
    .filter(i => i.status === 'overdue')
    .reduce((sum, i) => sum + parseFloat(i.amount.replace(/[$,]/g, '')), 0);

  return (
    <View className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Header */}
      <View 
        className="px-4 pb-3 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-lg items-center justify-center bg-blue-50 dark:bg-blue-900/20 mr-3">
              <Ship size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <ThemedText type="defaultSemiBold" className="text-lg" numberOfLines={1}>
                {boat.name}
              </ThemedText>
              <ThemedText className="text-xs text-gray-400 dark:text-gray-500">
                Invoice Management
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity 
            className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center"
            activeOpacity={0.8}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View className="flex-row -mx-1 mb-4">
          <SummaryCard 
            icon={Clock} 
            label="Pending" 
            value={`$${totalPending.toLocaleString()}`} 
            color="#f59e0b" 
          />
          <SummaryCard 
            icon={AlertCircle} 
            label="Overdue" 
            value={`$${totalOverdue.toLocaleString()}`} 
            color="#ef4444" 
          />
          <SummaryCard 
            icon={DollarSign} 
            label="This Month" 
            value="$146,450" 
            color="#3b82f6" 
          />
        </View>

        {/* Invoices List */}
        <View>
          <ThemedText type="defaultSemiBold" className="text-sm text-gray-500 dark:text-gray-400 mb-2 px-1">
            Recent Invoices
          </ThemedText>
          {dummyInvoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </View>

        {/* View All Button */}
        <TouchableOpacity 
          className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 flex-row items-center justify-center mt-2"
          activeOpacity={0.7}
        >
          <ThemedText className="text-blue-500 font-medium mr-1">View All Invoices</ThemedText>
          <ChevronRight size={18} color="#3b82f6" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
