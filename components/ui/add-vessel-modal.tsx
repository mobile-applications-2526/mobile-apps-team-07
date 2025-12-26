import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Keyboard,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Camera, ChevronDown, Check, ChevronUp } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { useColorScheme } from 'nativewind';
import { CreateVesselInput } from '@/types';

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
  onCreate: (vessel: CreateVesselInput) => void;
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
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['60%', '90%'], []);

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
  const [touched, setTouched] = useState({
    vesselName: false,
    imoNumber: false,
    type: false,
    vesselSubtype: false,
  });

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
      // Reset form logic when modal closes
      const timer = setTimeout(() => {
        setVesselName('');
        setImoNumber('');
        setVesselType('');
        setVesselSubtype('');
        setVesselPictureUrl(null);
        setImoError(null);
        setTouched({ vesselName: false, imoNumber: false, type: false, vesselSubtype: false });
        setTypeDropdownOpen(false);
        setSubtypeDropdownOpen(false);
      }, 300); // Wait for animation to finish
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    if (vesselType) {
      setVesselSubtype('');
      setTouched(prev => ({ ...prev, vesselSubtype: false }));
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
    setImoNumber(cleaned);
    if (touched.imoNumber) {
      setImoError(validateImo(cleaned));
    }
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

  const isFormValid =
    vesselName.trim().length > 0 &&
    imoNumber.length === 7 &&
    !imoError &&
    vesselType !== '' &&
    vesselSubtype !== '';

  const handleCreate = () => {
    if (!isFormValid || isCreating) return;
    onCreate({
      vesselName: vesselName.trim(),
      imoNumber,
      vesselType,
      vesselSubtype,
      vesselPictureUrl,
    });
  };

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backdropComponent={(props) => (<BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />)}
      backgroundStyle={{ backgroundColor: isDark ? '#151718' : '#F2F2F7' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#404040' : '#e5e7eb' }}
      onDismiss={onCancel}
    >
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Add New Vessel</ThemedText>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Photo Upload */}
        <TouchableOpacity
          style={[styles.imageButton, isDark && styles.imageButtonDark]}
          onPress={() => console.log('Image picker')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.7 }}>
            <Camera size={18} color="#3b82f6" />
            <ThemedText style={{ fontSize: 14, color: '#3b82f6' }}>
              Upload Photo
            </ThemedText>
          </View>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={{ gap: 20 }}>
          {/* Name Input */}
          <View>
            <ThemedText style={styles.label}>
              Vessel Name
            </ThemedText>
            <TextInput
              style={[
                styles.iosInput,
                isDark && styles.iosInputDark
              ]}
              placeholder="e.g. MT Her Majesty"
              placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
              value={vesselName}
              onChangeText={setVesselName}
              autoCapitalize="words"
            />
          </View>

          {/* IMO Input */}
          <View>
            <ThemedText style={styles.label}>
              IMO Number
            </ThemedText>
            <TextInput
              style={[
                styles.iosInput,
                isDark && styles.iosInputDark,
                (imoError && touched.imoNumber) ? { borderWidth: 1, borderColor: '#ef4444' } : {}
              ]}
              placeholder="7-digit number"
              placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
              value={imoNumber}
              onChangeText={handleImoChange}
              onBlur={handleImoBlur}
              keyboardType="numeric"
              maxLength={7}
            />
            {imoError && touched.imoNumber && (
              <ThemedText style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
                {imoError}
              </ThemedText>
            )}
          </View>

          {/* Classification Dropdowns */}
          <View>
            <ThemedText style={styles.label}>
              Classification
            </ThemedText>

            {/* Main Type */}
            <Pressable
              onPress={() => {
                setTypeDropdownOpen(!typeDropdownOpen);
                setSubtypeDropdownOpen(false);
                Keyboard.dismiss();
              }}
              style={[
                styles.iosInput,
                isDark && styles.iosInputDark,
                { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
              ]}
            >
              <ThemedText style={{ fontSize: 17, color: vesselType ? (isDark ? '#FFF' : '#000') : (isDark ? '#5c5c5e' : '#aeaeb2') }}>
                {vesselType || 'Select Type'}
              </ThemedText>
              {typeDropdownOpen ? (
                <ChevronUp size={18} color={isDark ? '#999' : '#666'} />
              ) : (
                <ChevronDown size={18} color={isDark ? '#999' : '#666'} />
              )}
            </Pressable>

            {/* Type List */}
            {typeDropdownOpen && (
              <View
                style={[styles.dropdownList, isDark && styles.dropdownListDark]}
              >
                {VESSEL_TYPES.map((type, index) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.dropdownItem,
                      index !== VESSEL_TYPES.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? '#2C2C2E' : '#e5e7eb'
                      }
                    ]}
                    onPress={() => handleTypeSelect(type)}
                  >
                    <ThemedText style={{ fontSize: 15 }}>{type}</ThemedText>
                    {vesselType === type && <Check size={16} color="#3b82f6" />}
                  </Pressable>
                ))}
              </View>
            )}

            {/* Subtype Selector */}
            {vesselType && (
              <View style={{ marginTop: 12 }}>
                <Pressable
                  onPress={() => {
                    setSubtypeDropdownOpen(!subtypeDropdownOpen);
                    setTypeDropdownOpen(false);
                    Keyboard.dismiss();
                  }}
                  style={[
                    styles.iosInput,
                    isDark && styles.iosInputDark,
                    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }
                  ]}
                >
                  <ThemedText style={{ fontSize: 17, color: vesselSubtype ? (isDark ? '#FFF' : '#000') : (isDark ? '#5c5c5e' : '#aeaeb2') }}>
                    {vesselSubtype || 'Select Subtype'}
                  </ThemedText>
                  {subtypeDropdownOpen ? (
                    <ChevronUp size={18} color={isDark ? '#999' : '#666'} />
                  ) : (
                    <ChevronDown size={18} color={isDark ? '#999' : '#666'} />
                  )}
                </Pressable>

                {/* Subtype List */}
                {subtypeDropdownOpen && (
                  <View
                    style={[styles.dropdownList, isDark && styles.dropdownListDark]}
                  >
                    {SUBTYPES[vesselType].map((sub, index) => (
                      <Pressable
                        key={sub}
                        style={[
                          styles.dropdownItem,
                          index !== SUBTYPES[vesselType].length - 1 && {
                            borderBottomWidth: 1,
                            borderBottomColor: isDark ? '#2C2C2E' : '#e5e7eb'
                          }
                        ]}
                        onPress={() => handleSubtypeSelect(sub)}
                      >
                        <ThemedText style={{ fontSize: 15 }}>{sub}</ThemedText>
                        {vesselSubtype === sub && <Check size={16} color="#3b82f6" />}
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Create Button */}
        <Pressable
          onPress={handleCreate}
          disabled={!isFormValid || isCreating}
          style={[
            styles.iosSaveButton,
            (!isFormValid || isCreating) && { opacity: 0.7 }
          ]}
        >
          {isCreating ? (
            <ActivityIndicator color="#000" />
          ) : (
            <ThemedText style={styles.iosSaveButtonText}>
              Create Vessel
            </ThemedText>
          )}
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageButton: {
    height: 80,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderRadius: 10,
  },
  imageButtonDark: {
    borderColor: '#4b5563',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    color: '#666',
    marginLeft: 4,
  },
  iosInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    color: '#000',
  },
  iosInputDark: {
    backgroundColor: '#1C1C1E',
    color: '#FFF',
  },
  dropdownList: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    marginTop: 8,
    overflow: 'hidden',
  },
  dropdownListDark: {
    backgroundColor: '#1C1C1E',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iosSaveButton: {
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 20,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iosSaveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddVesselModal;
