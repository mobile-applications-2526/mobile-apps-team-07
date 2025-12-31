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
    testID?: string;
}

export function InvoiceCard({
    invoice,
    onDownload,
    onEdit,
    onDelete,
    processing,
    testID
}: InvoiceCardProps) {
    const { mediumImpact } = useHaptics();

    // Uniform styling matching VesselCard (Blue/Gray palette)
    // We keep the icon variety but unify the colors
    const getStatusIcon = (status: Invoice['status']) => {
        switch (status) {
            case 'Paid': return CheckCircle;
            case 'Overdue': return AlertCircle;
            default: return Clock;
        }
    };

    const StatusIcon = getStatusIcon(invoice.status);

    return (
        <View
            testID={testID}
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
                {/* Icon - Blue accent like VesselCard */}
                <View className="w-10 h-10 rounded-lg mr-3 items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                    <FileText size={20} color="#3b82f6" />
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
                <View className="flex-row items-center">
                    <TouchableOpacity
                        testID={testID ? `${testID}-download` : undefined}
                        className="p-2"
                        onPress={() => onDownload(invoice)}
                        disabled={!!processing}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Download size={16} color={processing ? '#d1d5db' : '#9ca3af'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID={testID ? `${testID}-edit` : undefined}
                        className="p-2"
                        onPress={() => onEdit(invoice)}
                        disabled={!!processing}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Pencil size={16} color={processing ? '#d1d5db' : '#9ca3af'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID={testID ? `${testID}-delete` : undefined}
                        className="p-2"
                        onPress={() => { mediumImpact(); onDelete(invoice); }}
                        disabled={!!processing}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Trash2 size={16} color={processing ? '#d1d5db' : '#9ca3af'} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Strip (Status & Amount) - Uniform Blue Scheme */}
            <View className="flex-row items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/10">
                <View className="flex-row items-center">
                    <StatusIcon size={14} color="#3b82f6" />
                    <ThemedText className="text-xs ml-1.5 font-medium text-blue-600 dark:text-blue-400">
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
