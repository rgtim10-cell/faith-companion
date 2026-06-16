import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AIInsight } from '@/components/ui/AIInsight';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressArc } from '@/components/ui/ProgressArc';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
  aiInsights,
  momentumStats,
  overallMomentum,
  userProfile,
  weekDayLabels,
  weeklyMomentum,
} from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';

const maxBar = Math.max(...weeklyMomentum);

export function MomentumScreen() {
  const { realm } = useRealm();

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Momentum"
        eyebrow={`${userProfile.streak}-day streak`}
        eyebrowColor={realm.accentSoft}
        style={styles.header}
      />

      {/* OATH is alive — pattern insight */}
      <AIInsight text={aiInsights.Momentum.text} style={styles.insight} />

      {/* Overall score + week chart */}
      <GlassCard padding="lg" style={styles.mainCard}>
        <View style={styles.mainRow}>
          <View style={styles.arcWrapper}>
            <ProgressArc value={overallMomentum} size={150} strokeWidth={12} label="overall" />
          </View>
          <View style={styles.chartWrapper}>
            <Text style={[styles.chartLabel, { color: realm.accentSoft }]}>THIS WEEK</Text>
            <View style={styles.bars}>
              {weeklyMomentum.map((val, i) => {
                const isToday = i === weeklyMomentum.length - 1;
                const barHeight = (val / maxBar) * 72;
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: barHeight,
                            backgroundColor: isToday ? realm.accent : realm.accentMuted,
                            borderRadius: radius.sm,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.dayLabel,
                        { color: isToday ? realm.accentSoft : colors.textSubtle },
                      ]}
                    >
                      {weekDayLabels[i]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={styles.momentum90}>
          Highest sustained momentum in the last 90 days.
        </Text>
      </GlassCard>

      {/* Stat breakdown grid */}
      <SectionHeader
        title="Breakdown"
        subtitle="The signals behind your score"
        style={styles.sectionHeader}
      />

      <View style={styles.statsGrid}>
        {momentumStats.map((stat) => (
          <StatCard key={stat.id} stat={stat} style={styles.statCard} />
        ))}
      </View>

      {/* OATH pattern note */}
      <GlassCard padding="md" style={styles.patternCard}>
        <View style={[styles.patternDot, { backgroundColor: realm.accent }]} />
        <View style={styles.patternText}>
          <Text style={[styles.patternTitle, { color: realm.accentSoft }]}>OATH noticed a pattern</Text>
          <Text style={styles.patternBody}>
            Your top 3 momentum weeks all started with completing the morning mission before 7 AM. Today, you started at 6:42.
          </Text>
        </View>
      </GlassCard>
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
  mainCard: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  arcWrapper: {
    alignItems: 'center',
  },
  chartWrapper: {
    flex: 1,
    gap: spacing.sm,
  },
  chartLabel: {
    ...typography.labelMd,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 88,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    minHeight: 4,
  },
  dayLabel: {
    ...typography.labelSm,
    fontSize: 9,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  momentum90: {
    ...typography.bodySm,
    color: colors.textSubtle,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '47.5%',
  },
  patternCard: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },
  patternText: {
    flex: 1,
    gap: spacing.xs,
  },
  patternTitle: {
    ...typography.labelLg,
  },
  patternBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
