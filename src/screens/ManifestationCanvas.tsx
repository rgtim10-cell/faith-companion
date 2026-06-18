import React, { Suspense, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { Atmosphere } from '@/components/layout/Atmosphere';
import { useCovenant } from '@/context/CovenantContext';
import { composeExperience } from '@/engine/composer';
import type { ComposedExperience } from '@/engine/composerTypes';
import { DEMO_SEEDS } from '@/data/demoSeeds';
import { colors, spacing } from '@/design/tokens';

const MemorySky = React.lazy(() => import('@/components/ui/MemorySky'));

type CanvasState = 'silence' | 'manifestation' | 'communion';

/**
 * ManifestationCanvas — the One Screen experiment.
 *
 * There are no screens here. No tabs, no navigation, no destinations. OATH has
 * exactly three states: it is silent, it is showing you something, or you are
 * speaking to it. Everything is composed from the existing engines — covenant,
 * memory graph, composer. Nothing is displayed as a record, a card, or a list.
 *
 * Silence:       atmosphere + memory sky + the covenant, barely present.
 * Manifestation: OATH weaves one narrative from your memories. It is the screen.
 * Communion:     a ritual. You give OATH something. Not a chat. Not a form.
 */
export function ManifestationCanvas() {
  const { covenant, memories, addMemory, loadDemoSeed } = useCovenant();
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();

  const [state, setState] = useState<CanvasState>('silence');
  const [composed, setComposed] = useState<ComposedExperience | null>(null);
  const [utterance, setUtterance] = useState('');

  // Atmosphere intensity rises when OATH gathers to speak.
  const intensity = useRef(new Animated.Value(0.06)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // Hidden seed loader — five taps in the top-left, for the experiment only.
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSeeds, setShowSeeds] = useState(false);

  const highlightIds = useMemo(
    () => composed?.records.map((r) => r.id) ?? [],
    [composed],
  );

  const breatheTo = (value: number, duration = 1400) =>
    Animated.timing(intensity, { toValue: value, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();

  const crossfade = (next: () => void) => {
    Animated.timing(fade, { toValue: 0, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      next();
      Animated.timing(fade, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  };

  // Silence → Manifestation. OATH composes from what it holds.
  const surface = () => {
    const exp = composeExperience(covenant, memories, 'auto');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    crossfade(() => {
      setComposed(exp);
      setState('manifestation');
    });
    breatheTo(0.26);
  };

  const toSilence = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crossfade(() => {
      setComposed(null);
      setState('silence');
    });
    breatheTo(0.06);
  };

  const toCommunion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crossfade(() => setState('communion'));
    breatheTo(0.16);
  };

  const speak = () => {
    const text = utterance.trim();
    if (text.length > 0) {
      addMemory({
        type: 'reflection',
        title: 'Spoken to OATH',
        content: text,
        source: 'night_reflection',
        linkedPromiseId: covenant?.id,
        emotionalWeight: 0.6,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setUtterance('');
    toSilence();
  };

  const onHotCorner = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      setShowSeeds(true);
    } else {
      tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 800);
    }
  };

  // ── Layers shared by every state ───────────────────────────
  return (
    <View style={styles.root}>
      <RealmBackground />
      <Atmosphere intensity={intensity} />
      <Suspense fallback={null}>
        <MemorySky
          memories={memories}
          covenant={covenant}
          highlightIds={highlightIds}
          skyState={state === 'manifestation' ? 'speaking' : state === 'communion' ? 'noticing' : 'silent'}
        />
      </Suspense>

      {/* Hidden seed loader hot-corner (experiment only) */}
      <Pressable onPress={onHotCorner} style={[styles.hotCorner, { top: insets.top, left: 0 }]} />

      <Animated.View style={[styles.field, { opacity: fade }]} pointerEvents="box-none">
        {state === 'silence' && (
          <SilenceField
            covenant={covenant}
            onEnter={surface}
            onSpeak={toCommunion}
            insetBottom={insets.bottom}
          />
        )}

        {state === 'manifestation' && (
          <ManifestationField
            exp={composed}
            covenant={covenant}
            H={H}
            onReturn={toSilence}
            onSpeak={toCommunion}
            insetBottom={insets.bottom}
          />
        )}

        {state === 'communion' && (
          <CommunionField
            value={utterance}
            onChange={setUtterance}
            onSpeak={speak}
            onCancel={toSilence}
          />
        )}
      </Animated.View>

      {/* Seed loader — for the experiment, so the sky has memories to show */}
      <Modal visible={showSeeds} transparent animationType="fade" onRequestClose={() => setShowSeeds(false)}>
        <View style={styles.seedOverlay}>
          <View style={styles.seedPanel}>
            <Text style={styles.seedTitle}>SEED</Text>
            {DEMO_SEEDS.map((seed) => (
              <Pressable
                key={seed.key}
                style={styles.seedBtn}
                onPress={async () => {
                  setShowSeeds(false);
                  await loadDemoSeed(seed.covenant, seed.memories);
                }}
              >
                <Text style={styles.seedLabel}>{seed.label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowSeeds(false)} style={styles.seedCancel}>
              <Text style={styles.seedCancelText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── STATE 1 — SILENCE ─────────────────────────────────────────
// Atmosphere, the sky, and the covenant — barely present. No message.
// No placeholder. No CTA. The whole field is touchable: touch it and
// OATH surfaces what it holds. A single dim glyph waits, if you want to speak.
function SilenceField({
  covenant,
  onEnter,
  onSpeak,
  insetBottom,
}: {
  covenant: { promise: string } | null;
  onEnter: () => void;
  onSpeak: () => void;
  insetBottom: number;
}) {
  return (
    <View style={styles.fill}>
      <Pressable style={styles.fill} onPress={onEnter} />
      {/* The covenant, held in the dark — presence, not instruction */}
      {covenant && (
        <View style={styles.covenantHold} pointerEvents="none">
          <Text style={styles.covenantWhisper}>{covenant.promise}</Text>
        </View>
      )}
      {/* The one way to speak — a dim glyph, no label, no button */}
      <Pressable onPress={onSpeak} style={[styles.speakGlyph, { bottom: insetBottom + spacing.xl }]} hitSlop={28}>
        <Text style={styles.speakGlyphText}>◌</Text>
      </Pressable>
    </View>
  );
}

// ── STATE 2 — MANIFESTATION ───────────────────────────────────
// OATH weaves one narrative. Hook, a memory in your own words, the turn —
// against the covenant. No badge, no label, no card, no dismiss button.
// Touch the field to let it go.
function ManifestationField({
  exp,
  covenant,
  H,
  onReturn,
  onSpeak,
  insetBottom,
}: {
  exp: ComposedExperience | null;
  covenant: { promise: string } | null;
  H: number;
  onReturn: () => void;
  onSpeak: () => void;
  insetBottom: number;
}) {
  const memory = exp?.records[0] ?? null;

  return (
    <View style={styles.fill}>
      <Pressable style={styles.fill} onPress={onReturn} />
      <View style={[styles.manifest, { paddingTop: H * 0.16 }]} pointerEvents="none">
        {exp ? (
          <>
            <Text style={styles.hook}>{exp.hook}</Text>
            {memory && (
              <Text style={styles.wovenMemory}>“{memory.content}”</Text>
            )}
            <Text style={styles.body}>{exp.body}</Text>
            <Text style={styles.pivot}>{exp.pivot}</Text>
            {covenant && (
              <Text style={styles.againstWord}>against your word — {covenant.promise}</Text>
            )}
          </>
        ) : (
          // Nothing composed yet: OATH holds the covenant up, quietly.
          <Text style={styles.hook}>
            {covenant ? covenant.promise : 'OATH is here.'}
          </Text>
        )}
      </View>
      <Pressable onPress={onSpeak} style={[styles.speakGlyph, { bottom: insetBottom + spacing.xl }]} hitSlop={28}>
        <Text style={styles.speakGlyphText}>◌</Text>
      </Pressable>
    </View>
  );
}

// ── STATE 3 — COMMUNION ───────────────────────────────────────
// A ritual, not a chat. One prompt, a bare line to write on, one act.
function CommunionField({
  value,
  onChange,
  onSpeak,
  onCancel,
}: {
  value: string;
  onChange: (s: string) => void;
  onSpeak: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.communion}>
      <Text style={styles.communionPrompt}>Speak. OATH is listening.</Text>
      <TextInput
        style={styles.communionInput}
        value={value}
        onChangeText={onChange}
        placeholder="…"
        placeholderTextColor="rgba(255,255,255,0.18)"
        multiline
        autoFocus
        selectionColor={colors.text}
      />
      <View style={styles.communionLine} />
      <Pressable onPress={onSpeak} hitSlop={16}>
        <Text style={styles.communionGive}>Give OATH your word</Text>
      </Pressable>
      <Pressable onPress={onCancel} hitSlop={16} style={styles.communionBack}>
        <Text style={styles.communionBackText}>not now</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#04050A' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  field: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hotCorner: { position: 'absolute', width: 64, height: 64, zIndex: 50 },

  // Silence
  covenantHold: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    top: '42%',
    alignItems: 'center',
  },
  covenantWhisper: {
    fontSize: 17,
    lineHeight: 27,
    color: 'rgba(255,255,255,0.20)',
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  speakGlyph: { position: 'absolute', alignSelf: 'center' },
  speakGlyphText: { fontSize: 22, color: 'rgba(255,255,255,0.16)' },

  // Manifestation
  manifest: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  hook: {
    fontSize: 30,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  wovenMemory: {
    fontSize: 19,
    lineHeight: 30,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 17,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: -0.2,
  },
  pivot: {
    fontSize: 22,
    lineHeight: 32,
    color: colors.text,
    letterSpacing: -0.4,
  },
  againstWord: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.28)',
    fontStyle: 'italic',
    letterSpacing: 0.1,
    marginTop: spacing.sm,
  },

  // Communion
  communion: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  communionPrompt: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  communionInput: {
    fontSize: 24,
    lineHeight: 34,
    color: colors.text,
    fontWeight: '300',
    letterSpacing: -0.4,
    textAlign: 'center',
    minHeight: 80,
  },
  communionLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: spacing.xxl,
  },
  communionGive: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  communionBack: { marginTop: spacing.sm },
  communionBackText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.22)',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Seed loader (experiment only)
  seedOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: spacing.xl },
  seedPanel: { backgroundColor: '#0E1018', borderRadius: 18, padding: spacing.xl, gap: spacing.sm },
  seedTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 3, color: 'rgba(255,255,255,0.3)', marginBottom: spacing.sm },
  seedBtn: { paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  seedLabel: { fontSize: 16, color: colors.text },
  seedCancel: { alignItems: 'center', paddingTop: spacing.md },
  seedCancelText: { fontSize: 14, color: 'rgba(255,255,255,0.3)' },
});

export default ManifestationCanvas;
