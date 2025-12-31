import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  ActionSheetIOS,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ThemedText } from '@/components/common';
import { useColorScheme } from 'nativewind';
import { CreateVesselInput, VesselSubtype, VesselType } from '@/types';
import { VESSEL_TYPES, VESSEL_SUBTYPES } from '@/constants';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';

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

  const IOS = Platform.OS == 'ios';
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['60%', '100%'], []);

  // Form State
  const [vesselName, setVesselName] = useState('');
  const [imoNumber, setImoNumber] = useState('');
  const [vesselType, setVesselType] = useState<VesselType>('Gas Carrier');
  const [vesselSubtype, setVesselSubtype] = useState<VesselSubtype>('LPG');
  const [vesselPicture, setVesselPicture] = useState('');

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      // Reset state on open
      setVesselName('');
      setImoNumber('');
      setVesselType('Gas Carrier');
      setVesselSubtype('LPG');
      setVesselPicture('');
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  // Update subtype when type changes
  useEffect(() => {
    setVesselSubtype(VESSEL_SUBTYPES[vesselType][0]);
  }, [vesselType]);

  // Validation
  const isFormValid = useMemo(() => {
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
      vesselPicture,
    });
  };

  const showSelection = (title: string, options: string[], onSelect: (opt: string) => void) => {
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

  const pickImage = async (useCamera: boolean) => {
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: 'images',
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
        setVesselPicture(result.assets[0].uri);
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
      <View testID="add-vessel-modal" className="flex-row items-center justify-between px-4 py-3 border-b border-black/5">
        <ThemedText testID="add-vessel-title" className="text-lg font-semibold text-center flex-1">Add New Vessel</ThemedText>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Vessel Details Section */}
        <View className={`rounded-xl p-4 mb-5 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'}`}>
          <ThemedText className="text-[15px] font-semibold text-gray-500 mb-3">Vessel Details</ThemedText>

          {/* Vessel Name */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">Vessel Name</ThemedText>
            <View className={`flex-row items-center p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
              <ThemedText className={`text-[17px] min-w-[100px] ${isDark ? 'text-white' : 'text-black'}`}>
                Name
              </ThemedText>
              <TextInput
                testID="vessel-name-input"
                className={`flex-1 text-right text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
                placeholder="Enter name"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={vesselName}
                onChangeText={setVesselName}
                clearButtonMode="while-editing"
              />
            </View>
          </View>

          {/* IMO Number */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">IMO Number</ThemedText>
            <View className={`flex-row items-center p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}>
              <ThemedText className={`text-[17px] min-w-[100px] ${isDark ? 'text-white' : 'text-black'}`}>
                IMO
              </ThemedText>
              <TextInput
                testID="vessel-imo-input"
                className={`flex-1 text-right text-[17px] ${isDark ? 'text-white' : 'text-black'}`}
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
            <ThemedText testID="imo-length-error" className="text-xs text-gray-400 mt-1">IMO must be exactly 7 digits</ThemedText>
          )}
          {existingImos.includes(imoNumber) && imoNumber.length === 7 && (
            <ThemedText testID="imo-exists-error" className="text-xs text-red-500 mt-1">
              This IMO already exists
            </ThemedText>
          )}
        </View>

        {/* Classification Section */}
        <View className={`rounded-xl p-4 mb-5 ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-sm'}`}>
          <ThemedText className="text-[15px] font-semibold text-gray-500 mb-3">Classification</ThemedText>

          {/* Vessel Type */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">Vessel Type</ThemedText>
            {IOS?(
              <Pressable
                testID="vessel-type-picker"
                onPress={() => showSelection('Select Vessel Type', [...VESSEL_TYPES], (opt) => setVesselType(opt as VesselType))}
                className={`flex-row justify-between items-center p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}
              >
                <ThemedText className={`text-[17px] ${isDark ? 'text-white' : 'text-black'}`}>
                  {vesselType}
                </ThemedText>
                <ThemedText className="text-[#007AFF] text-[17px]">Edit</ThemedText>
              </Pressable>
            ):(
              <Picker
                testID="vessel-type-picker"
                selectedValue={vesselType}
                onValueChange={(value) => setVesselType(value)}
                className="w-full"
              >
                {VESSEL_TYPES.map((type, i) => (
                  <Picker.Item
                    key={i}
                    label={type}
                    value={type}
                  />
                ))}
              </Picker>
            ) }
          </View>

          {/* Vessel Subtype */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">Subtype</ThemedText>
            {IOS?(
              <Pressable
                testID="vessel-subtype-picker"
                onPress={() => showSelection('Select Subtype', VESSEL_SUBTYPES[vesselType], (opt) => setVesselSubtype(opt as VesselSubtype))}
                className={`flex-row justify-between items-center p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}
              >
                <ThemedText className={`text-[17px] ${isDark ? 'text-white' : 'text-black'}`}>
                  {vesselSubtype}
                </ThemedText>
                <ThemedText className="text-[#007AFF] text-[17px]">Edit</ThemedText>
              </Pressable>
            ):(
              <Picker
                testID="vessel-subtype-picker"
                selectedValue={vesselSubtype}
                onValueChange={(value) => setVesselSubtype(value)}
                className="w-full"
              >
                {VESSEL_SUBTYPES[vesselType].map((sub, i) => (
                  <Picker.Item
                    key={i}
                    label={sub}
                    value={sub}
                  />
                ))}
              </Picker>
            ) }
          </View>

          {/* Vessel Picture */}
          <View className="mb-4">
            <ThemedText className="text-[13px] font-medium mb-1.5 text-gray-500">Vessel Photo</ThemedText>
            <Pressable
              testID="vessel-photo-button"
              onPress={showImageSelection}
              className={`flex-row justify-between items-center p-3 rounded-lg ${isDark ? 'bg-[#2C2C2E]' : 'bg-gray-100'}`}
            >
              <ThemedText style={{ fontSize: 17, color: isDark ? '#FFF' : '#000' }}>Photo</ThemedText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {vesselPicture ? (
                  <Image
                    testID="vessel-photo-preview"
                    source={{ uri: vesselPicture }}
                    style={{ width: 32, height: 32, borderRadius: 4, marginRight: 8 }}
                  />
                ) : null}
                <ThemedText style={{ color: '#007AFF', fontSize: 17 }}>{vesselPicture ? 'Edit' : 'Add'}</ThemedText>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          testID="create-vessel-button"
          onPress={handleSubmit}
          disabled={!isFormValid || isCreating}
          className={`bg-white rounded-full py-3 w-full items-center mt-8 mb-5 shadow-lg ${(!isFormValid || isCreating) && 'opacity-50'}`}
        >
          <ThemedText className="text-black text-base font-bold">
            {isCreating ? 'Creating...' : 'Create Vessel'}
          </ThemedText>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

export default AddVesselModal;
