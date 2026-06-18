import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

// Remove browser focus ring on web — textarea:focus outline is a web artifact.
// Native (iOS/Android) is unaffected.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = 'textarea:focus,input:focus{outline:none!important;box-shadow:none!important;border-color:transparent!important;}';
  document.head.appendChild(s);
}
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
type CommunionMode = 'speak' | 'evidence';

export function ManifestationCanvas() {
  const { covenant, memories, addMemory, loadDemoSeed } = useCovenant();
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();

  const [state, setState] = useState<CanvasState>('silence');
  const [composed, setComposed] = useState<ComposedExperience | null>(null);
  const [utterance, setUtterance] = useState('');
  const [communionMode, setCommunionMode] = useState<CommunionMode>('speak');

  const intensity = useRef(new Animated.Value(0.06)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // Silence-only animations: the field breathes while OATH waits.
  const glyphScale = useRef(new Animated.Value(1)).current;
  const glyphOpacity = useRef(new Animated.Value(0.12)).current;
  const covenantOpacity = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const covenantRef = useRef<Animated.CompositeAnimation | null>(null);

  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSeeds, setShowSeeds] = useState(false);

  const highlightIds = useMemo(
    () => composed?.records.map((r) => r.id) ?? [],
    [composed],
  );

  const startSilenceAnimations = useCallback(() => {
    // Covenant drifts into view — teaches that this space holds something.
    covenantOpacity.setValue(0);
    const ca = Animated.sequence([
      Animated.delay(1600),
      Animated.timing(covenantOpacity, {
        toValue: 0.20,
        duration: 2200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    covenantRef.current = ca;
    ca.start();

    // Glyph breathes — the field is alive, responsive, waiting.
    glyphScale.setValue(1.0);
    glyphOpacity.setValue(0.12);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glyphScale, {
            toValue: 1.22,
            duration: 2800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(glyphOpacity, {
            toValue: 0.38,
            duration: 2800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(glyphScale, {
            toValue: 1.0,
            duration: 2800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(glyphOpacity, {
            toValue: 0.12,
            duration: 2800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loopRef.current = loop;
    loop.start();
  }, [covenantOpacity, glyphOpacity, glyphScale]);

  const stopSilenceAnimations = useCallback(() => {
    loopRef.current?.stop();
    covenantRef.current?.stop();
    covenantOpacity.setValue(0);
  }, [covenantOpacity]);

  useEffect(() => {
    if (state === 'silence') {
      startSilenceAnimations();
    } else {
      stopSilenceAnimations();
    }
    return stopSilenceAnimations;
  }, [state, startSilenceAnimations, stopSilenceAnimations]);

  const breatheTo = (value: number, duration = 1400) =>
    Animated.timing(intensity, {
      toValue: value,
      duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();

  const crossfade = (next: () => void) => {
    Animated.timing(fade, {
      toValue: 0,
      duration: 280,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      next();
      Animated.timing(fade, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  };

  const surface = () => {
    const exp = composeExperience(covenant, memories, 'auto');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    crossfade(() => {
      setComposed(exp);
      setState('manifestation');
    });
    breatheTo(0.28);
  };

  const toSilence = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crossfade(() => {
      setComposed(null);
      setState('silence');
      setUtterance('');
      setCommunionMode('speak');
    });
    breatheTo(0.06);
  };

  const toCommunion = (mode: CommunionMode = 'speak') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crossfade(() => {
      setCommunionMode(mode);
      setState('communion');
    });
    breatheTo(0.18);
  };

  const speak = () => {
    const text = utterance.trim();
    if (text.length > 0) {
      addMemory({
        type: communionMode === 'evidence' ? 'evidence' : 'reflection',
        title: communionMode === 'evidence' ? 'Witnessed' : 'Spoken to OATH',
        content: text,
        source: 'night_reflection',
        linkedPromiseId: covenant?.id,
        emotionalWeight: communionMode === 'evidence' ? 0.75 : 0.6,
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

  return (
    <View style={styles.root}>
      <RealmBackground />
      <Atmosphere intensity={intensity} />
      <Suspense fallback={null}>
        <MemorySky
          memories={memories}
          covenant={covenant}
          highlightIds={highlightIds}
          skyState={
            state === 'manifestation' ? 'speaking'
            : state === 'communion' ? 'noticing'
            : 'silent'
          }
        />
      </Suspense>

      <Pressable onPress={onHotCorner} style={[styles.hotCorner, { top: insets.top, left: 0 }]} />

      <Animated.View style={[styles.field, { opacity: fade }]} pointerEvents="box-none">
        {state === 'silence' && (
          <SilenceField
            covenant={covenant}
            covenantOpacity={covenantOpacity}
            glyphScale={glyphScale}
            glyphOpacity={glyphOpacity}
            onEnter={surface}
            onSpeak={() => toCommunion('speak')}
            insetBottom={insets.bottom}
          />
        )}
        {state === 'manifestation' && (
          <ManifestationField
            exp={composed}
            covenant={covenant}
            H={H}
            onReturn={toSilence}
            onSpeak={() => toCommunion('speak')}
            onEvidence={() => toCommunion('evidence')}
            insetBottom={insets.bottom}
          />
        )}
        {state === 'communion' && (
          <CommunionField
            mode={communionMode}
            value={utterance}
            onChange={setUtterance}
            onModeToggle={() => setCommunionMode((m) => (m === 'speak' ? 'evidence' : 'speak'))}
            onSpeak={speak}
            onCancel={toSilence}
            insetBottom={insets.bottom}
          />
        )}
      </Animated.View>

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

// ── STATE 1 — SILENCE ──────────────────────────────────────────────────────────
// The field waits. The glyph breathes. The covenant drifts in slowly.
// No instruction. No CTA. Touch anywhere → OATH surfaces what it holds.
// Touch the glyph → speak to OATH.
function SilenceField({
  covenant,
  covenantOpacity,
  glyphScale,
  glyphOpacity,
  onEnter,
  onSpeak,
  insetBottom,
}: {
  covenant: { promise: string } | null;
  covenantOpacity: Animated.Value;
  glyphScale: Animated.Value;
  glyphOpacity: Animated.Value;
  onEnter: () => void;
  onSpeak: () => void;
  insetBottom: number;
}) {
  return (
    <View style={styles.fill}>
      <Pressable style={styles.fill} onPress={onEnter} />
      {covenant && (
        <Animated.View
          style={[styles.covenantHold, { opacity: covenantOpacity }]}
          pointerEvents="none"
        >
          <Text style={styles.covenantWhisper}>{covenant.promise}</Text>
        </Animated.View>
      )}
      <Pressable
        onPress={onSpeak}
        style={[styles.speakGlyphWrap, { bottom: insetBottom + spacing.xl }]}
        hitSlop={32}
      >
        <Animated.Text
          style={[
            styles.glyphCore,
            { transform: [{ scale: glyphScale }], opacity: glyphOpacity },
          ]}
        >
          ◌
        </Animated.Text>
      </Pressable>
    </View>
  );
}

// ── STATE 2 — MANIFESTATION ────────────────────────────────────────────────────
// OATH weaves one narrative. Hook → body → pivot. No card, no badge, no label.
// Touch anywhere → return to silence.
// ◌ → speak   ◈ → record evidence
function ManifestationField({
  exp,
  covenant,
  H,
  onReturn,
  onSpeak,
  onEvidence,
  insetBottom,
}: {
  exp: ComposedExperience | null;
  covenant: { promise: string } | null;
  H: number;
  onReturn: () => void;
  onSpeak: () => void;
  onEvidence: () => void;
  insetBottom: number;
}) {
  // Covenant appears once. For person_you_becoming, it's already quoted in hook.
  const hookHasCovenant = exp?.type === 'person_you_becoming';

  return (
    <View style={styles.fill}>
      <Pressable style={styles.fill} onPress={onReturn} />
      <View style={[styles.manifest, { paddingTop: H * 0.16 }]} pointerEvents="none">
        {exp ? (
          <>
            <Text style={styles.hook}>{exp.hook}</Text>
            <Text style={styles.body}>{exp.body}</Text>
            <Text style={styles.pivot}>{exp.pivot}</Text>
            {covenant && !hookHasCovenant && (
              <Text style={styles.againstWord}>
                against your word — {covenant.promise}
              </Text>
            )}
          </>
        ) : (
          <Text style={styles.hook}>
            {covenant?.promise ?? 'OATH is here.'}
          </Text>
        )}
      </View>
      <View
        style={[styles.manifestGlyphs, { bottom: insetBottom + spacing.xl }]}
        pointerEvents="box-none"
      >
        <Pressable onPress={onSpeak} hitSlop={28}>
          <Text style={styles.glyphDim}>◌</Text>
        </Pressable>
        <Pressable onPress={onEvidence} hitSlop={28}>
          <Text style={styles.glyphDimmer}>◈</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── STATE 3 — COMMUNION ────────────────────────────────────────────────────────
// A ritual. Words appear in the dark without a cursor.
// speak mode: "OATH is listening." — reflection, spoken freely.
// evidence mode: "What happened? Name one thing." — a specific witness.
// The confirm label brightens as text is typed. Nothing submits until you're ready.
// ◈ / ◌ in the center toggles between modes.
function CommunionField({
  mode,
  value,
  onChange,
  onModeToggle,
  onSpeak,
  onCancel,
  insetBottom,
}: {
  mode: CommunionMode;
  value: string;
  onChange: (s: string) => void;
  onModeToggle: () => void;
  onSpeak: () => void;
  onCancel: () => void;
  insetBottom: number;
}) {
  const hasText = value.trim().length > 0;
  const giveAnim = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    Animated.timing(giveAnim, {
      toValue: hasText ? 0.72 : 0.15,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [hasText, giveAnim]);

  const prompt = mode === 'evidence'
    ? 'What happened? Name one thing.'
    : 'OATH is listening.';

  const giveLabel = mode === 'evidence' ? 'witness this' : 'give OATH your word';

  return (
    <View style={[styles.communion, { paddingBottom: insetBottom + spacing.xl }]}>
      <Text style={styles.communionPrompt}>{prompt}</Text>
      <TextInput
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={[styles.communionInput, { outline: 'none', border: 'none', boxShadow: 'none', borderWidth: 0 } as any]}
        value={value}
        onChangeText={onChange}
        multiline
        autoFocus
        caretHidden
        selectionColor="rgba(255,255,255,0.25)"
        keyboardAppearance="dark"
      />
      <View style={styles.communionActions}>
        <Pressable onPress={onCancel} hitSlop={20}>
          <Text style={styles.communionBack}>not now</Text>
        </Pressable>
        <Pressable onPress={onModeToggle} hitSlop={28}>
          <Text style={styles.communionModeGlyph}>
            {mode === 'speak' ? '◈' : '◌'}
          </Text>
        </Pressable>
        <Animated.View style={{ opacity: giveAnim }}>
          <Pressable onPress={onSpeak} hitSlop={20}>
            <Text style={styles.communionGive}>{giveLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#04050A' },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  field: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  hotCorner: {
    position: 'absolute',
    width: 64,
    height: 64,
    zIndex: 50,
  },

  // ── Silence ──────────────────────────────────────────────────────
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
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  speakGlyphWrap: {
    position: 'absolute',
    alignSelf: 'center',
  },
  glyphCore: {
    fontSize: 24,
    color: colors.text,
  },
  glyphDim: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.18)',
  },
  glyphDimmer: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.12)',
  },

  // ── Manifestation ────────────────────────────────────────────────
  manifest: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  hook: {
    fontSize: 30,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 44,
    letterSpacing: -0.8,
  },
  body: {
    fontSize: 17,
    lineHeight: 29,
    color: 'rgba(255,255,255,0.52)',
    letterSpacing: -0.2,
  },
  pivot: {
    fontSize: 23,
    lineHeight: 34,
    color: colors.text,
    letterSpacing: -0.5,
    fontWeight: '500',
  },
  againstWord: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.26)',
    fontStyle: 'italic',
    letterSpacing: 0.1,
    marginTop: spacing.sm,
  },
  manifestGlyphs: {
    position: 'absolute',
    flexDirection: 'row',
    left: spacing.xl,
    right: spacing.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // ── Communion ────────────────────────────────────────────────────
  communion: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  communionPrompt: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  communionInput: {
    fontSize: 26,
    lineHeight: 38,
    color: colors.text,
    fontWeight: '300',
    letterSpacing: -0.5,
    textAlign: 'center',
    minHeight: 90,
  },
  communionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  communionBack: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.22)',
    letterSpacing: 0.3,
  },
  communionModeGlyph: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.20)',
  },
  communionGive: {
    fontSize: 14,
    color: colors.text,
    letterSpacing: 0.3,
  },

  // ── Seed loader (experiment only) ────────────────────────────────
  seedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  seedPanel: {
    backgroundColor: '#0E1018',
    borderRadius: 18,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  seedTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.3)',
    marginBottom: spacing.sm,
  },
  seedBtn: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  seedLabel: { fontSize: 16, color: colors.text },
  seedCancel: { alignItems: 'center', paddingTop: spacing.md },
  seedCancelText: { fontSize: 14, color: 'rgba(255,255,255,0.3)' },
});

export default ManifestationCanvas;
