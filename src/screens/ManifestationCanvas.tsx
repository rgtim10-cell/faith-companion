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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { Atmosphere } from '@/components/layout/Atmosphere';
import { useCovenant } from '@/context/CovenantContext';
import { composeExperience } from '@/engine/composer';
import type { ComposedExperience } from '@/engine/composerTypes';
import {
  retrieveForGuidance,
  parseUtterance,
  isGuidanceUtterance,
  findTwinPair,
} from '@/engine/guidanceEngine';
import type { GuidanceResponse } from '@/engine/guidanceEngine';
import { buildIdentityProfile } from '@/engine/identityEngine';
import type { IdentityProfile } from '@/engine/identityEngine';
import { useIdentity } from '@/context/IdentityContext';
import type { MemoryRecord } from '@/data/memoryGraph';
import { DEMO_SEEDS } from '@/data/demoSeeds';
import { colors, spacing } from '@/design/tokens';

const MemorySky = React.lazy(() => import('@/components/ui/MemorySky'));
const ParticleField = React.lazy(() => import('@/components/ui/ParticleField'));
const DriftField = React.lazy(() => import('@/components/ui/DriftField'));

// Remove browser focus ring on web — textarea:focus outline is a web artifact.
// Native (iOS/Android) is unaffected.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = 'textarea:focus,input:focus{outline:none!important;box-shadow:none!important;border-color:transparent!important;}';
  document.head.appendChild(s);
}

// silence:          the sky IS the interface — covenant + memories, tappable.
// memory:           one star surfaced. The memory speaks, then OATH.
// mirror:           OATH looks through the record — connections illuminate first.
// identity:         Level 3 mirror — OATH has observed something. Evidence stars light up.
// manifestation:    OATH weaves one narrative from the sky.
// communion:        a ritual. You give OATH your word (speak) or witness (evidence).
// guidance_recall:  OATH searches the record. Stars surface one by one. The twin arc forms.
// guidance_speak:   OATH speaks from memory. Follow-up input stays open.
type CanvasState =
  | 'silence'
  | 'memory'
  | 'mirror'
  | 'identity'
  | 'manifestation'
  | 'communion'
  | 'guidance_recall'
  | 'guidance_speak';
type CommunionMode = 'speak' | 'evidence';

const SKY_STATE: Record<CanvasState, 'silent' | 'noticing' | 'speaking' | 'remembering'> = {
  silence: 'silent',
  memory: 'remembering',
  mirror: 'noticing',
  identity: 'speaking',
  manifestation: 'speaking',
  communion: 'noticing',
  guidance_recall: 'noticing',
  guidance_speak: 'speaking',
};

// What OATH is *doing* drives how its resting particle field moves (directive
// §1/§7). silence → rest; OATH looking through the record → gather inward;
// OATH speaking → field opens & brightens; a single memory held → field stills.
const FIELD_MODE: Record<CanvasState, 'rest' | 'gather' | 'speaking' | 'still'> = {
  silence: 'rest',
  memory: 'still',
  mirror: 'gather',
  identity: 'speaking',
  manifestation: 'speaking',
  communion: 'gather',
  guidance_recall: 'gather',
  guidance_speak: 'speaking',
};

// The Drift ecosystem (§8.2) uses the same semantic mapping but drives
// orbital speed rather than gather/brightness/drift controls.
const DRIFT_MODE: Record<CanvasState, 'idle' | 'gather' | 'speaking' | 'still'> = {
  silence: 'idle',
  memory: 'still',
  mirror: 'gather',
  identity: 'speaking',
  manifestation: 'speaking',
  communion: 'gather',
  guidance_recall: 'gather',
  guidance_speak: 'speaking',
};

