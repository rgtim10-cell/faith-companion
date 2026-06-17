import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Atmosphere } from '@/components/layout/Atmosphere';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { useCovenant } from '@/context/CovenantContext';
import { useRealm } from '@/context/RealmContext';
import { buildManifestations } from '@/engine/manifestation';
import {
  manifestationColor,
  manifestationLabel,
  memoryTypeColor,
  memoryTypeGlyph,
  memoryTypeLabel,
} from '@/data/memoryGraph';
import type { MemoryRecord } from '@/data/memoryGraph';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { RootStackParamList } from '@/types';

const REALM_ORDER = ['presence', 'future_self', 'mission_control', 'alignment'] as const;

/**
 * The Manifestation Engine — OATH choosing what to show you.
 *
 * Not a dashboard. Not a list. OATH selects one thing from your Memory Graph
 * and builds a living experience around it. The interface transforms per
 * manifestation type. Everything displayed is askable.
 */
export function OathScreen() {
  const { covenant, memories } = useCovenant();
  const { realm, realmKey, setRealm } = useRealm();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  const manifestations = useMemo(
    () => buildManifestations(covenant, memories),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [covenant, memories.length],
  );

  const [manifestIdx, setManifestIdx] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intensity = useRef(new Animated.Value(0.15)).current;

  const current = manifestations[manifestIdx] ?? null;
  const manifestColor = current ? manifestationColor[current.type] : realm.accent;
  const hasNext = manifestIdx < manifestations.length - 1;
  const hasPrev = manifestIdx > 0;

  // Fade in on mount
  useEffect(() => {
    Animated.timing(intensity, { toValue: 0.18, duration: 1200, useNativeDriver: true }).start();
  }, [intensity]);

  // Cross-fade when manifestation changes
  const switchTo = (idx: number) => {
    setShowExplanation(false);
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setManifestIdx(idx);
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      Animated.sequence([
        Animated.timing(intensity, { toValue: 0.35, duration: 600, useNativeDriver: true }),
        Animated.timing(intensity, { toValue: 0.18, duration: 900, useNativeDriver: true }),
      ]).start();
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const openCommunion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Communion');
  };

  if (!current) {
    return (
      <View style={styles.root}>
        <RealmBackground />
        <View style={[styles.empty, { paddingTop: insets.top + spacing.xl }]}>
          <Text style={styles.emptyText}>Tell me something, and I'll tell you what I see.</Text>
          <TouchableOpacity onPress={openCommunion} style={[styles.emptyBtn, { borderColor: realm.accent + '55' }]}>
            <Text style={[styles.emptyBtnText, { color: realm.accent }]}>Open Communion</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <RealmBackground />
      <Atmosphere intensity={intensity} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: 'rgba(255,255,255,0.3)' }]}>OATH</Text>
          <View style={[styles.realmPill, { borderColor: realm.accent + '44', backgroundColor: realm.accentMuted }]}>
            <View style={[styles.realmDot, { backgroundColor: realm.accent }]} />
            <Text style={[styles.realmPillText, { color: realm.accentSoft }]}>{realm.name}</Text>
          </View>
        </View>

        <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
          {/* Type badge */}
          <View style={styles.typeBadge}>
            <Text style={[styles.typeGlyph, { color: manifestColor }]}>
              {current.type === 'future_self' ? '◉' :
               current.type === 'evidence' ? '◆' :
               current.type === 'confidence' ? '◈' :
               current.type === 'drift' ? '▽' :
               current.type === 'truth' ? '○' :
               current.type === 'learning' ? '◎' : '◇'}
            </Text>
            <Text style={[styles.typeLabel, { color: manifestColor }]}>
              {manifestationLabel[current.type].toUpperCase()}
            </Text>
            <Text style={[styles.typeCount, { color: 'rgba(255,255,255,0.2)' }]}>
              {manifestIdx + 1} of {manifestations.length}
            </Text>
          </View>

          {/* OATH's opening */}
          <Text style={styles.opening}>{current.opening}</Text>

          {/* Supporting records */}
          {current.records.length > 0 && (
            <View style={styles.records}>
              {current.records.map((record) => (
                <MemoryCard key={record.id} record={record} accentColor={manifestColor} />
              ))}
            </View>
          )}

          {/* Explanation (expandable) */}
          {showExplanation && (
            <View style={[styles.explanationBlock, { borderColor: manifestColor + '22', backgroundColor: manifestColor + '09' }]}>
              <Text style={[styles.explanationLabel, { color: manifestColor }]}>WHY OATH SHOWED YOU THIS</Text>
              <Text style={styles.explanationText}>{current.explanation}</Text>
            </View>
          )}

          {/* Interactive prompts */}
          <View style={styles.prompts}>
            {current.prompts.map((prompt) => (
              <PromptPill
                key={prompt}
                label={prompt}
                accent={manifestColor}
                onPress={() => {
                  if (prompt === 'Why did you show me this?') {
                    setShowExplanation((v) => !v);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  } else {
                    openCommunion();
                  }
                }}
              />
            ))}
          </View>

          {/* Navigation between manifestations */}
          <View style={styles.nav}>
            <TouchableOpacity
              onPress={() => hasPrev && switchTo(manifestIdx - 1)}
              style={[styles.navBtn, !hasPrev && styles.navBtnDisabled]}
              disabled={!hasPrev}
            >
              <Text style={[styles.navArrow, { color: hasPrev ? colors.textSecondary : 'rgba(255,255,255,0.12)' }]}>←</Text>
              <Text style={[styles.navLabel, { color: hasPrev ? colors.textSubtle : 'rgba(255,255,255,0.1)' }]}>Prev</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openCommunion} style={[styles.communionBtn, { borderColor: realm.accent + '44' }]}>
              <Text style={[styles.communionBtnText, { color: realm.accentSoft }]}>Open Communion</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => hasNext && switchTo(manifestIdx + 1)}
              style={[styles.navBtn, !hasNext && styles.navBtnDisabled]}
              disabled={!hasNext}
            >
              <Text style={[styles.navLabel, { color: hasNext ? colors.textSubtle : 'rgba(255,255,255,0.1)' }]}>Next</Text>
              <Text style={[styles.navArrow, { color: hasNext ? colors.textSecondary : 'rgba(255,255,255,0.12)' }]}>→</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Realm switcher */}
        <View style={styles.realmSwitcher}>
          {REALM_ORDER.map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => setRealm(key)}
              style={[
                styles.realmDotBtn,
                {
                  backgroundColor: key === realmKey ? realm.accent : colors.surface2,
                  borderColor: key === realmKey ? realm.accent + '80' : colors.border,
                  width: key === realmKey ? 22 : 8,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function MemoryCard({ record, accentColor }: { record: MemoryRecord; accentColor: string }) {
  const typeColor = memoryTypeColor[record.type];
  const glyph = memoryTypeGlyph[record.type];
  const label = memoryTypeLabel[record.type];
  const daysAgo = Math.round((Date.now() - record.date) / (24 * 60 * 60 * 1000));

  return (
    <View style={[styles.card, { borderColor: accentColor + '1A', backgroundColor: accentColor + '08' }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardBadge}>
          <Text style={[styles.cardGlyph, { color: typeColor }]}>{glyph}</Text>
          <Text style={[styles.cardType, { color: typeColor }]}>{label.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardDate}>{daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}</Text>
      </View>
      <Text style={styles.cardContent} numberOfLines={3}>{record.content}</Text>
    </View>
  );
}

function PromptPill({ label, accent, onPress }: { label: string; accent: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[styles.pill, { borderColor: accent + '33', backgroundColor: accent + '0A' }]}>
      <Text style={[styles.pillText, { color: accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 32,
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  emptyBtnText: { ...typography.bodyMd, fontWeight: '500' },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appName: { ...typography.labelLg, fontSize: 13, letterSpacing: 3 },
  realmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  realmDot: { width: 5, height: 5, borderRadius: 3 },
  realmPillText: { ...typography.labelMd },
  // Body
  body: { gap: spacing.lg },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeGlyph: { fontSize: 16 },
  typeLabel: { ...typography.labelMd, letterSpacing: 1.8, fontSize: 11 },
  typeCount: { ...typography.labelSm, marginLeft: 'auto' },
  opening: {
    fontSize: 26,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 36,
    maxWidth: 340,
  },
  records: { gap: spacing.sm },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardGlyph: { fontSize: 13 },
  cardType: { ...typography.labelSm, letterSpacing: 1.4 },
  cardDate: { ...typography.labelSm, color: colors.textSubtle },
  cardContent: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  // Explanation
  explanationBlock: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  explanationLabel: { ...typography.labelSm, letterSpacing: 1.6 },
  explanationText: { ...typography.bodySm, color: colors.textSecondary, lineHeight: 19 },
  // Prompts
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillText: { ...typography.bodySm, fontWeight: '500' },
  // Navigation
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: spacing.xs },
  navBtnDisabled: { opacity: 0.3 },
  navArrow: { fontSize: 18 },
  navLabel: { ...typography.bodySm, fontWeight: '500' },
  communionBtn: {
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  communionBtnText: { ...typography.bodyMd, fontWeight: '500' },
  // Realm switcher
  realmSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  realmDotBtn: {
    height: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
});
