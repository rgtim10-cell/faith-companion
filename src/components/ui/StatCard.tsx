import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { colors, spacing, typography } from '@/design/tokens';
import { useRealm } from '@/context/RealmContext';
import type { MomentumStat } from '@/types';

interface StatCardProps {
  stat: MomentumStat;
  style?: object;
}

export function StatCard({ stat, style }: StatCardProps) {
  const { realm } = useRealm();
  const isUp = stat.trend >= 0;

  return (
    <GlassCard padding="md" style={[styles.card, style]}>
      <Text style={styles.label}>{stat.label.toUpperCase()}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{stat.value}</Text>
        <Text style={[styles.unit, { color: realm.accentSoft }]}>%</Text>
      </View>
      <View style={styles.trendRow}>
        <Text style={[styles.trend, { color: isUp ? colors.success : colors.error }]}>
          {isUp ? '↑' : '↓'} {Math.abs(stat.trend)}%
        </Text>
        <Text style={styles.trendLabel}> this week</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  label: {
    ...typography.labelMd,
    color: colors.textSubtle,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  value: {
    ...typography.displayMd,
    color: colors.text,
  },
  unit: {
    ...typography.headingSm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trend: {
    ...typography.labelMd,
    fontWeight: '600',
  },
  trendLabel: {
    ...typography.labelMd,
    color: colors.textSubtle,
  },
});
