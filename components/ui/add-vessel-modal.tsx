import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Camera, ChevronDown, Check, ChevronUp, Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

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

  // Animation for drag gesture
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          // Dismiss modal
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onCancel();
          });
        } else {
          // Snap back
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 10,
          }).start();
        }
      },
    })
  ).current;

  // Reset animation when modal opens
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible]);

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

  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setName('');
      setImo('');
      setVesselType('');
      setSubtype('');
      setImage(undefined);
      setImoError(null);
      setTouched({ name: false, imo: false, type: false, subtype: false });
      setTypeDropdownOpen(false);
      setSubtypeDropdownOpen(false);
    }
  }, [visible]);

  // Reset subtype when vessel type changes
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
    // Automatically open subtype if type is selected
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

  const placeholderColor = isDark ? '#9ca3af' : '#6b7280';

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
          <View className="flex-1 justify-end bg-black/60">
            <TouchableOpacity 
              className="absolute inset-0"
              activeOpacity={1}
              onPress={onCancel}
            />
            
            {/* Modal Content */}
            <Animated.View 
              className="bg-white dark:bg-[#1c1c1e] rounded-t-[28px] overflow-hidden shadow-2xl"
              style={{ 
                maxHeight: '92%',
                transform: [{ translateY }],
              }}
            >
              {/* Drag Handle */}
              <View 
                {...panResponder.panHandlers}
                className="items-center pt-3 pb-2"
              >
                <View className="w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
              </View>

              {/* Header */}
              <View className="px-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                <ThemedText type="subtitle" className="text-xl text-center">
                  New Vessel
                </ThemedText>
              </View>

              <ScrollView 
                className="px-6 pt-4"
                contentContainerStyle={{ paddingBottom: 24 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
              >
                {/* Photo Upload */}
                <TouchableOpacity
                  className="h-32 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 items-center justify-center bg-gray-50 dark:bg-gray-800/50 mb-6 active:opacity-70"
                  onPress={() => console.log('Image picker')}
                >
                  <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mb-2">
                    <Camera size={24} color="#3b82f6" />
                  </View>
                  <ThemedText className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Upload Vessel Photo
                  </ThemedText>
                </TouchableOpacity>

                {/* Form Fields */}
                <View className="gap-5">
                  {/* Name */}
                  <View className="gap-2">
                    <ThemedText className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                      Vessel Name
                    </ThemedText>
                    <TextInput
                      className="h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-base text-gray-900 dark:text-white"
                      placeholder="e.g. MT Her Majesty"
                      placeholderTextColor={placeholderColor}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* IMO */}
                  <View className="gap-2">
                    <ThemedText className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                      IMO Number
                    </ThemedText>
                    <TextInput
                      className={`h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/80 border text-base text-gray-900 dark:text-white ${
                        imoError ? 'border-red-500 bg-red-50/50' : 'border-gray-200 dark:border-gray-700'
                      }`}
                      placeholder="7-digit number"
                      placeholderTextColor={placeholderColor}
                      value={imo}
                      onChangeText={handleImoChange}
                      onBlur={handleImoBlur}
                      keyboardType="numeric"
                      maxLength={7}
                    />
                    {imoError && touched.imo && (
                      <ThemedText className="text-xs text-red-500 ml-1">
                        {imoError}
                      </ThemedText>
                    )}
                  </View>

                  {/* Type Selection (Accordion Style) */}
                  <View className="gap-2">
                    <ThemedText className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                      Classification
                    </ThemedText>
                    
                    {/* Main Type */}
                    <TouchableOpacity
                      onPress={() => {
                        setTypeDropdownOpen(!typeDropdownOpen);
                        setSubtypeDropdownOpen(false);
                        Keyboard.dismiss();
                      }}
                      className="h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex-row items-center justify-between"
                    >
                      <ThemedText className={vesselType ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                        {vesselType || 'Select Vessel Type'}
                      </ThemedText>
                      {typeDropdownOpen ? (
                        <ChevronUp size={20} color={placeholderColor} />
                      ) : (
                        <ChevronDown size={20} color={placeholderColor} />
                      )}
                    </TouchableOpacity>

                    {/* Type Options */}
                    {typeDropdownOpen && (
                      <View className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden mt-1 shadow-sm">
                        {VESSEL_TYPES.map((type, index) => (
                          <TouchableOpacity
                            key={type}
                            className={`p-4 flex-row justify-between items-center ${
                              index !== VESSEL_TYPES.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                            }`}
                            onPress={() => handleTypeSelect(type)}
                          >
                            <ThemedText>{type}</ThemedText>
                            {vesselType === type && <Check size={18} color="#3b82f6" />}
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Subtype (Only visible if type selected) */}
                    {vesselType && (
                      <View className="mt-2">
                        <TouchableOpacity
                          onPress={() => {
                            setSubtypeDropdownOpen(!subtypeDropdownOpen);
                            setTypeDropdownOpen(false);
                            Keyboard.dismiss();
                          }}
                          className="h-12 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex-row items-center justify-between"
                        >
                          <ThemedText className={subtype ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                            {subtype || `Select ${vesselType.split(' ')[0]} Type`}
                          </ThemedText>
                          {subtypeDropdownOpen ? (
                            <ChevronUp size={20} color={placeholderColor} />
                          ) : (
                            <ChevronDown size={20} color={placeholderColor} />
                          )}
                        </TouchableOpacity>

                        {/* Subtype Options */}
                        {subtypeDropdownOpen && (
                          <View className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden mt-1 shadow-sm">
                            {SUBTYPES[vesselType].map((sub, index) => (
                              <TouchableOpacity
                                key={sub}
                                className={`p-4 flex-row justify-between items-center ${
                                  index !== SUBTYPES[vesselType].length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                                }`}
                                onPress={() => handleSubtypeSelect(sub)}
                              >
                                <ThemedText>{sub}</ThemedText>
                                {subtype === sub && <Check size={18} color="#3b82f6" />}
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
                className="px-6 pt-4 pb-2 bg-white dark:bg-[#1c1c1e]"
                style={{ paddingBottom: Math.max(insets.bottom, 16) }}
              >
                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={!isFormValid || isCreating}
                  className={`h-14 rounded-2xl flex-row items-center justify-center gap-2 ${
                    isFormValid && !isCreating 
                      ? 'bg-blue-500 active:bg-blue-600' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ship size={20} color={isFormValid ? '#fff' : isDark ? '#9ca3af' : '#6b7280'} />
                      <ThemedText 
                        className={`font-semibold text-base ${
                          isFormValid ? 'text-white' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        Add to Fleet
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default AddVesselModal;