import React, { useMemo } from 'react';
import { View, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common';
import { Camera, Check } from 'lucide-react-native';
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
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['60%', '100%'], []);

  // Form State
  const [vesselName, setVesselName] = React.useState('');
  const [imoNumber, setImoNumber] = React.useState('');
  const [vesselType, setVesselType] = React.useState<VesselType>('Gas Carrier');
  const [vesselSubtype, setVesselSubtype] = React.useState('LPG');
  const [vesselPictureUrl, setVesselPictureUrl] = React.useState('');

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      // Reset state on open
      setVesselName('');
      setImoNumber('');
      setVesselType('Gas Carrier');
      setVesselSubtype('LPG');
      setVesselPictureUrl('');
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  // Update subtype when type changes
  React.useEffect(() => {
    setVesselSubtype(SUBTYPES[vesselType][0]);
  }, [vesselType]);

  // Validation
  const isFormValid = React.useMemo(() => {
    if (!vesselName.trim()) return false;
    if (!imoNumber || imoNumber.length !== 7) return false;
    if (existingImos.includes(imoNumber)) return false;
    return true;
  }, [vesselName, imoNumber, existingImos]);

  const handleSubmit = () => {
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
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />}
      backgroundStyle={{ backgroundColor: isDark ? '#151718' : '#F2F2F7' }}
      handleIndicatorStyle={{ backgroundColor: isDark ? '#404040' : '#e5e7eb' }}
      onDismiss={onCancel}
    >
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Add New Vessel</ThemedText>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {/* Photo Upload */}
        <Pressable
          onPress={() => console.log('Image picker')}
          style={[styles.imageButton, isDark && styles.imageButtonDark]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: 0.7 }}>
            <Camera size={18} color="#3b82f6" />
            <ThemedText style={{ fontSize: 14, color: '#3b82f6' }}>
              Upload Photo
            </ThemedText>
          </View>
        </Pressable>

        {/* Vessel Name */}
        <View style={styles.fieldContainer}>
          <ThemedText style={styles.label}>Vessel Name</ThemedText>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={vesselName}
            onChangeText={setVesselName}
            placeholder="e.g. MT Her Majesty"
            placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
          />
        </View>

        {/* IMO Number */}
        <View style={styles.fieldContainer}>
          <ThemedText style={styles.label}>IMO Number</ThemedText>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={imoNumber}
            onChangeText={setImoNumber}
            placeholder="7 digits"
            placeholderTextColor={isDark ? '#5c5c5e' : '#aeaeb2'}
            keyboardType="numeric"
            maxLength={7}
          />
          {imoNumber.length > 0 && imoNumber.length !== 7 && (
            <ThemedText style={styles.hint}>IMO must be exactly 7 digits</ThemedText>
          )}
          {existingImos.includes(imoNumber) && imoNumber.length === 7 && (
            <ThemedText style={[styles.hint, { color: '#ef4444' }]}>
              This IMO already exists
            </ThemedText>
          )}
        </View>

        {/* Vessel Type */}
        <View style={styles.fieldContainer}>
          <ThemedText style={styles.label}>Vessel Type</ThemedText>
          <View style={[styles.segmentedControl, isDark && styles.segmentedControlDark]}>
            {VESSEL_TYPES.map((type) => (
              <Pressable
                key={type}
                onPress={() => setVesselType(type)}
                style={[
                  styles.segment,
                  vesselType === type && styles.segmentActive,
                  vesselType === type && !isDark && styles.segmentActiveLight,
                ]}
              >
                <ThemedText style={[
                  styles.segmentText,
                  vesselType === type && styles.segmentTextActive,
                  vesselType === type && !isDark && { color: '#000' }
                ]}>
                  {type}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Vessel Subtype */}
        <View style={styles.fieldContainer}>
          <ThemedText style={styles.label}>Subtype</ThemedText>
          <View style={[styles.segmentedControl, isDark && styles.segmentedControlDark]}>
            {SUBTYPES[vesselType].map((subtype) => (
              <Pressable
                key={subtype}
                onPress={() => setVesselSubtype(subtype)}
                style={[
                  styles.segment,
                  vesselSubtype === subtype && styles.segmentActive,
                  vesselSubtype === subtype && !isDark && styles.segmentActiveLight,
                ]}
              >
                <ThemedText style={[
                  styles.segmentText,
                  vesselSubtype === subtype && styles.segmentTextActive,
                  vesselSubtype === subtype && !isDark && { color: '#000' }
                ]}>
                  {subtype}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid || isCreating}
          style={[
            styles.submitButton,
            (!isFormValid || isCreating) && styles.submitButtonDisabled,
          ]}
        >
          <ThemedText style={styles.submitButtonText}>
            {isCreating ? 'Creating...' : 'Create Vessel'}
          </ThemedText>
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
    backgroundColor: '#f9fafb',
  },
  imageButtonDark: {
    borderColor: '#4b5563',
    backgroundColor: '#1f2937',
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
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#1C1C1E',
    color: '#FFF',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    padding: 2,
    gap: 4,
  },
  segmentedControlDark: {
    backgroundColor: '#1C1C1E',
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#3C3C3E',
  },
  segmentActiveLight: {
    backgroundColor: '#fff',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
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
    marginTop: 32,
    marginBottom: 20,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AddVesselModal;
