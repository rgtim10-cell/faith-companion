import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { Atmosphere } from '@/components/layout/Atmosphere';

// Lazy so the Skia web API binds only after CanvasKit (WASM) has loaded.
const SkiaOrb = React.lazy(() => import('@/components/ui/SkiaOrb'));
import { threshold } from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { useCovenant } from '@/context/CovenantContext';
import { colors, spacing, typography } from '@/design/tokens';
import type { RootStackParamList } from '@/types';

function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

type Beat =
  | { kind: 'speak'; lead?: string; body: string; hold: number }
  | { kind: 'memory'; timeAgo: string; words: string; kept: string; hold: number }
  | { kind: 'ask'; body: string };

/**
 * The Threshold — a scene, not a screen.
 *
 * You arrive into stillness. A distant light breathes, notices you, and draws
 * near. Then OATH speaks — one breath at a time, each phrase condensing out of
 * the light and dissolving before the next. When it remembers, the room itself
 * dims and goes quiet. At the end it simply waits, listening. Nothing stacks,
 * nothing scrolls. You did not open a page; you entered a space.
 */
export function TodayScreen() {
  const { realm, realmKey } = useRealm();
  const { covenant, memories } = useCovenant();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { height: H } = useWindowDimensions();
  const m = threshold[realmKey];

  const beats: Beat[] = useMemo(() => {
    const arr: Beat[] = [
      { kind: 'speak', body: `${greetingWord()}, ${m.greetingName}.`, hold: 2400 },
      { kind: 'speak', lead: m.lead, body: m.observation, hold: 3800 },
    ];
    // Surface the real covenant promise as the memory beat when available.
    const significantMemory = memories.find((mem) => mem.emotionalWeight >= 0.85 && mem.type !== 'promise');
    if (covenant && m.memory) {
      const timeAgo = significantMemory
        ? `${Math.round((Date.now() - significantMemory.date) / (24 * 60 * 60 * 1000))} days ago, you said`
        : m.memory.timeAgo;
      const words = significantMemory ? significantMemory.content : covenant.promise;
      arr.push({ kind: 'memory', timeAgo, words, kept: m.memory.kept, hold: 5200 });
    } else if (m.memory) {
      arr.push({ kind: 'memory', timeAgo: m.memory.timeAgo, words: m.memory.words, kept: m.memory.kept, hold: 5200 });
    }
    arr.push({ kind: 'ask', body: m.reflect });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realmKey, covenant?.id, memories.length]);

  // The felt layers of the scene.
  const approach = useRef(new Animated.Value(0)).current; // the presence draws near
  const intensity = useRef(new Animated.Value(0)).current; // atmosphere bloom
  const dim = useRef(new Animated.Value(0)).current; // the room darkening for memory
  const pulse = useRef(new Animated.Value(0)).current; // orb's breath of speech
  const uOpacity = useRef(new Animated.Value(0)).current; // the current utterance
  const uShift = useRef(new Animated.Value(0)).current;

  const [idx, setIdx] = useState(-1); // -1 = arrival / stillness
  const [listening, setListening] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Arrival — the long way in. The presence is far, then near.
  useEffect(() => {
    clearTimers();
    [approach, intensity, dim, pulse, uOpacity, uShift].forEach((v) => v.setValue(0));
    setIdx(-1);
    setListening(false);

    Animated.parallel([
      Animated.timing(approach, { toValue: 1, duration: 4400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(intensity, { toValue: 0.55, duration: 2800, useNativeDriver: true }),
        Animated.timing(intensity, { toValue: 0.12, duration: 1800, useNativeDriver: true }),
      ]),
    ]).start();

    timers.current.push(setTimeout(() => setIdx(0), 4400));
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realmKey]);

  // Each beat: the presence gathers (light + orb swell), the words condense,
  // hold in silence, then dissolve. Memory dims the whole room.
  useEffect(() => {
    if (idx < 0 || idx >= beats.length) return;
    const beat = beats[idx];

    uOpacity.setValue(0);
    uShift.setValue(0);

    if (beat.kind === 'memory') {
      Animated.timing(dim, { toValue: 1, duration: 1700, useNativeDriver: true }).start();
      Animated.timing(intensity, { toValue: 0.05, duration: 1700, useNativeDriver: true }).start();
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.1, duration: 1700, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(intensity, { toValue: 0.42, duration: 900, useNativeDriver: true }).start();
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 320, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 760, useNativeDriver: true }),
      ]).start();
    }

    Animated.parallel([
      Animated.timing(uOpacity, { toValue: 1, duration: 1500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(uShift, { toValue: 1, duration: 1800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    if (beat.kind === 'ask') {
      timers.current.push(setTimeout(() => setListening(true), 1500));
      return; // the scene holds open — OATH waits
    }

    timers.current.push(
      setTimeout(() => {
        Animated.timing(uOpacity, { toValue: 0, duration: 1100, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
          if (beat.kind === 'memory') {
            Animated.timing(dim, { toValue: 0, duration: 1500, useNativeDriver: true }).start();
          }
          timers.current.push(setTimeout(() => setIdx((i) => i + 1), 750));
        });
      }, 1700 + beat.hold),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Touching the presence opens Communion — OATH stops speaking, begins to listen.
  const onOrbTouch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    navigation.navigate('Communion');
  };

  const beat = idx >= 0 && idx < beats.length ? beats[idx] : null;

  return (
    <View style={styles.container}>
      <Atmosphere intensity={intensity} dim={dim} />

      {/* The presence — distant, then near */}
      <Animated.View
        style={[
          styles.orb,
          {
            top: H * 0.17,
            opacity: approach,
            transform: [
              { scale: approach.interpolate({ inputRange: [0, 1], outputRange: [0.68, 1] }) },
              { translateY: approach.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
            ],
          },
        ]}
      >
        <Suspense fallback={null}>
          <SkiaOrb size={300} pulseValue={pulse} listening={listening} onPress={onOrbTouch} />
        </Suspense>
      </Animated.View>

      {/* The voice — one breath at a time, in the same place, then gone */}
      <Animated.View
        style={[
          styles.voice,
          {
            top: H * 0.55,
            opacity: uOpacity,
            transform: [{ translateY: uShift.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          },
        ]}
      >
        {beat?.kind === 'speak' && (
          <>
            {beat.lead ? <Text style={[styles.lead, { color: realm.accentSoft }]}>{beat.lead}</Text> : null}
            <Text style={styles.body}>{beat.body}</Text>
          </>
        )}

        {beat?.kind === 'memory' && (
          <>
            <Text style={[styles.memTime, { color: realm.accentSoft }]}>{beat.timeAgo}</Text>
            <Text style={styles.memWords}>“{beat.words}”</Text>
            <Text style={styles.memKept}>{beat.kept}</Text>
          </>
        )}

        {beat?.kind === 'ask' && <Text style={styles.ask}>{beat.body}</Text>}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  voice: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  lead: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 28,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 38,
    textAlign: 'center',
    maxWidth: 330,
  },
  memTime: {
    ...typography.labelSm,
    letterSpacing: 1.6,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  memWords: {
    fontSize: 23,
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.text,
    lineHeight: 34,
    letterSpacing: -0.3,
    textAlign: 'center',
    maxWidth: 320,
  },
  memKept: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.lg,
    maxWidth: 300,
  },
  ask: {
    fontSize: 25,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.4,
    lineHeight: 33,
    textAlign: 'center',
    maxWidth: 320,
  },
});
