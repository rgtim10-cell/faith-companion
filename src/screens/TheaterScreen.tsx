import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useTheater } from '@/context/TheaterContext';
import { memoryTypeColor, memoryTypeGlyph, memoryTypeLabel } from '@/data/memoryGraph';
import type { TheaterBeat } from '@/data/theaterExperience';
import { colors, radius, spacing } from '@/design/tokens';

type Phase =
  | { kind: 'intro' }
  | { kind: 'sequence'; beatIdx: number }
  | { kind: 'closing' };

/**
 * Theater — OATH's full-screen, rare narrative mode.
 *
 * No tabs. No cards. No productivity language.
 * Just OATH telling you what it sees.
 *
 * Tap anywhere to advance. Auto-advances from the opening.
 */
export function TheaterScreen() {
  const { currentExperience, dismissExperience } = useTheater();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>({ kind: 'intro' });
  const [returnVisible, setReturnVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const wordmarkAnim = useRef(new Animated.Value(0)).current;
  const introTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exp = currentExperience;

  // Navigate back if no experience (shouldn't happen in normal flow)
  useEffect(() => {
    if (!exp) navigation.goBack();
  }, [exp, navigation]);

  // Entrance: wordmark fades in quietly, then opening content
  useEffect(() => {
    Animated.sequence([
      Animated.timing(wordmarkAnim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.delay(300),
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crossFade = useCallback((fn: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      fn();
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  // Auto-advance from opening after 3.5s
  useEffect(() => {
    if (phase.kind !== 'intro') return;
    introTimerRef.current = setTimeout(() => {
      crossFade(() => setPhase({ kind: 'sequence', beatIdx: 0 }));
    }, 3500);
    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
    };
  }, [phase.kind, crossFade]);

  // Show return button 2s after closing appears
  useEffect(() => {
    if (phase.kind !== 'closing') return;
    returnTimerRef.current = setTimeout(() => setReturnVisible(true), 2200);
    return () => {
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    };
  }, [phase.kind]);

  const handleTap = useCallback(() => {
    if (!exp) return;

    if (phase.kind === 'intro') {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
      crossFade(() => setPhase({ kind: 'sequence', beatIdx: 0 }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } else if (phase.kind === 'sequence') {
      if (phase.beatIdx < exp.beats.length - 1) {
        crossFade(() => setPhase({ kind: 'sequence', beatIdx: phase.beatIdx + 1 }));
      } else {
        crossFade(() => setPhase({ kind: 'closing' }));
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    // Closing: no tap-to-advance — wait for return button
  }, [exp, phase, crossFade]);

  const handleReturn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    dismissExperience();
    navigation.goBack();
  }, [dismissExperience, navigation]);

  if (!exp) return null;

  const totalSteps = 1 + exp.beats.length + 1;
  const currentStep =
    phase.kind === 'intro' ? 0
    : phase.kind === 'sequence' ? 1 + phase.beatIdx
    : totalSteps - 1;

  // Accent tint on background — extremely subtle
  const tintStyle = { backgroundColor: exp.accentColor + '0A' };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Background — near-black with accent tint */}
      <View style={[StyleSheet.absoluteFill, styles.bg]} />
      <View style={[StyleSheet.absoluteFill, tintStyle]} pointerEvents="none" />

      {/* Wordmark — always visible, very dim */}
      <Animated.View
        style={[styles.wordmarkContainer, { paddingTop: insets.top + spacing.md, opacity: wordmarkAnim }]}
        pointerEvents="none"
      >
        <Text style={styles.wordmark}>OATH</Text>
        <Text style={[styles.experienceType, { color: exp.accentColor + '60' }]}>
          {exp.type.replace(/_/g, ' ').toUpperCase()}
        </Text>
      </Animated.View>

      {/* Main content — tappable to advance */}
      <Pressable
        style={styles.contentArea}
        onPress={handleTap}
        accessible={false}
      >
        <Animated.View style={[styles.contentInner, { opacity: fadeAnim }]}>

          {/* Opening */}
          {phase.kind === 'intro' && (
            <View style={styles.openingBlock}>
              <Text style={styles.openingText}>{exp.opening}</Text>
            </View>
          )}

          {/* Sequence beats */}
          {phase.kind === 'sequence' && (
            <BeatView beat={exp.beats[phase.beatIdx]} accentColor={exp.accentColor} />
          )}

          {/* Closing */}
          {phase.kind === 'closing' && (
            <View style={styles.closingBlock}>
              <Text style={styles.closingText}>{exp.closing}</Text>
              <Text style={styles.closingAttrib}>— OATH</Text>

              {returnVisible && (
                <TouchableOpacity
                  onPress={handleReturn}
                  style={styles.returnBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.returnText}>Return  →</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </Animated.View>
      </Pressable>

      {/* Progress dots — hidden on closing */}
      {phase.kind !== 'closing' && (
        <View style={[styles.progress, { paddingBottom: insets.bottom + spacing.lg }]}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentStep && styles.dotActive,
                i < currentStep && styles.dotPassed,
              ]}
            />
          ))}
        </View>
      )}

      {/* Advance hint — fades in after a beat, hides on closing */}
      {phase.kind === 'sequence' && (
        <Animated.View
          style={[styles.hint, { paddingBottom: insets.bottom + spacing.sm, opacity: fadeAnim }]}
          pointerEvents="none"
        >
          <Text style={styles.hintText}>
            {phase.beatIdx === exp.beats.length - 1 ? 'tap to finish' : 'tap to continue'}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

// ── BeatView ──────────────────────────────────────────────────
// Renders a single narrative beat based on its type.

function BeatView({ beat, accentColor }: { beat: TheaterBeat; accentColor: string }) {
  switch (beat.type) {
    case 'oath_voice':
      return (
        <View style={styles.oathVoiceBlock}>
          <Text style={styles.oathVoiceText}>{beat.content}</Text>
        </View>
      );

    case 'memory': {
      if (!beat.record) return null;
      const typeColor = memoryTypeColor[beat.record.type];
      const glyph = memoryTypeGlyph[beat.record.type];
      const typeLabel = memoryTypeLabel[beat.record.type];
      const d = Math.round((Date.now() - beat.record.date) / (24 * 60 * 60 * 1000));
      const when = d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days ago`;

      return (
        <View style={styles.memoryBlock}>
          <View style={[styles.memoryAccentBar, { backgroundColor: typeColor + '60' }]} />
          <View style={styles.memoryContent}>
            <View style={styles.memoryHeader}>
              <Text style={[styles.memoryGlyph, { color: typeColor }]}>{glyph}</Text>
              <Text style={[styles.memoryType, { color: typeColor }]}>{typeLabel.toUpperCase()}</Text>
              <Text style={styles.memoryWhen}>{when}</Text>
            </View>
            <Text style={styles.memoryText}>{beat.content}</Text>
          </View>
        </View>
      );
    }

    case 'stats':
      return (
        <View style={styles.statsBlock}>
          {beat.content.split('\n').map((line, i) => (
            <Text key={i} style={styles.statsLine}>{line}</Text>
          ))}
        </View>
      );

    case 'reflection':
      return (
        <View style={[styles.reflectionBlock, { borderLeftColor: accentColor + '40' }]}>
          <Text style={styles.reflectionText}>{beat.content}</Text>
          <Text style={styles.reflectionAttrib}>— OATH</Text>
        </View>
      );

    default:
      return null;
  }
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#080808',
  },
  bg: {
    backgroundColor: '#080808',
  },

  // Wordmark
  wordmarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 3,
    zIndex: 10,
  },
  wordmark: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.12)',
  },
  experienceType: {
    fontSize: 8,
    fontWeight: '500',
    letterSpacing: 2.5,
  },

  // Content area — fills most of screen
  contentArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    marginTop: 60,
    marginBottom: 60,
  },
  contentInner: {
    gap: spacing.lg,
  },

  // Opening
  openingBlock: {
    alignItems: 'flex-start',
  },
  openingText: {
    fontSize: 38,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 52,
    letterSpacing: -1.5,
    maxWidth: 320,
  },

  // Closing
  closingBlock: {
    gap: spacing.lg,
    alignItems: 'flex-start',
  },
  closingText: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 46,
    letterSpacing: -1.2,
    maxWidth: 300,
  },
  closingAttrib: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.25)',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  returnBtn: {
    marginTop: spacing.lg,
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignSelf: 'flex-start',
  },
  returnText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.2,
  },

  // Beat: oath_voice
  oathVoiceBlock: {
    paddingVertical: spacing.sm,
  },
  oathVoiceText: {
    fontSize: 22,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 33,
    letterSpacing: -0.5,
    fontStyle: 'italic',
    maxWidth: 340,
  },

  // Beat: memory
  memoryBlock: {
    flexDirection: 'row',
    gap: 14,
  },
  memoryAccentBar: {
    width: 2,
    borderRadius: 1,
    flexShrink: 0,
  },
  memoryContent: {
    flex: 1,
    gap: 8,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memoryGlyph: { fontSize: 13 },
  memoryType: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  memoryWhen: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    marginLeft: 4,
  },
  memoryText: {
    fontSize: 20,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 32,
    letterSpacing: -0.4,
  },

  // Beat: stats
  statsBlock: {
    gap: 6,
  },
  statsLine: {
    fontSize: 22,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 32,
    letterSpacing: -0.3,
  },

  // Beat: reflection
  reflectionBlock: {
    borderLeftWidth: 2,
    paddingLeft: 16,
    gap: 8,
    paddingVertical: spacing.xs,
  },
  reflectionText: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.45)',
    lineHeight: 26,
    letterSpacing: -0.15,
    fontStyle: 'italic',
    maxWidth: 340,
  },
  reflectionAttrib: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.18)',
    fontStyle: 'italic',
  },

  // Progress dots
  progress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotActive: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    width: 8,
  },
  dotPassed: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  // Advance hint
  hint: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.12)',
    letterSpacing: 1.5,
    fontWeight: '500',
  },
});
