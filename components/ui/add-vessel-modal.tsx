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

// Vessel type options
const VESSEL_TYPES = ['Gas Carrier', 'Chemical Tanker', 'MR Tanker'] as const;
type VesselType = typeof VESSEL_TYPES[number];

// Subtype options based on vessel type
const SUBTYPES: Record<VesselType, string[]> = {
  'Gas Carrier': ['LPG', 'LNG', 'LEG'],
  'Chemical Tanker': ['Type 1', 'Type 2', 'Type 3'],
  'MR Tanker': ['Clean', 'Dirty'],
};

interface AddVesselModalProps {
  visible: boolean;
  existingImos: string[];
  onCancel: () => void;
  onCreate: (vessel: {
    name: string;
    imo: string;
    type: string;
    subtype: string;
    image?: string;
  }) => void;
  isCreating?: boolean;
}

export function AddVesselModal({
  visible,
  existingImos,
  onCancel,
  onCreate,
  isCreating = false,
}: AddVesselModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Form state
  const [name, setName] = useState('');
  const [imo, setImo] = useState('');
  const [vesselType, setVesselType] = useState<VesselType | ''>('');
  const [subtype, setSubtype] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  
  // Dropdown state
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [subtypeDropdownOpen, setSubtypeDropdownOpen] = useState(false);
  
  // Validation state
  const [imoError, setImoError] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    name: false,
    imo: false,
    type: false,
    subtype: false,
  });

  // Reset form logic when modal closes
  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        setName('');
        setImo('');
        setVesselType('');
        setSubtype('');
        setImage(undefined);
        setImoError(null);
        setTouched({ name: false, imo: false, type: false, subtype: false });
        setTypeDropdownOpen(false);
        setSubtypeDropdownOpen(false);
      }, 300); // Wait for animation to finish
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (vesselType) {
      setSubtype('');
      setTouched(prev => ({ ...prev, subtype: false }));
    }
  }, [vesselType]);

  const validateImo = (value: string): string | null => {
    if (!value) return null;
    if (!/^\d{7}$/.test(value)) {
      return 'IMO must be 7 digits';
    }
    if (existingImos.includes(value)) {
      return 'IMO number already exists';
    }
    return null;
  };

  const handleImoChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 7);
    setImo(cleaned);
    if (touched.imo) {
      setImoError(validateImo(cleaned));
    }
  };

  const handleImoBlur = () => {
    setTouched(prev => ({ ...prev, imo: true }));
    setImoError(validateImo(imo));
  };

  const handleTypeSelect = (type: VesselType) => {
    setVesselType(type);
    setTypeDropdownOpen(false);
    setSubtypeDropdownOpen(true);
    setTouched(prev => ({ ...prev, type: true }));
  };

  const handleSubtypeSelect = (sub: string) => {
    setSubtype(sub);
    setSubtypeDropdownOpen(false);
    setTouched(prev => ({ ...prev, subtype: true }));
  };

  const isFormValid = 
    name.trim().length > 0 &&
    imo.length === 7 &&
    !imoError &&
    vesselType !== '' &&
    subtype !== '';

  const handleCreate = () => {
    if (!isFormValid || isCreating) return;
    onCreate({
      name: name.trim(),
      imo,
      type: vesselType,
      subtype,
      image,
    });
  };

  const placeholderColor = isDark ? '#6b7280' : '#9ca3af';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Backdrop */}
          <View className="flex-1 justify-end bg-black/50">
            <TouchableOpacity 
              className="absolute inset-0"
              activeOpacity={1}
              onPress={onCancel}
            />
            
            {/* Modal Content */}
            <View 
              className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl overflow-hidden w-full"
              style={{ 
                minHeight: '80%',
                maxHeight: '90%',
              }}
            >
              {/* Header */}
              <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1c1c1e]">
                <ThemedText type="subtitle" className="text-lg font-bold text-center">
                  Add New Vessel
                </ThemedText>
              </View>

              {/* Scrollable Form Body */}
              <ScrollView 
                className="flex-1 px-6 pt-5 bg-white dark:bg-[#1c1c1e]"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Photo Upload */}
                <TouchableOpacity
                  className="h-20 border border-dashed border-gray-300 dark:border-gray-600 items-center justify-center mb-5 active:opacity-70"
                  onPress={() => console.log('Image picker')}
                >
                  <View className="flex-row items-center gap-2 opacity-70">
                    <Camera size={18} color="#3b82f6" />
                    <ThemedText className="text-sm text-blue-500">
                      Upload Photo
                    </ThemedText>
                  </View>
                </TouchableOpacity>

                {/* Form Fields */}
                <View className="gap-4">
                  {/* Name Input */}
                  <View>
                    <ThemedText className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Vessel Name
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { color: isDark ? '#fff' : '#111', borderColor: isDark ? '#4b5563' : '#d1d5db' }
                      ]}
                      placeholder="e.g. MT Her Majesty"
                      placeholderTextColor={placeholderColor}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* IMO Input */}
                  <View>
                    <ThemedText className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      IMO Number
                    </ThemedText>
                    <TextInput
                      style={[
                        styles.input,
                        { 
                          color: isDark ? '#fff' : '#111', 
                          borderColor: imoError ? '#ef4444' : (isDark ? '#4b5563' : '#d1d5db')
                        }
                      ]}
                      placeholder="7-digit number"
                      placeholderTextColor={placeholderColor}
                      value={imo}
                      onChangeText={handleImoChange}
                      onBlur={handleImoBlur}
                      keyboardType="numeric"
                      maxLength={7}
                    />
                    {imoError && touched.imo && (
                      <ThemedText className="text-xs text-red-500 mt-1">
                        {imoError}
                      </ThemedText>
                    )}
                  </View>

                  {/* Classification Dropdowns */}
                  <View>
                    <ThemedText className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Classification
                    </ThemedText>
                    
                    {/* Main Type */}
                    <TouchableOpacity
                      onPress={() => {
                        setTypeDropdownOpen(!typeDropdownOpen);
                        setSubtypeDropdownOpen(false);
                        Keyboard.dismiss();
                      }}
                      style={[
                        styles.dropdown,
                        { borderColor: isDark ? '#4b5563' : '#d1d5db' }
                      ]}
                    >
                      <ThemedText className={`text-base ${vesselType ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {vesselType || 'Select Type'}
                      </ThemedText>
                      {typeDropdownOpen ? (
                        <ChevronUp size={18} color={placeholderColor} />
                      ) : (
                        <ChevronDown size={18} color={placeholderColor} />
                      )}
                    </TouchableOpacity>

                    {/* Type List */}
                    {typeDropdownOpen && (
                      <View 
                        style={[styles.dropdownList, { borderColor: isDark ? '#4b5563' : '#d1d5db' }]}
                        className="bg-white dark:bg-gray-800"
                      >
                        {VESSEL_TYPES.map((type, index) => (
                          <TouchableOpacity
                            key={type}
                            style={[
                              styles.dropdownItem,
                              index !== VESSEL_TYPES.length - 1 && { 
                                borderBottomWidth: 1, 
                                borderBottomColor: isDark ? '#4b5563' : '#e5e7eb' 
                              }
                            ]}
                            onPress={() => handleTypeSelect(type)}
                          >
                            <ThemedText className="text-sm">{type}</ThemedText>
                            {vesselType === type && <Check size={16} color="#3b82f6" />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Subtype Selector */}
                    {vesselType && (
                      <View className="mt-2">
                        <TouchableOpacity
                          onPress={() => {
                            setSubtypeDropdownOpen(!subtypeDropdownOpen);
                            setTypeDropdownOpen(false);
                            Keyboard.dismiss();
                          }}
                          style={[
                            styles.dropdown,
                            { borderColor: isDark ? '#4b5563' : '#d1d5db' }
                          ]}
                        >
                          <ThemedText className={`text-base ${subtype ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            {subtype || 'Select Subtype'}
                          </ThemedText>
                          {subtypeDropdownOpen ? (
                            <ChevronUp size={18} color={placeholderColor} />
                          ) : (
                            <ChevronDown size={18} color={placeholderColor} />
                          )}
                        </TouchableOpacity>

                        {/* Subtype List */}
                        {subtypeDropdownOpen && (
                          <View 
                            style={[styles.dropdownList, { borderColor: isDark ? '#4b5563' : '#d1d5db' }]}
                            className="bg-white dark:bg-gray-800"
                          >
                            {SUBTYPES[vesselType].map((sub, index) => (
                              <TouchableOpacity
                                key={sub}
                                style={[
                                  styles.dropdownItem,
                                  index !== SUBTYPES[vesselType].length - 1 && { 
                                    borderBottomWidth: 1, 
                                    borderBottomColor: isDark ? '#4b5563' : '#e5e7eb' 
                                  }
                                ]}
                                onPress={() => handleSubtypeSelect(sub)}
                              >
                                <ThemedText className="text-sm">{sub}</ThemedText>
                                {subtype === sub && <Check size={16} color="#3b82f6" />}
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>

              {/* Footer Button */}
              <View 
                className="px-6 pt-3 bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-gray-700"
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
              >
                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={!isFormValid || isCreating}
                  className={`h-12 rounded-xl flex-row items-center justify-center gap-2 ${
                    isFormValid && !isCreating 
                      ? 'bg-blue-600 active:bg-blue-700' 
                      : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <ThemedText 
                      className={`font-semibold text-base ${
                        isFormValid ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      Create Vessel
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    paddingHorizontal: 8,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: 4,
  },
  dropdown: {
    height: 40,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownList: {
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default AddVesselModal;