/**
 * AddEditCargoSheet Component
 *
 * Bottom sheet for adding or editing cargo.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common';
import { useColorScheme } from 'nativewind';
import { Package, Thermometer, AlertTriangle, FileText } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';

import { Cargo } from '@/types';
import { CARGO_TYPES, IMO_HAZARD_CLASSES } from '@/constants';
import { CreateCargoInput } from '@/services/cargo.service';

interface AddEditCargoSheetProps {
  visible: boolean;
  voyageId: number;
  cargo?: Cargo | null;
  onCancel: () => void;
  onSubmit: (input: CreateCargoInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function AddEditCargoSheet({
  visible,
  voyageId,
  cargo,
  onCancel,
  onSubmit,
  isSubmitting = false,
}: AddEditCargoSheetProps) {
  const IOS = Platform.OS === 'ios';
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['75%', '95%'], []);

  const isEditing = !!cargo;

  // Basic Info
  const [cargoType, setCargoType] = useState('');
  const [nominatedQuantity, setNominatedQuantity] = useState('');
  const [chartererName, setChartererName] = useState('');
  const [receiverName, setReceiverName] = useState('');

  // Cargo Properties
  const [requiredTemp, setRequiredTemp] = useState('');
  const [apiGravity, setApiGravity] = useState('');
  const [density15c, setDensity15c] = useState('');
  const [sulphurPct, setSulphurPct] = useState('');
  const [waterContentPct, setWaterContentPct] = useState('');

  // Hazard Classification
  const [unNumber, setUnNumber] = useState('');
  const [imoClass, setImoClass] = useState('');

  // Instructions
  const [loadingInstructions, setLoadingInstructions] = useState('');
  const [dischargeInstructions, setDischargeInstructions] = useState('');

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();

      if (cargo) {
        // Edit mode - populate form
        setCargoType(cargo.cargoType || '');
        setNominatedQuantity(cargo.nominatedQuantityMt?.toString() || '');
        setChartererName(cargo.chartererName || '');
        setReceiverName(cargo.receiverName || '');
        setRequiredTemp(cargo.requiredTempC?.toString() || '');
        setApiGravity(cargo.apiGravity?.toString() || '');
        setDensity15c(cargo.density15c?.toString() || '');
        setSulphurPct(cargo.sulphurPct?.toString() || '');
        setWaterContentPct(cargo.waterContentPct?.toString() || '');
        setUnNumber(cargo.unNumber || '');
        setImoClass(cargo.imoClass || '');
        setLoadingInstructions(cargo.loadingInstructions || '');
        setDischargeInstructions(cargo.dischargeInstructions || '');
      } else {
        // Create mode - reset form
        setCargoType('');
        setNominatedQuantity('');
        setChartererName('');
        setReceiverName('');
        setRequiredTemp('');
        setApiGravity('');
        setDensity15c('');
        setSulphurPct('');
        setWaterContentPct('');
        setUnNumber('');
        setImoClass('');
        setLoadingInstructions('');
        setDischargeInstructions('');
      }
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, cargo]);

  // Validation
  const isFormValid = useMemo(() => {
    if (!cargoType.trim()) return false;
    if (!nominatedQuantity || parseFloat(nominatedQuantity) <= 0) return false;
    if (!chartererName.trim()) return false;
    return true;
  }, [cargoType, nominatedQuantity, chartererName]);

  const handleSubmit = async () => {
    if (!isFormValid || isSubmitting) return;

    const input: CreateCargoInput = {
      cargoType: cargoType.trim(),
      nominatedQuantityMt: parseFloat(nominatedQuantity) || 0,
      chartererName: chartererName.trim(),
      receiverName: receiverName.trim() || undefined,
      requiredTempC: requiredTemp ? parseFloat(requiredTemp) : undefined,
      apiGravity: apiGravity ? parseFloat(apiGravity) : undefined,
      density15c: density15c ? parseFloat(density15c) : undefined,
      sulphurPct: sulphurPct ? parseFloat(sulphurPct) : undefined,
      waterContentPct: waterContentPct ? parseFloat(waterContentPct) : undefined,
      unNumber: unNumber.trim() || undefined,
      imoClass: imoClass || undefined,
      loadingInstructions: loadingInstructions.trim() || undefined,
      dischargeInstructions: dischargeInstructions.trim() || undefined,
    };

    try {
      await onSubmit(input);
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'add'} cargo. Please try again.`);
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

  const NumericInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    suffix,
    required = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    suffix?: string;
    required?: boolean;
  }) => (
    <View className="mb-4">
      <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
        {label} {required && '*'}
      </ThemedText>
      <View
        className={`flex-row items-center p-3 rounded-lg ${
          isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
        }`}
      >
        <TextInput
          className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#666' : '#999'}
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
        />
        {suffix && <ThemedText className="text-gray-500 ml-2">{suffix}</ThemedText>}
      </View>
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
          {isEditing ? 'Edit Cargo' : 'Add Cargo'}
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
            <Package size={18} color="#8b5cf6" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Basic Information
            </ThemedText>
          </View>

          {/* Cargo Type */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Cargo Type *
            </ThemedText>
            {IOS ? (
              <Pressable
                onPress={() =>
                  showSelection('Select Cargo Type', [...CARGO_TYPES], (opt) =>
                    setCargoType(opt)
                  )
                }
                className={`p-3 rounded-lg ${
                  isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                }`}
              >
                <ThemedText className={`text-[15px] ${cargoType ? (isDark ? 'text-white' : 'text-black') : 'text-gray-400'}`}>
                  {cargoType || 'Select cargo type'}
                </ThemedText>
                <ThemedText className="text-[#007AFF] text-[13px] mt-1.5">
                  {cargoType ? 'Edit' : 'Select'}
                </ThemedText>
              </Pressable>
            ) : (
              <Picker
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
          <NumericInput
            label="Quantity (MT)"
            value={nominatedQuantity}
            onChangeText={setNominatedQuantity}
            placeholder="e.g. 5000"
            required
          />

          {/* Charterer & Receiver */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <View className="mb-4">
                <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
                  Charterer *
                </ThemedText>
                <View
                  className={`flex-row items-center p-3 rounded-lg ${
                    isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                  }`}
                >
                  <TextInput
                    className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                    placeholder="Enter charterer"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={chartererName}
                    onChangeText={setChartererName}
                  />
                </View>
              </View>
            </View>
            <View className="flex-1">
              <View className="mb-4">
                <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
                  Receiver
                </ThemedText>
                <View
                  className={`flex-row items-center p-3 rounded-lg ${
                    isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                  }`}
                >
                  <TextInput
                    className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                    placeholder="Enter receiver"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={receiverName}
                    onChangeText={setReceiverName}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Cargo Properties */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <Thermometer size={18} color="#3b82f6" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Cargo Properties
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <NumericInput
                label="Required Temp"
                value={requiredTemp}
                onChangeText={setRequiredTemp}
                placeholder="e.g. -42"
                suffix="°C"
              />
            </View>
            <View className="flex-1">
              <NumericInput
                label="API Gravity"
                value={apiGravity}
                onChangeText={setApiGravity}
                placeholder="e.g. 35"
              />
            </View>
            <View className="flex-1">
              <NumericInput
                label="Density @15°C"
                value={density15c}
                onChangeText={setDensity15c}
                placeholder="e.g. 850"
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <NumericInput
                label="Sulphur Content"
                value={sulphurPct}
                onChangeText={setSulphurPct}
                placeholder="e.g. 0.5"
                suffix="%"
              />
            </View>
            <View className="flex-1">
              <NumericInput
                label="Water Content"
                value={waterContentPct}
                onChangeText={setWaterContentPct}
                placeholder="e.g. 0.1"
                suffix="%"
              />
            </View>
          </View>
        </View>

        {/* Hazard Classification */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <AlertTriangle size={18} color="#f59e0b" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Hazard Classification
            </ThemedText>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <View className="mb-4">
                <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
                  UN Number
                </ThemedText>
                <View
                  className={`flex-row items-center p-3 rounded-lg ${
                    isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                  }`}
                >
                  <TextInput
                    className={`flex-1 text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                    placeholder="e.g. UN1978"
                    placeholderTextColor={isDark ? '#666' : '#999'}
                    value={unNumber}
                    onChangeText={setUnNumber}
                  />
                </View>
                <ThemedText className="text-xs text-gray-400 mt-1">
                  UN identification number for hazardous materials
                </ThemedText>
              </View>
            </View>

            <View className="flex-1">
              <View className="mb-4">
                <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
                  IMO Hazard Class
                </ThemedText>
                {IOS ? (
                  <Pressable
                    onPress={() =>
                      showSelection(
                        'Select IMO Class',
                        IMO_HAZARD_CLASSES.map((c) => c.label),
                        (opt) => {
                          const cls = IMO_HAZARD_CLASSES.find((c) => c.label === opt);
                          if (cls) setImoClass(cls.value);
                        }
                      )
                    }
                    className={`p-3 rounded-lg ${
                      isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'
                    }`}
                  >
                    <ThemedText
                      className={`text-[15px] ${isDark ? 'text-white' : 'text-black'}`}
                      numberOfLines={1}
                    >
                      {IMO_HAZARD_CLASSES.find((c) => c.value === imoClass)?.label || 'None'}
                    </ThemedText>
                    <ThemedText className="text-[#007AFF] text-[13px] mt-1.5">Edit</ThemedText>
                  </Pressable>
                ) : (
                  <Picker
                    selectedValue={imoClass}
                    onValueChange={(value) => setImoClass(value)}
                    style={{ backgroundColor: isDark ? '#2C2C2E' : '#f3f4f6' }}
                  >
                    {IMO_HAZARD_CLASSES.map((cls) => (
                      <Picker.Item key={cls.value} label={cls.label} value={cls.value} />
                    ))}
                  </Picker>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View
          className={`rounded-xl p-4 mb-5 ${
            isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'
          }`}
        >
          <View className="flex-row items-center gap-2 mb-3">
            <FileText size={18} color="#22c55e" />
            <ThemedText className="text-[15px] font-semibold text-gray-500">
              Instructions
            </ThemedText>
          </View>

          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Loading Instructions
            </ThemedText>
            <View className={`p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
              <TextInput
                className={`text-[17px] min-h-[80px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="Enter special loading instructions..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={loadingInstructions}
                onChangeText={setLoadingInstructions}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View>
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">
              Discharge Instructions
            </ThemedText>
            <View className={`p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
              <TextInput
                className={`text-[17px] min-h-[80px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="Enter special discharge instructions..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={dischargeInstructions}
                onChangeText={setDischargeInstructions}
                multiline
                textAlignVertical="top"
              />
            </View>
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
              : 'Add Cargo'}
          </ThemedText>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export default AddEditCargoSheet;
