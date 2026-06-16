import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AIInsight } from '@/components/ui/AIInsight';
import { MissionCard } from '@/components/ui/MissionCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { aiInsights, missions } from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { MissionCategory } from '@/types';

const ALL = 'All';
const categories = [ALL, 'Focus', 'Body', 'Mind', 'Discipline', 'Spirit'] as const;
type FilterValue = typeof categories[number];

export function MissionsScreen() {
  const { realm } = useRealm();
  const [filter, setFilter] = useState<FilterValue>(ALL);

  const filtered =
    filter === ALL
      ? missions
      : missions.filter((m) => m.category === (filter as MissionCategory));

  const completedCount = missions.filter((m) => m.status === 'completed').length;
  const totalCount = missions.filter((m) => m.status !== 'locked').length;

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Missions"
        eyebrow={`${completedCount} of ${totalCount} done today`}
        eyebrowColor={realm.accentSoft}
        style={styles.header}
      />

      {/* OATH is alive — recommends what to start */}
      <AIInsight text={aiInsights.Missions.text} style={styles.insight} />

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filterScroll}
      >
        {categories.map((cat) => {
          const active = filter === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilter(cat)}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: realm.accentMuted, borderColor: realm.accent + '66' }
                  : { backgroundColor: colors.glass, borderColor: colors.border },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: active ? realm.accentSoft : colors.textSecondary },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Mission list */}
      <View style={styles.list}>
        {filtered.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  insight: {
    marginBottom: spacing.lg,
  },
  filterScroll: {
    marginBottom: spacing.lg,
  },
  filters: {
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterText: {
    ...typography.labelLg,
  },
  list: {
    gap: spacing.sm,
  },
});
