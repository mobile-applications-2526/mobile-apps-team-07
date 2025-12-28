import React from 'react';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { FileText, Download, Pencil, Trash2, CheckCircle, AlertCircle, Clock } from 'lucide-react-native';
import { ThemedText } from '@/components/common/ThemedText';
import { Invoice } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useHaptics } from '@/hooks';

interface InvoiceCardProps {
    invoice: Invoice;
    onDownload: (i: Invoice) => void;
    onEdit: (i: Invoice) => void;
    onDelete: (i: Invoice) => void;
    processing?: boolean;
}

export function InvoiceCard({
    invoice,
    onDownload,
    onEdit,
    onDelete,
    processing
}: InvoiceCardProps) {
    const { mediumImpact } = useHaptics();

    const getStatusConfig = (status: Invoice['status']) => {
        switch (status) {
            case 'Paid': return { color: '#10b981', icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400' };
            case 'Overdue': return { color: '#ef4444', icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400' };
            default: return { color: '#f59e0b', icon: Clock, bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-400' };
        }
    };

    const statusConfig = getStatusConfig(invoice.status);
    const StatusIcon = statusConfig.icon;

    return (
        <View
            className="bg-white dark:bg-[#1c1c1e] rounded-xl mb-3 overflow-hidden"
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
            }}
        >
            <View className="flex-row items-start px-3 py-3">
                {/* Icon */}
                <View className="w-10 h-10 rounded-lg mr-3 items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <FileText size={20} color="#6b7280" />
                </View>

                {/* Info */}
                <View className="flex-1 mr-2 justify-center min-h-[40px]">
                    <View className="flex-row items-center">
                        <ThemedText type="defaultSemiBold" className="text-[15px] flex-shrink" numberOfLines={1}>
                            {invoice.number}
                        </ThemedText>
                    </View>
                    <ThemedText className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
                        {invoice.type} • {new Date(invoice.date).toLocaleDateString()}
                    </ThemedText>
                </View>

                {/* Actions */}
                <View className="flex-row items-center gap-1">
                    <TouchableOpacity
                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
                        onPress={() => onDownload(invoice)}
                        disabled={!!processing}
                    >
                        <Download size={14} color={processing ? '#9ca3af' : '#374151'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full"
                        onPress={() => onEdit(invoice)}
                        disabled={!!processing}
                    >
                        <Pencil size={14} color={processing ? '#9ca3af' : '#374151'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full"
                        onPress={() => { mediumImpact(); onDelete(invoice); }}
                        disabled={!!processing}
                    >
                        <Trash2 size={14} color={processing ? '#9ca3af' : '#ef4444'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Strip (Status & Amount) */}
            <View className={`flex-row items-center justify-between px-3 py-2 ${statusConfig.bg}`}>
                <View className="flex-row items-center">
                    <StatusIcon size={14} color={statusConfig.color} />
                    <ThemedText className={`text-xs ml-1.5 font-medium ${statusConfig.text}`}>
                        {invoice.status}
                    </ThemedText>
                </View>
                <ThemedText type="defaultSemiBold" className="text-sm">
                    {formatCurrency(invoice.amount, invoice.currency)}
                </ThemedText>
            </View>
        </View>
    );
}
