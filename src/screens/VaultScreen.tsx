import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRealm } from '@/context/RealmContext';
import { aiInsights, journalEntries, userProfile, vaultMemories } from '@/data/mock';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { MoodLevel } from '@/types';

const TABS = ['Memories', 'Reflections', 'Insights', 'History'] as const;
type Tab = typeof TABS[number];

const moodColors: Record<MoodLevel, string> = {
  unstoppable: '#34D399',
  strong: '#60A5FA',
  steady: '#94A3B8',
  low: '#FBBF24',
};

const milestoneItems = [
  { id: 'ms1', icon: '◈', category: 'Milestone', detail: `${userProfile.streak} days in a row` },
  { id: 'ms2', icon: '◉', category: 'Breakthrough', detail: 'Overcame a big mental block' },
  { id: 'ms3', icon: '✦', category: 'Win', detail: 'Best week in months' },
  { id: 'ms4', icon: '◑', category: 'Lesson', detail: 'Distractions in the afternoon' },
];

export function VaultScreen() {
  const { realm } = useRealm();
  const [activeTab, setActiveTab] = useState<Tab>('Memories');
  const featuredMemory = vaultMemories[0];

  return (
    <ScreenWrapper scrollable={false}>
      {/* Header — OATH frames this as memory, not history */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Vault</Text>
        <TouchableOpacity style={[styles.searchBtn, { borderColor: colors.border }]}>
          <Text style={[styles.searchIcon, { color: colors.textSubtle }]}>⌕</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tab}>
              <Text style={[styles.tabText, { color: active ? realm.accentSoft : colors.textSubtle }]}>
                {tab}
              </Text>
              {active && <View style={[styles.tabUnderline, { backgroundColor: realm.accent }]} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={[styles.tabDivider, { backgroundColor: colors.border }]} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'Memories' && (
          <>
            {/* Featured memory — OATH surfaces what matters most */}
            <View style={styles.remembersBlock}>
              <View style={styles.remembersHeader}>
                <Text style={[styles.remembersLabel, { color: realm.accent }]}>OATH REMEMBERS</Text>
                <Text style={[styles.remembersDate, { color: colors.textSubtle }]}>
                  {featuredMemory.daysAgo} DAYS AGO
                </Text>
              </View>
              <Text style={styles.featuredQuote}>"{featuredMemory.quote}"</Text>
              <Text style={[styles.featuredReflection, { color: colors.textSecondary }]}>
                {featuredMemory.reflection}
              </Text>
            </View>

            {/* Milestone items */}
            <View style={styles.milestoneList}>
              {milestoneItems.map((item) => (
                <TouchableOpacity key={item.id} activeOpacity={0.75}>
                  <GlassCard padding="md" style={styles.milestoneCard}>
                    <View style={[styles.milestoneIcon, { backgroundColor: realm.accentMuted }]}>
                      <Text style={[styles.milestoneIconText, { color: realm.accent }]}>{item.icon}</Text>
                    </View>
                    <View style={styles.milestoneText}>
                      <Text style={[styles.milestoneCategory, { color: realm.accentSoft }]}>{item.category}</Text>
                      <Text style={styles.milestoneDetail}>{item.detail}</Text>
                    </View>
                    <Text style={[styles.milestoneArrow, { color: colors.textSubtle }]}>›</Text>
                  </GlassCard>
                </TouchableOpacity>
              ))}
            </View>

            {/* Remaining memories */}
            {vaultMemories.slice(1).map((memory) => (
              <GlassCard key={memory.id} padding="lg" style={[
                styles.memoryCard,
                memory.emotionalWeight === 'high' && { borderColor: realm.accent + '44' },
              ]}>
                <Text style={[styles.memoryDays, { color: realm.accentSoft }]}>{memory.daysAgo} days ago</Text>
                <Text style={styles.memoryQuote}>"{memory.quote}"</Text>
                <Text style={[styles.memoryReflection, { color: colors.textSecondary }]}>{memory.reflection}</Text>
              </GlassCard>
            ))}
          </>
        )}

        {activeTab === 'Reflections' && (
          <View style={styles.journalList}>
            {journalEntries.map((entry) => (
              <GlassCard key={entry.id} padding="md" style={styles.journalCard}>
                <View style={styles.journalTop}>
                  <Text style={[styles.journalDate, { color: colors.textSubtle }]}>{entry.date}</Text>
                  <View style={[styles.moodDot, { backgroundColor: moodColors[entry.mood] }]} />
                </View>
                <Text style={styles.journalTitle}>{entry.title}</Text>
                <Text style={[styles.journalPreview, { color: colors.textSecondary }]} numberOfLines={2}>
                  {entry.preview}
                </Text>
              </GlassCard>
            ))}
          </View>
        )}

        {activeTab === 'Insights' && (
          <GlassCard padding="lg" style={[styles.insightCard, { borderColor: realm.accent + '33' }]}>
            <Text style={[styles.insightLabel, { color: realm.accent }]}>OATH SENSES</Text>
            <Text style={styles.insightText}>{aiInsights.Vault.text}</Text>
            <View style={[styles.insightDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={[styles.openJournalBtn, { backgroundColor: realm.accent }]}>
              <Text style={styles.openJournalText}>Open Journal</Text>
            </TouchableOpacity>
          </GlassCard>
        )}

        {activeTab === 'History' && (
          <View style={styles.historyBlock}>
            <Text style={[styles.historyMeta, { color: colors.textSubtle }]}>
              OATH keeps everything. Nothing you share is forgotten.
            </Text>
            {vaultMemories.map((memory) => (
              <GlassCard key={memory.id} padding="md" style={styles.historyCard}>
                <Text style={[styles.historyDate, { color: realm.accentSoft }]}>{memory.daysAgo} days ago</Text>
                <Text style={styles.historyQuote} numberOfLines={2}>"{memory.quote}"</Text>
              </GlassCard>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  screenTitle: {
    ...typography.displayMd,
    color: colors.text,
    letterSpacing: -1,
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },
  tabScroll: {
    marginBottom: 0,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingRight: spacing.lg,
  },
  tab: {
    paddingBottom: spacing.sm,
    position: 'relative',
  },
  tabText: {
    ...typography.bodyMd,
    fontWeight: '500',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 1,
  },
  tabDivider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: 100,
  },
  remembersBlock: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  remembersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remembersLabel: {
    ...typography.labelLg,
    letterSpacing: 1.8,
  },
  remembersDate: {
    ...typography.labelSm,
    letterSpacing: 1.2,
  },
  featuredQuote: {
    fontSize: 22,
    fontWeight: '400',
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  featuredReflection: {
    ...typography.bodyMd,
    lineHeight: 22,
  },
  milestoneList: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  milestoneIconText: {
    fontSize: 16,
  },
  milestoneText: {
    flex: 1,
    gap: 2,
  },
  milestoneCategory: {
    ...typography.labelMd,
    letterSpacing: 1,
  },
  milestoneDetail: {
    ...typography.bodyMd,
    color: colors.text,
  },
  milestoneArrow: {
    fontSize: 20,
  },
  memoryCard: {
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memoryDays: {
    ...typography.labelSm,
    letterSpacing: 1.2,
  },
  memoryQuote: {
    ...typography.bodyLg,
    fontStyle: 'italic',
    color: colors.text,
    lineHeight: 24,
  },
  memoryReflection: {
    ...typography.bodySm,
    lineHeight: 19,
  },
  journalList: {
    gap: spacing.sm,
  },
  journalCard: {
    gap: spacing.xs,
  },
  journalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  journalDate: {
    ...typography.labelSm,
  },
  moodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  journalTitle: {
    ...typography.headingSm,
    color: colors.text,
  },
  journalPreview: {
    ...typography.bodySm,
    lineHeight: 19,
  },
  insightCard: {
    gap: spacing.md,
    borderWidth: 1,
  },
  insightLabel: {
    ...typography.labelLg,
    letterSpacing: 1.5,
  },
  insightText: {
    ...typography.bodyMd,
    color: colors.text,
    lineHeight: 22,
  },
  insightDivider: {
    height: StyleSheet.hairlineWidth,
  },
  openJournalBtn: {
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  openJournalText: {
    ...typography.labelLg,
    color: '#000',
    fontWeight: '700',
  },
  historyBlock: {
    gap: spacing.sm,
  },
  historyMeta: {
    ...typography.bodySm,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  historyCard: {
    gap: 4,
  },
  historyDate: {
    ...typography.labelSm,
    letterSpacing: 1,
  },
  historyQuote: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
