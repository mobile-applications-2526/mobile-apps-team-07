import React from 'react';
import {
  View, TextInput, Pressable, StyleSheet, ActionSheetIOS, Platform, Alert,
  Image,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common';
import { Camera } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Vessel } from '@/types';
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

interface EditVesselModalProps {
  visible: boolean;
  vessel: Vessel | null;
  onCancel: () => void;
  onSave: (vesselId: number, updates: Partial<Vessel>) => void;
  isSaving?: boolean;
}

export default function EditVesselModal({
  visible,
  vessel,
  onCancel,
  onSave,
  isSaving = false,
}: EditVesselModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['60%', '100%'], []);

  // Form State
  const [vesselName, setVesselName] = React.useState('');
  const [vesselType, setVesselType] = React.useState<VesselType>('Gas Carrier');
  const [vesselSubtype, setVesselSubtype] = React.useState('LPG');
  const [vesselPictureUrl, setVesselPictureUrl] = React.useState('');

  React.useEffect(() => {
    if (visible && vessel) {
      bottomSheetRef.current?.present();
      // Populate form with vessel data
      setVesselName(vessel.vesselName || '');

      // Normalize vessel type to ensure it's one of our valid types
      const normalizedType = VESSEL_TYPES.includes(vessel.vesselType as VesselType)
        ? (vessel.vesselType as VesselType)
        : 'Gas Carrier';
      setVesselType(normalizedType);

      const normalizedSubtype = vessel.vesselSubtype || SUBTYPES[normalizedType][0];
      setVesselSubtype(normalizedSubtype);

      setVesselPictureUrl(vessel.vesselPictureUrl || '');
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, vessel]);

  // Update subtype when type changes
  React.useEffect(() => {
    const validSubtypes = SUBTYPES[vesselType];
    if (!validSubtypes.includes(vesselSubtype)) {
      setVesselSubtype(validSubtypes[0]);
    }
  }, [vesselType, vesselSubtype]);

  // Validation
  const isFormValid = React.useMemo(() => {
    return vesselName.trim().length > 0;
  }, [vesselName]);

  const handleSubmit = () => {
    if (!isFormValid || isSaving || !vessel) return;

    onSave(vessel.id, {
      vesselName: vesselName.trim(),
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

  if (!vessel) return null;

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
        <ThemedText style={styles.headerTitle}>Edit Vessel</ThemedText>
      </View>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
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

        {/* IMO Number (Read-only) */}
        <View style={styles.fieldContainer}>
          <ThemedText style={styles.label}>IMO Number</ThemedText>
          <View style={[styles.input, isDark && styles.inputDark, styles.inputDisabled]}>
            <ThemedText style={{ opacity: 0.6 }}>{vessel.imoNumber}</ThemedText>
          </View>
          <ThemedText style={styles.hint}>IMO number cannot be changed</ThemedText>
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
            onPress={() => showSelection('Select Subtype', (SUBTYPES[vesselType] || SUBTYPES['Gas Carrier']), (opt) => setVesselSubtype(opt))}
            style={[styles.input, isDark && styles.inputDark, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}
          >
            <ThemedText style={{ fontSize: 17, color: isDark ? '#FFF' : '#000' }}>{vesselSubtype}</ThemedText>
            <ThemedText style={{ color: '#007AFF', fontSize: 17 }}>Edit</ThemedText>
          </Pressable>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={!isFormValid || isSaving}
          style={[
            styles.submitButton,
            (!isFormValid || isSaving) && styles.submitButtonDisabled,
          ]}
        >
          <ThemedText style={styles.submitButtonText}>
            {isSaving ? 'Saving...' : 'Save Changes'}
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
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    // Borders handled by container if needed, but for native rows usually just background
  },
  inputDark: {
    backgroundColor: '#1C1C1E',
    color: '#FFF',
  },
  nativeInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 17,
    padding: 0,
    color: '#000',
  },
  inputDisabled: {
    opacity: 0.6,
    justifyContent: 'center',
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
