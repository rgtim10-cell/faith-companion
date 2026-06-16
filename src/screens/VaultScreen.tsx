import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AIInsight } from '@/components/ui/AIInsight';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { MemoryCard } from '@/components/ui/MemoryCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { aiInsights, journalEntries, vaultMemories } from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, spacing, typography } from '@/design/tokens';
import type { MoodLevel } from '@/types';

const moodConfig: Record<MoodLevel, { label: string; variant: 'success' | 'info' | 'default' | 'warning' }> = {
  unstoppable: { label: 'Unstoppable', variant: 'success' },
  strong: { label: 'Strong', variant: 'info' },
  steady: { label: 'Steady', variant: 'default' },
  low: { label: 'Low', variant: 'warning' },
};

export function VaultScreen() {
  const { realm } = useRealm();

  return (
    <ScreenWrapper>
      <SectionHeader
        title="Vault"
        subtitle="What OATH has witnessed and remembers."
        eyebrow="Your history"
        eyebrowColor={realm.accentSoft}
        style={styles.header}
      />

      {/* OATH is alive — emotional pattern insight */}
      <AIInsight text={aiInsights.Vault.text} style={styles.insight} />

      {/* Memories — the emotional core of OATH */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: realm.accentSoft }]}>OATH REMEMBERS</Text>
        <View style={styles.memoryList}>
          {vaultMemories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </View>
      </View>

      {/* Journal Entries */}
      <View style={styles.section}>
        <SectionHeader
          title="Journal"
          subtitle="In your own words"
          style={styles.journalHeader}
        />
        <View style={styles.journalList}>
          {journalEntries.map((entry) => {
            const mood = moodConfig[entry.mood];
            return (
              <GlassCard key={entry.id} padding="md" style={styles.journalCard}>
                <View style={styles.journalHeader2}>
                  <Text style={styles.journalDate}>{entry.date}</Text>
                  <Badge label={mood.label} variant={mood.variant} />
                </View>
                <Text style={styles.journalTitle}>{entry.title}</Text>
                <Text style={styles.journalPreview} numberOfLines={2}>
                  {entry.preview}
                </Text>
              </GlassCard>
            );
          })}
        </View>
      </View>

      {/* Archive note */}
      <View style={styles.archiveNote}>
        <Text style={styles.archiveText}>
          OATH keeps everything. Nothing you share is forgotten.
        </Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  insight: {
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.labelLg,
    letterSpacing: 1.8,
  },
  memoryList: {
    gap: spacing.md,
  },
  journalHeader: {
    marginBottom: spacing.sm,
  },
  journalList: {
    gap: spacing.sm,
  },
  journalCard: {
    gap: spacing.xs,
  },
  journalHeader2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalDate: {
    ...typography.labelMd,
    color: colors.textSubtle,
  },
  journalTitle: {
    ...typography.headingSm,
    color: colors.text,
  },
  journalPreview: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  archiveNote: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  archiveText: {
    ...typography.bodySm,
    color: colors.textSubtle,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
