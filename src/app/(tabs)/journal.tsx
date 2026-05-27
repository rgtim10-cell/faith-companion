import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { PrayerCard } from '@/components/PrayerCard';
import { EmptyState } from '@/components/EmptyState';
import type { PrayerCategory, PrayerStatus } from '@/types';

type FilterType = 'all' | PrayerStatus;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'answered', label: 'Answered' },
  { key: 'archived', label: 'Archived' },
];

export default function JournalScreen() {
  const { colors } = useTheme();
  const { state, updatePrayer, markPrayerAnswered } = useData();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredPrayers = useMemo(() => {
    if (activeFilter === 'all') return state.prayers;
    return state.prayers.filter((p) => p.status === activeFilter);
  }, [state.prayers, activeFilter]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Prayer Journal</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/prayer/new')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                isActive
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight, borderWidth: 1 },
              ]}
              onPress={() => setActiveFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: isActive ? '#FFFFFF' : colors.textSecondary },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Prayer List */}
      <FlatList
        data={filteredPrayers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PrayerCard
            prayer={item}
            onPress={() => router.push(`/prayer/${item.id}`)}
            onFavorite={() =>
              updatePrayer(item.id, { is_favorite: !item.is_favorite })
            }
            onMarkAnswered={() => markPrayerAnswered(item.id)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title="No Prayers Yet"
            description="Start your prayer journey by writing your first prayer. God is always listening."
            actionLabel="Write a Prayer"
            onAction={() => router.push('/prayer/new')}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.title,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  filterText: {
    ...Typography.captionMedium,
  },
  list: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
});
