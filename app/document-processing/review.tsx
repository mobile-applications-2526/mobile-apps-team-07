import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Check,
  X,
  Edit3,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Ship,
  Map,
  Activity,
  Anchor,
  FileText,
  Calendar,
  Navigation,
  Package,
  File,
  Scan,
  Brain,
  FileSearch,
  Layers,
  PenTool,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import {
  useExtraction,
  useValidateField,
  useCommitExtraction,
  documentProcessingKeys,
} from '@/hooks/queries';
import {
  ExtractedField,
  ExtractionMethod,
  TABLE_LABELS,
  EXTRACTION_METHOD_LABELS,
} from '@/types/documentProcessing';

// Icon mapping for tables
const TABLE_ICONS: Record<string, typeof Ship> = {
  vessel: Ship,
  voyage: Map,
  vessel_status: Activity,
  voyage_port: Anchor,
  charter_base: FileText,
  tc_charter: Calendar,
  vc_charter: Navigation,
  cargo: Package,
  other: File,
};

// Icon mapping for extraction methods
const METHOD_ICONS: Record<ExtractionMethod, typeof Scan> = {
  OCR: Scan,
  TEXT_EXTRACTION: FileSearch,
  REGEX: FileSearch,
  ML_MODEL: Brain,
  TEMPLATE: Layers,
  MANUAL: PenTool,
};

// Format field name for display
const formatFieldName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
};

