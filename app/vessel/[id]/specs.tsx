import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Ship, FileText, Upload, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVessel } from './_layout';

type Document = {
  id: string;
  name: string;
  description: string;
  status: 'uploaded' | 'pending' | 'expired';
  lastUpdated?: string;
};

const documents: Document[] = [
  { id: 'q88', name: 'Q88', description: 'Vessel Particulars Questionnaire', status: 'uploaded', lastUpdated: 'Nov 15, 2025' },
  { id: 'formc', name: 'Form C', description: 'Safety Equipment Certificate', status: 'pending' },
  { id: 'charter', name: 'Charter Party', description: 'Current Charter Agreement', status: 'uploaded', lastUpdated: 'Oct 28, 2025' },
  { id: 'class', name: 'Class Certificate', description: 'Classification Society Certificate', status: 'expired', lastUpdated: 'Aug 10, 2025' },
];

function DocumentCard({ doc, hasQ88 }: { doc: Document; hasQ88: boolean }) {
  const statusConfig = {
    'uploaded': { icon: CheckCircle, color: '#10b981', bg: 'bg-green-50 dark:bg-green-900/20', label: 'Uploaded' },
    'pending': { icon: Upload, color: '#f59e0b', bg: 'bg-orange-50 dark:bg-orange-900/20', label: 'Pending' },
    'expired': { icon: AlertCircle, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20', label: 'Expired' },
  };
  
  // Override status if Q88 is not uploaded and this is not the Q88 doc
  const effectiveStatus = !hasQ88 && doc.id === 'q88' ? 'pending' : doc.status;
  const config = statusConfig[effectiveStatus];
  const StatusIcon = config.icon;

  return (
    <TouchableOpacity 
      className="bg-white dark:bg-[#1c1c1e] rounded-xl mb-3 overflow-hidden"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center p-4">
        <View className={`w-12 h-12 rounded-xl items-center justify-center ${config.bg} mr-3`}>
          <FileText size={24} color={config.color} />
        </View>
        
        <View className="flex-1">
          <ThemedText type="defaultSemiBold" className="text-base" numberOfLines={1}>
            {doc.name}
          </ThemedText>
          <ThemedText className="text-xs text-gray-500 dark:text-gray-400" numberOfLines={1}>
            {doc.description}
          </ThemedText>
          {doc.lastUpdated && effectiveStatus === 'uploaded' && (
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Updated: {doc.lastUpdated}
            </ThemedText>
          )}
        </View>

        <View className="flex-row items-center">
          <View className={`flex-row items-center px-2 py-1 rounded-full ${config.bg} mr-2`}>
            <StatusIcon size={12} color={config.color} />
            <ThemedText className="text-xs font-medium ml-1" style={{ color: config.color }}>
              {config.label}
            </ThemedText>
          </View>
          <ChevronRight size={20} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function VesselSpecs() {
  const insets = useSafeAreaInsets();
  const boat = useVessel();
  const hasQ88 = boat?.hasQ88 ?? false;

  if (!boat) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 dark:bg-[#000]">
        <ThemedText>Vessel not found</ThemedText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Header */}
      <View 
        className="px-4 pb-3 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-lg items-center justify-center bg-blue-50 dark:bg-blue-900/20 mr-3">
            <Ship size={20} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <ThemedText type="defaultSemiBold" className="text-lg" numberOfLines={1}>
              {boat.name}
            </ThemedText>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500">
              Specifications & Documents
            </ThemedText>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Q88 Upload Banner (if not uploaded) */}
        {!hasQ88 && (
          <TouchableOpacity 
            className="bg-orange-500 rounded-xl p-4 mb-4 flex-row items-center"
            activeOpacity={0.8}
          >
            <View className="w-12 h-12 rounded-xl bg-white/20 items-center justify-center mr-3">
              <Upload size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <ThemedText className="text-white font-semibold text-base">
                Upload Q88 to Unlock Features
              </ThemedText>
              <ThemedText className="text-white/80 text-xs">
                Other tabs require Q88 document to be uploaded first
              </ThemedText>
            </View>
            <ChevronRight size={24} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Documents Section */}
        <View>
          <ThemedText type="defaultSemiBold" className="text-sm text-gray-500 dark:text-gray-400 mb-2 px-1">
            Documents
          </ThemedText>
          {documents.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} hasQ88={hasQ88} />
          ))}
        </View>

        {/* Quick Specs */}
        <View className="mt-4">
          <ThemedText type="defaultSemiBold" className="text-sm text-gray-500 dark:text-gray-400 mb-2 px-1">
            Quick Specifications
          </ThemedText>
          <View className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4">
            <View className="flex-row flex-wrap">
              {[
                { label: 'Vessel Type', value: boat.type },
                { label: 'Subtype', value: boat.subtype },
                { label: 'IMO Number', value: boat.imo },
                { label: 'Flag State', value: 'Panama' },
                { label: 'Class', value: 'Lloyd\'s Register' },
                { label: 'Year Built', value: '2018' },
              ].map((item, index) => (
                <View key={index} className="w-1/2 mb-3">
                  <ThemedText className="text-xs text-gray-400 dark:text-gray-500">
                    {item.label}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" className="text-sm" numberOfLines={1}>
                    {item.value}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
