import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressArc } from '@/components/ui/ProgressArc';
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
      {/* OATH frames momentum — not a dashboard title */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.streakLabel, { color: realm.accentSoft }]}>
            {userProfile.streak}-DAY STREAK
          </Text>
          <Text style={styles.screenTitle}>Momentum</Text>
        </View>
        {/* THIS WEEK mini chart */}
        <View style={styles.miniChartBlock}>
          <Text style={[styles.miniChartLabel, { color: realm.accentSoft }]}>THIS WEEK</Text>
          <View style={styles.miniBars}>
            {weeklyMomentum.map((val, i) => {
              const isToday = i === weeklyMomentum.length - 1;
              const h = Math.max(4, (val / maxBar) * 32);
              return (
                <View key={i} style={styles.miniBarCol}>
                  <View style={[styles.miniBar, {
                    height: h,
                    backgroundColor: isToday ? realm.accent : realm.accentMuted,
                    borderRadius: 2,
                  }]} />
                  <Text style={[styles.miniDay, { color: isToday ? realm.accentSoft : colors.textSubtle }]}>
                    {weekDayLabels[i]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Overall score — OATH's primary read */}
      <GlassCard padding="lg" style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <ProgressArc value={overallMomentum} size={140} strokeWidth={12} label="Overall" />
          <View style={styles.scoreMeta}>
            <Text style={[styles.momentumWord, { color: realm.accentSoft }]}>Momentum</Text>
            <Text style={styles.momentumLevel}>High</Text>
            <Text style={[styles.oathRead, { color: colors.textSubtle }]}>
              Highest sustained{'\n'}momentum in 90 days.
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* OATH narrates the breakdown */}
      <View style={styles.breakdownHeader}>
        <Text style={[styles.breakdownEyebrow, { color: realm.accentSoft }]}>THIS IS WHAT I'M SEEING</Text>
        <Text style={styles.breakdownTitle}>Breakdown</Text>
      </View>

      <View style={styles.statsGrid}>
        {momentumStats.map((stat) => {
          const isPositive = stat.trend >= 0;
          return (
            <GlassCard key={stat.id} padding="md" style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
              <View style={styles.trendRow}>
                <Text style={[styles.trendText, { color: isPositive ? realm.accent : colors.error }]}>
                  {isPositive ? '↑' : '↓'} {Math.abs(stat.trend)}%
                </Text>
              </View>
              <View style={[styles.statBar, { backgroundColor: colors.border }]}>
                <View style={[styles.statBarFill, {
                  width: `${stat.value}%` as `${number}%`,
                  backgroundColor: realm.accentMuted,
                  borderRightWidth: 2,
                  borderRightColor: realm.accent,
                }]} />
              </View>
            </GlassCard>
          );
        })}
      </View>

      {/* OATH INSIGHT — OATH speaks last, most personal */}
      <GlassCard padding="lg" style={[styles.insightCard, { borderColor: realm.accent + '33' }]}>
        <View style={styles.insightHeader}>
          <View style={[styles.insightDot, { backgroundColor: realm.accent }]} />
          <Text style={[styles.insightLabel, { color: realm.accent }]}>OATH INSIGHT</Text>
        </View>
        <Text style={styles.insightText}>{aiInsights.Momentum.text}</Text>
      </GlassCard>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  streakLabel: {
    ...typography.labelMd,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  screenTitle: {
    ...typography.displayMd,
    color: colors.text,
    letterSpacing: -1,
  },
  miniChartBlock: {
    alignItems: 'flex-end',
    gap: 4,
  },
  miniChartLabel: {
    ...typography.labelSm,
    letterSpacing: 1.2,
  },
  miniBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
  },
  miniBarCol: {
    alignItems: 'center',
    gap: 2,
    justifyContent: 'flex-end',
  },
  miniBar: {
    width: 8,
    minHeight: 4,
  },
  miniDay: {
    ...typography.labelSm,
    fontSize: 8,
  },
  scoreCard: {
    marginBottom: spacing.xl,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  scoreMeta: {
    flex: 1,
    gap: spacing.xs,
  },
  momentumWord: {
    ...typography.labelLg,
    letterSpacing: 1.5,
  },
  momentumLevel: {
    ...typography.displayMd,
    color: colors.text,
    letterSpacing: -1,
  },
  oathRead: {
    ...typography.bodySm,
    lineHeight: 18,
    fontStyle: 'italic',
    marginTop: spacing.xs,
  },
  breakdownHeader: {
    marginBottom: spacing.md,
  },
  breakdownEyebrow: {
    ...typography.labelSm,
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  breakdownTitle: {
    ...typography.headingMd,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '47.5%',
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 32,
  },
  statLabel: {
    ...typography.bodySm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    ...typography.labelMd,
    fontWeight: '600',
  },
  statBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
  },
  insightCard: {
    gap: spacing.sm,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  insightLabel: {
    ...typography.labelMd,
    letterSpacing: 1.5,
  },
  insightText: {
    ...typography.bodyMd,
    color: colors.text,
    lineHeight: 22,
  },
});
