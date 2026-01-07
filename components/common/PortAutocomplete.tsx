/**
 * Port Autocomplete Component
 *
 * Provides port search with autocomplete functionality.
 * Searches vessel's port history with debounced input.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { VesselPort } from '@/types';
import { searchVesselPorts, getRecentVesselPorts } from '@/services/port.service';
import { Ionicons } from '@expo/vector-icons';

interface PortAutocompleteProps {
  vesselId: number;
  onSelect: (port: VesselPort) => void;
  onAddNew?: (portName: string) => void;
  placeholder?: string;
  initialValue?: string;
  disabled?: boolean;
}

export function PortAutocomplete({
  vesselId,
  onSelect,
  onAddNew,
  placeholder = 'Search ports...',
  initialValue = '',
  disabled = false,
}: PortAutocompleteProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Theme colors based on color scheme
  const colors = {
    surface: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#111827',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    primary: '#3b82f6',
  };

  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<VesselPort[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent ports on mount
  useEffect(() => {
    const loadRecentPorts = async () => {
      try {
        const recent = await getRecentVesselPorts(vesselId);
        setResults(recent.slice(0, 5));
      } catch (err) {
        console.warn('Failed to load recent ports:', err);
      }
    };
    loadRecentPorts();
  }, [vesselId]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced search
  const handleSearch = useCallback(
    (text: string) => {
      setQuery(text);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (text.length < 1) {
        // Show recent ports when query is empty
        getRecentVesselPorts(vesselId)
          .then((recent) => setResults(recent.slice(0, 5)))
          .catch(() => setResults([]));
        setShowDropdown(true);
        return;
      }

      setIsLoading(true);
      setShowDropdown(true);

      // Set new timer for 300ms debounce
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const searchResults = await searchVesselPorts(vesselId, text);
          setResults(searchResults);
        } catch (err) {
          console.warn('Port search failed:', err);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    },
    [vesselId]
  );

  const handleSelectPort = (port: VesselPort) => {
    setQuery(port.portName);
    setShowDropdown(false);
    onSelect(port);
  };

  const handleAddNewPort = () => {
    if (onAddNew && query.trim()) {
      setShowDropdown(false);
      onAddNew(query.trim());
    }
  };

  const renderPortItem = ({ item }: { item: VesselPort }) => (
    <TouchableOpacity
      style={[styles.resultItem, { borderBottomColor: colors.border }]}
      onPress={() => handleSelectPort(item)}
    >
      <View style={styles.portInfo}>
        <Text style={[styles.portName, { color: colors.text }]}>
          {item.portName}
        </Text>
        <Text style={[styles.portDetails, { color: colors.textSecondary }]}>
          {item.portCode ? `${item.portCode} • ` : ''}
          {item.country || 'Unknown'}
          {item.visitCount ? ` • ${item.visitCount} visits` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: showDropdown ? colors.primary : colors.border,
          },
        ]}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
          onFocus={() => setShowDropdown(true)}
          editable={!disabled}
        />
        {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
        {query.length > 0 && !isLoading && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              handleSearch('');
            }}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderPortItem}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
                {query.length > 0 ? 'No ports found' : 'Start typing to search'}
              </Text>
            </View>
          )}

          {onAddNew && query.trim().length > 0 && !results.find((p) => p.portName.toLowerCase() === query.toLowerCase()) && (
            <TouchableOpacity
              style={[styles.addNewButton, { borderTopColor: colors.border }]}
              onPress={handleAddNewPort}
            >
              <Ionicons name="add-circle" size={20} color={colors.primary} />
              <Text style={[styles.addNewText, { color: colors.primary }]}>
                Add "{query}" as new port
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 300,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultsList: {
    maxHeight: 250,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  portInfo: {
    flex: 1,
  },
  portName: {
    fontSize: 15,
    fontWeight: '500',
  },
  portDetails: {
    fontSize: 13,
    marginTop: 2,
  },
  noResults: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default PortAutocomplete;
