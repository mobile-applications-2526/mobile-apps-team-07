import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Ship, MapPin, Calendar, Navigation, Plus, Clock } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVessel } from './_layout';

type Voyage = {
  id: string;
  from: string;
  to: string;
  departureDate: string;
  arrivalDate: string;
  status: 'completed' | 'in-progress' | 'scheduled';
};

const dummyVoyages: Voyage[] = [
  { id: '1', from: 'Singapore', to: 'Rotterdam', departureDate: 'Nov 15', arrivalDate: 'Dec 21', status: 'in-progress' },
  { id: '2', from: 'Rotterdam', to: 'Houston', departureDate: 'Dec 28', arrivalDate: 'Jan 15', status: 'scheduled' },
  { id: '3', from: 'Dubai', to: 'Singapore', departureDate: 'Oct 20', arrivalDate: 'Nov 10', status: 'completed' },
];

function VoyageCard({ voyage }: { voyage: Voyage }) {
  const statusColors = {
    'completed': { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600', dot: 'bg-green-500' },
    'in-progress': { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600', dot: 'bg-blue-500' },
    'scheduled': { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600', dot: 'bg-orange-500' },
  };
  
  const colors = statusColors[voyage.status];

  return (
    <TouchableOpacity 
      className="bg-white dark:bg-[#1c1c1e] rounded-xl mb-3 overflow-hidden"
      activeOpacity={0.7}
    >
      <View className="p-4">
        {/* Route */}
        <View className="flex-row items-center mb-3">
          <View className="flex-row items-center flex-1">
            <MapPin size={14} color="#3b82f6" />
            <ThemedText type="defaultSemiBold" className="text-sm ml-1" numberOfLines={1}>
              {voyage.from}
            </ThemedText>
            <Navigation size={12} color="#9ca3af" className="mx-2" />
            <MapPin size={14} color="#ef4444" />
            <ThemedText type="defaultSemiBold" className="text-sm ml-1" numberOfLines={1}>
              {voyage.to}
            </ThemedText>
          </View>
        </View>

        {/* Dates */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Calendar size={12} color="#6b7280" />
            <ThemedText className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              {voyage.departureDate} → {voyage.arrivalDate}
            </ThemedText>
          </View>
          
          {/* Status Badge */}
          <View className={`flex-row items-center px-2 py-1 rounded-full ${colors.bg}`}>
            <View className={`w-1.5 h-1.5 rounded-full ${colors.dot} mr-1.5`} />
            <ThemedText className={`text-xs font-medium ${colors.text}`}>
              {voyage.status === 'in-progress' ? 'In Progress' : 
               voyage.status === 'scheduled' ? 'Scheduled' : 'Completed'}
            </ThemedText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function VesselVoyages() {
  const insets = useSafeAreaInsets();
  const boat = useVessel();

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
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-lg items-center justify-center bg-blue-50 dark:bg-blue-900/20 mr-3">
              <Ship size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <ThemedText type="defaultSemiBold" className="text-lg" numberOfLines={1}>
                {boat.name}
              </ThemedText>
              <ThemedText className="text-xs text-gray-400 dark:text-gray-500">
                Voyage Management
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity 
            className="w-9 h-9 rounded-full bg-blue-500 items-center justify-center"
            activeOpacity={0.8}
          >
            <Plus size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Voyage */}
        {boat.eta && boat.port && (
          <View className="mb-4">
            <ThemedText type="defaultSemiBold" className="text-sm text-gray-500 dark:text-gray-400 mb-2 px-1">
              Current Voyage
            </ThemedText>
            <View className="bg-blue-500 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Navigation size={16} color="#fff" />
                  <ThemedText className="text-white font-semibold ml-2">
                    En Route to {boat.port}
                  </ThemedText>
                </View>
              </View>
              <View className="flex-row items-center">
                <Clock size={12} color="rgba(255,255,255,0.8)" />
                <ThemedText className="text-white/80 text-xs ml-1">
                  ETA: {boat.eta}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Voyage History */}
        <View>
          <ThemedText type="defaultSemiBold" className="text-sm text-gray-500 dark:text-gray-400 mb-2 px-1">
            Voyage History
          </ThemedText>
          {dummyVoyages.map((voyage) => (
            <VoyageCard key={voyage.id} voyage={voyage} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
