import React, { useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet, Alert, Platform, ActionSheetIOS } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common/ThemedText';
import { PlusCircle, Trash2, Calendar } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { invoiceService } from '@/services';
import { useVesselDetails } from '@/hooks';

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

interface CreateInvoiceSheetProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: (newInvoice: Invoice) => void;
    vesselId: string;
}

export default function CreateInvoiceSheet({ visible, onClose, onSuccess, vesselId }: CreateInvoiceSheetProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const bottomSheetRef = React.useRef<BottomSheetModal>(null);
    const snapPoints = React.useMemo(() => ['75%', '100%'], []);
    const { vesselVoyages } = useVesselDetails();

    // -- Toggle State --
    const [invoiceType, setInvoiceType] = React.useState<'TC' | 'VC'>('TC');

    // -- Common Form State --
    const [invoiceNumber, setInvoiceNumber] = React.useState('');
    const [invoiceDate, setInvoiceDate] = React.useState(new Date());
    const [dueDate, setDueDate] = React.useState<Date | null>(null);
    const [currency, setCurrency] = React.useState('USD');
    const [remarks, setRemarks] = React.useState('');
    const [additionalCharges, setAdditionalCharges] = React.useState<AdditionalCharge[]>([]);

    // -- TC Specific State --
    const [periodFrom, setPeriodFrom] = React.useState<Date | null>(null);
    const [periodTo, setPeriodTo] = React.useState<Date | null>(null);
    const [hireDays, setHireDays] = React.useState('');
    const [dailyRate, setDailyRate] = React.useState('');
    const [offHireDays, setOffHireDays] = React.useState('');
    const [offHireHours, setOffHireHours] = React.useState('');
    const [offHireMinutes, setOffHireMinutes] = React.useState('');
    const [bunkerAdjustment, setBunkerAdjustment] = React.useState('');
    const [otherDeductions, setOtherDeductions] = React.useState('');

    // -- VC Specific State --
    const [selectedVoyageId, setSelectedVoyageId] = React.useState<number | null>(null);

    // Freight
    const [freightBasis, setFreightBasis] = React.useState<'Per MT' | 'Lumpsum'>('Per MT');
    const [cargoQuantity, setCargoQuantity] = React.useState('');
    const [freightRate, setFreightRate] = React.useState('');
    const [lumpsumAmount, setLumpsumAmount] = React.useState('');

    // Demurrage/Despatch
    const [demurrageType, setDemurrageType] = React.useState<'Demurrage' | 'Despatch'>('Demurrage');
    const [demurrageDays, setDemurrageDays] = React.useState('');
    const [demurrageHours, setDemurrageHours] = React.useState('');
    const [demurrageMinutes, setDemurrageMinutes] = React.useState('');
    const [demurrageRate, setDemurrageRate] = React.useState('');

    // Port Charges
    const [portCharges, setPortCharges] = React.useState('');

    const [processing, setProcessing] = React.useState(false);
    const [showDatePicker, setShowDatePicker] = React.useState<'invoice' | 'due' | 'from' | 'to' | null>(null);

    React.useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            resetForm();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    const resetForm = () => {
        const typePrefix = invoiceType === 'TC' ? 'HIRE' : 'FRT';
        setInvoiceNumber(`${typePrefix}-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`);
        setInvoiceDate(new Date());
        setDueDate(null);
        setCurrency('USD');
        setRemarks('');
        setAdditionalCharges([]);

        // TC Reset
        setPeriodFrom(null);
        setPeriodTo(null);
        setHireDays('');
        setDailyRate('');
        setOffHireDays('');
        setOffHireHours('');
        setOffHireMinutes('');
        setBunkerAdjustment('');
        setOtherDeductions('');

        // VC Reset
        setSelectedVoyageId(null);
        setFreightBasis('Per MT');
        setCargoQuantity('');
        setFreightRate('');
        setLumpsumAmount('');
        setDemurrageType('Demurrage');
        setDemurrageDays('');
        setDemurrageHours('');
        setDemurrageMinutes('');
        setDemurrageRate('');
        setPortCharges('');
    };

    // Update invoice number prefix when switching types
    React.useEffect(() => {
        const parts = invoiceNumber.split('-');
        if (parts.length >= 3) {
            const newPrefix = invoiceType === 'TC' ? 'HIRE' : 'FRT';
            // Only auto-update if it looks like an auto-generated one (starts with HIRE or FRT)
            if (parts[0] === 'HIRE' || parts[0] === 'FRT') {
                setInvoiceNumber(`${newPrefix}-${parts.slice(1).join('-')}`);
            }
        }
    }, [invoiceType]);

    // --- TC Calculations ---
    React.useEffect(() => {
        if (periodFrom && periodTo) {
            const diffTime = Math.abs(periodTo.getTime() - periodFrom.getTime());
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            setHireDays(diffDays.toFixed(2));
        }
    }, [periodFrom, periodTo]);

    const hireAmount = useMemo(() => {
        return (parseFloat(hireDays) || 0) * (parseFloat(dailyRate) || 0);
    }, [hireDays, dailyRate]);

    const totalOffHireDays = useMemo(() => {
        return (parseFloat(offHireDays) || 0) + ((parseFloat(offHireHours) || 0) / 24) + ((parseFloat(offHireMinutes) || 0) / 1440);
    }, [offHireDays, offHireHours, offHireMinutes]);

    const offHireAmount = useMemo(() => {
        return totalOffHireDays * (parseFloat(dailyRate) || 0);
    }, [totalOffHireDays, dailyRate]);

    const tcTotalAmount = useMemo(() => {
        let total = hireAmount;
        total -= offHireAmount;
        total -= (parseFloat(bunkerAdjustment) || 0);
        total -= (parseFloat(otherDeductions) || 0);
        const chargesTotal = additionalCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        total += chargesTotal;
        return total;
    }, [hireAmount, offHireAmount, bunkerAdjustment, otherDeductions, additionalCharges]);

    // --- VC Calculations ---
    const freightAmount = useMemo(() => {
        if (freightBasis === 'Lumpsum') {
            return parseFloat(lumpsumAmount) || 0;
        } else {
            return (parseFloat(cargoQuantity) || 0) * (parseFloat(freightRate) || 0);
        }
    }, [freightBasis, lumpsumAmount, cargoQuantity, freightRate]);

    const totalDemurrageTime = useMemo(() => {
        return (parseFloat(demurrageDays) || 0) + ((parseFloat(demurrageHours) || 0) / 24) + ((parseFloat(demurrageMinutes) || 0) / 1440);
    }, [demurrageDays, demurrageHours, demurrageMinutes]);

    const demurrageAmount = useMemo(() => {
        return totalDemurrageTime * (parseFloat(demurrageRate) || 0);
    }, [totalDemurrageTime, demurrageRate]);

    const vcTotalAmount = useMemo(() => {
        let total = freightAmount;

        if (demurrageType === 'Demurrage') {
            total += demurrageAmount;
        } else {
            total -= demurrageAmount; // Despatch is deducted (or added as negative charge, depending on perspective. Usually deducted from freight or paid separately). Ideally Despatch means ship owner pays charterer back for time saved. So it reduces invoiced amount.
        }

        total += (parseFloat(portCharges) || 0);
        const chargesTotal = additionalCharges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        total += chargesTotal;
        return total;
    }, [freightAmount, demurrageType, demurrageAmount, portCharges, additionalCharges]);

    const grandTotal = invoiceType === 'TC' ? tcTotalAmount : vcTotalAmount;

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

    const showCurrencySelection = () => {
        const options = ['USD', 'AED', 'EUR'];
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: [...options, 'Cancel'], cancelButtonIndex: options.length, title: 'Select Currency' },
                (buttonIndex) => { if (buttonIndex < options.length) setCurrency(options[buttonIndex]); }
            );
        } else {
            Alert.alert(
                'Select Currency', 'Choose a currency',
                (options.map(opt => ({ text: opt, onPress: () => setCurrency(opt) })) as any[]).concat([{ text: 'Cancel', style: 'cancel' }])
            );
        }
    };

    const showVoyageSelection = () => {
        const options = vesselVoyages.map(v => `V${v.voyageNumber}`);
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: [...options, 'Cancel'], cancelButtonIndex: options.length, title: 'Select Voyage' },
                (buttonIndex) => {
                    if (buttonIndex < options.length) setSelectedVoyageId(vesselVoyages[buttonIndex].id);
                }
            );
        } else {
            Alert.alert(
                'Select Voyage', 'Choose a voyage',
                (vesselVoyages.map(v => ({
                    text: `V${v.voyageNumber}`,
                    onPress: () => setSelectedVoyageId(v.id)
                })) as any[]).concat([{ text: 'Cancel', style: 'cancel' }])
            );
        }
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

        setProcessing(true);
        try {
            let result;

            if (invoiceType === 'TC') {
                if (!periodFrom || !periodTo) { throw new Error('Period From and To are required'); }
                if (!dailyRate) { throw new Error('Daily Hire Rate is required'); }

                const payload = {
                    invoiceNumber,
                    invoiceDate: invoiceDate.toISOString().split('T')[0],
                    dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
                    invoiceType: 'Hire',
                    currency,
                    totalAmount: tcTotalAmount,
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
                        { description: `Hire Payment (${parseFloat(hireDays).toFixed(4)} days @ ${currency} ${dailyRate}/day)`, amount: hireAmount, chargeType: 'Hire' },
                        ...(totalOffHireDays > 0 ? [{ description: `Off-Hire (${totalOffHireDays.toFixed(4)} days)`, amount: -offHireAmount, chargeType: 'OffHire' }] : []),
                        ...(parseFloat(bunkerAdjustment) !== 0 ? [{ description: 'Bunker Adjustment', amount: -(parseFloat(bunkerAdjustment) || 0), chargeType: 'Adjustment' }] : []),
                        ...additionalCharges.map(c => ({ description: c.title, amount: parseFloat(c.amount) || 0, chargeType: 'Additional' }))
                    ]
                };
                result = await invoiceService.createTCInvoice(payload);
            } else {
                // VC Payload construction
                if (!selectedVoyageId) { throw new Error('Voyage is required'); }

                const payload = {
                    invoiceNumber,
                    invoiceDate: invoiceDate.toISOString().split('T')[0],
                    dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
                    invoiceType: 'Freight',
                    currency,
                    totalAmount: vcTotalAmount,
                    paymentStatus: 'Pending',
                    remarks,
                    vessel: { id: parseInt(vesselId) },
                    voyage: { id: selectedVoyageId },
                    freightBasis,
                    cargoQuantity: parseFloat(cargoQuantity) || 0,
                    freightRate: parseFloat(freightRate) || 0,
                    lumpsumAmount: parseFloat(lumpsumAmount) || 0,
                    demurrageType,
                    demurrageTime: totalDemurrageTime,
                    demurrageRate: parseFloat(demurrageRate) || 0,
                    charges: [
                        { description: `Freight (${freightBasis === 'Per MT' ? `${cargoQuantity}MT @ ${freightRate}` : 'Lumpsum'})`, amount: freightAmount, chargeType: 'Freight' },
                        ...(totalDemurrageTime > 0 ? [{ description: `${demurrageType} (${totalDemurrageTime.toFixed(4)} days @ ${demurrageRate})`, amount: demurrageType === 'Demurrage' ? demurrageAmount : -demurrageAmount, chargeType: demurrageType }] : []),
                        ...(parseFloat(portCharges) > 0 ? [{ description: 'Port Charges', amount: parseFloat(portCharges), chargeType: 'PortCharges' }] : []),
                        ...additionalCharges.map(c => ({ description: c.title, amount: parseFloat(c.amount) || 0, chargeType: 'Additional' }))
                    ]
                };
                result = await invoiceService.createVCInvoice(payload);
            }

            const newInv: Invoice = {
                id: String((result as any).id),
                number: (result as any).invoiceNumber,
                type: invoiceType === 'TC' ? 'TC Hire' : 'VC Freight',
                amount: (result as any).totalAmount,
                currency: (result as any).currency ?? 'USD',
                status: (result as any).paymentStatus ?? 'Pending',
                date: (result as any).invoiceDate,
                dueDate: (result as any).dueDate,
                pdfUrl: (result as any).fileUrl,
                pdfReady: (result as any).pdfReady
            };

            onSuccess(newInv);
        } catch (err: any) {
            console.error('Invoice creation failed', err);
            Alert.alert('Error', err.message || 'Failed to create invoice.');
        } finally {
            setProcessing(false);
        }
    };

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
            {/* Date Pickers (Platform specific) */}
            {showDatePicker === pickerKey && Platform.OS !== 'ios' && (
                <DateTimePicker value={value ?? new Date()} mode="date" display="default" onChange={handleDateChange} />
            )}
            {showDatePicker === pickerKey && Platform.OS === 'ios' && (
                <View style={[styles.datePickerContainer, isDark && { backgroundColor: '#2C2C2E' }]}>
                    <DateTimePicker
                        value={value ?? new Date()}
                        mode="date"
                        display="inline"
                        onChange={(e, d) => handleDateChange(e, d)}
                        themeVariant={isDark ? 'dark' : 'light'}
                        style={styles.datePicker}
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
                <ThemedText style={styles.headerTitle}>Create Invoice</ThemedText>
            </View>

            <BottomSheetScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Type Selection */}
                <View style={[styles.section, isDark && styles.sectionDark, { padding: 6 }]}>
                    <View style={[styles.segmentedControl, isDark && styles.segmentedControlDark]}>
                        {(['TC', 'VC'] as const).map((type) => (
                            <Pressable
                                key={type}
                                onPress={() => setInvoiceType(type)}
                                style={[styles.segment, invoiceType === type && (isDark ? styles.segmentActiveDark : styles.segmentActive)]}
                            >
                                <ThemedText style={[styles.segmentText, invoiceType === type && styles.segmentTextActive]}>
                                    {type === 'TC' ? 'Time Charter' : 'Voyage Charter'}
                                </ThemedText>
                            </Pressable>
                        ))}
                    </View>
                </View>

                {/* Common Info */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <ThemedText style={styles.sectionHeader}>Basic Information</ThemedText>
                    <View style={styles.fieldContainer}>
                        <ThemedText style={styles.label}>Invoice Number</ThemedText>
                        <TextInput style={[styles.input, isDark && styles.inputDark]} value={invoiceNumber} onChangeText={setInvoiceNumber} />
                    </View>
                    <View>{renderDateInput('Invoice Date', invoiceDate, 'invoice')}{renderDateInput('Due Date', dueDate, 'due')}</View>

                    <View style={[styles.row, { justifyContent: 'space-between' }]}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <ThemedText style={styles.label}>Currency</ThemedText>
                            <Pressable onPress={showCurrencySelection} style={[styles.input, isDark && styles.inputDark]}>
                                <ThemedText style={{ fontSize: 16, color: isDark ? '#FFF' : '#000' }}>{currency}</ThemedText>
                            </Pressable>
                        </View>
                        {invoiceType === 'VC' && (
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <ThemedText style={styles.label}>Voyage</ThemedText>
                                <Pressable onPress={showVoyageSelection} style={[styles.input, isDark && styles.inputDark]}>
                                    <ThemedText style={{ fontSize: 16, color: isDark ? '#FFF' : '#000' }} numberOfLines={1}>
                                        {selectedVoyageId ? (vesselVoyages.find(v => v.id === selectedVoyageId)?.voyageNumber ? `V${vesselVoyages.find(v => v.id === selectedVoyageId)?.voyageNumber}` : 'Selected') : 'Select...'}
                                    </ThemedText>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>

                {/* TC Specific Fields */}
                {invoiceType === 'TC' && (
                    <View style={[styles.section, isDark && styles.sectionDark]}>
                        <ThemedText style={styles.sectionHeader}>Hire Details</ThemedText>
                        <View>{renderDateInput('Period From', periodFrom, 'from')}{renderDateInput('Period To', periodTo, 'to')}</View>

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 4 }}>
                                <ThemedText style={styles.label}>Hire Days</ThemedText>
                                <TextInput style={[styles.input, isDark && styles.inputDark]} value={hireDays} editable={false} placeholder="0.00" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 4 }}>
                                <ThemedText style={styles.label}>Rate / Day</ThemedText>
                                <TextInput style={[styles.input, isDark && styles.inputDark]} value={dailyRate} onChangeText={setDailyRate} keyboardType="numeric" placeholder="0.00" />
                            </View>
                        </View>
                        <ThemedText style={styles.sumTitle}>Hire Amount: {currency} {hireAmount.toLocaleString()}</ThemedText>

                        <ThemedText style={[styles.label, { marginTop: 16 }]}>Off-Hire Duration (D/H/M)</ThemedText>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginRight: 4 }]} value={offHireDays} onChangeText={setOffHireDays} placeholder="D" keyboardType="numeric" />
                            <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginHorizontal: 4 }]} value={offHireHours} onChangeText={setOffHireHours} placeholder="H" keyboardType="numeric" />
                            <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginLeft: 4 }]} value={offHireMinutes} onChangeText={setOffHireMinutes} placeholder="M" keyboardType="numeric" />
                        </View>
                        <ThemedText style={styles.sumTitle}>Off-Hire Deduction: {currency} {offHireAmount.toLocaleString()}</ThemedText>
                    </View>
                )}

                {/* VC Specific Fields */}
                {invoiceType === 'VC' && (
                    <>
                        <View style={[styles.section, isDark && styles.sectionDark]}>
                            <ThemedText style={styles.sectionHeader}>Freight</ThemedText>
                            <View style={[styles.segmentedControl, isDark && styles.segmentedControlDark, { marginBottom: 16 }]}>
                                {(['Per MT', 'Lumpsum'] as const).map((basis) => (
                                    <Pressable key={basis} onPress={() => setFreightBasis(basis)} style={[styles.segment, freightBasis === basis && (isDark ? styles.segmentActiveDark : styles.segmentActive)]}>
                                        <ThemedText style={[styles.segmentText, freightBasis === basis && styles.segmentTextActive]}>{basis}</ThemedText>
                                    </Pressable>
                                ))}
                            </View>

                            {freightBasis === 'Per MT' ? (
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: 4 }}>
                                        <ThemedText style={styles.label}>Quantity (MT)</ThemedText>
                                        <TextInput style={[styles.input, isDark && styles.inputDark]} value={cargoQuantity} onChangeText={setCargoQuantity} keyboardType="numeric" placeholder="0.00" />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 4 }}>
                                        <ThemedText style={styles.label}>Rate ({currency}/MT)</ThemedText>
                                        <TextInput style={[styles.input, isDark && styles.inputDark]} value={freightRate} onChangeText={setFreightRate} keyboardType="numeric" placeholder="0.00" />
                                    </View>
                                </View>
                            ) : (
                                <View>
                                    <ThemedText style={styles.label}>Lumpsum Amount ({currency})</ThemedText>
                                    <TextInput style={[styles.input, isDark && styles.inputDark]} value={lumpsumAmount} onChangeText={setLumpsumAmount} keyboardType="numeric" placeholder="0.00" />
                                </View>
                            )}
                            <ThemedText style={styles.sumTitle}>Freight Amount: {currency} {freightAmount.toLocaleString()}</ThemedText>
                        </View>

                        <View style={[styles.section, isDark && styles.sectionDark]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <ThemedText style={styles.sectionHeader}>Demurrage / Despatch</ThemedText>
                                <Pressable
                                    onPress={() => setDemurrageType(prev => prev === 'Demurrage' ? 'Despatch' : 'Demurrage')}
                                    style={{ backgroundColor: isDark ? '#333' : '#eee', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                                >
                                    <ThemedText style={{ fontSize: 13, fontWeight: '600' }}>{demurrageType}</ThemedText>
                                </Pressable>
                            </View>

                            <ThemedText style={styles.label}>Time (D/H/M)</ThemedText>
                            <View style={styles.row}>
                                <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginRight: 4 }]} value={demurrageDays} onChangeText={setDemurrageDays} placeholder="D" keyboardType="numeric" />
                                <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginHorizontal: 4 }]} value={demurrageHours} onChangeText={setDemurrageHours} placeholder="H" keyboardType="numeric" />
                                <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginLeft: 4 }]} value={demurrageMinutes} onChangeText={setDemurrageMinutes} placeholder="M" keyboardType="numeric" />
                            </View>

                            <View style={{ marginTop: 12 }}>
                                <ThemedText style={styles.label}>Rate per Day ({currency})</ThemedText>
                                <TextInput style={[styles.input, isDark && styles.inputDark]} value={demurrageRate} onChangeText={setDemurrageRate} keyboardType="numeric" placeholder="0.00" />
                            </View>
                            <ThemedText style={styles.sumTitle}>{demurrageType} Amount: {currency} {demurrageAmount.toLocaleString()}</ThemedText>
                        </View>

                        <View style={[styles.section, isDark && styles.sectionDark]}>
                            <ThemedText style={styles.sectionHeader}>Port Charges</ThemedText>
                            <TextInput style={[styles.input, isDark && styles.inputDark]} value={portCharges} onChangeText={setPortCharges} keyboardType="numeric" placeholder="0.00" />
                        </View>
                    </>
                )}

                {/* Additional Charges (Shared) */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <ThemedText style={styles.sectionHeader}>Additional Charges</ThemedText>
                    {additionalCharges.map((charge) => (
                        <View key={charge.id} style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 2, marginRight: 8 }]} value={charge.title} onChangeText={(t) => updateCharge(charge.id, 'title', t)} placeholder="Title" />
                            <TextInput style={[styles.input, isDark && styles.inputDark, { flex: 1, marginRight: 8 }]} value={charge.amount} onChangeText={(t) => updateCharge(charge.id, 'amount', t)} placeholder="0.00" keyboardType="numeric" />
                            <Pressable onPress={() => handleRemoveCharge(charge.id)}><Trash2 size={20} color="#ef4444" /></Pressable>
                        </View>
                    ))}
                    <Pressable onPress={handleAddCharge} style={styles.addButton}><PlusCircle size={20} color="#007AFF" /><ThemedText style={styles.addButtonText}>Add Charge</ThemedText></Pressable>
                </View>

                {/* Remarks */}
                <View style={[styles.section, isDark && styles.sectionDark]}>
                    <ThemedText style={styles.sectionHeader}>Remarks</ThemedText>
                    <TextInput style={[styles.input, isDark && styles.inputDark, { height: 80, textAlignVertical: 'top' }]} value={remarks} onChangeText={setRemarks} multiline placeholder="Enter remarks..." />
                </View>

                {/* Grand Total */}
                <View style={{ marginTop: 24, marginBottom: 48, alignItems: 'center', paddingHorizontal: 16 }}>
                    <ThemedText style={{ fontSize: 16, color: '#666' }}>Total Invoice Amount</ThemedText>
                    <ThemedText style={{ fontSize: 24, fontWeight: '800', marginVertical: 16 }}>{currency} {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</ThemedText>
                    <Pressable onPress={handleSubmit} disabled={processing} style={[styles.submitButton, processing && { opacity: 0.7 }]}>
                        <ThemedText style={styles.submitButtonText}>{processing ? 'Creating...' : 'Generate Invoice'}</ThemedText>
                    </Pressable>
                </View>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    content: { padding: 16, paddingBottom: 40 },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
    sectionDark: { backgroundColor: '#1C1C1E' },
    sectionHeader: { fontSize: 15, fontWeight: '600', color: '#666', marginBottom: 12 },
    row: { flexDirection: 'row' },
    fieldContainer: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '500', marginBottom: 6, color: '#666' },
    input: { backgroundColor: '#F2F2F7', borderRadius: 10, padding: 12, fontSize: 17, color: '#000' },
    inputDark: { backgroundColor: '#2C2C2E', color: '#FFF' },
    dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    segmentedControl: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 2, height: 36 },
    segmentedControlDark: { backgroundColor: '#2C2C2E' },
    segment: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
    segmentActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
    segmentActiveDark: { backgroundColor: '#636366' },
    segmentText: { fontSize: 13, fontWeight: '500' },
    segmentTextActive: { fontWeight: '600' },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, marginTop: 8 },
    addButtonText: { color: '#007AFF', fontSize: 16, marginLeft: 8, fontWeight: '500' },
    submitButton: { backgroundColor: '#fff', borderRadius: 30, paddingVertical: 12, width: '100%', alignItems: 'center', borderColor: '#fff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    submitButtonText: { color: '#000', fontSize: 16, fontWeight: '700' },
    sumTitle: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginTop: 8, textAlign: 'right' },
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
