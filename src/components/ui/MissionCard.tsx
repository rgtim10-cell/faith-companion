import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { useRealm } from '@/context/RealmContext';
import type { Mission } from '@/types';

const categoryColors: Record<string, string> = {
  Focus: '#4D8CFF',
  Body: '#34D399',
  Mind: '#8B5CF6',
  Discipline: '#FBBF24',
  Spirit: '#F87171',
};

interface MissionCardProps {
  mission: Mission;
  onPress?: () => void;
}

export function MissionCard({ mission, onPress }: MissionCardProps) {
  const { realm } = useRealm();
  const catColor = categoryColors[mission.category] ?? realm.accent;
  const isLocked = mission.status === 'locked';
  const isDone = mission.status === 'completed';

  const handlePress = () => {
    if (isLocked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity activeOpacity={isLocked ? 1 : 0.75} onPress={handlePress}>
      <GlassCard padding="md" style={[styles.card, isLocked && styles.locked]}>
        <View style={styles.header}>
          <View style={[styles.categoryDot, { backgroundColor: catColor + '22' }]}>
            <View style={[styles.dotInner, { backgroundColor: catColor, opacity: isLocked ? 0.35 : 1 }]} />
          </View>
          <Text style={[styles.category, { color: isLocked ? colors.textDisabled : catColor }]}>
            {mission.category.toUpperCase()}
          </Text>
          {isDone && (
            <View style={styles.doneChip}>
              <Text style={styles.doneText}>DONE</Text>
            </View>
          )}
          {isLocked && (
            <View style={styles.lockedChip}>
              <Text style={styles.lockedText}>LATER</Text>
            </View>
          )}
        </View>

        <Text style={[styles.title, isLocked && styles.textLocked]}>{mission.title}</Text>
        <Text style={[styles.desc, isLocked && styles.textLocked]} numberOfLines={2}>
          {mission.description}
        </Text>

        {!isLocked && (
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${mission.progress}%`,
                    backgroundColor: isDone ? colors.success : realm.accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>{mission.progress}%</Text>
          </View>
        )}

        <Text style={[styles.meta, isLocked && styles.textLocked]}>
          ~{mission.estimatedMinutes} min
        </Text>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  locked: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  categoryDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  category: {
    ...typography.labelSm,
    flex: 1,
  },
  doneChip: {
    backgroundColor: colors.success + '22',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.success + '44',
  },
  doneText: {
    ...typography.labelSm,
    color: colors.success,
  },
  lockedChip: {
    backgroundColor: colors.surface3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  lockedText: {
    ...typography.labelSm,
    color: colors.textSubtle,
  },
  title: {
    ...typography.headingSm,
    color: colors.text,
  },
  desc: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  textLocked: {
    color: colors.textSubtle,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressLabel: {
    ...typography.labelSm,
    color: colors.textSubtle,
    minWidth: 30,
    textAlign: 'right',
  },
  meta: {
    ...typography.labelSm,
    color: colors.textSubtle,
    marginTop: 2,
  },
});
