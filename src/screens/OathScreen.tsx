import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Atmosphere } from '@/components/layout/Atmosphere';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { useCovenant } from '@/context/CovenantContext';
import { useRealm } from '@/context/RealmContext';
import { buildManifestations, findManifestationOfType } from '@/engine/manifestation';
import type { FeedbackReaction, ManifestationType, MemoryRecord } from '@/data/memoryGraph';
import {
  manifestationLabel,
  memoryTypeColor,
  memoryTypeGlyph,
  memoryTypeLabel,
} from '@/data/memoryGraph';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { RootStackParamList } from '@/types';

// ── Manifestation identity ────────────────────────────────────
// Each type has a distinct visual character. Not just a color —
// a feeling: weight of the text, warmth of the light, glyph that
// marks its kind.

interface ManifestationTheme {
  accent: string;
  glyph: string;
  bloomOpacity: number;    // how strongly the accent bleeds into the space
  voiceFontSize: number;
  voiceFontWeight: '300' | '400' | '500';
  voiceLineHeight: number;
  voiceLetterSpacing: number;
}

const THEMES: Record<ManifestationType, ManifestationTheme> = {
  evidence: {
    accent: '#34D399',
    glyph: '◆',
    bloomOpacity: 0.11,
    voiceFontSize: 28,
    voiceFontWeight: '400',
    voiceLineHeight: 40,
    voiceLetterSpacing: -0.6,
  },
  confidence: {
    accent: '#FBBF24',
    glyph: '◈',
    bloomOpacity: 0.15,
    voiceFontSize: 30,
    voiceFontWeight: '500',
    voiceLineHeight: 42,
    voiceLetterSpacing: -0.8,
  },
  truth: {
    // Truth is quiet. Less light, smaller voice, more space.
    accent: '#93C5FD',
    glyph: '○',
    bloomOpacity: 0.04,
    voiceFontSize: 24,
    voiceFontWeight: '300',
    voiceLineHeight: 36,
    voiceLetterSpacing: -0.2,
  },
  drift: {
    // Drift is a soft warning — orange, not red. Honest, not alarming.
    accent: '#F97316',
    glyph: '▽',
    bloomOpacity: 0.09,
    voiceFontSize: 26,
    voiceFontWeight: '400',
    voiceLineHeight: 38,
    voiceLetterSpacing: -0.4,
  },
  future_self: {
    accent: '#4D8CFF',
    glyph: '◉',
    bloomOpacity: 0.14,
    voiceFontSize: 28,
    voiceFontWeight: '400',
    voiceLineHeight: 40,
    voiceLetterSpacing: -0.6,
  },
  memory: {
    // Memory is sacred. Warmer light, italic voice, room barely breathing.
    accent: '#D4A853',
    glyph: '◇',
    bloomOpacity: 0.07,
    voiceFontSize: 25,
    voiceFontWeight: '300',
    voiceLineHeight: 37,
    voiceLetterSpacing: -0.3,
  },
  learning: {
    accent: '#F472B6',
    glyph: '◎',
    bloomOpacity: 0.09,
    voiceFontSize: 26,
    voiceFontWeight: '400',
    voiceLineHeight: 38,
    voiceLetterSpacing: -0.4,
  },
  chain: {
    // Evidence Chain — the full arc. Gold. Heavier than truth, quieter than confidence.
    accent: '#D4A853',
    glyph: '◇',
    bloomOpacity: 0.1,
    voiceFontSize: 26,
    voiceFontWeight: '300',
    voiceLineHeight: 37,
    voiceLetterSpacing: -0.3,
  },
};

/**
 * The Manifestation Engine — OATH's center.
 *
 * Not a screen you visit. A space OATH shapes around what it wants to show
 * you. The interface transforms per manifestation type. Everything displayed
 * is askable. OATH speaks first; you respond or move on.
 */
