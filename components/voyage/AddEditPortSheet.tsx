/**
 * AddEditPortSheet Component
 *
 * Bottom sheet for adding or editing a voyage port.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActionSheetIOS,
  Platform,
  Alert,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common';
import { useColorScheme } from 'nativewind';
import { MapPin, Clock, Calendar, FileText } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { VoyagePort, PortType } from '@/types';
import { PORT_TYPES, PORT_TYPE_LABELS, COMMON_PORTS } from '@/constants';
import { CreatePortInput } from '@/services/port.service';

interface AddEditPortSheetProps {
  visible: boolean;
  voyageId: number;
  port?: VoyagePort | null;
  existingPorts?: VoyagePort[];
  onCancel: () => void;
  onSubmit: (input: CreatePortInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddEditPortSheet({
  visible,
  voyageId,
  port,
  existingPorts = [],
  onCancel,
  onSubmit,
  isSubmitting = false,
}: AddEditPortSheetProps) {
  const IOS = Platform.OS === 'ios';
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%', '95%'], []);

  const isEditing = !!port;

  // Form state
  const [portName, setPortName] = useState('');
  const [portType, setPortType] = useState<PortType>('Load');
  const [portSequence, setPortSequence] = useState(1);
  const [showPortSuggestions, setShowPortSuggestions] = useState(false);

  // Date states
  const [laycanStart, setLaycanStart] = useState<Date | undefined>(undefined);
  const [laycanEnd, setLaycanEnd] = useState<Date | undefined>(undefined);
  const [eta, setEta] = useState<Date | undefined>(undefined);
  const [etb, setEtb] = useState<Date | undefined>(undefined);
  const [atb, setAtb] = useState<Date | undefined>(undefined);
  const [etd, setEtd] = useState<Date | undefined>(undefined);
  const [atd, setAtd] = useState<Date | undefined>(undefined);
  const [norTendered, setNorTendered] = useState<Date | undefined>(undefined);
  const [norAccepted, setNorAccepted] = useState<Date | undefined>(undefined);

  const [remarks, setRemarks] = useState('');

  // Date picker state
  const [activePicker, setActivePicker] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  // Calculate next sequence
  const nextSequence = useMemo(() => {
    if (existingPorts.length === 0) return 1;
    return Math.max(...existingPorts.map((p) => p.portSequence)) + 1;
  }, [existingPorts]);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();

      if (port) {
        // Edit mode - populate form
        setPortName(port.portName);
        setPortType(port.portType);
        setPortSequence(port.portSequence);
        setLaycanStart(port.laycanStart ? new Date(port.laycanStart) : undefined);
        setLaycanEnd(port.laycanEnd ? new Date(port.laycanEnd) : undefined);
        setEta(port.eta ? new Date(port.eta) : undefined);
        setEtb(port.etb ? new Date(port.etb) : undefined);
        setAtb(port.atb ? new Date(port.atb) : undefined);
        setEtd(port.etd ? new Date(port.etd) : undefined);
        setAtd(port.atd ? new Date(port.atd) : undefined);
        setNorTendered(port.norTendered ? new Date(port.norTendered) : undefined);
        setNorAccepted(port.norAccepted ? new Date(port.norAccepted) : undefined);
        setRemarks(port.remarks || '');
      } else {
        // Create mode - reset form
        setPortName('');
        setPortType('Load');
        setPortSequence(nextSequence);
        setLaycanStart(undefined);
        setLaycanEnd(undefined);
        setEta(undefined);
        setEtb(undefined);
        setAtb(undefined);
        setEtd(undefined);
        setAtd(undefined);
        setNorTendered(undefined);
        setNorAccepted(undefined);
        setRemarks('');
      }
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, port, nextSequence]);

  // Validation
  const isFormValid = useMemo(() => {
    return !!portName.trim();
  }, [portName]);

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    const input: CreatePortInput = {
      portType,
      portSequence,
      portName: portName.trim(),
      laycanStart: laycanStart?.toISOString(),
      laycanEnd: laycanEnd?.toISOString(),
      eta: eta?.toISOString(),
      etb: etb?.toISOString(),
      atb: atb?.toISOString(),
      etd: etd?.toISOString(),
      atd: atd?.toISOString(),
      norTendered: norTendered?.toISOString(),
      norAccepted: norAccepted?.toISOString(),
      remarks: remarks.trim() || undefined,
    };

    try {
      await onSubmit(input);
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} port. Please try again.`);
    }
  };

  const showSelection = (
    title: string,
    options: string[],
    onSelect: (opt: string) => void
  ) => {
    if (IOS) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: options.length,
          title: title,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length) {
            onSelect(options[buttonIndex]);
          }
        }
      );
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date?: Date) => {
    if (!date) return 'Not set';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openDatePicker = (field: string, currentValue?: Date) => {
    setActivePicker(field);
    setPickerMode('date');
    setTempDate(currentValue || new Date());
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }

    if (date && activePicker) {
      const setters: Record<string, (d: Date | undefined) => void> = {
        laycanStart: setLaycanStart,
        laycanEnd: setLaycanEnd,
        eta: setEta,
        etb: setEtb,
        atb: setAtb,
        etd: setEtd,
        atd: setAtd,
        norTendered: setNorTendered,
        norAccepted: setNorAccepted,
      };

      if (setters[activePicker]) {
        setters[activePicker](date);
      }
    }

    if (Platform.OS === 'ios') {
      setTempDate(date || new Date());
    }
  };

  const confirmIOSDate = () => {
    if (activePicker) {
      const setters: Record<string, (d: Date | undefined) => void> = {
        laycanStart: setLaycanStart,
        laycanEnd: setLaycanEnd,
        eta: setEta,
        etb: setEtb,
        atb: setAtb,
        etd: setEtd,
        atd: setAtd,
        norTendered: setNorTendered,
        norAccepted: setNorAccepted,
      };

      if (setters[activePicker]) {
        setters[activePicker](tempDate);
      }
    }
    setActivePicker(null);
  };

  const filteredPorts = COMMON_PORTS.filter((p) =>
    p.toLowerCase().includes(portName.toLowerCase())
  );

  const DateField = ({
    label,
    value,
    field,
    showTime = false,
  }: {
    label: string;
    value?: Date;
    field: string;
    showTime?: boolean;
  }) => (
    <View className="mb-4">
      <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
        {label}
      </ThemedText>
      <Pressable
        onPress={() => openDatePicker(field, value)}
        className={`p-3 rounded-lg ${
          isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
        }`}
      >
        <ThemedText
          className={`text-[15px] ${
            value ? (isDark ? 'text-white' : 'text-black') : 'text-gray-400'
          }`}
          numberOfLines={1}
        >
          {showTime ? formatDateTime(value) : formatDate(value)}
        </ThemedText>
        <ThemedText className="text-[#007AFF] text-[13px] mt-1.5">
          {value ? 'Edit' : 'Add'}
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
      )}
      backgroundStyle={{ backgroundColor: isDark ? '#151718' : '#F2F2F7' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#404040' : '#e5e7eb' }}
      onDismiss={onCancel}
    >
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-black/5">
        <ThemedText className="text-lg font-semibold text-center flex-1">
          {isEditing ? 'Edit Port' : 'Add Port'}
        </ThemedText>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Information */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <MapPin size={18} color="#22c55e" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Basic Information
            </ThemedText>
          </View>

          {/* Port Name */}
          <View className="mb-4 relative">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Port Name *
            </ThemedText>
            <View
              className={`flex-row items-center p-3 rounded-lg ${
                isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
              }`}
            >
              <TextInput
                className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="e.g. Singapore, Jurong"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={portName}
                onChangeText={(text) => {
                  setPortName(text);
                  setShowPortSuggestions(text.length > 0);
                }}
                onFocus={() => setShowPortSuggestions(portName.length > 0)}
                onBlur={() => setTimeout(() => setShowPortSuggestions(false), 200)}
              />
            </View>

            {/* Port Suggestions */}
            {showPortSuggestions && filteredPorts.length > 0 && (
              <View
                className={`absolute top-20 left-0 right-0 rounded-lg z-50 max-h-48 overflow-hidden ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-white'
                } shadow-lg`}
              >
                <ScrollView>
                  {filteredPorts.slice(0, 5).map((portSuggestion) => (
                    <TouchableOpacity
                      key={portSuggestion}
                      onPress={() => {
                        setPortName(portSuggestion);
                        setShowPortSuggestions(false);
                      }}
                      className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700"
                    >
                      <ThemedText>{portSuggestion}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Port Type & Sequence */}
          <View className="flex-row gap-3">
            <View className="flex-1 mb-4">
              <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
                Port Type *
              </ThemedText>
              {IOS ? (
                <Pressable
                  onPress={() =>
                    showSelection(
                      'Select Port Type',
                      PORT_TYPES.map((t) => PORT_TYPE_LABELS[t]),
                      (opt) => {
                        const type = PORT_TYPES.find((t) => PORT_TYPE_LABELS[t] === opt);
                        if (type) setPortType(type);
                      }
                    )
                  }
                  className={`p-3 rounded-lg ${
                    isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                  }`}
                >
                  <ThemedText className={`text-[15px] ${isDark ? 'text-white' : 'text-black'}`}>
                    {PORT_TYPE_LABELS[portType]}
                  </ThemedText>
                  <ThemedText className="text-[#007AFF] text-[13px] mt-1.5">Edit</ThemedText>
                </Pressable>
              ) : (
                <Picker
                  selectedValue={portType}
                  onValueChange={(value) => setPortType(value)}
                  style={{ backgroundColor: isDark ? '#2C2C2E' : '#f3f4f6' }}
                >
                  {PORT_TYPES.map((type) => (
                    <Picker.Item key={type} label={PORT_TYPE_LABELS[type]} value={type} />
                  ))}
                </Picker>
              )}
            </View>

            <View className="w-24">
              <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
                Sequence *
              </ThemedText>
              <View
                className={`flex-row items-center justify-center p-3 rounded-lg ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                }`}
              >
                <TextInput
                  className={`text-center text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                  value={portSequence.toString()}
                  onChangeText={(text) => setPortSequence(parseInt(text) || 1)}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Laycan Window */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Calendar size={18} color="#f59e0b" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Laycan Window
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <DateField label="Laycan Start" value={laycanStart} field="laycanStart" />
            </View>
            <View className="flex-1">
              <DateField label="Laycan End" value={laycanEnd} field="laycanEnd" />
            </View>
          </View>
        </View>

        {/* Estimated Times */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Clock size={18} color="#3b82f6" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Estimated Times
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <DateField label="ETA" value={eta} field="eta" showTime />
            </View>
            <View className="flex-1">
              <DateField label="ETB" value={etb} field="etb" showTime />
            </View>
          </View>

          <DateField label="ETD" value={etd} field="etd" showTime />
        </View>

        {/* Actual Times */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Clock size={18} color="#22c55e" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Actual Times
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <DateField label="ATB" value={atb} field="atb" showTime />
            </View>
            <View className="flex-1">
              <DateField label="ATD" value={atd} field="atd" showTime />
            </View>
          </View>
        </View>

        {/* Notice of Readiness */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <FileText size={18} color="#8b5cf6" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Notice of Readiness
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <DateField label="NOR Tendered" value={norTendered} field="norTendered" showTime />
            </View>
            <View className="flex-1">
              <DateField label="NOR Accepted" value={norAccepted} field="norAccepted" showTime />
            </View>
          </View>
        </View>

        {/* Remarks */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <ThemedText className="text-[15px] font-semibold text-gray-500 mb-3">
            Remarks
          </ThemedText>

          <View className={`p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
            <TextInput
              className={`text-[17px] min-h-[80px] ${isDark ? 'text-white' : 'text-black'}`}
              placeholder="Enter any additional remarks..."
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={remarks}
              onChangeText={setRemarks}
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid || isSubmitting}
          className={`bg-blue-600 rounded-full py-3 w-full items-center mt-4 mb-5 ${
            (!isFormValid || isSubmitting) && 'opacity-50'
          }`}
        >
          <ThemedText className="text-white text-base font-bold">
            {isSubmitting
              ? isEditing
                ? 'Saving...'
                : 'Adding...'
              : isEditing
              ? 'Save Changes'
              : 'Add Port'}
          </ThemedText>
        </Pressable>
      </BottomSheetScrollView>

      {/* Date Picker Modal for iOS */}
      {IOS && activePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={activePicker !== null}
          onRequestClose={() => setActivePicker(null)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className={`${isDark ? 'bg-[#1C1C1E]' : 'bg-white'} rounded-t-2xl`}>
              {/* Header with Cancel and Done */}
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <TouchableOpacity onPress={() => setActivePicker(null)}>
                  <ThemedText className="text-[#007AFF] text-[17px]">Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText className="text-[17px] font-semibold">
                  Select Date & Time
                </ThemedText>
                <TouchableOpacity onPress={confirmIOSDate}>
                  <ThemedText className="text-[#007AFF] text-[17px] font-semibold">Done</ThemedText>
                </TouchableOpacity>
              </View>
              {/* Date Picker */}
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                display="spinner"
                onChange={handleDateChange}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {!IOS && activePicker && (
        <DateTimePicker
          value={tempDate}
          mode="datetime"
          display="default"
          onChange={(event, date) => {
            setActivePicker(null);
            if (event.type === 'set' && date && activePicker) {
              const setters: Record<string, (d: Date | undefined) => void> = {
                laycanStart: setLaycanStart,
                laycanEnd: setLaycanEnd,
                eta: setEta,
                etb: setEtb,
                atb: setAtb,
                etd: setEtd,
                atd: setAtd,
                norTendered: setNorTendered,
                norAccepted: setNorAccepted,
              };
              if (setters[activePicker]) {
                setters[activePicker](date);
              }
            }
          }}
        />
      )}
    </BottomSheetModal>
  );
}

export default AddEditPortSheet;
