/**
 * CreateVoyageSheet Component
 *
 * Bottom sheet for creating a new voyage with ports and cargo.
 * Follows the existing AddVesselModal pattern.
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
  Modal,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common';
import { useColorScheme } from 'nativewind';
import { Plus, X, MapPin, Package, AlertTriangle } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import { VoyageStatus, PortType, CharterParty } from '@/types';
import {
  VOYAGE_STATUSES,
  VOYAGE_STATUS_LABELS,
  PORT_TYPE_LABELS,
  CARGO_TYPES,
  COMMON_PORTS,
} from '@/constants';
import { CreateVoyageInput } from '@/services/voyage.service';

interface CreateVoyageSheetProps {
  visible: boolean;
  vesselId: number;
  charters: CharterParty[];
  onCancel: () => void;
  onCreate: (input: CreateVoyageInput) => Promise<void>;
  isCreating?: boolean;
}

interface PortEntry {
  id: string;
  portName: string;
  portType: PortType;
  portSequence: number;
}

export function CreateVoyageSheet({
  visible,
  vesselId,
  charters,
  onCancel,
  onCreate,
  isCreating = false,
}: CreateVoyageSheetProps) {
  const IOS = Platform.OS === 'ios';
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%', '95%'], []);

  // Basic Info
  const [voyageNumber, setVoyageNumber] = useState('');
  const [voyageStatus, setVoyageStatus] = useState<VoyageStatus>('Ballast');
  const [charterPartyId, setCharterPartyId] = useState<number | undefined>(undefined);

  // Dates
  const [voyageStartDate, setVoyageStartDate] = useState(new Date());
  const [voyageEndDate, setVoyageEndDate] = useState<Date | undefined>(undefined);
  const [activeDatePicker, setActiveDatePicker] = useState<'start' | 'end' | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  // Ports
  const [loadPorts, setLoadPorts] = useState<PortEntry[]>([
    { id: '1', portName: '', portType: 'Load', portSequence: 1 },
  ]);
  const [dischargePorts, setDischargePorts] = useState<PortEntry[]>([]);

  // Cargo
  const [cargoType, setCargoType] = useState('');
  const [cargoQuantity, setCargoQuantity] = useState('');
  const [cargoTemp, setCargoTemp] = useState('');

  // Instructions
  const [voyageInstructions, setVoyageInstructions] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      // Reset form on open
      setVoyageNumber('');
      setVoyageStatus('Ballast');
      setCharterPartyId(undefined);
      setVoyageStartDate(new Date());
      setVoyageEndDate(undefined);
      setLoadPorts([{ id: '1', portName: '', portType: 'Load', portSequence: 1 }]);
      setDischargePorts([]);
      setCargoType('');
      setCargoQuantity('');
      setCargoTemp('');
      setVoyageInstructions('');
      setRemarks('');
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  // Validation
  const isFormValid = useMemo(() => {
    if (!voyageNumber.trim()) return false;
    if (!loadPorts.some((p) => p.portName.trim())) return false;
    if (!cargoType.trim()) return false;
    if (!cargoQuantity || parseFloat(cargoQuantity) <= 0) return false;
    return true;
  }, [voyageNumber, loadPorts, cargoType, cargoQuantity]);

  const handleSubmit = async () => {
    if (!isFormValid || isCreating) return;

    const input: CreateVoyageInput = {
      vesselId,
      voyageNumber: voyageNumber.trim(),
      voyageStatus,
      charterPartyId,
      loadPorts: loadPorts
        .filter((p) => p.portName.trim())
        .map((p, idx) => ({
          portType: 'Load' as PortType,
          portSequence: idx + 1,
          portName: p.portName.trim(),
        })),
      dischargePorts: dischargePorts
        .filter((p) => p.portName.trim())
        .map((p, idx) => ({
          portType: 'Discharge' as PortType,
          portSequence: loadPorts.filter((lp) => lp.portName.trim()).length + idx + 1,
          portName: p.portName.trim(),
        })),
      cargo: {
        cargoType: cargoType.trim(),
        nominatedQuantityMt: parseFloat(cargoQuantity) || 0,
        requiredTempC: cargoTemp ? parseFloat(cargoTemp) : undefined,
      },
      voyageStartDate: voyageStartDate.toISOString(),
      voyageEndDate: voyageEndDate?.toISOString(),
      voyageInstructions: voyageInstructions.trim() || undefined,
      remarks: remarks.trim() || undefined,
    };

    try {
      await onCreate(input);
    } catch (error) {
      Alert.alert('Error', 'Failed to create voyage. Please try again.');
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

  const addLoadPort = () => {
    if (loadPorts.length >= 5) return;
    setLoadPorts([
      ...loadPorts,
      {
        id: Date.now().toString(),
        portName: '',
        portType: 'Load',
        portSequence: loadPorts.length + 1,
      },
    ]);
  };

  const removeLoadPort = (id: string) => {
    if (loadPorts.length <= 1) return;
    setLoadPorts(loadPorts.filter((p) => p.id !== id));
  };

  const updateLoadPort = (id: string, name: string) => {
    setLoadPorts(loadPorts.map((p) => (p.id === id ? { ...p, portName: name } : p)));
  };

  const addDischargePort = () => {
    if (dischargePorts.length >= 5) return;
    setDischargePorts([
      ...dischargePorts,
      {
        id: Date.now().toString(),
        portName: '',
        portType: 'Discharge',
        portSequence: dischargePorts.length + 1,
      },
    ]);
  };

  const removeDischargePort = (id: string) => {
    setDischargePorts(dischargePorts.filter((p) => p.id !== id));
  };

  const updateDischargePort = (id: string, name: string) => {
    setDischargePorts(
      dischargePorts.map((p) => (p.id === id ? { ...p, portName: name } : p))
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const activeCharters = charters.filter((c) => c.isActive);

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
      <View
        testID="create-voyage-sheet"
        className="flex-row items-center justify-between px-4 py-3 border-b border-black/5"
      >
        <ThemedText
          testID="create-voyage-title"
          className="text-lg font-semibold text-center flex-1"
        >
          Create New Voyage
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
          <ThemedText className="text-[15px] font-semibold text-gray-500 mb-3">
            Basic Information
          </ThemedText>

          {/* Voyage Number */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Voyage Number *
            </ThemedText>
            <View
              className={`flex-row items-center p-3 rounded-lg ${
                isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
              }`}
            >
              <TextInput
                testID="voyage-number-input"
                className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="e.g. V-2024-001"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={voyageNumber}
                onChangeText={setVoyageNumber}
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {/* Voyage Status */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Status
            </ThemedText>
            {IOS ? (
              <Pressable
                testID="voyage-status-picker"
                onPress={() =>
                  showSelection(
                    'Select Status',
                    VOYAGE_STATUSES.map((s) => VOYAGE_STATUS_LABELS[s]),
                    (opt) => {
                      const status = VOYAGE_STATUSES.find(
                        (s) => VOYAGE_STATUS_LABELS[s] === opt
                      );
                      if (status) setVoyageStatus(status);
                    }
                  )
                }
                className={`flex-row justify-between items-center p-3 rounded-lg ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                }`}
              >
                <ThemedText className={`text-[17px] ${isDark ? 'text-white' : 'text-black'}`}>
                  {VOYAGE_STATUS_LABELS[voyageStatus]}
                </ThemedText>
                <ThemedText className="text-[#007AFF] text-[17px]">Edit</ThemedText>
              </Pressable>
            ) : (
              <Picker
                testID="voyage-status-picker"
                selectedValue={voyageStatus}
                onValueChange={(value) => setVoyageStatus(value)}
                style={{ backgroundColor: isDark ? '#2C2C2E' : '#f3f4f6' }}
              >
                {VOYAGE_STATUSES.map((status) => (
                  <Picker.Item
                    key={status}
                    label={VOYAGE_STATUS_LABELS[status]}
                    value={status}
                  />
                ))}
              </Picker>
            )}
          </View>

          {/* Charter Party */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Charter Party (Optional)
            </ThemedText>
            {IOS ? (
              <Pressable
                testID="charter-party-picker"
                onPress={() =>
                  showSelection(
                    'Select Charter Party',
                    ['None', ...activeCharters.map((c) => `${c.charterReference} - ${c.chartererName}`)],
                    (opt) => {
                      if (opt === 'None') {
                        setCharterPartyId(undefined);
                      } else {
                        const charter = activeCharters.find(
                          (c) => `${c.charterReference} - ${c.chartererName}` === opt
                        );
                        if (charter) setCharterPartyId(charter.id);
                      }
                    }
                  )
                }
                className={`flex-row justify-between items-center p-3 rounded-lg ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                }`}
              >
                <ThemedText className={`text-[17px] ${isDark ? 'text-white' : 'text-black'}`}>
                  {charterPartyId
                    ? activeCharters.find((c) => c.id === charterPartyId)?.chartererName || 'None'
                    : 'None'}
                </ThemedText>
                <ThemedText className="text-[#007AFF] text-[17px]">Edit</ThemedText>
              </Pressable>
            ) : (
              <Picker
                testID="charter-party-picker"
                selectedValue={charterPartyId?.toString() || ''}
                onValueChange={(value) =>
                  setCharterPartyId(value ? parseInt(value) : undefined)
                }
                style={{ backgroundColor: isDark ? '#2C2C2E' : '#f3f4f6' }}
              >
                <Picker.Item label="None" value="" />
                {activeCharters.map((charter) => (
                  <Picker.Item
                    key={charter.id}
                    label={`${charter.charterReference} - ${charter.chartererName}`}
                    value={charter.id.toString()}
                  />
                ))}
              </Picker>
            )}
          </View>

          {/* No charter warning */}
          {!charterPartyId && (
            <View className="flex-row items-start gap-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
              <AlertTriangle size={18} color="#f59e0b" style={{ marginTop: 2 }} />
              <View className="flex-1">
                <ThemedText className="text-amber-500 font-medium text-sm">
                  Creating voyage without charter party
                </ThemedText>
                <ThemedText className="text-amber-500/80 text-xs mt-0.5">
                  Performance comparisons will be unavailable.
                </ThemedText>
              </View>
            </View>
          )}
        </View>

        {/* Voyage Dates */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <ThemedText className="text-[15px] font-semibold text-gray-500 mb-3">
            Voyage Dates
          </ThemedText>

          {/* Start Date */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Start Date *
            </ThemedText>
            <Pressable
              onPress={() => {
                setTempDate(voyageStartDate);
                setActiveDatePicker('start');
              }}
              className={`flex-row justify-between items-center p-3 rounded-lg ${
                isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
              }`}
            >
              <ThemedText className={`text-[17px] ${isDark ? 'text-white' : 'text-black'}`}>
                {formatDate(voyageStartDate)}
              </ThemedText>
              <ThemedText className="text-[#007AFF] text-[17px]">Edit</ThemedText>
            </Pressable>
          </View>

          {/* End Date */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              End Date (Optional)
            </ThemedText>
            <Pressable
              onPress={() => {
                setTempDate(voyageEndDate || new Date());
                setActiveDatePicker('end');
              }}
              className={`flex-row justify-between items-center p-3 rounded-lg ${
                isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
              }`}
            >
              <ThemedText className={`text-[17px] ${isDark ? 'text-white' : 'text-black'}`}>
                {voyageEndDate ? formatDate(voyageEndDate) : 'Not set'}
              </ThemedText>
              <ThemedText className="text-[#007AFF] text-[17px]">
                {voyageEndDate ? 'Edit' : 'Add'}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {/* Load Ports */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <MapPin size={18} color="#22c55e" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Load Ports *
            </ThemedText>
          </View>

          {loadPorts.map((port, index) => (
            <View key={port.id} className="mb-3">
              <View
                className={`flex-row items-center p-3 rounded-lg ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                }`}
              >
                <ThemedText className="text-gray-500 mr-2">{index + 1}.</ThemedText>
                <TextInput
                  className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                  placeholder="Port name..."
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={port.portName}
                  onChangeText={(text) => updateLoadPort(port.id, text)}
                />
                {loadPorts.length > 1 && (
                  <TouchableOpacity onPress={() => removeLoadPort(port.id)}>
                    <X size={20} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          {loadPorts.length < 5 && (
            <TouchableOpacity
              onPress={addLoadPort}
              className="flex-row items-center justify-center gap-2 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <Plus size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <ThemedText className="text-gray-500 text-sm">Add Load Port</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Discharge Ports */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <MapPin size={18} color="#3b82f6" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Discharge Ports
            </ThemedText>
          </View>

          {dischargePorts.length === 0 ? (
            <ThemedText className="text-sm text-gray-400 text-center py-4">
              No discharge ports added yet
            </ThemedText>
          ) : (
            dischargePorts.map((port, index) => (
              <View key={port.id} className="mb-3">
                <View
                  className={`flex-row items-center p-3 rounded-lg ${
                    isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                  }`}
                >
                  <ThemedText className="text-gray-500 mr-2">{index + 1}.</ThemedText>
                  <TextInput
                    className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                    placeholder="Port name..."
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={port.portName}
                    onChangeText={(text) => updateDischargePort(port.id, text)}
                  />
                  <TouchableOpacity onPress={() => removeDischargePort(port.id)}>
                    <X size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {dischargePorts.length < 5 && (
            <TouchableOpacity
              onPress={addDischargePort}
              className="flex-row items-center justify-center gap-2 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <Plus size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
              <ThemedText className="text-gray-500 text-sm">Add Discharge Port</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Cargo */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Package size={18} color="#8b5cf6" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Cargo
            </ThemedText>
          </View>

          {/* Cargo Type */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Cargo Type *
            </ThemedText>
            {IOS ? (
              <Pressable
                testID="cargo-type-picker"
                onPress={() =>
                  showSelection('Select Cargo Type', [...CARGO_TYPES], (opt) =>
                    setCargoType(opt)
                  )
                }
                className={`flex-row justify-between items-center p-3 rounded-lg ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                }`}
              >
                <ThemedText className={`text-[17px] ${isDark ? 'text-white' : 'text-black'}`}>
                  {cargoType || 'Select cargo type'}
                </ThemedText>
                <ThemedText className="text-[#007AFF] text-[17px]">Edit</ThemedText>
              </Pressable>
            ) : (
              <Picker
                testID="cargo-type-picker"
                selectedValue={cargoType}
                onValueChange={(value) => setCargoType(value)}
                style={{ backgroundColor: isDark ? '#2C2C2E' : '#f3f4f6' }}
              >
                <Picker.Item label="Select cargo type" value="" />
                {CARGO_TYPES.map((type) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            )}
          </View>

          {/* Quantity */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Quantity (MT) *
            </ThemedText>
            <View
              className={`flex-row items-center p-3 rounded-lg ${
                isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
              }`}
            >
              <TextInput
                className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="e.g. 5000"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={cargoQuantity}
                onChangeText={setCargoQuantity}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Temperature */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Required Temperature (°C)
            </ThemedText>
            <View
              className={`flex-row items-center p-3 rounded-lg ${
                isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
              }`}
            >
              <TextInput
                className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="e.g. -42"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={cargoTemp}
                onChangeText={setCargoTemp}
                keyboardType="decimal-pad"
              />
            </View>
            <ThemedText className="text-xs text-gray-400 mt-1">
              Critical for cargo integrity on gas carriers
            </ThemedText>
          </View>
        </View>

        {/* Instructions */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <ThemedText className="text-[15px] font-semibold text-gray-500 mb-3">
            Instructions (Optional)
          </ThemedText>

          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Voyage Instructions
            </ThemedText>
            <View
              className={`p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}
            >
              <TextInput
                className={`text-[17px] min-h-[80px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="Enter voyage instructions..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={voyageInstructions}
                onChangeText={setVoyageInstructions}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View>
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Remarks
            </ThemedText>
            <View
              className={`p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}
            >
              <TextInput
                className={`text-[17px] min-h-[80px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="Additional remarks..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          testID="create-voyage-button"
          onPress={handleSubmit}
          disabled={!isFormValid || isCreating}
          className={`bg-blue-600 rounded-full py-3 w-full items-center mt-4 mb-5 ${
            (!isFormValid || isCreating) && 'opacity-50'
          }`}
        >
          <ThemedText className="text-white text-base font-bold">
            {isCreating ? 'Creating...' : 'Create Voyage'}
          </ThemedText>
        </Pressable>
      </BottomSheetScrollView>

      {/* Date Picker Modal for iOS */}
      {IOS && activeDatePicker && (
        <Modal
          transparent
          animationType="slide"
          visible={activeDatePicker !== null}
          onRequestClose={() => setActiveDatePicker(null)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className={`${isDark ? 'bg-[#1C1C1E]' : 'bg-white'} rounded-t-2xl`}>
              {/* Header with Cancel and Done */}
              <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <TouchableOpacity onPress={() => setActiveDatePicker(null)}>
                  <ThemedText className="text-[#007AFF] text-[17px]">Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText className="text-[17px] font-semibold">
                  {activeDatePicker === 'start' ? 'Start Date' : 'End Date'}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    if (activeDatePicker === 'start') {
                      setVoyageStartDate(tempDate);
                    } else {
                      setVoyageEndDate(tempDate);
                    }
                    setActiveDatePicker(null);
                  }}
                >
                  <ThemedText className="text-[#007AFF] text-[17px] font-semibold">Done</ThemedText>
                </TouchableOpacity>
              </View>
              {/* Date Picker */}
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setTempDate(date);
                }}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Date Picker for Android */}
      {!IOS && activeDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setActiveDatePicker(null);
            if (event.type === 'set' && date) {
              if (activeDatePicker === 'start') {
                setVoyageStartDate(date);
              } else {
                setVoyageEndDate(date);
              }
            }
          }}
        />
      )}
    </BottomSheetModal>
  );
}

export default CreateVoyageSheet;