export function OathScreen() {
  const { covenant, memories, feedback, addFeedback, addMemory } = useCovenant();
  const { realm } = useRealm();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();

  const allManifestations = useMemo(
    () => buildManifestations(covenant, memories, feedback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [covenant?.id, memories.length, feedback.length],
  );

  const [manifestIdx, setManifestIdx] = useState(0);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [savedAsEvidence, setSavedAsEvidence] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState<Partial<Record<ManifestationType, FeedbackReaction>>>({});

  const current = allManifestations[Math.min(manifestIdx, allManifestations.length - 1)] ?? null;
  const theme = current ? THEMES[current.type] : THEMES.future_self;

  // Animation layers
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const bloomAnim = useRef(new Animated.Value(0)).current;
  const intensity = useRef(new Animated.Value(0)).current;

  // Entrance — bloom in on first focus.
  useFocusEffect(
    useCallback(() => {
      setActiveCardId(null);
      setShowExplanation(false);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(intensity, { toValue: 0.18, duration: 1400, useNativeDriver: true }),
      ]).start();
      bloomAnim.setValue(theme.bloomOpacity);
    }, [theme.bloomOpacity, fadeAnim, bloomAnim, intensity]),
  );

  const handleFeedback = (reaction: FeedbackReaction) => {
    if (!current) return;
    addFeedback({ type: current.type, reaction });
    setFeedbackGiven((prev) => ({ ...prev, [current.type]: reaction }));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const switchTo = (idx: number) => {
    setActiveCardId(null);
    setShowExplanation(false);

    Animated.timing(fadeAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setManifestIdx(idx);
      const nextTheme = THEMES[allManifestations[idx]?.type ?? 'future_self'];
      bloomAnim.setValue(nextTheme.bloomOpacity);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(intensity, { toValue: 0.32, duration: 500, useNativeDriver: true }),
          Animated.timing(intensity, { toValue: 0.18, duration: 800, useNativeDriver: true }),
        ]),
      ]).start();
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  // Triggered experiences — OATH responds to how the user is feeling.
  const handleShowMe = () => {
    const next = (Math.min(manifestIdx, allManifestations.length - 1) + 1) % allManifestations.length;
    switchTo(next);
  };

  const handleMotivation = () => {
    switchTo(findManifestationOfType(allManifestations, ['confidence', 'evidence']));
  };

  const handleDrift = () => {
    switchTo(findManifestationOfType(allManifestations, ['drift', 'truth']));
  };

  const handleSaveAsEvidence = (record: MemoryRecord) => {
    if (savedAsEvidence.has(record.id)) return;
    addMemory({
      type: 'evidence',
      title: record.title,
      content: record.content,
      emotionalWeight: Math.min(1, record.emotionalWeight + 0.1),
      source: 'evidence_upload',
      realm: record.realm,
      linkedPromiseId: covenant?.id,
    });
    setSavedAsEvidence((prev) => new Set([...prev, record.id]));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const openCommunion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Communion');
  };

  if (!current) {
    return (
      <View style={styles.root}>
        <RealmBackground />
        <View style={[styles.emptyState, { paddingTop: insets.top + spacing.xxl }]}>
          <Text style={styles.emptyText}>
            Tell me something, and I'll tell you what I see.
          </Text>
          <TouchableOpacity onPress={openCommunion}
            style={[styles.emptyBtn, { borderColor: realm.accent + '55' }]}
            activeOpacity={0.75}>
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

      {/* Type-specific atmospheric bloom — the space takes on the manifestation's color */}
      <Animated.View
        style={[styles.bloom, { backgroundColor: theme.accent, opacity: bloomAnim }]}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.wordmark}>OATH</Text>
          <Animated.View style={[styles.typeBadge, { borderColor: theme.accent + '44', opacity: fadeAnim }]}>
            <Text style={[styles.typeBadgeGlyph, { color: theme.accent }]}>{theme.glyph}</Text>
            <Text style={[styles.typeBadgeLabel, { color: theme.accent }]}>
              {manifestationLabel[current.type].toUpperCase()}
            </Text>
            {allManifestations.length > 1 && (
              <Text style={styles.typeBadgeCount}>
                {Math.min(manifestIdx, allManifestations.length - 1) + 1}/{allManifestations.length}
              </Text>
            )}
          </Animated.View>
        </View>

        {/* Opening — what OATH chose to say. The primary experience. */}
        <Animated.View style={[styles.opening, { minHeight: H * 0.36, opacity: fadeAnim }]}>
          <Text
            style={[
              styles.openingText,
              {
                fontSize: theme.voiceFontSize,
                fontWeight: theme.voiceFontWeight,
                lineHeight: theme.voiceLineHeight,
                letterSpacing: theme.voiceLetterSpacing,
                fontStyle: current.type === 'memory' ? 'italic' : 'normal',
              },
            ]}
          >
            {current.opening}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.body, { opacity: fadeAnim }]}>
          {/* Supporting records — chain gets a timeline; others get expandable cards */}
          {current.records.length > 0 && (
            <View style={styles.records}>
              <View style={[styles.recordsDivider, { backgroundColor: theme.accent + '30' }]} />
              {current.type === 'chain' ? (
                <ChainTimeline
                  records={current.records}
                  accent={theme.accent}
                />
              ) : (
                current.records.map((record) => (
                  <ExpandableCard
                    key={record.id}
                    record={record}
                    accent={theme.accent}
                    isActive={activeCardId === record.id}
                    isSaved={savedAsEvidence.has(record.id)}
                    onToggle={() => {
                      setActiveCardId((id) => (id === record.id ? null : record.id));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }}
                    onWhyThis={() => { setShowExplanation((v) => !v); setActiveCardId(null); }}
                    onConnectCovenant={openCommunion}
                    onSaveEvidence={() => handleSaveAsEvidence(record)}
                    onDisagree={openCommunion}
                  />
                ))
              )}
            </View>
          )}

          {/* Why This Matters — connects this manifestation to the covenant */}
          <WhyThisMatters
            type={current.type}
            promise={covenant?.promise ?? null}
            accent={theme.accent}
          />

          {/* Why OATH showed this — expands inline */}
          {showExplanation && (
            <View style={[styles.explanation, { borderColor: theme.accent + '20', backgroundColor: theme.accent + '08' }]}>
              <Text style={[styles.explanationLabel, { color: theme.accent }]}>
                WHY OATH SHOWED YOU THIS
              </Text>
              <Text style={styles.explanationText}>{current.explanation}</Text>
              <TouchableOpacity onPress={() => setShowExplanation(false)} hitSlop={8}>
                <Text style={[styles.explanationClose, { color: theme.accent }]}>Close ↑</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Prompt pills */}
          <View style={styles.prompts}>
            {current.prompts.map((prompt) => (
              <PromptPill
                key={prompt}
                label={prompt}
                accent={theme.accent}
                onPress={() => {
                  if (prompt.toLowerCase().includes('why')) {
                    setShowExplanation((v) => !v);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  } else {
                    openCommunion();
                  }
                }}
              />
            ))}
          </View>

          {/* Feedback — teaches OATH what resonates */}
          <FeedbackRow
            given={feedbackGiven[current.type] ?? null}
            accent={theme.accent}
            onReact={handleFeedback}
          />

          {/* Triggers — summoning OATH's perspective */}
          <View style={styles.triggers}>
            <View style={[styles.triggerDivider, { backgroundColor: 'rgba(255,255,255,0.06)' }]} />
            <TriggerRow label="Show me what you see" sub="OATH selects something from your Memory" onPress={handleShowMe} />
            <TriggerRow label="I need motivation" sub="OATH surfaces your own evidence and proof" onPress={handleMotivation} />
            <TriggerRow label="I'm drifting" sub="OATH names what it sees honestly" onPress={handleDrift} />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────

// Evidence Chain timeline — vertical arc from promise to latest evidence.
function ChainTimeline({ records, accent }: { records: MemoryRecord[]; accent: string }) {
  return (
    <View style={chainStyles.container}>
      {records.map((record, i) => {
        const isLast = i === records.length - 1;
        const typeColor = memoryTypeColor[record.type];
        const glyph = memoryTypeGlyph[record.type];
        const daysAgo = Math.round((Date.now() - record.date) / (24 * 60 * 60 * 1000));

        return (
          <View key={record.id} style={chainStyles.node}>
            {/* Vertical connector line */}
            {!isLast && (
              <View style={[chainStyles.line, { backgroundColor: accent + '28' }]} />
            )}
            {/* Glyph node */}
            <View style={[chainStyles.glyphCircle, { borderColor: typeColor + '55', backgroundColor: typeColor + '10' }]}>
              <Text style={[chainStyles.glyphText, { color: typeColor }]}>{glyph}</Text>
            </View>
            {/* Content */}
            <View style={chainStyles.nodeContent}>
              <View style={chainStyles.nodeHeader}>
                <Text style={[chainStyles.nodeType, { color: typeColor }]}>
                  {memoryTypeLabel[record.type].toUpperCase()}
                </Text>
                <Text style={chainStyles.nodeDate}>
                  {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
                </Text>
              </View>
              <Text style={chainStyles.nodeContent2} numberOfLines={3}>
                {record.content}
              </Text>
              {/* Memory resonance indicator — shows when a record links to the covenant */}
              {record.tags?.includes('covenant') || record.linkedPromiseId ? (
                <View style={chainStyles.resonanceRow}>
                  <View style={[chainStyles.resonanceDot, { backgroundColor: accent }]} />
                  <Text style={[chainStyles.resonanceLabel, { color: accent }]}>
                    Resonates with your covenant
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const chainStyles = StyleSheet.create({
  container: { gap: 0 },
  node: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 16,
    position: 'relative',
  },
  line: {
    position: 'absolute',
    left: 15,
    top: 28,
    width: 1,
    bottom: 0,
  },
  glyphCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  glyphText: { fontSize: 13 },
  nodeContent: { flex: 1, gap: 4 },
  nodeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nodeType: { fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },
  nodeDate: { fontSize: 11, color: 'rgba(255,255,255,0.28)' },
  nodeContent2: { fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 20, letterSpacing: -0.1 },
  resonanceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  resonanceDot: { width: 5, height: 5, borderRadius: 3 },
  resonanceLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2, opacity: 0.8 },
});

// Why This Matters — connects the manifestation to the user's covenant.
// Not a technical explanation (that's "Why OATH showed you this") —
// this is the emotional significance of what OATH is surfacing.
const WHY_THIS_MATTERS: Partial<Record<ManifestationType, (promise: string | null) => string>> = {
  chain: (p) =>
    p
      ? `This arc was built by you — through struggle, proof, and clarity. It is the lived shape of "${p.slice(0, 60)}${p.length > 60 ? '...' : ''}"`
      : 'This arc is the lived shape of your transformation. Not a summary — a record of the real thing.',
  evidence: () =>
    'Evidence is not about feeling good. It is about knowing what is true. What you have done cannot be undone.',
  confidence: () =>
    'Confidence built from your own record is different from motivation. It does not require a feeling. It only requires a look at what you have already done.',
  drift: () =>
    'Naming drift is not defeat. It is the first act of return. OATH shows this because you asked for truth, not comfort.',
  truth: () =>
    'Realizations do not expire. This one is still shaping decisions — you may not notice it, but OATH does.',
  memory: () =>
    'Some things are worth keeping exactly as they were. Not revised. Not improved. Just held.',
  learning: () =>
    'Patterns only become visible with enough data. You have generated enough. What you do next with this is up to you.',
  future_self: (p) =>
    p
      ? `The version of you who said "${p.slice(0, 50)}${p.length > 50 ? '...' : ''}" — you are already that person. The gap is smaller than you think.`
      : 'You are already further than where you started. The version of you who began this journey would recognize what you have become.',
};

function WhyThisMatters({
  type,
  promise,
  accent,
}: {
  type: ManifestationType;
  promise: string | null;
  accent: string;
}) {
  const text = WHY_THIS_MATTERS[type]?.(promise);
  if (!text) return null;

  return (
    <View style={[wtmStyles.container, { borderLeftColor: accent + '50' }]}>
      <Text style={[wtmStyles.label, { color: accent }]}>WHY THIS MATTERS</Text>
      <Text style={wtmStyles.text}>{text}</Text>
    </View>
  );
}

const wtmStyles = StyleSheet.create({
  container: {
    borderLeftWidth: 2,
    paddingLeft: 14,
    gap: 6,
  },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8 },
  text: { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 21, letterSpacing: -0.1 },
});

// Feedback row — teaches OATH what resonates.
const FEEDBACK_LABELS: Record<FeedbackReaction, string> = {
  resonated: 'That resonated',
  not_relevant: 'Not relevant',
  more: 'Tell me more',
  disagree: 'I disagree',
};

function FeedbackRow({
  given,
  accent,
  onReact,
}: {
  given: FeedbackReaction | null;
  accent: string;
  onReact: (r: FeedbackReaction) => void;
}) {
  return (
    <View style={fbStyles.container}>
      <Text style={fbStyles.label}>
        {given ? '◆ OATH will remember that' : 'Did this resonate?'}
      </Text>
      {!given && (
        <View style={fbStyles.pills}>
          {(Object.keys(FEEDBACK_LABELS) as FeedbackReaction[]).map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => onReact(r)}
              style={[
                fbStyles.pill,
                { borderColor: accent + '35', backgroundColor: accent + '09' },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[fbStyles.pillText, { color: accent }]}>{FEEDBACK_LABELS[r]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const fbStyles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: 0.4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 99,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: '500', letterSpacing: 0.1 },
});

function ExpandableCard({
  record,
  accent,
  isActive,
  isSaved,
  onToggle,
  onWhyThis,
  onConnectCovenant,
  onSaveEvidence,
  onDisagree,
}: {
  record: MemoryRecord;
  accent: string;
  isActive: boolean;
  isSaved: boolean;
  onToggle: () => void;
  onWhyThis: () => void;
  onConnectCovenant: () => void;
  onSaveEvidence: () => void;
  onDisagree: () => void;
}) {
  const typeColor = memoryTypeColor[record.type];
  const glyph = memoryTypeGlyph[record.type];
  const label = memoryTypeLabel[record.type];
  const daysAgo = Math.round((Date.now() - record.date) / (24 * 60 * 60 * 1000));

  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.82}
      style={[styles.card, { borderColor: accent + '1E', backgroundColor: accent + '07' }]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardBadge}>
          <Text style={[styles.cardGlyph, { color: typeColor }]}>{glyph}</Text>
          <Text style={[styles.cardType, { color: typeColor }]}>{label.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardDate}>
          {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
        </Text>
      </View>
      <Text style={styles.cardContent} numberOfLines={isActive ? undefined : 2}>
        {record.content}
      </Text>

      {/* Memory Resonance — surfaces when this memory connects to the covenant */}
      {record.linkedPromiseId && !isActive && (
        <View style={styles.resonanceRow}>
          <View style={[styles.resonanceDot, { backgroundColor: accent }]} />
          <Text style={[styles.resonanceText, { color: accent }]}>Resonates with your covenant</Text>
        </View>
      )}

      {isActive && (
        <View style={styles.cardActions}>
          <ActionPill label="Why did you show me this?" accent={accent} onPress={onWhyThis} />
          <ActionPill label="Connect to my covenant" accent={accent} onPress={onConnectCovenant} />
          {!isSaved && record.type !== 'evidence' && (
            <ActionPill label="Save as evidence" accent="#34D399" onPress={onSaveEvidence} />
          )}
          {isSaved && (
            <Text style={styles.savedConfirm}>◆ Saved as evidence</Text>
          )}
          <ActionPill label="Show me what this means" accent={accent} onPress={onConnectCovenant} />
          <ActionPill label="I disagree" accent={colors.textSubtle} onPress={onDisagree} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function ActionPill({ label, accent, onPress }: { label: string; accent: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.actionPill, { borderColor: accent + '40', backgroundColor: accent + '0C' }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.actionPillText, { color: accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function PromptPill({ label, accent, onPress }: { label: string; accent: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.promptPill, { borderColor: accent + '30', backgroundColor: accent + '08' }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.promptPillText, { color: accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TriggerRow({ label, sub, onPress }: { label: string; sub: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.triggerRow} activeOpacity={0.65}>
      <View style={styles.triggerRowLeft}>
        <Text style={styles.triggerLabel}>{label}</Text>
        <Text style={styles.triggerSub}>{sub}</Text>
      </View>
      <Text style={styles.triggerArrow}>→</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  bloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scroll: { paddingHorizontal: spacing.lg },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 34,
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
  wordmark: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3.5,
    color: 'rgba(255,255,255,0.22)',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  typeBadgeGlyph: { fontSize: 13 },
  typeBadgeLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8 },
  typeBadgeCount: { fontSize: 10, color: 'rgba(255,255,255,0.2)', marginLeft: 2 },

  // Opening — the center of the experience
  opening: {
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  openingText: {
    color: colors.text,
    maxWidth: 360,
  },

  // Body
  body: { gap: spacing.xl },

  // Records
  records: { gap: spacing.sm },
  recordsDivider: {
    height: 1,
    marginBottom: spacing.md,
  },

  // Card
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardGlyph: { fontSize: 13 },
  cardType: { fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },
  cardDate: { fontSize: 11, color: colors.textSubtle },
  cardContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  actionPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  actionPillText: { fontSize: 12, fontWeight: '500', letterSpacing: 0.1 },
  savedConfirm: {
    fontSize: 12,
    fontWeight: '500',
    color: '#34D399',
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
  resonanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  resonanceDot: { width: 4, height: 4, borderRadius: 2 },
  resonanceText: { fontSize: 11, fontWeight: '500', letterSpacing: 0.2, opacity: 0.75 },

  // Explanation
  explanation: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  explanationLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.8 },
  explanationText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    letterSpacing: -0.1,
  },
  explanationClose: { fontSize: 13, fontWeight: '500', marginTop: spacing.xs },

  // Prompt pills
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  promptPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  promptPillText: { fontSize: 13, fontWeight: '500', letterSpacing: 0.1 },

  // Triggers
  triggers: { gap: 0 },
  triggerDivider: { height: 1, marginBottom: spacing.md },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  triggerRowLeft: { flex: 1, gap: 2 },
  triggerLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.2,
  },
  triggerSub: {
    fontSize: 12,
    color: colors.textSubtle,
    letterSpacing: 0,
  },
  triggerArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.2)',
    paddingLeft: spacing.md,
  },
});
