import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import {
  Clock,
  Loader,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Scan,
  Database,
  Shield,
} from 'lucide-react-native';
import { useDocumentStatus } from '@/hooks/queries';
import { ProcessingStatus } from '@/types/documentProcessing';

interface StepConfig {
  icon: typeof Clock;
  color: string;
  message: string;
  subMessage: string;
}

export default function DocumentProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    documentId: string;
    documentName?: string;
  }>();

  const documentId = parseInt(params.documentId || '0');
  const [shouldNavigate, setShouldNavigate] = useState(false);

  const { data: status, isLoading, error } = useDocumentStatus(documentId, {
    onCompleted: () => setShouldNavigate(true),
    onFailed: (error) => console.error('Processing failed:', error),
  });

  const progressWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const rotateValue = useSharedValue(0);

  // Animate progress bar
  useEffect(() => {
    if (status?.progress) {
      progressWidth.value = withTiming(status.progress, { duration: 300 });
    }
  }, [status?.progress]);

  // Pulse and rotate animation during processing
  useEffect(() => {
    if (status?.status === 'PROCESSING') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      rotateValue.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [status?.status]);

  // Navigate when complete
  useEffect(() => {
    if (shouldNavigate && (status?.status === 'COMPLETED' || status?.status === 'REVIEW_REQUIRED')) {
      const timer = setTimeout(() => {
        router.replace({
          pathname: '/document-processing/review',
          params: {
            documentId: params.documentId,
            documentName: params.documentName,
          },
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldNavigate, status?.status]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const loaderStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateValue.value}deg` }],
  }));

  const getStatusConfig = (): StepConfig => {
    switch (status?.status) {
      case 'PENDING':
        return {
          icon: Clock,
          color: '#f59e0b',
          message: 'Queued for processing...',
          subMessage: 'Your document is waiting in the queue',
        };
      case 'PROCESSING':
        return {
          icon: Loader,
          color: '#3b82f6',
          message: status.ocrCompleted
            ? 'Extracting data fields...'
            : 'Running OCR analysis...',
          subMessage: `${status.extractedFieldsCount || 0} fields found so far`,
        };
      case 'COMPLETED':
        return {
          icon: CheckCircle,
          color: '#22c55e',
          message: 'Processing complete!',
          subMessage: `${status.extractedFieldsCount} fields extracted with ${status.averageConfidence?.toFixed(0)}% confidence`,
        };
      case 'REVIEW_REQUIRED':
        return {
          icon: AlertTriangle,
          color: '#f59e0b',
          message: 'Review required',
          subMessage: 'Some fields need your attention',
        };
      case 'FAILED':
        return {
          icon: XCircle,
          color: '#ef4444',
          message: 'Processing failed',
          subMessage: status.errorMessage || 'An error occurred during processing',
        };
      default:
        return {
          icon: FileText,
          color: '#6b7280',
          message: 'Loading...',
          subMessage: '',
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  const isProcessingStep = (step: 'upload' | 'ocr' | 'extraction' | 'validation'): 'completed' | 'active' | 'pending' => {
    if (!status) return 'pending';

    switch (step) {
      case 'upload':
        return 'completed';
      case 'ocr':
        if (status.ocrCompleted) return 'completed';
        if (status.status === 'PROCESSING' && !status.ocrCompleted) return 'active';
        return 'pending';
      case 'extraction':
        if (status.extractionCompleted) return 'completed';
        if (status.status === 'PROCESSING' && status.ocrCompleted) return 'active';
        return 'pending';
      case 'validation':
        if (status.status === 'COMPLETED' || status.status === 'REVIEW_REQUIRED') return 'completed';
        if (status.extractionCompleted && status.status === 'PROCESSING') return 'active';
        return 'pending';
    }
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black justify-center px-6">
        <View className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 items-center shadow-lg">
          <XCircle size={48} color="#ef4444" />
          <Text className="text-xl font-bold text-red-500 mt-4">Connection Error</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
            Unable to check processing status. Please try again.
          </Text>
          <TouchableOpacity
            className="mt-6 px-8 py-3 bg-blue-500 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black justify-center px-6">
      <View className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 items-center shadow-lg">
        {/* Status Icon */}
        <Animated.View style={status?.status === 'PROCESSING' ? loaderStyle : iconStyle}>
          <StatusIcon size={64} color={config.color} />
        </Animated.View>

        {/* Status Message */}
        <Text
          className="text-xl font-bold mt-5 text-center"
          style={{ color: config.color }}
        >
          {config.message}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2">
          {config.subMessage}
        </Text>

        {/* Progress Bar */}
        {(status?.status === 'PENDING' || status?.status === 'PROCESSING') && (
          <View className="w-full mt-6">
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <Animated.View
                className="h-full rounded-full"
                style={[progressBarStyle, { backgroundColor: config.color }]}
              />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 text-right mt-2">
              {status?.progress || 0}%
            </Text>
          </View>
        )}

        {/* Processing Steps */}
        {(status?.status === 'PENDING' || status?.status === 'PROCESSING') && (
          <View className="w-full mt-6 flex-row justify-between">
            <ProcessingStep
              icon={FileText}
              label="Upload"
              status={isProcessingStep('upload')}
            />
            <ProcessingStep
              icon={Scan}
              label="OCR"
              status={isProcessingStep('ocr')}
            />
            <ProcessingStep
              icon={Database}
              label="Extract"
              status={isProcessingStep('extraction')}
            />
            <ProcessingStep
              icon={Shield}
              label="Validate"
              status={isProcessingStep('validation')}
            />
          </View>
        )}

        {/* Stats when complete */}
        {(status?.status === 'COMPLETED' || status?.status === 'REVIEW_REQUIRED') && (
          <View className="flex-row items-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 w-full justify-center">
            <View className="items-center px-6">
              <Text className="text-3xl font-bold text-blue-500">
                {status.extractedFieldsCount}
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">Fields</Text>
            </View>
            <View className="w-px h-10 bg-gray-200 dark:bg-gray-700" />
            <View className="items-center px-6">
              <Text className="text-3xl font-bold text-blue-500">
                {status.averageConfidence?.toFixed(0)}%
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">Confidence</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        {status?.status === 'FAILED' && (
          <TouchableOpacity
            className="mt-6 px-8 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
            onPress={() => router.back()}
          >
            <Text className="text-blue-500 font-semibold">Try Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Document Name Footer */}
      <Text className="text-xs text-gray-400 text-center mt-5" numberOfLines={1}>
        {params.documentName || `Document #${documentId}`}
      </Text>
    </SafeAreaView>
  );
}

interface ProcessingStepProps {
  icon: typeof Clock;
  label: string;
  status: 'completed' | 'active' | 'pending';
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({ icon: Icon, label, status }) => {
  const getColors = () => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-green-500', text: 'text-green-500', iconColor: '#fff' };
      case 'active':
        return { bg: 'border-2 border-blue-500 bg-white dark:bg-transparent', text: 'text-blue-500', iconColor: '#3b82f6' };
      default:
        return { bg: 'border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent', text: 'text-gray-400', iconColor: '#9ca3af' };
    }
  };

  const colors = getColors();

  return (
    <View className="items-center flex-1">
      <View className={`w-8 h-8 rounded-full items-center justify-center ${colors.bg}`}>
        {status === 'completed' ? (
          <CheckCircle size={16} color="#fff" />
        ) : (
          <Icon size={14} color={colors.iconColor} />
        )}
      </View>
      <Text className={`text-xs mt-1 ${colors.text}`}>{label}</Text>
    </View>
  );
};
