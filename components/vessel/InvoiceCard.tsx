import React from 'react';
import { View, Image, Pressable } from 'react-native';
import { FileText, Download, Pencil, Trash2 } from 'lucide-react-native';
import { ThemedText } from '@/components/common/ThemedText';
import { Card } from '@/components/common/Card';
import { Invoice } from '@/types';
import { formatCurrency } from '@/lib/utils';

export function StatusBadge({ status }: { status: Invoice['status'] }) {
    const base = 'px-1 py-0.5 rounded-full text-xs font-medium mr-2';
    if (status === 'Paid') return <ThemedText className={`${base} bg-green-50 text-green-700 border border-green-100`}>Paid</ThemedText>;
    if (status === 'Overdue') return <ThemedText className={`${base} bg-red-50 text-red-700 border border-red-100`}>Overdue</ThemedText>;
    return <ThemedText className={`${base} bg-yellow-50 text-yellow-700 border border-yellow-100`}>Pending</ThemedText>;
}

export function TypeBadge({ type }: { type: string }) {
    return <ThemedText className="px-0.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium uppercase">{type}</ThemedText>;
}

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
    const statusColor = invoice.status === 'Paid' ? '#10b981' : invoice.status === 'Overdue' ? '#ef4444' : '#f59e0b';

    return (
        <Card className="mb-3 w-full flex-row items-center">
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
        </Card>
    );
}
