import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRealm } from '@/context/RealmContext';
import { useCovenant } from '@/context/CovenantContext';
import { computeOathState } from '@/engine/oathState';
import { computeSignificance } from '@/engine/memoryEvolution';
import { memoryTypeGlyph, memoryTypeLabel } from '@/data/memoryGraph';
import { colors, radius, spacing, typography } from '@/design/tokens';

const TABS = ['Memories', 'Reflections', 'Insights', 'History'] as const;
type Tab = typeof TABS[number];

function daysAgoLabel(date: number): string {
  const d = Math.round((Date.now() - date) / (24 * 60 * 60 * 1000));
  if (d === 0) return 'Today';
  if (d === 1) return 'Yesterday';
  return `${d} days ago`;
}

export function VaultScreen() {
  const { realm } = useRealm();
  const { covenant, memories, feedback } = useCovenant();
  const [activeTab, setActiveTab] = useState<Tab>('Memories');

  const oathState = useMemo(
    () => computeOathState(memories, covenant, feedback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memories.length, covenant?.id, feedback.length],
  );

  // Non-promise memories sorted by significance descending
  const meaningfulMemories = useMemo(
    () =>
      memories
        .filter((m) => m.type !== 'promise')
        .sort((a, b) => computeSignificance(b) - computeSignificance(a)),
    [memories],
  );

  const featuredMemory = meaningfulMemories[0] ?? null;

  // Evidence + breakthrough for milestone strip
  const milestoneMemories = useMemo(
    () =>
      meaningfulMemories
        .filter((m) => m.type === 'evidence' || m.type === 'breakthrough')
        .slice(0, 4),
    [meaningfulMemories],
  );

  // Reflection entries for the Reflections tab
  const reflectionMemories = useMemo(
    () => memories.filter((m) => m.type === 'reflection').sort((a, b) => b.date - a.date),
    [memories],
  );

  // All memories for History tab
  const allChronological = useMemo(
    () => [...memories].sort((a, b) => b.date - a.date),
    [memories],
  );

  // OATH SENSES — generated from real patterns
  const insightText = useMemo(() => {
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const recentBreakthroughs = memories.filter(
      (m) => m.type === 'breakthrough' && m.date > now - 21 * DAY,
    ).length;
    const totalEvidence = memories.filter((m) => m.type === 'evidence').length;
    const totalReflections = memories.filter((m) => m.type === 'reflection').length;
    const totalStruggles = memories.filter((m) => m.type === 'struggle').length;
    const recentStruggles = memories.filter(
      (m) => m.type === 'struggle' && m.date > now - 21 * DAY,
    ).length;

    if (memories.length < 3) {
      return 'The record is still forming. OATH is watching for patterns.';
    }
    if (oathState.key === 'proud' || oathState.key === 'encouraged') {
      if (recentBreakthroughs >= 2) {
        return `${recentBreakthroughs} breakthroughs in the last three weeks. The pattern is not accidental — this is what consistency looks like from the outside.`;
      }
      if (totalEvidence >= 3) {
        return `${totalEvidence} pieces of evidence in the record. The proof is accumulating. What you are becoming is already documented here.`;
      }
      return 'The record shows forward movement. OATH is watching what comes next.';
    }
    if (oathState.key === 'concerned') {
      if (recentStruggles > recentBreakthroughs) {
        return `${recentStruggles} struggles in the last three weeks. OATH is not measuring the pause — it is watching the return.`;
      }
      return 'This is a quiet period. Quiet is not the same as stopped.';
    }
    if (totalStruggles > 0 && totalEvidence > 0) {
      return `${totalEvidence} evidence records against ${totalStruggles} struggle records. The ratio matters less than the direction. OATH watches the direction.`;
    }
    if (totalReflections >= 3) {
      return `${totalReflections} reflections in the record. The discipline of observation is rare — most people act without ever noticing what they see.`;
    }
    return 'OATH holds every entry. None of it fades. When the record is ready, patterns will surface here.';
  }, [memories, oathState]);

  return (
    <ScreenWrapper scrollable={false}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Vault</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
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
            {featuredMemory ? (
              <>
                {/* Featured — highest significance memory */}
                <View style={styles.remembersBlock}>
                  <View style={styles.remembersHeader}>
                    <Text style={[styles.remembersLabel, { color: realm.accent }]}>OATH REMEMBERS</Text>
                    <Text style={[styles.remembersDate, { color: colors.textSubtle }]}>
                      {daysAgoLabel(featuredMemory.date).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.featuredQuote}>"{featuredMemory.content}"</Text>
                  {featuredMemory.oathInterpretation ? (
                    <Text style={[styles.featuredReflection, { color: colors.textSecondary }]}>
                      {featuredMemory.oathInterpretation}
                    </Text>
                  ) : null}
                </View>

                {/* Milestone strip — evidence and breakthroughs */}
                {milestoneMemories.length > 0 && (
                  <View style={styles.milestoneList}>
                    {milestoneMemories.map((item) => (
                      <GlassCard key={item.id} padding="md" style={styles.milestoneCard}>
                        <View style={[styles.milestoneIcon, { backgroundColor: realm.accentMuted }]}>
                          <Text style={[styles.milestoneIconText, { color: realm.accent }]}>
                            {memoryTypeGlyph[item.type]}
                          </Text>
                        </View>
                        <View style={styles.milestoneText}>
                          <Text style={[styles.milestoneCategory, { color: realm.accentSoft }]}>
                            {memoryTypeLabel[item.type]}
                          </Text>
                          <Text style={styles.milestoneDetail} numberOfLines={1}>{item.title}</Text>
                        </View>
                        <Text style={[styles.milestoneDate, { color: colors.textSubtle }]}>
                          {daysAgoLabel(item.date)}
                        </Text>
                      </GlassCard>
                    ))}
                  </View>
                )}

                {/* Remaining memories */}
                {meaningfulMemories.slice(1).map((memory) => (
                  <GlassCard
                    key={memory.id}
                    padding="lg"
                    style={[
                      styles.memoryCard,
                      computeSignificance(memory) >= 0.75 && { borderColor: realm.accent + '33', borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.memoryDays, { color: realm.accentSoft }]}>
                      {daysAgoLabel(memory.date)}
                    </Text>
                    <Text style={styles.memoryQuote}>"{memory.content}"</Text>
                    {memory.oathInterpretation ? (
                      <Text style={[styles.memoryReflection, { color: colors.textSecondary }]}>
                        {memory.oathInterpretation}
                      </Text>
                    ) : null}
                  </GlassCard>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyGlyph}>◇</Text>
                <Text style={styles.emptyTitle}>The record is empty.</Text>
                <Text style={styles.emptySub}>
                  OATH is watching. Share something in Communion{'\n'}and it will begin to remember.
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'Reflections' && (
          <>
            {reflectionMemories.length > 0 ? (
              <View style={styles.journalList}>
                {reflectionMemories.map((entry) => {
                  const d = new Date(entry.date);
                  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <GlassCard key={entry.id} padding="md" style={styles.journalCard}>
                      <View style={styles.journalTop}>
                        <Text style={[styles.journalDate, { color: colors.textSubtle }]}>{dateStr}</Text>
                        <Text style={[styles.journalTypeTag, { color: realm.accentSoft }]}>
                          {memoryTypeGlyph[entry.type]}
                        </Text>
                      </View>
                      <Text style={styles.journalTitle}>{entry.title}</Text>
                      <Text style={[styles.journalPreview, { color: colors.textSecondary }]} numberOfLines={3}>
                        {entry.content}
                      </Text>
                    </GlassCard>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyGlyph}>○</Text>
                <Text style={styles.emptyTitle}>No reflections yet.</Text>
                <Text style={styles.emptySub}>
                  Night reflection seals each day.{'\n'}OATH keeps what you share there.
                </Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'Insights' && (
          <GlassCard padding="lg" style={[styles.insightCard, { borderColor: realm.accent + '33' }]}>
            <Text style={[styles.insightLabel, { color: realm.accent }]}>OATH SENSES</Text>
            <Text style={styles.insightText}>{insightText}</Text>
          </GlassCard>
        )}

        {activeTab === 'History' && (
          <View style={styles.historyBlock}>
            {allChronological.length > 0 ? (
              <>
                <Text style={[styles.historyMeta, { color: colors.textSubtle }]}>
                  OATH keeps everything. Nothing you share is forgotten.
                </Text>
                {allChronological.map((memory) => (
                  <GlassCard key={memory.id} padding="md" style={styles.historyCard}>
                    <View style={styles.historyRow}>
                      <Text style={[styles.historyGlyph, { color: realm.accentSoft }]}>
                        {memoryTypeGlyph[memory.type]}
                      </Text>
                      <View style={styles.historyBody}>
                        <Text style={[styles.historyDate, { color: realm.accentSoft }]}>
                          {daysAgoLabel(memory.date)}
                        </Text>
                        <Text style={styles.historyQuote} numberOfLines={2}>
                          "{memory.content}"
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyGlyph}>◈</Text>
                <Text style={styles.emptyTitle}>Nothing in the record yet.</Text>
                <Text style={styles.emptySub}>
                  Everything you share with OATH lives here.{'\n'}It begins the moment you speak.
                </Text>
              </View>
            )}
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

  // Memories tab
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
  milestoneDate: {
    ...typography.labelSm,
    flexShrink: 0,
  },
  memoryCard: {
    gap: spacing.xs,
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

  // Reflections tab
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
  journalTypeTag: {
    fontSize: 12,
  },
  journalTitle: {
    ...typography.headingSm,
    color: colors.text,
  },
  journalPreview: {
    ...typography.bodySm,
    lineHeight: 19,
  },

  // Insights tab
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

  // History tab
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
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  historyGlyph: {
    fontSize: 14,
    marginTop: 2,
    flexShrink: 0,
  },
  historyBody: {
    flex: 1,
    gap: 2,
  },
  historyDate: {
    ...typography.labelSm,
    letterSpacing: 1,
  },
  historyQuote: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.xxl * 1.5,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyGlyph: {
    fontSize: 28,
    color: 'rgba(255,255,255,0.2)',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    color: colors.textSubtle,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 280,
  },
});
