import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Camera, ChevronDown, Check, ChevronUp } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { useColorScheme } from 'nativewind';
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
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['60%', '90%'], []);

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

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      if (vessel) {
        setVesselName(vessel.vesselName || '');
        setImoNumber(vessel.imoNumber || '');
        setVesselType((vessel.vesselType as VesselType) || '');
        setVesselSubtype(vessel.vesselSubtype || '');
        setVesselPictureUrl(vessel.vesselPictureUrl || null);
      }
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, vessel]);

  React.useEffect(() => {
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
        <ThemedText style={styles.headerTitle}>Edit Vessel</ThemedText>
      </View>

      <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.imageButton, isDark && styles.imageButtonDark]}
          onPress={() => console.log('Image picker')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.7 }}>
            <Camera size={18} color="#3b82f6" />
            <ThemedText style={{ fontSize: 14, color: '#3b82f6' }}>Update Photo</ThemedText>
          </View>
        </TouchableOpacity>

        <View>
          <ThemedText style={styles.label}>Vessel Name</ThemedText>
          <TextInput
            style={[styles.iosInput, isDark && styles.iosInputDark]}
            placeholder="e.g. MT Her Majesty"
            placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
            value={vesselName}
            onChangeText={setVesselName}
            autoCapitalize="words"
          />
        </View>

        <View style={{ marginTop: 20 }}>
          <ThemedText style={styles.label}>IMO Number</ThemedText>
          <TextInput
            style={[styles.iosInput, isDark && styles.iosInputDark, imoError && { borderWidth: 1, borderColor: '#ef4444' }]}
            placeholder="7-digit number"
            placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
            value={imoNumber}
            onChangeText={handleImoChange}
            onBlur={handleImoBlur}
            keyboardType="numeric"
            maxLength={7}
          />
          {imoError && touched.imoNumber && <ThemedText style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{imoError}</ThemedText>}
        </View>

        <View style={{ marginTop: 20 }}>
          <ThemedText style={styles.label}>Classification</ThemedText>

          <Pressable
            onPress={() => { setTypeDropdownOpen(!typeDropdownOpen); setSubtypeDropdownOpen(false); }}
            style={[styles.iosInput, isDark && styles.iosInputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
          >
            <ThemedText style={{ fontSize: 17, color: vesselType ? (isDark ? '#FFF' : '#000') : (isDark ? '#5c5c5e' : '#aeaeb2') }}>
              {vesselType || 'Select Type'}
            </ThemedText>
            {typeDropdownOpen ? <ChevronUp size={18} color={isDark ? '#999' : '#666'} /> : <ChevronDown size={18} color={isDark ? '#999' : '#666'} />}
          </Pressable>

          {typeDropdownOpen && (
            <View style={[styles.dropdownList, isDark && styles.dropdownListDark]}>
              {VESSEL_TYPES.map((type, index) => (
                <Pressable
                  key={type}
                  style={[styles.dropdownItem, index !== VESSEL_TYPES.length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#e5e7eb' }]}
                  onPress={() => handleTypeSelect(type)}
                >
                  <ThemedText style={{ fontSize: 15 }}>{type}</ThemedText>
                  {vesselType === type && <Check size={16} color="#3b82f6" />}
                </Pressable>
              ))}
            </View>
          )}

          {vesselType && (
            <View style={{ marginTop: 12 }}>
              <Pressable
                onPress={() => { setSubtypeDropdownOpen(!subtypeDropdownOpen); setTypeDropdownOpen(false); }}
                style={[styles.iosInput, isDark && styles.iosInputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
              >
                <ThemedText style={{ fontSize: 17, color: vesselSubtype ? (isDark ? '#FFF' : '#000') : (isDark ? '#5c5c5e' : '#aeaeb2') }}>
                  {vesselSubtype || 'Select Subtype'}
                </ThemedText>
                {subtypeDropdownOpen ? <ChevronUp size={18} color={isDark ? '#999' : '#666'} /> : <ChevronDown size={18} color={isDark ? '#999' : '#666'} />}
              </Pressable>

              {subtypeDropdownOpen && (
                <View style={[styles.dropdownList, isDark && styles.dropdownListDark]}>
                  {SUBTYPES[vesselType].map((sub, index) => (
                    <Pressable
                      key={sub}
                      style={[styles.dropdownItem, index !== SUBTYPES[vesselType].length - 1 && { borderBottomWidth: 1, borderBottomColor: isDark ? '#2C2C2E' : '#e5e7eb' }]}
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

        <Pressable
          onPress={handleSave}
          disabled={!isFormValid || isSaving}
          style={[styles.iosSaveButton, (!isFormValid || isSaving) && { opacity: 0.7 }]}
        >
          {isSaving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <ThemedText style={styles.iosSaveButtonText}>Save</ThemedText>
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

export default EditVesselModal;
