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
import { Camera, ChevronDown, Check, ChevronUp } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
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
        // Only trigger drag if moving down significantly
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > DISMISS_THRESHOLD || gestureState.vy > 0.5) {
          // Dismiss modal smoothly
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 250, // Slightly slower for smoothness
            useNativeDriver: true,
          }).start(() => {
            // FIX: Do NOT reset translateY here. 
            // Just trigger the close action. The reset happens in useEffect when it opens again.
            onCancel(); 
          });
        } else {
          // Snap back to top if threshold not met
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  // Reset animation ONLY when modal becomes visible
  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
      // Optional: Reset form state here if desired
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

  const placeholderColor = isDark ? '#9ca3af' : '#9ca3af';
  const borderColor = isDark ? 'border-gray-700' : 'border-gray-300';
  const inputBg = isDark ? 'bg-gray-800' : 'bg-white';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade" // Fade backing, slide content via Animated
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
            
            {/* Modal Content - Rounded Top Corners applied here */}
            <Animated.View 
              className="bg-white dark:bg-[#1c1c1e] rounded-t-3xl overflow-hidden w-full"
              style={{ 
                minHeight: '80%',
                maxHeight: '90%',
                transform: [{ translateY }],
              }}
            >
              {/* Drag Handle Area */}
              <View 
                {...panResponder.panHandlers}
                className="items-center pt-4 pb-2 bg-white dark:bg-[#1c1c1e] z-10"
              >
                <View className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              </View>

              {/* Header */}
              <View className="px-6 pb-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1c1c1e]">
                <ThemedText type="subtitle" className="text-lg font-bold text-center">
                  Add New Vessel
                </ThemedText>
              </View>

              {/* Scrollable Form Body - Flex 1 allows scrolling regardless of content size */}
              <ScrollView 
                className="flex-1 px-6 pt-5 bg-gray-50 dark:bg-[#1c1c1e]"
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {/* Photo Upload */}
                <TouchableOpacity
                  className={`h-24 rounded-xl border border-dashed ${borderColor} items-center justify-center bg-white dark:bg-gray-800/30 mb-6 active:opacity-70`}
                  onPress={() => console.log('Image picker')}
                >
                  <View className="flex-row items-center gap-2 opacity-70">
                    <Camera size={20} color="#3b82f6" />
                    <ThemedText className="text-sm text-blue-500 font-medium">
                      Upload Photo
                    </ThemedText>
                  </View>
                </TouchableOpacity>

                {/* Form Fields */}
                <View className="gap-5">
                  {/* Name Input */}
                  <View>
                    <ThemedText className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      Vessel Name
                    </ThemedText>
                    <TextInput
                      className={`h-11 px-3 rounded-lg border ${borderColor} ${inputBg} text-base text-gray-900 dark:text-white`}
                      placeholder="e.g. MT Her Majesty"
                      placeholderTextColor={placeholderColor}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>

                  {/* IMO Input */}
                  <View>
                    <ThemedText className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      IMO Number
                    </ThemedText>
                    <TextInput
                      className={`h-11 px-3 rounded-lg border ${inputBg} text-base text-gray-900 dark:text-white ${
                        imoError ? 'border-red-500' : borderColor
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
                      <ThemedText className="text-xs text-red-500 mt-1 ml-1">
                        {imoError}
                      </ThemedText>
                    )}
                  </View>

                  {/* Classification Dropdowns */}
                  <View>
                    <ThemedText className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">
                      Classification
                    </ThemedText>
                    
                    {/* Main Type */}
                    <TouchableOpacity
                      onPress={() => {
                        setTypeDropdownOpen(!typeDropdownOpen);
                        setSubtypeDropdownOpen(false);
                        Keyboard.dismiss();
                      }}
                      className={`h-11 px-3 rounded-lg border ${borderColor} ${inputBg} flex-row items-center justify-between`}
                    >
                      <ThemedText className={`text-base ${vesselType ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                        {vesselType || 'Select Type'}
                      </ThemedText>
                      {typeDropdownOpen ? (
                        <ChevronUp size={20} color={placeholderColor} />
                      ) : (
                        <ChevronDown size={20} color={placeholderColor} />
                      )}
                    </TouchableOpacity>

                    {/* Type List */}
                    {typeDropdownOpen && (
                      <View className={`border ${borderColor} ${inputBg} rounded-lg overflow-hidden mt-2 shadow-sm`}>
                        {VESSEL_TYPES.map((type, index) => (
                          <TouchableOpacity
                            key={type}
                            className={`p-3 flex-row justify-between items-center ${
                              index !== VESSEL_TYPES.length - 1 ? `border-b ${borderColor}` : ''
                            }`}
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
                      <View className="mt-3">
                        <TouchableOpacity
                          onPress={() => {
                            setSubtypeDropdownOpen(!subtypeDropdownOpen);
                            setTypeDropdownOpen(false);
                            Keyboard.dismiss();
                          }}
                          className={`h-11 px-3 rounded-lg border ${borderColor} ${inputBg} flex-row items-center justify-between`}
                        >
                          <ThemedText className={`text-base ${subtype ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                            {subtype || 'Select Subtype'}
                          </ThemedText>
                          {subtypeDropdownOpen ? (
                            <ChevronUp size={20} color={placeholderColor} />
                          ) : (
                            <ChevronDown size={20} color={placeholderColor} />
                          )}
                        </TouchableOpacity>

                        {/* Subtype List */}
                        {subtypeDropdownOpen && (
                          <View className={`border ${borderColor} ${inputBg} rounded-lg overflow-hidden mt-2 shadow-sm`}>
                            {SUBTYPES[vesselType].map((sub, index) => (
                              <TouchableOpacity
                                key={sub}
                                className={`p-3 flex-row justify-between items-center ${
                                  index !== SUBTYPES[vesselType].length - 1 ? `border-b ${borderColor}` : ''
                                }`}
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
                className="px-6 pt-3 bg-white dark:bg-[#1c1c1e] border-t border-gray-100 dark:border-gray-800"
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
              >
                <TouchableOpacity
                  onPress={handleCreate}
                  disabled={!isFormValid || isCreating}
                  className={`h-12 rounded-xl flex-row items-center justify-center gap-2 shadow-sm ${
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
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

export default AddVesselModal;