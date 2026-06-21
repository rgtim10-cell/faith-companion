import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, spacing, typography } from '@/design/tokens';
import { useRealm } from '@/context/RealmContext';
import type { VaultMemory } from '@/types';

interface MemoryCardProps {
  memory: VaultMemory;
  style?: object;
}

export function MemoryCard({ memory, style }: MemoryCardProps) {
  const { realm } = useRealm();

  return (
    <View style={[styles.outer, style, { borderColor: memory.emotionalWeight === 'high' ? realm.accent + '33' : colors.border }]}>
      <BlurView intensity={16} tint="dark" style={styles.blur}>
        <View style={[styles.inner, { backgroundColor: memory.emotionalWeight === 'high' ? realm.accentMuted : colors.glass }]}>
          <View style={styles.header}>
            <View style={[styles.indicator, { backgroundColor: realm.accent }]} />
            <Text style={[styles.tag, { color: realm.accentSoft }]}>
              OATH REMEMBERS · {memory.daysAgo} DAYS AGO
            </Text>
          </View>

          <Text style={styles.quote}>"{memory.quote}"</Text>

          <View style={styles.divider} />

          <Text style={styles.reflection}>{memory.reflection}</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
  },
  blur: {
    width: '100%',
  },
  inner: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tag: {
    ...typography.labelSm,
  },
  quote: {
    ...typography.oath,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  reflection: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