export function ManifestationCanvas() {
  const { covenant, memories, addMemory, loadDemoSeed } = useCovenant();
  const insets = useSafeAreaInsets();
  const { height: H } = useWindowDimensions();

  const [state, setState] = useState<CanvasState>('silence');
  const [composed, setComposed] = useState<ComposedExperience | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [utterance, setUtterance] = useState('');
  const [communionMode, setCommunionMode] = useState<CommunionMode>('speak');

  // Guidance state
  const [guidanceResponse, setGuidanceResponse] = useState<GuidanceResponse | null>(null);
  const [guidanceHighlights, setGuidanceHighlights] = useState<string[]>([]);
  const [twinIds, setTwinIds] = useState<[string, string] | null>(null);
  const [followUtterance, setFollowUtterance] = useState('');
  const sequenceTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Identity state
  const [identityProfile, setIdentityProfile] = useState<IdentityProfile | null>(null);
  const [identityEvidenceRevealing, setIdentityEvidenceRevealing] = useState(false);
  const { suppressedTraitIds, challengedTraits, suppressTrait, challengeTrait } = useIdentity();

  const intensity = useRef(new Animated.Value(0.06)).current;
  const fade = useRef(new Animated.Value(1)).current;

  // Silence-only: the glyph breathes so the field reads as alive and responsive.
  const glyphScale = useRef(new Animated.Value(1)).current;
  const glyphOpacity = useRef(new Animated.Value(0.12)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);
  const mirrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSeeds, setShowSeeds] = useState(false);

  const selectedMemory = useMemo(
    () => memories.find((m) => m.id === selectedId) ?? null,
    [memories, selectedId],
  );

  const highlightIds = useMemo(() => {
    if (state === 'memory' && selectedId) return [selectedId];
    if (state === 'manifestation') return composed?.records.map((r) => r.id) ?? [];
    if (state === 'identity') return guidanceHighlights;
    if (state === 'guidance_recall' || state === 'guidance_speak') return guidanceHighlights;
    return [];
  }, [state, selectedId, composed, guidanceHighlights]);

  const startGlyphBreath = useCallback(() => {
    glyphScale.setValue(1.0);
    glyphOpacity.setValue(0.12);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glyphScale, { toValue: 1.22, duration: 2800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(glyphOpacity, { toValue: 0.36, duration: 2800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glyphScale, { toValue: 1.0, duration: 2800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(glyphOpacity, { toValue: 0.12, duration: 2800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ]),
      ]),
    );
    loopRef.current = loop;
    loop.start();
  }, [glyphOpacity, glyphScale]);

  useEffect(() => {
    if (state === 'silence') startGlyphBreath();
    else loopRef.current?.stop();
    return () => loopRef.current?.stop();
  }, [state, startGlyphBreath]);

  useEffect(() => () => { if (mirrorTimer.current) clearTimeout(mirrorTimer.current); }, []);
  useEffect(() => () => { sequenceTimers.current.forEach(clearTimeout); }, []);

  const onRevealEvidence = useCallback((ids: string[]) => {
    setIdentityEvidenceRevealing(true);
    setGuidanceHighlights([]);
    sequenceTimers.current.forEach(clearTimeout);
    sequenceTimers.current = [];
    let delay = 0;
    ids.forEach((id) => {
      delay += 500;
      const t = setTimeout(() => {
        setGuidanceHighlights((prev) => [...new Set([...prev, id])]);
      }, delay);
      sequenceTimers.current.push(t);
    });
  }, []);

  const handleChallengeTrait = useCallback((traitId: string, note: string) => {
    addMemory({
      type: 'truth',
      title: 'Correction to OATH',
      content: note,
      tags: ['correction', 'identity', traitId],
      source: 'communion',
      linkedPromiseId: covenant?.id,
      emotionalWeight: 0.8,
    });
    challengeTrait(traitId, note);
  }, [addMemory, challengeTrait, covenant]);

  const breatheTo = (value: number, duration = 1400) =>
    Animated.timing(intensity, { toValue: value, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }).start();

  const crossfade = (next: () => void, out = 280, inn = 520) => {
    Animated.timing(fade, { toValue: 0, duration: out, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      next();
      Animated.timing(fade, { toValue: 1, duration: inn, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  };

  // ── Star tapped: surface that single memory. No card. The sky dims around it.
  const onSelectStar = (id: string) => {
    if (covenant && id === covenant.id) { enterMirror(); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crossfade(() => { setSelectedId(id); setState('memory'); });
    breatheTo(0.12);
  };

  // ── Empty sky tapped: "Show me what you see." OATH looks, then speaks.
  const enterMirror = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    crossfade(() => setState('mirror'));
    breatheTo(0.16);
    // The sky responds first; only after OATH has looked does it speak.
    if (mirrorTimer.current) clearTimeout(mirrorTimer.current);
    mirrorTimer.current = setTimeout(() => {
      const challengedTraitIds = challengedTraits.map((c) => c.traitId);
      const profile = buildIdentityProfile(covenant, memories, { suppressedTraitIds, challengedTraitIds });
      if (profile.mirrorLevel === 3 && profile.mirrorObservation) {
        // Level 3: OATH has observed identity — evidence stars light the sky.
        setIdentityProfile(profile);
        const evidenceIds = [
          ...(profile.dominantStrength?.evidenceIds ?? []),
          ...(profile.dominantStruggle?.evidenceIds ?? []),
        ];
        setGuidanceHighlights([...new Set(evidenceIds)].slice(0, 6));
        crossfade(() => setState('identity'));
        breatheTo(0.28);
      } else {
        const exp = composeExperience(covenant, memories, 'auto');
        crossfade(() => { setComposed(exp); setState('manifestation'); });
        breatheTo(0.28);
      }
    }, 1600);
  };

  const toSilence = () => {
    sequenceTimers.current.forEach(clearTimeout);
    sequenceTimers.current = [];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crossfade(() => {
      setComposed(null);
      setSelectedId(null);
      setUtterance('');
      setCommunionMode('speak');
      setGuidanceResponse(null);
      setGuidanceHighlights([]);
      setTwinIds(null);
      setFollowUtterance('');
      setIdentityProfile(null);
      setIdentityEvidenceRevealing(false);
      setState('silence');
    });
    breatheTo(0.06);
  };

  const toCommunion = (mode: CommunionMode = 'speak') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    crossfade(() => { setCommunionMode(mode); setState('communion'); });
    breatheTo(0.18);
  };

  const runGuidanceSequence = (text: string) => {
    // Clear any in-progress sequence
    sequenceTimers.current.forEach(clearTimeout);
    sequenceTimers.current = [];
    setGuidanceHighlights([]);
    setTwinIds(null);

    // Transition to recall — sky quiets, connections illuminate
    crossfade(() => setState('guidance_recall'));
    breatheTo(0.18);

    // Retrieval is pure and synchronous — run it immediately
    const response = retrieveForGuidance(text, covenant, memories);
    setGuidanceResponse(response);

    const ids = response.ranked.map((r) => r.memory.id);
    const twin = findTwinPair(response.ranked, memories);

    // Stars surface one by one — 500ms apart
    let delay = 400;
    ids.forEach((id) => {
      delay += 500;
      const t = setTimeout(() => {
        setGuidanceHighlights((prev) => [...new Set([...prev, id])]);
      }, delay);
      sequenceTimers.current.push(t);
    });

    // Emotional twin arc: struggle pulses red, path forms to breakthrough
    if (twin) {
      delay += 700;
      const twinTimer = setTimeout(() => {
        setTwinIds(twin);
        setGuidanceHighlights((prev) => [...new Set([...prev, twin[0], twin[1]])]);
      }, delay);
      sequenceTimers.current.push(twinTimer);
      delay += 1000;
    } else {
      delay += 500;
    }

    // OATH pauses, then speaks
    const speakTimer = setTimeout(() => {
      crossfade(() => setState('guidance_speak'));
      breatheTo(0.22);
    }, delay);
    sequenceTimers.current.push(speakTimer);
  };

  const speak = () => {
    const text = utterance.trim();
    if (!text) return;

    const parsed = parseUtterance(text, memories);

    if (isGuidanceUtterance(parsed)) {
      setUtterance('');
      runGuidanceSequence(text);
      return;
    }

    // Save as memory record
    addMemory({
      type: communionMode === 'evidence' ? 'evidence' : 'reflection',
      title: communionMode === 'evidence' ? 'Witnessed' : 'Spoken to OATH',
      content: text,
      source: 'night_reflection',
      linkedPromiseId: covenant?.id,
      emotionalWeight: communionMode === 'evidence' ? 0.75 : 0.6,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setUtterance('');
    toSilence();
  };

  const speakFollowUp = () => {
    const text = followUtterance.trim();
    if (!text) { toSilence(); return; }

    if (guidanceResponse && !guidanceResponse.hasMemory) {
      // Memory birth: save the first record, then return to silence — the new star appears
      addMemory({
        type: 'reflection',
        title: 'First memory',
        content: text,
        source: 'communion',
        linkedPromiseId: covenant?.id,
        emotionalWeight: 0.65,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFollowUtterance('');
      toSilence();
      return;
    }

    // Continue the conversation — re-run retrieval from the follow-up utterance
    setFollowUtterance('');
    runGuidanceSequence(text);
  };

  const onHotCorner = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (tapCount.current >= 5) { tapCount.current = 0; setShowSeeds(true); }
    else tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 800);
  };

  return (
    <View style={styles.root}>
      <RealmBackground />
      <Atmosphere intensity={intensity} />

      {/* Empty-sky tap → Mirror. Sits beneath the stars so star taps win. */}
      {state === 'silence' && (
        <Pressable style={styles.fill} onPress={enterMirror} />
      )}

      {/* Layer 1: ambient particle haze — the atmosphere OATH inhabits. */}
      <Suspense fallback={null}>
        <ParticleField mode={FIELD_MODE[state]} />
      </Suspense>

      {/* Layer 2: orbital ecosystem — matter under covenant gravity (§8.2). */}
      <Suspense fallback={null}>
        <DriftField mode={DRIFT_MODE[state]} />
      </Suspense>

      <Suspense fallback={null}>
        <MemorySky
          memories={memories}
          covenant={covenant}
          highlightIds={highlightIds}
          skyState={(state === 'identity' && identityEvidenceRevealing) ? 'noticing' : SKY_STATE[state]}
          twinIds={twinIds ?? undefined}
          onSelectStar={state === 'silence' ? onSelectStar : undefined}
        />
      </Suspense>

      <Pressable onPress={onHotCorner} style={[styles.hotCorner, { top: insets.top, left: 0 }]} />

      <Animated.View style={[styles.field, { opacity: fade }]} pointerEvents="box-none">
        {state === 'silence' && (
          <Pressable
            onPress={() => toCommunion('speak')}
            style={[styles.speakGlyphWrap, { bottom: insets.bottom + spacing.xl }]}
            hitSlop={32}
          >
            <Animated.Text style={[styles.glyphCore, { transform: [{ scale: glyphScale }], opacity: glyphOpacity }]}>
              ◌
            </Animated.Text>
          </Pressable>
        )}

        {state === 'memory' && (
          <MemoryField memory={selectedMemory} H={H} onReturn={toSilence} />
        )}

        {(state === 'mirror' || state === 'guidance_recall') && <MirrorField />}

        {state === 'identity' && (
          <IdentityMirrorField
            profile={identityProfile}
            H={H}
            onReturn={toSilence}
            onSpeak={() => toCommunion('speak')}
            onSuppressTrait={suppressTrait}
            onChallengeTrait={handleChallengeTrait}
            onRevealEvidence={onRevealEvidence}
            isRevealingEvidence={identityEvidenceRevealing}
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

        {state === 'guidance_speak' && (
          <GuidanceSpeakField
            response={guidanceResponse}
            followText={followUtterance}
            onFollowChange={setFollowUtterance}
            onSpeak={speakFollowUp}
            onReturn={toSilence}
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
                onPress={async () => { setShowSeeds(false); await loadDemoSeed(seed.covenant, seed.memories); }}
              >
                <Text style={styles.seedLabel}>{seed.label}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowSeeds(false)} style={styles.seedCancel}>
              <Text style={styles.seedCancelText}>Close</Text>
            </Pressable>

            {/* Dev-only: identity audit panel */}
            {identityProfile && (
              <>
                <Text style={styles.auditTitle}>IDENTITY AUDIT</Text>
                {[...identityProfile.strengths, ...identityProfile.struggles].map((t) => (
                  <View key={t.id} style={styles.auditRow}>
                    <Text style={styles.auditTraitId}>{t.id}</Text>
                    <Text style={styles.auditDetail}>
                      {t.kind} · conf {t.confidence.toFixed(3)} · {t.trajectory} · {t.evidenceCount} evidence
                    </Text>
                    <Text style={styles.auditDetail}>
                      suppressed: {suppressedTraitIds.includes(t.id) ? 'YES' : 'no'} · challenged: {challengedTraits.some((c) => c.traitId === t.id) ? 'YES' : 'no'}
                    </Text>
                  </View>
                ))}
                <Text style={styles.auditDetail}>
                  mirror level: {identityProfile.mirrorLevel} · alignment: {identityProfile.covenantAlignment.alignmentScore.toFixed(2)} ({identityProfile.covenantAlignment.recentTrend})
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── MEMORY ─────────────────────────────────────────────────────────────────────
// A star was touched. The sky fades. The memory surfaces in its own words.
// Then OATH speaks — never with counts, only with recognition.
function oathLineFor(mem: MemoryRecord): string {
  if (mem.isFoundational) return 'This one holds the others up.';
  if ((mem.referenceCount ?? 0) >= 3) return 'You keep returning here.';
  switch (mem.type) {
    case 'breakthrough': return 'This is where it turned.';
    case 'evidence':     return 'Proof. You made this real.';
    case 'struggle':     return 'You were here. You did not stay.';
    case 'truth':        return 'You already knew this.';
    case 'reflection':   return 'You spoke this into the dark. OATH kept it.';
    case 'pattern':      return 'It keeps surfacing. That is the signal.';
    default:             return 'OATH is still holding this.';
  }
}

function MemoryField({
  memory,
  H,
  onReturn,
}: {
  memory: MemoryRecord | null;
  H: number;
  onReturn: () => void;
}) {
  return (
    <Pressable style={styles.fill} onPress={onReturn}>
      <View style={[styles.memoryHold, { paddingTop: H * 0.34 }]} pointerEvents="none">
        {memory ? (
          <>
            <Text style={styles.memoryContent}>“{memory.content}”</Text>
            <Text style={styles.memoryOath}>{oathLineFor(memory)}</Text>
          </>
        ) : (
          <Text style={styles.memoryOath}>OATH lost the thread. Touch the sky.</Text>
        )}
      </View>
    </Pressable>
  );
}

// ── MIRROR ──────────────────────────────────────────────────────────────────────
// OATH is looking through the record. The sky's connections illuminate (handled
// by skyState='noticing'); here we only hold a near-silent presence, no words yet.
function MirrorField() {
  const dots = useRef(new Animated.Value(0.15)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(dots, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(dots, { toValue: 0.15, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [dots]);
  return (
    <View style={styles.fill} pointerEvents="none">
      <Animated.Text style={[styles.mirrorDots, { opacity: dots }]}>· · ·</Animated.Text>
    </View>
  );
}

// ── IDENTITY MIRROR ─────────────────────────────────────────────────────────────
// Level 3: OATH has watched long enough to observe identity. Not a summary —
// an observation. Evidence stars are already glowing in the sky above.
// Phase 7: 5-option challenge flow — user can correct, suppress, or affirm.
function IdentityMirrorField({
  profile,
  H,
  onReturn,
  onSpeak,
  onSuppressTrait,
  onChallengeTrait,
  onRevealEvidence,
  isRevealingEvidence,
  insetBottom,
}: {
  profile: IdentityProfile | null;
  H: number;
  onReturn: () => void;
  onSpeak: () => void;
  onSuppressTrait: (traitId: string) => void;
  onChallengeTrait: (traitId: string, note: string) => void;
  onRevealEvidence: (ids: string[]) => void;
  isRevealingEvidence: boolean;
  insetBottom: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [phase, setPhase] = useState<'observe' | 'correct'>('observe');
  const [correctionNote, setCorrectionNote] = useState('');

  useEffect(() => {
    setPhase('observe');
    setCorrectionNote('');
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1, duration: 900, delay: 300,
      easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.mirrorObservation]);

  if (!profile?.mirrorObservation) {
    return <Pressable style={styles.fill} onPress={onReturn} />;
  }

  const { mirrorObservation, dominantStrength, dominantStruggle, covenantAlignment } = profile;
  const primaryTrait = dominantStrength ?? dominantStruggle;
  const secondary = dominantStrength?.oathObservation ?? dominantStruggle?.oathObservation ?? '';

  const evidenceIds = [
    ...(dominantStrength?.evidenceIds ?? []),
    ...(dominantStruggle?.evidenceIds ?? []),
  ];

  const submitCorrection = () => {
    if (!correctionNote.trim() || !primaryTrait) return;
    onChallengeTrait(primaryTrait.id, correctionNote.trim());
    setCorrectionNote('');
    onReturn();
  };

  return (
    <View style={styles.fill}>
      <Pressable style={styles.fill} onPress={onReturn} />
      <Animated.View
        style={[styles.identityHold, { paddingTop: H * 0.16 }, { opacity }]}
        pointerEvents="none"
      >
        <Text style={styles.identityObservation}>{mirrorObservation}</Text>
        {!!secondary && !isRevealingEvidence && (
          <Text style={styles.identitySecondary}>{secondary}</Text>
        )}
        {isRevealingEvidence && (
          <Text style={styles.identitySecondary}>
            The stars above are the moments OATH is referencing. {evidenceIds.length} in total.
          </Text>
        )}
        <Text style={styles.identityAlignment}>{covenantAlignment.oathObservation}</Text>
      </Animated.View>

      {/* Challenge options — only in observe phase, not revealing */}
      {phase === 'observe' && !isRevealingEvidence && (
        <View style={[styles.identityOptions, { bottom: insetBottom + spacing.xl }]}>
          <Pressable style={styles.identityOption} onPress={onReturn} hitSlop={8}>
            <Text style={styles.identityOptionText}>That feels true</Text>
          </Pressable>
          <Pressable style={styles.identityOption} onPress={onReturn} hitSlop={8}>
            <Text style={styles.identityOptionText}>Not quite</Text>
          </Pressable>
          <Pressable style={styles.identityOption} onPress={() => setPhase('correct')} hitSlop={8}>
            <Text style={[styles.identityOptionText, styles.identityOptionChallenge]}>You're wrong</Text>
          </Pressable>
          {primaryTrait && (
            <Pressable style={styles.identityOption} onPress={() => onRevealEvidence(evidenceIds)} hitSlop={8}>
              <Text style={styles.identityOptionText}>Show me the evidence</Text>
            </Pressable>
          )}
          {primaryTrait && (
            <Pressable
              style={styles.identityOption}
              onPress={() => { onSuppressTrait(primaryTrait.id); onReturn(); }}
              hitSlop={8}
            >
              <Text style={[styles.identityOptionText, styles.identityOptionDanger]}>Don't say this again</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* After evidence reveal: glyph to speak or return */}
      {isRevealingEvidence && (
        <View style={[styles.identityGlyph, { bottom: insetBottom + spacing.xl }]} pointerEvents="box-none">
          <Pressable onPress={onSpeak} hitSlop={28}><Text style={styles.glyphDim}>◌</Text></Pressable>
        </View>
      )}

      {/* Correction phase */}
      {phase === 'correct' && (
        <View style={[styles.identityCorrectPanel, { paddingBottom: insetBottom + spacing.xl }]}>
          <Text style={styles.identityCorrectPrompt}>What should OATH understand differently?</Text>
          <TextInput
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={[styles.identityCorrectInput, { outline: 'none', border: 'none', borderWidth: 0, boxShadow: 'none' } as any]}
            value={correctionNote}
            onChangeText={setCorrectionNote}
            multiline
            autoFocus
            caretHidden
            selectionColor="rgba(255,255,255,0.25)"
            keyboardAppearance="dark"
            placeholder="Speak the truth as you know it."
            placeholderTextColor="rgba(255,255,255,0.20)"
          />
          <View style={styles.identityCorrectActions}>
            <Pressable onPress={() => setPhase('observe')} hitSlop={20}>
              <Text style={styles.communionBack}>back</Text>
            </Pressable>
            <Pressable onPress={submitCorrection} hitSlop={20} disabled={!correctionNote.trim()}>
              <Text style={[styles.communionGive, { opacity: correctionNote.trim() ? 1 : 0.3 }]}>
                give OATH your truth
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

// ── MANIFESTATION ───────────────────────────────────────────────────────────────
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
              <Text style={styles.againstWord}>against your word — {covenant.promise}</Text>
            )}
          </>
        ) : (
          <Text style={styles.hook}>{covenant?.promise ?? 'OATH is here.'}</Text>
        )}
      </View>
      <View style={[styles.manifestGlyphs, { bottom: insetBottom + spacing.xl }]} pointerEvents="box-none">
        <Pressable onPress={onSpeak} hitSlop={28}><Text style={styles.glyphDim}>◌</Text></Pressable>
        <Pressable onPress={onEvidence} hitSlop={28}><Text style={styles.glyphDimmer}>◈</Text></Pressable>
      </View>
    </View>
  );
}

// ── COMMUNION ───────────────────────────────────────────────────────────────────
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
    Animated.timing(giveAnim, { toValue: hasText ? 0.72 : 0.15, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [hasText, giveAnim]);

  const prompt = mode === 'evidence' ? 'What happened? Name one thing.' : 'OATH is listening.';
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
        <Pressable onPress={onCancel} hitSlop={20}><Text style={styles.communionBack}>not now</Text></Pressable>
        <Pressable onPress={onModeToggle} hitSlop={28}>
          <Text style={styles.communionModeGlyph}>{mode === 'speak' ? '◈' : '◌'}</Text>
        </Pressable>
        <Animated.View style={{ opacity: giveAnim }}>
          <Pressable onPress={onSpeak} hitSlop={20}><Text style={styles.communionGive}>{giveLabel}</Text></Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

// ── GUIDANCE SPEAK ──────────────────────────────────────────────────────────────
// OATH has searched. Now it speaks — from memory, not from inference.
// The sky stays alive with retrieved stars. The prose arrives as one thought.
// A follow-up input waits at the bottom; tapping sky returns to silence.
function GuidanceSpeakField({
  response,
  followText,
  onFollowChange,
  onSpeak,
  onReturn,
  insetBottom,
}: {
  response: GuidanceResponse | null;
  followText: string;
  onFollowChange: (s: string) => void;
  onSpeak: () => void;
  onReturn: () => void;
  insetBottom: number;
}) {
  const prose = response?.prose ?? '· · ·';
  const isFallback = response ? !response.hasMemory : false;
  const hasText = followText.trim().length > 0;

  const proseOpacity = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const giveAnim = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    proseOpacity.setValue(0);
    inputOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(proseOpacity, {
        toValue: 1, duration: 700, delay: 200,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.timing(inputOpacity, {
        toValue: 1, duration: 500,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prose]);

  useEffect(() => {
    Animated.timing(giveAnim, {
      toValue: hasText ? 0.85 : 0.15, duration: 300, useNativeDriver: true,
    }).start();
  }, [hasText, giveAnim]);

  return (
    <View style={styles.fill}>
      {/* Upper sky — tap to return */}
      <Pressable style={styles.fill} onPress={onReturn} />

      {/* OATH speaks — bottom of screen, sky visible above */}
      <View
        style={[styles.guidanceContent, { paddingBottom: insetBottom + spacing.xl }]}
        pointerEvents="box-none"
      >
        <Animated.Text style={[styles.guidanceProse, { opacity: proseOpacity }]} pointerEvents="none">
          {prose}
        </Animated.Text>

        <Animated.View style={[styles.guidanceInputRow, { opacity: inputOpacity }]} pointerEvents="box-none">
          <TextInput
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            style={[styles.guidanceInputText, { outline: 'none', border: 'none', borderWidth: 0, boxShadow: 'none' } as any]}
            value={followText}
            onChangeText={onFollowChange}
            placeholder={isFallback ? 'What would you want to remember?' : 'Continue…'}
            placeholderTextColor="rgba(255,255,255,0.20)"
            multiline
            caretHidden
            keyboardAppearance="dark"
            selectionColor="rgba(255,255,255,0.25)"
          />
          <Animated.View style={{ opacity: giveAnim }}>
            <Pressable onPress={onSpeak} hitSlop={20} disabled={!hasText}>
              <Text style={styles.guidanceGive}>give OATH your word</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#04050A' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  field: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hotCorner: { position: 'absolute', width: 64, height: 64, zIndex: 50 },

  // Silence glyph
  speakGlyphWrap: { position: 'absolute', alignSelf: 'center' },
  glyphCore: { fontSize: 24, color: colors.text },
  glyphDim: { fontSize: 22, color: 'rgba(255,255,255,0.18)' },
  glyphDimmer: { fontSize: 20, color: 'rgba(255,255,255,0.12)' },

  // Memory
  memoryHold: { flex: 1, paddingHorizontal: spacing.xl, alignItems: 'center', gap: spacing.lg },
  memoryContent: {
    fontSize: 24, lineHeight: 36, color: colors.text, fontWeight: '300',
    fontStyle: 'italic', textAlign: 'center', letterSpacing: -0.4,
  },
  memoryOath: {
    fontSize: 15, lineHeight: 23, color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', letterSpacing: 0.2, marginTop: spacing.sm,
  },

  // Mirror
  mirrorDots: { position: 'absolute', alignSelf: 'center', top: '52%', fontSize: 20, letterSpacing: 6, color: colors.text },

  // Identity Mirror (Level 3)
  identityHold: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.xl },
  identityObservation: { fontSize: 24, lineHeight: 38, color: colors.text, fontWeight: '300', letterSpacing: -0.5 },
  identitySecondary: { fontSize: 16, lineHeight: 26, color: 'rgba(255,255,255,0.52)', letterSpacing: -0.1 },
  identityAlignment: { fontSize: 14, lineHeight: 23, color: 'rgba(255,255,255,0.30)', fontStyle: 'italic', letterSpacing: 0.1 },
  identityGlyph: { position: 'absolute', left: spacing.xl },
  identityOptions: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    gap: spacing.xs,
  },
  identityOption: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  identityOptionText: { fontSize: 15, color: 'rgba(255,255,255,0.60)', letterSpacing: 0.1 },
  identityOptionChallenge: { color: 'rgba(255,200,120,0.80)' },
  identityOptionDanger: { color: 'rgba(255,100,100,0.60)' },
  identityCorrectPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
    backgroundColor: 'rgba(4,5,10,0.85)',
  },
  identityCorrectPrompt: { fontSize: 14, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.4 },
  identityCorrectInput: {
    fontSize: 22,
    lineHeight: 34,
    color: colors.text,
    fontWeight: '300',
    letterSpacing: -0.4,
    minHeight: 70,
  },
  identityCorrectActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },

  // Manifestation
  manifest: { flex: 1, paddingHorizontal: spacing.xl, gap: spacing.lg },
  hook: { fontSize: 30, fontWeight: '300', color: colors.text, lineHeight: 44, letterSpacing: -0.8 },
  body: { fontSize: 17, lineHeight: 29, color: 'rgba(255,255,255,0.52)', letterSpacing: -0.2 },
  pivot: { fontSize: 23, lineHeight: 34, color: colors.text, letterSpacing: -0.5, fontWeight: '500' },
  againstWord: { fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.26)', fontStyle: 'italic', letterSpacing: 0.1, marginTop: spacing.sm },
  manifestGlyphs: { position: 'absolute', flexDirection: 'row', left: spacing.xl, right: spacing.xl, justifyContent: 'space-between', alignItems: 'center' },

  // Communion
  communion: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center', gap: spacing.lg },
  communionPrompt: { fontSize: 14, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.4, textAlign: 'center' },
  communionInput: { fontSize: 26, lineHeight: 38, color: colors.text, fontWeight: '300', letterSpacing: -0.5, textAlign: 'center', minHeight: 90 },
  communionActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  communionBack: { fontSize: 13, color: 'rgba(255,255,255,0.22)', letterSpacing: 0.3 },
  communionModeGlyph: { fontSize: 18, color: 'rgba(255,255,255,0.20)' },
  communionGive: { fontSize: 14, color: colors.text, letterSpacing: 0.3 },

  // Guidance speak
  guidanceContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  guidanceProse: {
    fontSize: 20,
    lineHeight: 33,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '300',
    letterSpacing: -0.35,
  },
  guidanceInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: spacing.md,
    minHeight: 48,
  },
  guidanceInputText: {
    flex: 1,
    fontSize: 17,
    lineHeight: 26,
    color: colors.text,
    fontWeight: '300',
    letterSpacing: -0.3,
    maxHeight: 80,
    paddingVertical: 0,
  },
  guidanceGive: {
    fontSize: 14,
    color: colors.text,
    letterSpacing: 0.3,
    paddingBottom: 2,
  },

  // Audit panel (dev only)
  auditTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 3, color: 'rgba(255,200,100,0.5)', marginTop: spacing.lg },
  auditRow: { paddingVertical: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  auditTraitId: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  auditDetail: { fontSize: 11, color: 'rgba(255,255,255,0.30)', letterSpacing: 0.2, marginTop: 2 },

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
