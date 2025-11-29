import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Ship, Navigation, Pencil, Trash2, Plus, Anchor } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import Boat from '@/types/boat';
import DUMMY_BOATS from '@/data/dummy_boat_data.json';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

function VesselCard({ item }: { item: Boat }) {
  const router = useRouter();

  // Truncate vessel name after 25 characters
  const displayName = item.name.length > 25 
    ? `${item.name.substring(0, 25)}...` 
    : item.name;

  const hasActiveVoyage = item.eta && item.port;

  return (
    <TouchableOpacity
      className="bg-white dark:bg-[#1c1c1e] rounded-xl mb-2.5 overflow-hidden"
      activeOpacity={0.7}
      onPress={() => router.push(`/vessel/${item.id}`)}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View className="flex-row items-center px-3 py-2.5">
        {/* Compact Ship Icon */}
        <View className="w-10 h-10 rounded-lg mr-3 items-center justify-center bg-blue-50 dark:bg-blue-900/20">
          <Ship size={20} color="#3b82f6" />
        </View>

        {/* Vessel Info - Compact */}
        <View className="flex-1 mr-2">
          <View className="flex-row items-center">
            <ThemedText type="defaultSemiBold" className="text-[15px] flex-shrink" numberOfLines={1}>
              {displayName}
            </ThemedText>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 ml-2" numberOfLines={1}>
              {item.imo}
            </ThemedText>
          </View>
          <ThemedText className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
            {item.type} • {item.subtype}
          </ThemedText>
        </View>

        {/* Action Icons - Column layout */}
        <View className="items-center ml-2">
          <TouchableOpacity className="p-1.5" activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Trash2 size={16} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity className="p-1.5 mt-1" activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Pencil size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ETA Strip */}
      <View className={`flex-row items-center px-3 py-1.5 ${hasActiveVoyage ? 'bg-blue-50 dark:bg-blue-900/10' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
        {hasActiveVoyage ? (
          <>
            <Navigation size={12} color="#3b82f6" />
            <ThemedText className="text-xs text-blue-600 dark:text-blue-400 ml-1.5 font-medium" numberOfLines={1}>
              ETA {item.eta}
            </ThemedText>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mx-1" numberOfLines={1}>→</ThemedText>
            <ThemedText className="text-xs text-gray-600 dark:text-gray-300 flex-1" numberOfLines={1}>
              {item.port}
            </ThemedText>
          </>
        ) : (
          <>
            <Anchor size={12} color="#9ca3af" />
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 ml-1.5" numberOfLines={1}>
              No active voyage
            </ThemedText>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
        <Ship size={32} color="#9ca3af" />
      </View>
      <ThemedText className="text-gray-400 text-center text-sm">
        No vessels added yet{'\n'}Tap + to add your first vessel
      </ThemedText>
    </View>
  );
}

export default function Overview() {
  const insets = useSafeAreaInsets();
  const boats = DUMMY_BOATS as Boat[];

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Header */}
      <View
        className="px-4 pb-3 bg-white dark:bg-[#1c1c1e] border-b border-gray-100 dark:border-gray-800"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <ThemedText type="title" className="text-2xl font-bold">
              My Fleet
            </ThemedText>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {boats.length} vessel{boats.length !== 1 ? 's' : ''}
            </ThemedText>
          </View>
          <TouchableOpacity 
            className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center"
            activeOpacity={0.8}
          >
            <Plus size={22} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Vessel List */}
      <FlatList
        data={boats}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <VesselCard item={item} />}
        contentContainerStyle={{ 
          padding: 12, 
          paddingBottom: insets.bottom + 20 
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
    </ThemedView>
  );
}
