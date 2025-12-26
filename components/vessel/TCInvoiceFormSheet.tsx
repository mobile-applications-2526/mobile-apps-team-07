import React, { useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common/ThemedText';
import { PlusCircle, Trash2, Calendar, Calculator } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { invoiceService } from '@/services';

type Invoice = {
    id: string;
    number: string;
    type: string;
    amount: number;
    currency: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    date: string;
    dueDate?: string;
    pdfUrl?: string | null;
    pdfReady?: boolean;
};

type AdditionalCharge = {
    id: string;
    title: string;
    amount: string;
};

interface TCInvoiceFormSheetProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (newInvoice: Invoice) => void;
    vesselId: string;
}

export default function TCInvoiceFormSheet({ visible, onClose, onSuccess, vesselId }: TCInvoiceFormSheetProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const bottomSheetRef = React.useRef<BottomSheetModal>(null);
    const snapPoints = React.useMemo(() => ['60%', '90%'], []);

    // Form State
    const [invoiceNumber, setInvoiceNumber] = React.useState(`HIRE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
    const [invoiceDate, setInvoiceDate] = React.useState(new Date());
    const [dueDate, setDueDate] = React.useState<Date | null>(null);
    const [currency, setCurrency] = React.useState('USD');

    // Hire Period
    const [periodFrom, setPeriodFrom] = React.useState<Date | null>(null);
    const [periodTo, setPeriodTo] = React.useState<Date | null>(null);
    const [hireDays, setHireDays] = React.useState(''); // Auto-calc but editable
    const [dailyRate, setDailyRate] = React.useState('');

    // Deductions
    const [offHireDays, setOffHireDays] = React.useState('');
    const [offHireHours, setOffHireHours] = React.useState('');
    const [offHireMinutes, setOffHireMinutes] = React.useState('');
    const [bunkerAdjustment, setBunkerAdjustment] = React.useState('');
    const [otherDeductions, setOtherDeductions] = React.useState('');

    // Additional Charges
    const [additionalCharges, setAdditionalCharges] = React.useState<AdditionalCharge[]>([]);

    // Remarks
    const [remarks, setRemarks] = React.useState('');

    const [processing, setProcessing] = React.useState(false);
    const [showDatePicker, setShowDatePicker] = React.useState<'invoice' | 'due' | 'from' | 'to' | null>(null);

    React.useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            // Reset state on open
            setInvoiceNumber(`HIRE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
            setInvoiceDate(new Date());
            setDueDate(null);
            setCurrency('USD');
            setPeriodFrom(null);
            setPeriodTo(null);
            setHireDays('');
            setDailyRate('');
            setOffHireDays('');
            setOffHireHours('');
            setOffHireMinutes('');
            setBunkerAdjustment('');
            setOtherDeductions('');
            setAdditionalCharges([]);
            setRemarks('');
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    // --- Calculations ---

    // Update hireDays when dates change
    React.useEffect(() => {
        if (periodFrom && periodTo) {
            const diffTime = Math.abs(periodTo.getTime() - periodFrom.getTime());
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            setHireDays(diffDays.toFixed(2));
        }
    }, [periodFrom, periodTo]);

    const hireAmount = useMemo(() => {
        const d = parseFloat(hireDays) || 0;
        const r = parseFloat(dailyRate) || 0;
        return d * r;
    }, [hireDays, dailyRate]);

    const totalOffHireDays = useMemo(() => {
        const d = parseFloat(offHireDays) || 0;
        const h = parseFloat(offHireHours) || 0;
        const m = parseFloat(offHireMinutes) || 0;
        return d + (h / 24) + (m / 1440);
    }, [offHireDays, offHireHours, offHireMinutes]);

    const offHireAmount = useMemo(() => {
        const r = parseFloat(dailyRate) || 0;
        return totalOffHireDays * r;
    }, [totalOffHireDays, dailyRate]);

    // Derived Totals
    const totalAmount = useMemo(() => {
        let total = hireAmount;
        total -= offHireAmount;
        total -= (parseFloat(bunkerAdjustment) || 0);
        total -= (parseFloat(otherDeductions) || 0);
        const chargesTotal = additionalCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        total += chargesTotal;
        return total;
    }, [hireAmount, offHireAmount, bunkerAdjustment, otherDeductions, additionalCharges]);

    // --- Actions ---

    const handleAddCharge = () => {
        if (additionalCharges.length >= 10) {
            Alert.alert('Limit Reached', 'Maximum 10 additional charges allowed.');
            return;
        }
        setAdditionalCharges([...additionalCharges, { id: Math.random().toString(), title: '', amount: '' }]);
    };

    const handleRemoveCharge = (id: string) => {
        setAdditionalCharges(prev => prev.filter(c => c.id !== id));
    };

    const updateCharge = (id: string, field: 'title' | 'amount', value: string) => {
        setAdditionalCharges(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') setShowDatePicker(null);
        if (selectedDate) {
            if (showDatePicker === 'invoice') setInvoiceDate(selectedDate);
            if (showDatePicker === 'due') setDueDate(selectedDate);
            if (showDatePicker === 'from') setPeriodFrom(selectedDate);
            if (showDatePicker === 'to') setPeriodTo(selectedDate);
        }
    };

    const handleSubmit = async () => {
        if (!invoiceNumber) { Alert.alert('Error', 'Invoice Number is required'); return; }
        if (!periodFrom || !periodTo) { Alert.alert('Error', 'Period From and To are required'); return; }
        if (periodTo < periodFrom) { Alert.alert('Error', 'Period To must be after Period From'); return; }
        if (!dailyRate || parseFloat(dailyRate) <= 0) { Alert.alert('Error', 'Daily Hire Rate must be positive'); return; }

        if (totalOffHireDays > parseFloat(hireDays)) {
            // Just proceed with log/warning if needed, but alert is annoying for standard flow
        }

        setProcessing(true);
        try {
            const payload = {
                invoiceNumber,
                invoiceDate: invoiceDate.toISOString().split('T')[0],
                dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
                invoiceType: 'Hire',
                currency,
                totalAmount,
                paymentStatus: 'Pending',
                remarks,
                vessel: { id: parseInt(vesselId) },
                periodFrom: periodFrom.toISOString().split('T')[0],
                periodTo: periodTo.toISOString().split('T')[0],
                hireDays: parseFloat(hireDays),
                offHireDays: totalOffHireDays,
                bunkerAdjustment: parseFloat(bunkerAdjustment) || 0,
                otherDeductions: parseFloat(otherDeductions) || 0,
                charges: [
                    {
                        description: `Hire Payment (${parseFloat(hireDays).toFixed(4)} days @ ${currency} ${dailyRate}/day)`,
                        amount: hireAmount,
                        chargeType: 'Hire'
                    },
                    ...(totalOffHireDays > 0 ? [{
                        description: `Off-Hire (${totalOffHireDays.toFixed(4)} days)`,
                        amount: -offHireAmount,
                        chargeType: 'OffHire'
                    }] : []),
                    ...(parseFloat(bunkerAdjustment) !== 0 ? [{
                        description: 'Bunker Adjustment',
                        amount: -(parseFloat(bunkerAdjustment) || 0),
                        chargeType: 'Adjustment'
                    }] : []),
                    ...(parseFloat(otherDeductions) !== 0 ? [{
                        description: 'Other Deductions',
                        amount: -(parseFloat(otherDeductions) || 0),
                        chargeType: 'Deduction'
                    }] : []),
                    ...additionalCharges.map(c => ({
                        description: c.title,
                        amount: parseFloat(c.amount) || 0,
                        chargeType: 'Additional'
                    }))
                ]
            };

            const result = await invoiceService.createTCInvoice(payload);

            const newInv: Invoice = {
                id: String(result.id),
                number: result.invoiceNumber,
                type: 'TC Hire',
                amount: result.totalAmount,
                currency: result.currency ?? 'USD',
                status: result.paymentStatus ?? 'Pending',
                date: result.invoiceDate,
                dueDate: result.dueDate,
                pdfUrl: result.fileUrl,
                pdfReady: result.pdfReady
            };

            onSuccess(newInv);
        } catch (err) {
            console.error('Invoice creation failed', err);
            Alert.alert('Error', 'Failed to create invoice.');
        } finally {
            setProcessing(false);
        }
    };

    // Helper renderers
    const renderDateInput = (label: string, value: Date | null, pickerKey: 'invoice' | 'due' | 'from' | 'to') => (
        <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>{label}</ThemedText>
            <Pressable
                onPress={() => setShowDatePicker(showDatePicker === pickerKey ? null : pickerKey)}
                style={[styles.input, isDark && styles.inputDark, styles.dateInput]}
            >
                <ThemedText style={[{ fontSize: 16 }, !value && { color: '#999' }, isDark && { color: '#FFF' }]}>
                    {value ? value.toLocaleDateString() : 'Select Date'}
                </ThemedText>
                <Calendar size={18} color={isDark ? '#999' : '#666'} />
            </Pressable>
            {showDatePicker === pickerKey && Platform.OS !== 'ios' && (
                <DateTimePicker
                    value={value ?? new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
            {/* iOS Date Picker Inline in an Expanding Container */}
            {showDatePicker === pickerKey && Platform.OS === 'ios' && (
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
                        value={value ?? new Date()}
                        mode="date"
                        display="inline"
                        onChange={(e, d) => handleDateChange(e, d)}
                        themeVariant={isDark ? 'dark' : 'light'}
                        style={{
                            maxWidth: '100%',
                            alignSelf: 'center'
                        }}
                    />
                </View>
            )}
        </View>
    );

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
                <ThemedText style={styles.headerTitle}>Create TC Hire Invoice</ThemedText>
                {/* Cancel button removed */}
            </View>

            <BottomSheetScrollView contentContainerStyle={styles.content}>

                {/* Basic Info Group */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Invoice Number</ThemedText>
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            value={invoiceNumber}
                            onChangeText={setInvoiceNumber}
                        />
                    </View>

                    {/* Stacked Dates */}
                    <View>
                        {renderDateInput('Invoice Date', invoiceDate, 'invoice')}
                        {renderDateInput('Due Date', dueDate, 'due')}
                    </View>

                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Currency</ThemedText>
                        <View style={[styles.segmentedControl, isDark && styles.segmentedControlDark]}>
                            {['USD', 'AED', 'EUR'].map(c => (
                                <Pressable
                                    key={c}
                                    onPress={() => setCurrency(c)}
                                    style={[styles.segment, currency === c && styles.segmentActive, isDark && currency === c && styles.segmentActiveDark]}
                                >
                                    <ThemedText style={[styles.segmentText, currency === c && styles.segmentTextActive]}>{c}</ThemedText>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Hire Period Group */}
                <ThemedText style={styles.sectionHeader}>Period & Rate</ThemedText>
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    {/* Stacked Period Dates */}
                    <View>
                        {renderDateInput('Period From', periodFrom, 'from')}
                        {renderDateInput('Period To', periodTo, 'to')}
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <View style={styles.fieldContainer}>
                                <ThemedText style={styles.label}>Hire Days</ThemedText>
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark, { color: isDark ? '#999' : '#666' }]}
                                    value={hireDays}
                                    editable={false}
                                    placeholder="0.00"
                                />
                            </View>
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <View style={styles.fieldContainer}>
                                <ThemedText style={styles.label}>Daily Rate ({currency})</ThemedText>
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark]}
                                    value={dailyRate}
                                    onChangeText={setDailyRate}
                                    keyboardType="numeric"
                                    placeholder="0.00"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        <ThemedText style={styles.label}>Hire Amount</ThemedText>
                        <ThemedText style={styles.valueLarge}>{currency} {hireAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</ThemedText>
                    </View>
                </View>

                {/* Deductions Group */}
                <ThemedText style={styles.sectionHeader}>Deductions</ThemedText>
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <ThemedText style={styles.label}>Off-Hire Duration</ThemedText>
                    <View style={styles.row}>
                        <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginRight: 4 }]} value={offHireDays} onChangeText={setOffHireDays} placeholder="Days" keyboardType="numeric" />
                        <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginHorizontal: 4 }]} value={offHireHours} onChangeText={setOffHireHours} placeholder="Hrs" keyboardType="numeric" />
                        <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginLeft: 4 }]} value={offHireMinutes} onChangeText={setOffHireMinutes} placeholder="Mins" keyboardType="numeric" />
                    </View>
                    <ThemedText style={[styles.hint, { textAlign: 'right', marginBottom: 12 }]}>= {totalOffHireDays.toFixed(4)} days</ThemedText>

                    <View style={styles.summaryRow}>
                        <ThemedText style={styles.label}>Off-Hire Deduction</ThemedText>
                        <ThemedText style={[styles.value, { color: '#ef4444' }]}>- {currency} {offHireAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</ThemedText>
                    </View>

                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Bunker Adjustment (Positive to deduct)</ThemedText>
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            value={bunkerAdjustment}
                            onChangeText={setBunkerAdjustment}
                            keyboardType="numeric"
                            placeholder="0.00"
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Other Deductions (Positive to deduct)</ThemedText>
                        <TextInput
                            style={[styles.input, isDark && styles.inputDark]}
                            value={otherDeductions}
                            onChangeText={setOtherDeductions}
                            keyboardType="numeric"
                            placeholder="0.00"
                        />
                    </View>
                </View>

                {/* Additional Charges Group */}
                <ThemedText style={styles.sectionHeader}>Additional Charges</ThemedText>
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    {additionalCharges.map((charge, index) => (
                        <View key={charge.id} style={{ marginBottom: 12 }}>
                            <View style={[styles.row, { alignItems: 'center' }]}>
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark, { flex: 2, marginRight: 8 }]}
                                    value={charge.title}
                                    onChangeText={(t) => updateCharge(charge.id, 'title', t)}
                                    placeholder="Charge Title"
                                />
                                <TextInput
                                    style={[styles.input, isDark && styles.inputDark, { flex: 1, marginRight: 8 }]}
                                    value={charge.amount}
                                    onChangeText={(t) => updateCharge(charge.id, 'amount', t)}
                                    placeholder="0.00"
                                    keyboardType="numeric"
                                />
                                <Pressable onPress={() => handleRemoveCharge(charge.id)} style={{ padding: 4 }}>
                                    <Trash2 size={20} color="#ef4444" />
                                </Pressable>
                            </View>
                        </View>
                    ))}

                    <Pressable onPress={handleAddCharge} style={styles.addButton}>
                        <PlusCircle size={20} color="#007AFF" />
                        <ThemedText style={styles.addButtonText}>Add Charge</ThemedText>
                    </Pressable>
                </View>

                {/* Remarks */}
                <ThemedText style={styles.sectionHeader}>Remarks</ThemedText>
                <View style={[styles.section, isDark && styles.sectionDark, { marginBottom: 32 }]}>
                    <TextInput
                        style={[styles.input, isDark && styles.inputDark, { height: 80, textAlignVertical: 'top' }]}
                        value={remarks}
                        onChangeText={setRemarks}
                        multiline
                        placeholder="Enter remarks..."
                    />
                </View>

                {/* Totals Section */}
                <View style={{ marginTop: 24, marginBottom: 48, alignItems: 'center', paddingHorizontal: 16 }}>
                    <ThemedText style={{ fontSize: 16, color: '#666', marginBottom: 4 }}>Total Invoice Amount</ThemedText>
                    <View style={{ paddingVertical: 16, width: '100%', alignItems: 'center' }}>
                        <ThemedText style={{ fontSize: 24, fontWeight: '800', textAlign: 'center' }}>
                            {currency} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </ThemedText>
                    </View>

                    <Pressable
                        onPress={handleSubmit}
                        disabled={processing}
                        style={[styles.submitButton, processing && { opacity: 0.7 }]}
                    >
                        <ThemedText style={styles.submitButtonText}>{processing ? 'Creating...' : 'Generate Invoice'}</ThemedText>
                    </Pressable>
                </View>

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
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        marginBottom: 8,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
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
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#000',
    },
    inputDark: {
        backgroundColor: '#2C2C2E',
        color: '#FFF',
    },
    dateInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#E5E5EA',
        borderRadius: 8,
        padding: 2,
        height: 36,
    },
    segmentedControlDark: {
        backgroundColor: '#2C2C2E',
    },
    segment: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    segmentActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentActiveDark: {
        backgroundColor: '#636366',
    },
    segmentText: {
        fontSize: 13,
        fontWeight: '500',
    },
    segmentTextActive: {
        fontWeight: '600',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        marginTop: 8,
    },
    valueLarge: {
        fontSize: 20,
        fontWeight: '700',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    },
    hint: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        marginTop: 8,
    },
    addButtonText: {
        color: '#007AFF',
        fontSize: 16,
        marginLeft: 8,
        fontWeight: '500',
    },
    submitButton: {
        // backgroundColor: '#007AFF',
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
        // shadowColor: '#007AFF',
        borderColor: '#fff',

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
});