export default function ExtractionReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    documentId: string;
    documentName?: string;
  }>();

  const documentId = parseInt(params.documentId || '0');

  const {
    data: extraction,
    isLoading,
    refetch,
    isRefetching,
  } = useExtraction(documentId);

  const queryClient = useQueryClient();
  const validateMutation = useValidateField(documentId);
  const commitMutation = useCommitExtraction();

  const [expandedTables, setExpandedTables] = useState<Set<string>>(
    new Set(['vessel', 'charter_base'])
  );
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Group fields by target table
  const groupedFields = useMemo(() => {
    if (!extraction?.extractedFields) return {};

    return extraction.extractedFields.reduce((acc, field) => {
      const table = field.targetTable || 'other';
      if (!acc[table]) acc[table] = [];
      acc[table].push(field);
      return acc;
    }, {} as Record<string, ExtractedField[]>);
  }, [extraction?.extractedFields]);

  // Statistics
  const stats = useMemo(() => {
    const fields = extraction?.extractedFields || [];
    return {
      total: fields.length,
      validated: fields.filter((f) => f.validated).length,
      lowConfidence: fields.filter((f) => (f.confidenceScore ?? 0) < 70).length,
      averageConfidence: extraction?.averageConfidence || 0,
    };
  }, [extraction]);

  const toggleTable = useCallback((table: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(table)) {
        next.delete(table);
      } else {
        next.add(table);
      }
      return next;
    });
  }, []);

  const startEditing = (field: ExtractedField, fieldKey: string) => {
    setEditingFieldKey(fieldKey);
    setEditValue(field.fieldValue || '');
  };

  const cancelEditing = () => {
    setEditingFieldKey(null);
    setEditValue('');
  };

  const handleValidate = useCallback(
    async (field: ExtractedField, correctedValue: string | undefined, approved: boolean) => {
      const fieldId = field.id;

      // If field has no ID, update cache locally (backend bug workaround)
      if (fieldId === undefined || fieldId === null) {
        queryClient.setQueryData(
          documentProcessingKeys.extraction(documentId),
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              extractedFields: old.extractedFields.map((f: ExtractedField) =>
                f.fieldName === field.fieldName && f.targetTable === field.targetTable
                  ? {
                      ...f,
                      fieldValue: correctedValue ?? f.fieldValue,
                      validated: approved,
                      validatedAt: new Date().toISOString(),
                    }
                  : f
              ),
            };
          }
        );
        setEditingFieldKey(null);
        setEditValue('');
        return;
      }

      try {
        await validateMutation.mutateAsync({
          fieldId,
          data: { correctedValue, approved },
        });
        setEditingFieldKey(null);
        setEditValue('');
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to validate field');
      }
    },
    [validateMutation, queryClient, documentId]
  );

  const handleCommit = useCallback(() => {
    const unvalidatedLowConfidence = extraction?.extractedFields.filter(
      (f) => !f.validated && (f.confidenceScore ?? 0) < 70
    ).length || 0;

    if (unvalidatedLowConfidence > 0) {
      Alert.alert(
        'Low Confidence Fields',
        `${unvalidatedLowConfidence} fields have low confidence and haven't been reviewed. This may result in inaccurate data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Review Fields',
            onPress: () => {
              // Expand all tables with low confidence fields
              const tablesWithLowConfidence = new Set(
                extraction?.extractedFields
                  .filter((f) => !f.validated && (f.confidenceScore ?? 0) < 70)
                  .map((f) => f.targetTable || 'other')
              );
              setExpandedTables(tablesWithLowConfidence);
            },
          },
          {
            text: 'Commit Anyway',
            style: 'destructive',
            onPress: performCommit,
          },
        ]
      );
    } else {
      performCommit();
    }
  }, [extraction]);

  const performCommit = async () => {
    try {
      const result = await commitMutation.mutateAsync({
        documentId,
        options: { createNewEntity: true, minimumConfidence: 70 },
      });

      if (result.success) {
        // Build a summary of what was affected
        const affectedItems: string[] = [];
        if (result.affectedRecords.vessel) {
          const vesselName = result.affectedRecords.vessel.name;
          affectedItems.push(vesselName ? `Vessel "${vesselName}" updated` : 'Vessel data updated');
        }
        if (result.affectedRecords.vesselStatus) {
          affectedItems.push('Noon Report data saved');
        }
        if (result.affectedRecords.charter) {
          const charterType = result.affectedRecords.charter.type;
          affectedItems.push(charterType ? `Charter Party (${charterType}) saved` : 'Charter Party saved');
        }
        if (result.affectedRecords.voyage) {
          affectedItems.push('Voyage data saved');
        }
        if (result.affectedRecords.voyagePort) {
          affectedItems.push('Port information saved');
        }
        if (result.affectedRecords.cargo) {
          affectedItems.push('Cargo data saved');
        }

        const summaryMessage = affectedItems.length > 0
          ? `Successfully committed:\n${affectedItems.map(item => `• ${item}`).join('\n')}`
          : result.message || 'Data has been successfully committed to the database';

        // Determine where to navigate based on what was affected
        const vesselId = result.affectedRecords.vessel?.id;

        Alert.alert(
          'Success',
          summaryMessage,
          [
            {
              text: vesselId ? 'View Vessel' : 'OK',
              onPress: () => {
                if (vesselId) {
                  // Navigate to the vessel overview to see the updated data
                  router.replace(`/vessel/${vesselId}`);
                } else {
                  router.replace('/(tabs)');
                }
              },
            },
            ...(vesselId ? [{
              text: 'Go to Fleet',
              style: 'cancel' as const,
              onPress: () => router.replace('/(tabs)'),
            }] : []),
          ]
        );
      } else {
        Alert.alert('Error', result.errors?.join('\n') || 'Failed to commit data');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to commit extraction');
    }
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getConfidenceLabel = (score: number): string => {
    if (score >= 90) return 'High';
    if (score >= 70) return 'Medium';
    return 'Low';
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black justify-center items-center">
        <Text className="text-gray-500 dark:text-gray-400">Loading extraction results...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <View className="flex-1 ml-2">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white">
            Review Extraction
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {params.documentName || extraction?.documentName}
          </Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View className="flex-row bg-white dark:bg-[#1c1c1e] px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-gray-900 dark:text-white">{stats.total}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Fields</Text>
        </View>
        <View className="w-px bg-gray-200 dark:bg-gray-700" />
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-green-500">{stats.validated}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Validated</Text>
        </View>
        <View className="w-px bg-gray-200 dark:bg-gray-700" />
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-yellow-500">{stats.lowConfidence}</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Low Conf.</Text>
        </View>
        <View className="w-px bg-gray-200 dark:bg-gray-700" />
        <View className="flex-1 items-center">
          <Text className="text-lg font-bold text-blue-500">{stats.averageConfidence.toFixed(0)}%</Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">Avg Conf.</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Grouped Fields */}
          {Object.entries(groupedFields).map(([table, fields]) => {
            const tableConfig = TABLE_LABELS[table] || TABLE_LABELS.other;
            const TableIcon = TABLE_ICONS[table] || TABLE_ICONS.other;
            const isExpanded = expandedTables.has(table);
            const tableStats = {
              total: fields.length,
              validated: fields.filter((f) => f.validated).length,
              lowConfidence: fields.filter((f) => (f.confidenceScore ?? 0) < 70).length,
            };

            return (
              <View
                key={table}
                className="bg-white dark:bg-[#1c1c1e] rounded-xl mb-3 shadow-sm overflow-hidden"
              >
                {/* Table Header */}
                <TouchableOpacity
                  className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800"
                  onPress={() => toggleTable(table)}
                >
                  <TableIcon size={20} color="#3b82f6" />
                  <Text className="flex-1 text-base font-semibold text-gray-900 dark:text-white ml-3">
                    {tableConfig.label}
                  </Text>
                  <View className="flex-row items-center mr-2">
                    <Text className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                      {tableStats.validated}/{tableStats.total}
                    </Text>
                    {tableStats.lowConfidence > 0 && (
                      <AlertTriangle size={14} color="#f59e0b" />
                    )}
                  </View>
                  {isExpanded ? (
                    <ChevronUp size={20} color="#6b7280" />
                  ) : (
                    <ChevronDown size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>

                {/* Fields */}
                {isExpanded && (
                  <View className="px-4 py-2">
                    {fields.map((field, index) => {
                      const fieldKey = `${table}-${field.id ?? index}`;
                      return (
                        <FieldRow
                          key={fieldKey}
                          field={field}
                          isEditing={editingFieldKey === fieldKey}
                          editValue={editValue}
                          onEditValueChange={setEditValue}
                          onStartEdit={() => startEditing(field, fieldKey)}
                          onCancelEdit={cancelEditing}
                          onValidate={handleValidate}
                          isLast={index === fields.length - 1}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Spacer for commit button */}
          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Commit Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#1c1c1e] border-t border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          className={`py-4 rounded-xl items-center flex-row justify-center ${
            commitMutation.isPending ? 'bg-gray-300 dark:bg-gray-700' : 'bg-blue-500'
          }`}
          onPress={handleCommit}
          disabled={commitMutation.isPending}
        >
          <CheckCircle size={20} color="#fff" />
          <Text className="text-white font-bold text-base ml-2">
            {commitMutation.isPending ? 'Committing...' : 'Commit to Database'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

interface FieldRowProps {
  field: ExtractedField;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onValidate: (field: ExtractedField, correctedValue: string | undefined, approved: boolean) => void;
  isLast: boolean;
}

const FieldRow: React.FC<FieldRowProps> = React.memo(({
  field,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onCancelEdit,
  onValidate,
  isLast,
}) => {
  const MethodIcon = METHOD_ICONS[field.extractionMethod] || METHOD_ICONS.MANUAL;
  const confidenceColor = getConfidenceColor(field.confidenceScore);

  if (isEditing) {
    return (
      <View className={`py-3 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
        <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {formatFieldName(field.fieldName)}
        </Text>
        <TextInput
          className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white border border-blue-500"
          value={editValue}
          onChangeText={onEditValueChange}
          autoFocus
          selectTextOnFocus
        />
        <View className="flex-row mt-2 justify-end gap-2">
          <TouchableOpacity
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800"
            onPress={onCancelEdit}
          >
            <Text className="text-gray-600 dark:text-gray-300 text-sm font-medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-2 rounded-lg bg-blue-500"
            onPress={() => {
              const correctedValue = editValue !== field.fieldValue ? editValue : undefined;
              onValidate(field, correctedValue, true);
            }}
          >
            <Text className="text-white text-sm font-medium">Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className={`flex-row items-center py-3 ${!isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {formatFieldName(field.fieldName)}
          </Text>
          {field.validated && (
            <CheckCircle size={12} color="#22c55e" style={{ marginLeft: 4 }} />
          )}
        </View>
        <Text className="text-sm text-gray-900 dark:text-white font-medium mt-0.5">
          {field.fieldValue || '(empty)'}
        </Text>
        <View className="flex-row items-center mt-1">
          <MethodIcon size={10} color="#9ca3af" />
          <Text className="text-xs text-gray-400 ml-1">
            {EXTRACTION_METHOD_LABELS[field.extractionMethod]}
          </Text>
          <View
            className="ml-2 px-1.5 py-0.5 rounded"
            style={{ backgroundColor: `${confidenceColor}20` }}
          >
            <Text className="text-xs font-medium" style={{ color: confidenceColor }}>
              {(field.confidenceScore ?? 0).toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center ml-2">
        {!field.validated && (
          <>
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mr-2"
              onPress={onStartEdit}
            >
              <Edit3 size={14} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center"
              onPress={() => onValidate(field, undefined, true)}
            >
              <Check size={14} color="#22c55e" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
});

// Helper function to get confidence color (defined outside component to avoid re-creation)
function getConfidenceColor(score: number | undefined): string {
  const safeScore = score ?? 0;
  if (safeScore >= 90) return '#22c55e';
  if (safeScore >= 70) return '#f59e0b';
  return '#ef4444';
}
