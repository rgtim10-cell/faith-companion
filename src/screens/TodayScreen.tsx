import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ScrollView as ScrollViewType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { OathOrb } from '@/components/ui/OathOrb';
import { threshold } from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, spacing, typography } from '@/design/tokens';

function greetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The Threshold.
 *
 * Not a screen. A presence. OATH speaks one continuous thought — it greets,
 * it sees, it remembers (slowly, like testimony), and it asks an open
 * question. The orb breathes through the whole thing: it swells before each
 * line, draws a slow breath when the memory surfaces, and settles into
 * listening when it finishes. No cards. No buttons. No instructions.
 */
export function TodayScreen() {
  const { realm, realmKey } = useRealm();
  const insets = useSafeAreaInsets();
  const moment = threshold[realmKey];

  // Each line of OATH's thought surfaces on its own.
  const greet = useRef(new Animated.Value(0)).current;
  const lead = useRef(new Animated.Value(0)).current;
  const obs = useRef(new Animated.Value(0)).current;
  const memTime = useRef(new Animated.Value(0)).current;
  const memWords = useRef(new Animated.Value(0)).current;
  const memKept = useRef(new Animated.Value(0)).current;
  const reflect = useRef(new Animated.Value(0)).current;
  const listenLine = useRef(new Animated.Value(0)).current;

  // The orb's felt state — drives its glow and swell.
  const pulse = useRef(new Animated.Value(0)).current;
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<ScrollViewType>(null);

  useEffect(() => {
    const lines = [greet, lead, obs, memTime, memWords, memKept, reflect, listenLine];
    lines.forEach((v) => v.setValue(0));
    pulse.setValue(0);
    setListening(false);

    const rise = (v: Animated.Value, delay: number, duration = 850) =>
      Animated.timing(v, { toValue: 1, duration, delay, useNativeDriver: true });

    const hasMemory = Boolean(moment.memory);

    // The words stream in at a speaking cadence. The memory takes its time.
    const reveal = Animated.parallel([
      rise(greet, 300),
      rise(lead, 1150),
      rise(obs, 1950),
      ...(hasMemory
        ? [
            rise(memTime, 3300, 1000),
            rise(memWords, 4500, 1500), // sacred — slow
            rise(memKept, 6100, 1100),
          ]
        : []),
      rise(reflect, hasMemory ? 7500 : 3300, 1000),
      rise(listenLine, hasMemory ? 8500 : 4300, 1100),
    ]);

    // The orb's breath of speech — a small swell before each line, and one
    // long, deep swell as the memory surfaces (it feels different to remember).
    const speak = (up: number, upDur: number, downDur: number) =>
      Animated.sequence([
        Animated.timing(pulse, { toValue: up, duration: upDur, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: downDur, useNativeDriver: true }),
      ]);

    const breath = Animated.sequence([
      Animated.delay(180),
      speak(0.35, 220, 520),            // greeting
      Animated.delay(230),
      speak(0.35, 220, 520),            // lead
      Animated.delay(230),
      speak(0.4, 220, 560),             // observation
      ...(hasMemory
        ? [Animated.delay(520), speak(1, 520, 1500)] // remembering — deep, slow
        : []),
      Animated.delay(hasMemory ? 700 : 520),
      speak(0.4, 220, 600),             // the question
    ]);

    reveal.start();
    breath.start(({ finished }) => {
      if (finished) {
        setListening(true);
        // As OATH finishes speaking, the conversation settles toward its
        // question — a gentle drift, not a jump.
        requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      }
    });

    return () => {
      reveal.stop();
      breath.stop();
    };
    // re-compose whenever the realm shifts — atmosphere, voice, memory, all
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realmKey]);

  const flow = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  const onOrbTouch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <RealmBackground />

      {/* OATH — present at the top of everything it says */}
      <View style={[styles.crown, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={[styles.wordmark, { color: realm.accentSoft }]}>OATH</Text>
        <View style={styles.orbWrap}>
          <OathOrb size="lg" pulse={pulse} listening={listening} onPress={onOrbTouch} />
        </View>
      </View>

      {/* One continuous thought */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.stream, { paddingBottom: insets.bottom + 116 }]}
      >
        <Animated.Text style={[styles.greeting, flow(greet)]}>
          {greetingWord()}, {moment.greetingName}.
        </Animated.Text>

        <Animated.Text style={[styles.lead, flow(lead), { color: realm.accentSoft }]}>
          {moment.lead}
        </Animated.Text>

        <Animated.Text style={[styles.observation, flow(obs)]}>
          {moment.observation}
        </Animated.Text>

        {moment.memory && (
          <View style={styles.memory}>
            <Animated.Text style={[styles.memoryTime, flow(memTime), { color: realm.accentSoft }]}>
              {moment.memory.timeAgo}
            </Animated.Text>
            <Animated.Text style={[styles.memoryWords, flow(memWords)]}>
              “{moment.memory.words}”
            </Animated.Text>
            <Animated.Text style={[styles.memoryKept, flow(memKept)]}>
              {moment.memory.kept}
            </Animated.Text>
          </View>
        )}

        <Animated.Text style={[styles.reflect, flow(reflect)]}>
          {moment.reflect}
        </Animated.Text>

        <Animated.Text style={[styles.listening, flow(listenLine), { color: realm.accentSoft }]}>
          {moment.listening}
        </Animated.Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  crown: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  wordmark: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 7,
    opacity: 0.5,
    marginBottom: spacing.sm,
  },
  orbWrap: {
    marginVertical: -34,
  },
  scroll: {
    flex: 1,
  },
  stream: {
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  greeting: {
    ...typography.headingMd,
    fontWeight: '300',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  lead: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  observation: {
    fontSize: 26,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.6,
    lineHeight: 35,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 330,
  },
  // The memory — given air. Testimony, not content.
  memory: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    maxWidth: 320,
  },
  memoryTime: {
    ...typography.labelSm,
    letterSpacing: 1.4,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  memoryWords: {
    fontSize: 21,
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.text,
    lineHeight: 32,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  memoryKept: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  reflect: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 30,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  listening: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.lg,
    opacity: 0.9,
  },
});
