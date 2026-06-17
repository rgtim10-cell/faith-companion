import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AIInsight } from '@/components/ui/AIInsight';
import { GlassCard } from '@/components/ui/GlassCard';
import { MissionCard } from '@/components/ui/MissionCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { aiInsights, missions, oathSuggestion } from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { MissionCategory } from '@/types';

const ALL = 'All';
const categories = [ALL, 'Focus', 'Body', 'Mind', 'Discipline', 'Spirit'] as const;
type FilterValue = typeof categories[number];

export function MissionsScreen() {
  const { realm } = useRealm();
  const [filter, setFilter] = useState<FilterValue>(ALL);
  const [suggestionAccepted, setSuggestionAccepted] = useState(false);

  const filtered =
    filter === ALL
      ? missions
      : missions.filter((m) => m.category === (filter as MissionCategory));

  const completedCount = missions.filter((m) => m.status === 'completed').length;
  const totalCount = missions.filter((m) => m.status !== 'locked').length;

  function acceptSuggestion() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSuggestionAccepted(true);
  }

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Missions"
        eyebrow={`${completedCount} of ${totalCount} complete today`}
        eyebrowColor={realm.accentSoft}
        style={styles.header}
      />

      {/* OATH Suggestion — AI picks the best next move */}
      {!suggestionAccepted ? (
        <GlassCard padding="lg" style={[styles.suggestion, { borderColor: realm.accent + '44' }]}>
          <View style={styles.suggestionHeader}>
            <View style={[styles.suggestionDot, { backgroundColor: realm.accent }]} />
            <Text style={[styles.suggestionLabel, { color: realm.accent }]}>OATH SUGGESTS</Text>
          </View>
          <Text style={styles.suggestionTitle}>{oathSuggestion.title}</Text>
          <Text style={[styles.suggestionReason, { color: colors.textSecondary }]}>
            {oathSuggestion.reasoning}
          </Text>
          <View style={styles.suggestionFooter}>
            <View style={[styles.probPill, { backgroundColor: realm.accentMuted, borderColor: realm.accent + '44' }]}>
              <Text style={[styles.probText, { color: realm.accentSoft }]}>
                {oathSuggestion.completionProbability}% mission completion if you start here
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.acceptBtn, { backgroundColor: realm.accent }]}
              onPress={acceptSuggestion}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptBtnText}>Accept →</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ) : (
        <GlassCard padding="md" style={[styles.suggestionAccepted, { borderColor: realm.accent + '44' }]}>
          <View style={styles.suggestionHeader}>
            <Text style={[styles.suggestionLabel, { color: realm.accentSoft }]}>✓  OATH SUGGESTION ACCEPTED</Text>
          </View>
          <Text style={[styles.suggestionReason, { color: colors.textSecondary }]}>
            Starting with {oathSuggestion.title.replace('.', '')}. I'll track your progress.
          </Text>
        </GlassCard>
      )}

      {/* OATH is alive — tactical insight */}
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
  suggestion: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  suggestionAccepted: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
    borderWidth: 1,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  suggestionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  suggestionLabel: {
    ...typography.labelMd,
    letterSpacing: 1.2,
  },
  suggestionTitle: {
    ...typography.headingSm,
    color: colors.text,
  },
  suggestionReason: {
    ...typography.bodyMd,
    lineHeight: 21,
  },
  suggestionFooter: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  probPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  probText: {
    ...typography.labelMd,
  },
  acceptBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  acceptBtnText: {
    ...typography.labelLg,
    color: '#000',
    fontWeight: '700',
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
