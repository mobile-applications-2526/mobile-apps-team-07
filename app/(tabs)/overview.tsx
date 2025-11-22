import React from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

import Boat from '@/types/boat';

import DUMMY_BOATS from '@/data/dummy_boat_data.json';

function BoatCard({ item }: { item: Boat }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.iconWrap}>
        <Ship size={36} color="#0a7ea4" />
      </View>
      <View style={styles.info}>
        <ThemedText type="defaultSemiBold" style={styles.title} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <ThemedText style={styles.subtitleText}>{item.type} • {item.length}</ThemedText>
        <ThemedText style={styles.location}>{item.location}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export default function Overview() {
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={DUMMY_BOATS}
        keyExtractor={(b) => b.id}
        renderItem={({ item }) => <BoatCard item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 0,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,126,164,0.08)'
  },
  info: {
    flex: 1,
  },
  title: {
    marginBottom: 0,
    fontSize: 16,
    lineHeight: 18,
  },
  subtitleText: {
    fontSize: 13,
    color: '#444',
    marginVertical: 0,
    lineHeight: 16,
  },
  location: {
    marginTop: 0,
    fontSize: 12,
    color: '#666',
    lineHeight: 14,
  },
});
