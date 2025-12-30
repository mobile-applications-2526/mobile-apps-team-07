import React, { useEffect, useState, useMemo, useRef } from 'react';
import { View, TextInput, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common/ThemedText';
import { Calendar } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Invoice } from '@/types';

interface EditInvoiceSheetProps {
    invoice: Invoice | null;
    onClose: () => void;
    onSave: (invoice: Invoice, payload: any) => Promise<boolean>;
}

export default function EditInvoiceSheet({ invoice, onClose, onSave }: EditInvoiceSheetProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['60%', '100%'], []);

    const [formState, setFormState] = useState({
        number: '',
        type: '',
        date: '',
        dueDate: '',
        amount: '',
        currency: '',
        status: ''
    });
    const [showDatePickerFor, setShowDatePickerFor] = useState<null | 'date' | 'dueDate'>(null);

    useEffect(() => {
        if (invoice) {
            setFormState({
                number: invoice.number ?? '',
                type: invoice.type ?? '',
                date: invoice.date ? invoice.date.split('T')[0] : '',
                dueDate: invoice.dueDate ? String(invoice.dueDate).split('T')[0] : '',
                amount: String(invoice.amount ?? ''),
                currency: invoice.currency ?? 'USD',
                status: invoice.status ?? 'Pending'
            });
            bottomSheetRef.current?.present();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [invoice]);

    const handleSave = async () => {
        if (!invoice) return;

        const proceed = async () => {
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

            const success = await onSave(invoice, payload);
            if (success) {
                onClose();
            }
        };

        if (invoice.pdfUrl) {
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
    };

    const onDateChange = (event: any, selected?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePickerFor(null);
        }
        if (selected) {
            const iso = selected.toISOString();
            if (showDatePickerFor === 'date') setFormState(s => ({ ...s, date: iso }));
            if (showDatePickerFor === 'dueDate') setFormState(s => ({ ...s, dueDate: iso }));
        }
    };

    if (!invoice) return null;

    return (
        <BottomSheetModal
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            backdropComponent={(props) => (<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />)}
            backgroundStyle={{ backgroundColor: isDark ? '#151718' : '#F2F2F7' }}
            handleIndicatorStyle={{ backgroundColor: isDark ? '#404040' : '#e5e7eb' }}
            onDismiss={onClose}
        >
            <View style={styles.header}>
                <ThemedText style={styles.headerTitle}>Edit Invoice</ThemedText>
            </View>

            <BottomSheetScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Invoice Details Section */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <ThemedText style={styles.sectionHeader}>Invoice Details</ThemedText>

                    {/* Invoice Number */}
                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Invoice Number</ThemedText>
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            value={formState.number}
                            onChangeText={v => setFormState(s => ({ ...s, number: v }))}
                            placeholder="INV-0000"
                            placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
                        />
                    </View>

                    {/* Type */}
                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Type</ThemedText>
                        <View style={[styles.segmentedControl, isDark && styles.segmentedControlDark]}>
                            {['TC Hire', 'VC Freight', 'Demurrage'].map((t) => {
                                const isActive = formState.type === t;
                                return (
                                    <Pressable
                                        key={t}
                                        onPress={() => setFormState(s => ({ ...s, type: t }))}
                                        style={[styles.segment, isActive && (isDark ? styles.segmentActiveDark : styles.segmentActiveLight)]}
                                    >
                                        <ThemedText style={[
                                            styles.segmentText,
                                            isDark && { color: '#FFF' },
                                            isActive && styles.segmentTextActive
                                        ]}>
                                            {t}
                                        </ThemedText>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Invoice Date */}
                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Invoice Date</ThemedText>
                        <Pressable
                            onPress={() => setShowDatePickerFor(showDatePickerFor === 'date' ? null : 'date')}
                            style={[styles.input, isDark && styles.inputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                        >
                            <ThemedText style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>
                                {formState.date ? new Date(formState.date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Select Date'}
                            </ThemedText>
                            <Calendar size={18} color={isDark ? '#999' : '#666'} />
                        </Pressable>
                        {showDatePickerFor === 'date' && (
                            <View style={[styles.datePickerContainer, isDark && { backgroundColor: '#2C2C2E' }]}>
                                <DateTimePicker
                                    value={formState.date ? new Date(formState.date) : new Date()}
                                    mode="date"
                                    display="inline"
                                    onChange={onDateChange}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    style={styles.datePicker}
                                />
                            </View>
                        )}
                    </View>

                    {/* Due Date */}
                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Due Date</ThemedText>
                        <Pressable
                            onPress={() => setShowDatePickerFor(showDatePickerFor === 'dueDate' ? null : 'dueDate')}
                            style={[styles.input, isDark && styles.inputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
                        >
                            <ThemedText style={{ color: isDark ? '#FFF' : '#000', fontSize: 16 }}>
                                {formState.dueDate ? new Date(formState.dueDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'Select Due Date'}
                            </ThemedText>
                            <Calendar size={18} color={isDark ? '#999' : '#666'} />
                        </Pressable>
                        {showDatePickerFor === 'dueDate' && (
                            <View style={[styles.datePickerContainer, isDark && { backgroundColor: '#2C2C2E' }]}>
                                <DateTimePicker
                                    value={formState.dueDate ? new Date(formState.dueDate) : new Date()}
                                    mode="date"
                                    display="inline"
                                    onChange={onDateChange}
                                    themeVariant={isDark ? 'dark' : 'light'}
                                    style={styles.datePicker}
                                />
                            </View>
                        )}
                    </View>
                </View>

                {/* Financials Section */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <ThemedText style={styles.sectionHeader}>Financials</ThemedText>

                    {/* Amount */}
                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Amount</ThemedText>
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            value={formState.amount}
                            keyboardType="numeric"
                            onChangeText={v => setFormState(s => ({ ...s, amount: v }))}
                            placeholder="0.00"
                            placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
                        />
                    </View>

                    {/* Status */}
                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Status</ThemedText>
                        <View style={[styles.segmentedControl, isDark && styles.segmentedControlDark]}>
                            {['Pending', 'Paid', 'Overdue'].map((st) => {
                                const isActive = formState.status === st;
                                return (
                                    <Pressable
                                        key={st}
                                        onPress={() => setFormState(s => ({ ...s, status: st }))}
                                        style={[styles.segment, isActive && (isDark ? styles.segmentActiveDark : styles.segmentActiveLight)]}
                                    >
                                        <ThemedText style={[
                                            styles.segmentText,
                                            isDark && { color: '#FFF' },
                                            isActive && styles.segmentTextActive
                                        ]}>
                                            {st}
                                        </ThemedText>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>

                <Pressable onPress={handleSave} style={styles.submitButton}>
                    <ThemedText style={styles.submitButtonText}>Save</ThemedText>
                </Pressable>

            </BottomSheetScrollView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        flex: 1,
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionDark: {
        backgroundColor: '#1C1C1E', // System Gray 6
    },
    sectionHeader: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
    },
    fieldContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
        color: '#666',
    },
    input: {
        backgroundColor: '#F2F2F7', // Changed from '#FFF' to light gray for better contrast
        borderRadius: 10,
        padding: 12,
        fontSize: 17,
        color: '#000',
    },
    inputDark: {
        backgroundColor: '#2C2C2E', // System Gray 5 Dark
        color: '#FFF',
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#E5E5EA',
        borderRadius: 8,
        padding: 2,
        height: 36, // Added fixed height to match CreateInvoiceSheet
    },
    segmentedControlDark: {
        backgroundColor: '#2C2C2E',
    },
    segment: {
        flex: 1,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        // remove paddingVertical: 8 to rely on flex centering within fixed height container
    },
    segmentActiveDark: {
        backgroundColor: '#636366', // systemGray3
    },
    segmentActiveLight: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#000',
    },
    segmentTextActive: {
        fontWeight: '600',
    },
    submitButton: {
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        marginBottom: 20,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    datePickerContainer: {
        marginTop: 8,
        backgroundColor: '#f2f2f7',
        borderRadius: 12,
        paddingVertical: 8,
        overflow: 'hidden',
        alignItems: 'center',
        width: '100%'
    },
    datePicker: {
        maxWidth: '100%',
        alignSelf: 'center'
    }
});
