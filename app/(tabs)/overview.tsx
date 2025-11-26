import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ThemeToggle } from '@/components/theme-toggle';
import Boat from '@/types/boat';
import DUMMY_BOATS from '@/data/dummy_boat_data.json';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

function BoatCard({ item }: { item: Boat }) {
  const router = useRouter();
  
  return (
    <TouchableOpacity 
      className="flex-row items-center px-3 py-3 rounded-xl mt-5 bg-black/[0.03] dark:bg-white/[0.05]" 
      activeOpacity={0.8}
      onPress={() => router.push(`/vessel/${item.id}`)}>
      <View className="w-14 h-14 rounded-[10px] mr-3 items-center justify-center bg-[#0a7ea4]/[0.08]">
        <Ship size={36} color="#0a7ea4" />
      </View>
      <View className="flex-1">
        <ThemedText type="defaultSemiBold" className="text-base leading-[18px]" numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText className="text-[13px] text-[#444] dark:text-[#bbb] leading-4">{item.type} • {item.length}</ThemedText>
        <ThemedText className="text-xs text-[#666] dark:text-[#999] leading-[14px]">{item.location}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export default function Overview() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView className="flex-1">
      {/* Theme Toggle Button */}
      <View 
        className="absolute right-4 z-10"
        style={{ top: insets.top + 8 }}>
        <ThemeToggle />
      </View>
      
      <FlatList
        data={DUMMY_BOATS}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BoatCard item={item} />}
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 60 }}
      />
    </ThemedView>
  );
}
