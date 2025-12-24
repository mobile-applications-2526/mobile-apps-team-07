import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
} from 'react-native';
import { Camera, ChevronDown, Check, ChevronUp } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Vessel } from '@/types';

// Vessel type options
const VESSEL_TYPES = ['Gas Carrier', 'Chemical Tanker', 'MR Tanker'] as const;
type VesselType = typeof VESSEL_TYPES[number];

// Subtype options based on vessel type
const SUBTYPES: Record<VesselType, string[]> = {
  'Gas Carrier': ['LPG', 'LNG', 'LEG'],
  'Chemical Tanker': ['Type 1', 'Type 2', 'Type 3'],
  'MR Tanker': ['Clean', 'Dirty'],
};

interface EditVesselModalProps {
  visible: boolean;
  vessel: Vessel | null;
  onCancel: () => void;
  onSave: (updated: { vesselName: string; imoNumber: string; vesselType: string; vesselSubtype: string; vesselPictureUrl: string | null; }) => void;
  isSaving?: boolean;
}

export function EditVesselModal({ visible, vessel, onCancel, onSave, isSaving = false }: EditVesselModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Form state
  const [vesselName, setVesselName] = useState('');
  const [imoNumber, setImoNumber] = useState('');
  const [vesselType, setVesselType] = useState<VesselType | ''>('');
  const [vesselSubtype, setVesselSubtype] = useState('');
  const [vesselPictureUrl, setVesselPictureUrl] = useState<string | null>(null);

  // Dropdown state
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [subtypeDropdownOpen, setSubtypeDropdownOpen] = useState(false);

  // Validation state
  const [imoError, setImoError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ vesselName: false, imoNumber: false, type: false, vesselSubtype: false });

  // Populate form when vessel changes
  useEffect(() => {
    if (vessel) {
      setVesselName(vessel.vesselName || '');
      setImoNumber(vessel.imoNumber || '');
      setVesselType((vessel.vesselType as VesselType) || '');
      setVesselSubtype(vessel.vesselSubtype || '');
      setVesselPictureUrl(vessel.vesselPictureUrl || null);
    }
  }, [vessel]);

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        setTouched({ vesselName: false, imoNumber: false, type: false, vesselSubtype: false });
        setTypeDropdownOpen(false);
        setSubtypeDropdownOpen(false);
        setImoError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // Do not automatically clear subtype on initial vesselType population.
  // Clearing of subtype is handled explicitly in handleTypeSelect when the user changes the type.

  const validateImo = (value: string): string | null => {
    if (!value) return null;
    if (!/^\d{7}$/.test(value)) return 'IMO must be 7 digits';
    return null;
  };

  const handleImoChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 7);
    setImoNumber(cleaned);
    if (touched.imoNumber) setImoError(validateImo(cleaned));
  };

  const handleImoBlur = () => {
    setTouched(prev => ({ ...prev, imoNumber: true }));
    setImoError(validateImo(imoNumber));
  };

  const handleTypeSelect = (type: VesselType) => {
    setVesselType(type);
    setTypeDropdownOpen(false);
    setSubtypeDropdownOpen(true);
    setTouched(prev => ({ ...prev, type: true }));
  };

  const handleSubtypeSelect = (sub: string) => {
    setVesselSubtype(sub);
    setSubtypeDropdownOpen(false);
    setTouched(prev => ({ ...prev, vesselSubtype: true }));
  };

  const isFormValid = vesselName.trim().length > 0 && imoNumber.length === 7 && !imoError && vesselType !== '';

  const handleSave = () => {
    if (!isFormValid || isSaving || !vessel) return;
    onSave({ vesselName: vesselName.trim(), imoNumber, vesselType: vesselType as string, vesselSubtype, vesselPictureUrl });
  };

  const placeholderColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 justify-end bg-black/50">
            <TouchableOpacity className="absolute inset-0" activeOpacity={1} onPress={onCancel} />

            <View className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl overflow-hidden w-full" style={{ minHeight: '60%', maxHeight: '90%' }}>
              <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c1e]">
                <ThemedText type="subtitle" className="text-lg font-bold text-center">Edit Vessel</ThemedText>
              </View>

              <ScrollView className="flex-1 px-6 pt-5 bg-white dark:bg-[#1c1c1e]" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
                <TouchableOpacity className="h-20 border border-dashed border-gray-300 dark:border-gray-600 items-center justify-center mb-5" onPress={() => console.log('Image picker')}>
                  <View className="flex-row items-center gap-2 opacity-70">
                    <Camera size={18} color="#3b82f6" />
                    <ThemedText className="text-sm text-blue-500">Update Photo</ThemedText>
                  </View>
                </TouchableOpacity>

                <View className="gap-4">
                  <View>
                    <ThemedText className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vessel Name</ThemedText>
                    <TextInput style={[styles.input, { color: isDark ? '#fff' : '#111', borderColor: isDark ? '#4b5563' : '#d1d5db' }]} placeholder="e.g. MT Her Majesty" placeholderTextColor={placeholderColor} value={vesselName} onChangeText={setVesselName} autoCapitalize="words" />
                  </View>

                  <View>
                    <ThemedText className="text-sm text-gray-600 dark:text-gray-400 mb-1">IMO Number</ThemedText>
                    <TextInput style={[styles.input, { color: isDark ? '#fff' : '#111', borderColor: imoError ? '#ef4444' : (isDark ? '#4b5563' : '#d1d5db') }]} placeholder="7-digit number" placeholderTextColor={placeholderColor} value={imoNumber} onChangeText={handleImoChange} onBlur={handleImoBlur} keyboardType="numeric" maxLength={7} />
                    {imoError && touched.imoNumber && <ThemedText className="text-xs text-red-500 mt-1">{imoError}</ThemedText>}
                  </View>

                  <View>
                    <ThemedText className="text-sm text-gray-600 dark:text-gray-400 mb-1">Classification</ThemedText>

                    <TouchableOpacity onPress={() => { setTypeDropdownOpen(!typeDropdownOpen); setSubtypeDropdownOpen(false); Keyboard.dismiss(); }} style={[styles.dropdown, { borderColor: isDark ? '#4b5563' : '#d1d5db' }]}> 
                      <ThemedText className={`text-base ${vesselType ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{vesselType || 'Select Type'}</ThemedText>
                      {typeDropdownOpen ? <ChevronUp size={18} color={placeholderColor} /> : <ChevronDown size={18} color={placeholderColor} />}
                    </TouchableOpacity>

                    {typeDropdownOpen && (
                      <View style={[styles.dropdownList, { borderColor: isDark ? '#4b5563' : '#d1d5db' }]} className="bg-white dark:bg-gray-800">
                        {VESSEL_TYPES.map((type, index) => (
                          <TouchableOpacity key={type} style={[styles.dropdownItem, index !== VESSEL_TYPES.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#4b5563' : '#e5e7eb' }]} onPress={() => handleTypeSelect(type)}>
                            <ThemedText className="text-sm">{type}</ThemedText>
                            {vesselType === type && <Check size={16} color="#3b82f6" />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {vesselType && (
                      <View className="mt-2">
                        <TouchableOpacity onPress={() => { setSubtypeDropdownOpen(!subtypeDropdownOpen); setTypeDropdownOpen(false); Keyboard.dismiss(); }} style={[styles.dropdown, { borderColor: isDark ? '#4b5563' : '#d1d5db' }]}> 
                          <ThemedText className={`text-base ${vesselSubtype ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{vesselSubtype || 'Select Subtype'}</ThemedText>
                          {subtypeDropdownOpen ? <ChevronUp size={18} color={placeholderColor} /> : <ChevronDown size={18} color={placeholderColor} />}
                        </TouchableOpacity>

                        {subtypeDropdownOpen && (
                          <View style={[styles.dropdownList, { borderColor: isDark ? '#4b5563' : '#d1d5db' }]} className="bg-white dark:bg-gray-800">
                            {SUBTYPES[vesselType].map((sub, index) => (
                              <TouchableOpacity key={sub} style={[styles.dropdownItem, index !== SUBTYPES[vesselType].length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#4b5563' : '#e5e7eb' }]} onPress={() => handleSubtypeSelect(sub)}>
                                <ThemedText className="text-sm">{sub}</ThemedText>
                                {vesselSubtype === sub && <Check size={16} color="#3b82f6" />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>

              <View className="px-6 pt-3 bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-gray-700" style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={onCancel} className="flex-1 h-12 rounded-xl items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <ThemedText className="font-semibold text-base text-gray-700 dark:text-gray-200">Cancel</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} disabled={!isFormValid || isSaving} className={`flex-1 h-12 rounded-xl items-center justify-center ${isFormValid && !isSaving ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'}`}>
                    {isSaving ? <ActivityIndicator color="#fff" /> : <ThemedText className={`font-semibold text-base ${isFormValid ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}>Save</ThemedText>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  input: { height: 40, paddingHorizontal: 8, fontSize: 15, borderWidth: 1, borderRadius: 4 },
  dropdown: { height: 40, paddingHorizontal: 8, borderWidth: 1, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dropdownList: { borderWidth: 1, borderRadius: 4, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});

export default EditVesselModal;
