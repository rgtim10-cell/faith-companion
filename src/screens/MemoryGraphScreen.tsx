import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { useCovenant } from '@/context/CovenantContext';
import { useRealm } from '@/context/RealmContext';
import {
  memoryTypeColor,
  memoryTypeGlyph,
  memoryTypeLabel,
} from '@/data/memoryGraph';
import type { MemoryRecord, MemoryType } from '@/data/memoryGraph';
import { computeSignificance, significanceLevel, SIGNIFICANCE_LABEL } from '@/engine/memoryEvolution';
import { colors, radius, spacing, typography } from '@/design/tokens';

const FILTERS: { type: MemoryType | 'all'; label: string }[] = [
  { type: 'all', label: 'All' },
  { type: 'promise', label: 'Promises' },
  { type: 'evidence', label: 'Evidence' },
  { type: 'breakthrough', label: 'Breakthroughs' },
  { type: 'struggle', label: 'Struggles' },
  { type: 'truth', label: 'Truths' },
  { type: 'reflection', label: 'Reflections' },
];

function relativeDate(ts: number): string {
  const days = Math.round((Date.now() - ts) / (24 * 60 * 60 * 1000));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

function groupByDay(records: MemoryRecord[]): [string, MemoryRecord[]][] {
  const groups = new Map<string, MemoryRecord[]>();
  for (const r of records) {
    const d = relativeDate(r.date);
    const existing = groups.get(d) ?? [];
    existing.push(r);
    groups.set(d, existing);
  }
  return Array.from(groups.entries());
}

/**
 * Memory Graph — the archive of what OATH keeps.
 *
 * Not a feed. Not a gallery. A living record of who you are becoming —
 * promises made, evidence gathered, struggles named, truths realized.
 * Every record here was witnessed, not filed.
 */
export function MemoryGraphScreen() {
  const { memories, covenant } = useCovenant();
  const { realm } = useRealm();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<MemoryType | 'all'>('all');

  const filtered = filter === 'all' ? memories : memories.filter((m) => m.type === filter);
  const sorted = [...filtered].sort((a, b) => b.date - a.date);
  const groups = groupByDay(sorted);

  const counts: Partial<Record<MemoryType, number>> = {};
  memories.forEach((m) => { counts[m.type] = (counts[m.type] ?? 0) + 1; });

  return (
    <View style={styles.root}>
      <RealmBackground />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerLabel, { color: 'rgba(255,255,255,0.3)' }]}>OATH</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Memory</Text>
            <View style={[styles.countBadge, { backgroundColor: realm.accentMuted, borderColor: realm.accent + '44' }]}>
              <Text style={[styles.countText, { color: realm.accentSoft }]}>{memories.length}</Text>
            </View>
          </View>
          {covenant && (
            <View style={styles.covenantBlock}>
              <Text style={[styles.covenantLabel, { color: realm.accentSoft }]}>YOUR COVENANT</Text>
              <Text style={styles.covenantText}>"{covenant.promise}"</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow} contentContainerStyle={styles.statsRowContent}>
          {(Object.entries(counts) as [MemoryType, number][]).map(([type, count]) => (
            <View key={type} style={[styles.statChip, { borderColor: memoryTypeColor[type] + '33' }]}>
              <Text style={[styles.statGlyph, { color: memoryTypeColor[type] }]}>{memoryTypeGlyph[type]}</Text>
              <Text style={[styles.statCount, { color: memoryTypeColor[type] }]}>{count}</Text>
              <Text style={styles.statLabel}>{memoryTypeLabel[type]}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {FILTERS.map(({ type, label }) => {
            const on = filter === type;
            const accent = type !== 'all' ? memoryTypeColor[type as MemoryType] : realm.accent;
            return (
              <TouchableOpacity
                key={type}
                onPress={() => setFilter(type)}
                style={[
                  styles.filterChip,
                  on
                    ? { backgroundColor: accent + '18', borderColor: accent + '55' }
                    : { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' },
                ]}
              >
                <Text style={[styles.filterLabel, { color: on ? accent : colors.textSubtle }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Memory timeline */}
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyGlyph}>◇</Text>
            <Text style={styles.emptyText}>Your memories appear as you confide in OATH.</Text>
          </View>
        ) : (
          <View style={styles.timeline}>
            {groups.map(([day, records]) => (
              <View key={day} style={styles.group}>
                <Text style={styles.groupDate}>{day.toUpperCase()}</Text>
                {records.map((record) => (
                  <MemoryRow key={record.id} record={record} />
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function MemoryRow({ record }: { record: MemoryRecord }) {
  const [expanded, setExpanded] = useState(false);
  const color = memoryTypeColor[record.type];
  const glyph = memoryTypeGlyph[record.type];
  const label = memoryTypeLabel[record.type];

  return (
    <TouchableOpacity
      onPress={() => setExpanded((v) => !v)}
      style={[styles.row, { borderColor: color + '1A', backgroundColor: color + '06' }]}
      activeOpacity={0.8}
    >
      <View style={styles.rowLeft}>
        <Text style={[styles.rowGlyph, { color }]}>{glyph}</Text>
        <View style={[styles.rowLine, { backgroundColor: color + '22' }]} />
      </View>
      <View style={styles.rowRight}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowType, { color }]}>{label.toUpperCase()}</Text>
          {record.source === 'communion' && (
            <Text style={styles.rowSource}>Communion</Text>
          )}
          {record.source === 'evidence_upload' && (
            <Text style={styles.rowSource}>Evidence</Text>
          )}
          {record.linkedPromiseId && (
            <View style={[styles.linkedBadge, { backgroundColor: '#8B5CF620', borderColor: '#8B5CF644' }]}>
              <Text style={styles.linkedText}>◈ Linked</Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.rowContent, computeSignificance(record) >= 0.75 && styles.rowContentSignificant]}
          numberOfLines={expanded ? undefined : 2}
        >
          {record.content}
        </Text>
        {(() => {
          const sig = computeSignificance(record);
          const level = significanceLevel(sig);
          if (sig < 0.55) return null;
          const label = record.isFoundational
            ? 'Foundational'
            : record.isCarryForward
            ? 'Carried forward'
            : SIGNIFICANCE_LABEL[level];
          return (
            <View style={styles.weightRow}>
              <View style={[styles.weightDot, { backgroundColor: color }]} />
              <Text style={[styles.weightLabel, { color }]}>{label}</Text>
            </View>
          );
        })()}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },
  header: { marginBottom: spacing.lg, gap: spacing.sm },
  headerLabel: { ...typography.labelSm, letterSpacing: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: 28, fontWeight: '500', color: colors.text, letterSpacing: -0.6 },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  countText: { ...typography.labelMd, fontWeight: '700' },
  covenantBlock: {
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  covenantLabel: { ...typography.labelSm, letterSpacing: 1.6 },
  covenantText: {
    fontSize: 15,
    fontStyle: 'italic',
    fontWeight: '300',
    color: colors.textSecondary,
    lineHeight: 22,
    maxWidth: 320,
  },
  statsRow: { marginBottom: spacing.md },
  statsRowContent: { gap: spacing.sm, paddingRight: spacing.lg },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statGlyph: { fontSize: 13 },
  statCount: { fontSize: 13, fontWeight: '700' },
  statLabel: { ...typography.labelSm, color: colors.textSubtle },
  filterRow: { marginBottom: spacing.lg },
  filterContent: { gap: spacing.sm, paddingRight: spacing.lg },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterLabel: { ...typography.bodySm, fontWeight: '500' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyGlyph: { fontSize: 32, color: colors.textSubtle },
  emptyText: { ...typography.bodyMd, color: colors.textSecondary, textAlign: 'center', maxWidth: 260 },
  timeline: { gap: spacing.lg },
  group: { gap: spacing.sm },
  groupDate: { ...typography.labelSm, color: colors.textSubtle, letterSpacing: 1.4, paddingBottom: spacing.xs },
  row: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    gap: spacing.sm,
    padding: spacing.md,
  },
  rowLeft: { alignItems: 'center', gap: 4 },
  rowGlyph: { fontSize: 16 },
  rowLine: { width: 1, flex: 1 },
  rowRight: { flex: 1, gap: 5 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  rowType: { ...typography.labelSm, letterSpacing: 1.4 },
  rowSource: { ...typography.labelSm, color: colors.textSubtle },
  linkedBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  linkedText: { fontSize: 10, fontWeight: '600', color: '#A78BFA', letterSpacing: 0.8 },
  rowContent: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  rowContentSignificant: {
    fontSize: 16,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: -0.2,
  },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  weightDot: { width: 5, height: 5, borderRadius: 3 },
  weightLabel: { ...typography.labelSm, letterSpacing: 0.6 },
});
