import React, { useMemo } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Keyboard,
  ActionSheetIOS,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common';
import { Camera, Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { CreateVesselInput } from '@/types';
import * as ImagePicker from 'expo-image-picker';



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

  const showSelection = (title: string, options: string[], onSelect: (opt: string) => void) => {
    if (Platform.OS === 'ios') {
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
    } else {
      // Android simple native alert
      Alert.alert(
        title,
        'Select an option',
        (options.map(opt => ({
          text: opt,
          onPress: () => onSelect(opt),
        })) as { text: string; onPress: () => void; style?: 'cancel' | 'default' | 'destructive' }[]).concat([{ text: 'Cancel', style: 'cancel', onPress: () => { } }]),
        { cancelable: true }
      );
    }
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      if (useCamera) {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        setVesselPictureUrl(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const showImageSelection = () => {
    const options = ['Take Photo', 'Choose from Library'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...options, 'Cancel'],
          cancelButtonIndex: 2,
          title: 'Vessel Photo',
        },
        (buttonIndex) => {
          if (buttonIndex === 0) pickImage(true);
          if (buttonIndex === 1) pickImage(false);
        }
      );
    } else {
      Alert.alert(
        'Vessel Photo',
        'Select an option',
        [
          { text: 'Take Photo', onPress: () => pickImage(true) },
          { text: 'Choose from Library', onPress: () => pickImage(false) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
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

      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Vessel Details Section */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <ThemedText style={styles.sectionHeader}>Vessel Details</ThemedText>

          {/* Vessel Name */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>Vessel Name</ThemedText>
            <View style={[styles.input, isDark && styles.inputDark, { flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={{ fontSize: 17, color: isDark ? '#FFF' : '#000', minWidth: 100 }}>Name</ThemedText>
              <TextInput
                style={[styles.nativeInput, isDark && { color: '#FFF' }]}
                placeholder="Enter name"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={vesselName}
                onChangeText={setVesselName}
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {/* IMO Number */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>IMO Number</ThemedText>
            <View style={[styles.input, isDark && styles.inputDark, { flexDirection: 'row', alignItems: 'center' }]}>
              <ThemedText style={{ fontSize: 17, color: isDark ? '#FFF' : '#000', minWidth: 100 }}>IMO</ThemedText>
              <TextInput
                style={[styles.nativeInput, isDark && { color: '#FFF' }]}
                placeholder="7-digit number"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={imoNumber}
                onChangeText={text => {
                  // Only allow numbers
                  const numeric = text.replace(/[^0-9]/g, '');
                  if (numeric.length <= 7) setImoNumber(numeric);
                }}
                keyboardType="number-pad"
                maxLength={7}
              />
            </View>
          </View>
          {imoNumber.length > 0 && imoNumber.length !== 7 && (
            <ThemedText style={styles.hint}>IMO must be exactly 7 digits</ThemedText>
          )}
          {existingImos.includes(imoNumber) && imoNumber.length === 7 && (
            <ThemedText style={[styles.hint, { color: '#ef4444' }]}>
              This IMO already exists
            </ThemedText>
          )}
        </View>

        {/* Classification Section */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <ThemedText style={styles.sectionHeader}>Classification</ThemedText>

          {/* Vessel Type */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>Vessel Type</ThemedText>
            <Pressable
              onPress={() => showSelection('Select Vessel Type', [...VESSEL_TYPES], (opt) => setVesselType(opt as VesselType))}
              style={[styles.input, isDark && styles.inputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            >
              <ThemedText style={{ fontSize: 17, color: isDark ? '#FFF' : '#000' }}>{vesselType}</ThemedText>
              <ThemedText style={{ color: '#007AFF', fontSize: 17 }}>Edit</ThemedText>
            </Pressable>
          </View>

          {/* Vessel Subtype */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>Subtype</ThemedText>
            <Pressable
              onPress={() => showSelection('Select Subtype', SUBTYPES[vesselType], (opt) => setVesselSubtype(opt))}
              style={[styles.input, isDark && styles.inputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            >
              <ThemedText style={{ fontSize: 17, color: isDark ? '#FFF' : '#000' }}>{vesselSubtype}</ThemedText>
              <ThemedText style={{ color: '#007AFF', fontSize: 17 }}>Edit</ThemedText>
            </Pressable>
          </View>

          {/* Vessel Picture */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.label}>Vessel Photo</ThemedText>
            <Pressable
              onPress={showImageSelection}
              style={[styles.input, isDark && styles.inputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
            >
              <ThemedText style={{ fontSize: 17, color: isDark ? '#FFF' : '#000' }}>Photo</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {vesselPictureUrl ? (
                  <Image
                    source={{ uri: vesselPictureUrl }}
                    style={{ width: 32, height: 32, borderRadius: 4, marginRight: 8 }}
                  />
                ) : null}
                <ThemedText style={{ color: '#007AFF', fontSize: 17 }}>{vesselPictureUrl ? 'Edit' : 'Add'}</ThemedText>
              </View>
            </Pressable>
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
    </BottomSheetModal >
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
    paddingBottom: 40,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
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
    backgroundColor: '#F2F2F7', // Changed from '#FFF' to light gray for better contrast in white section
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    // Borders handled by container if needed, but for native rows usually just background
  },
  inputDark: {
    backgroundColor: '#2C2C2E', // Changed from '#1C1C1E' to lighter dark gray for contrast
    color: '#FFF',
  },
  nativeInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 17,
    padding: 0,
    color: '#000',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
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
