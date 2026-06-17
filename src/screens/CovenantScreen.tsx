import React, { Suspense, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Atmosphere } from '@/components/layout/Atmosphere';
import { useCovenant } from '@/context/CovenantContext';
import { colors, spacing } from '@/design/tokens';

const SkiaOrb = React.lazy(() => import('@/components/ui/SkiaOrb'));

type Phase = 'arriving' | 'narrating' | 'listening' | 'receiving' | 'sealing' | 'sealed';

const NARRATION = [
  { body: 'Before we begin.', hold: 2400 },
  { body: 'I need to know one thing.', hold: 2200 },
];

/**
 * The Covenant — first and only. A ceremony, not a form.
 *
 * OATH speaks first. Then waits. The user gives their word. OATH seals it.
 * Nothing else happens until this is done. No back button. No skip.
 * This is the beginning.
 */
export function CovenantScreen() {
  const { createCovenant } = useCovenant();
  const { height: H } = useWindowDimensions();

  const approach = useRef(new Animated.Value(0)).current;
  const intensity = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const uOpacity = useRef(new Animated.Value(0)).current;
  const uShift = useRef(new Animated.Value(0)).current;
  const inputOpacity = useRef(new Animated.Value(0)).current;
  const echoOpacity = useRef(new Animated.Value(0)).current;
  const echoShift = useRef(new Animated.Value(0)).current;
  const sealOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  const [phase, setPhase] = useState<Phase>('arriving');
  const [beatIdx, setBeatIdx] = useState(-1);
  const [currentText, setCurrentText] = useState('');
  const [input, setInput] = useState('');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const after = (ms: number, fn: () => void) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  // Arrival — the presence draws near.
  useEffect(() => {
    Animated.parallel([
      Animated.timing(approach, { toValue: 1, duration: 4200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(intensity, { toValue: 0.45, duration: 2600, useNativeDriver: true }),
        Animated.timing(intensity, { toValue: 0.1, duration: 1800, useNativeDriver: true }),
      ]),
    ]).start();

    after(4200, () => { setPhase('narrating'); setBeatIdx(0); });
    return clear;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Narration beats
  useEffect(() => {
    if (beatIdx < 0 || beatIdx >= NARRATION.length) return;
    const beat = NARRATION[beatIdx];
    setCurrentText(beat.body);

    uOpacity.setValue(0);
    uShift.setValue(0);
    Animated.parallel([
      Animated.timing(uOpacity, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(uShift, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    after(beat.hold, () => {
      Animated.timing(uOpacity, { toValue: 0, duration: 800, useNativeDriver: true }).start(() => {
        if (beatIdx + 1 < NARRATION.length) {
          setBeatIdx((i) => i + 1);
        } else {
          // Narration done — ask the question
          showQuestion();
        }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beatIdx]);

  function showQuestion() {
    setCurrentText('Who are you trying to become?');
    uOpacity.setValue(0);
    uShift.setValue(0);

    Animated.parallel([
      Animated.timing(uOpacity, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(uShift, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    after(1200, () => {
      Animated.timing(inputOpacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
      setPhase('listening');
      Animated.timing(intensity, { toValue: 0.28, duration: 900, useNativeDriver: true }).start();
    });
  }

  const release = () => {
    if (!input.trim() || phase !== 'listening') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhase('receiving');

    // Question fades, input fades
    Animated.parallel([
      Animated.timing(uOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      Animated.timing(inputOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    // Orb takes it in
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.1, duration: 1800, useNativeDriver: true }),
    ]).start();

    after(800, () => {
      // Echo the user's words
      echoOpacity.setValue(0);
      echoShift.setValue(0);
      Animated.parallel([
        Animated.timing(echoOpacity, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(echoShift, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();

      after(2200, () => {
        // OATH's single response
        setCurrentText('I will hold this.\nWhat you become from here will be measured against your word.');
        uOpacity.setValue(0);
        uShift.setValue(0);
        Animated.parallel([
          Animated.timing(uOpacity, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(uShift, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();

        after(3600, () => {
          setPhase('sealing');
          Animated.timing(sealOpacity, { toValue: 1, duration: 1400, useNativeDriver: true }).start();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          after(1600, () => {
            setPhase('sealed');
            Animated.timing(btnOpacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
          });
        });
      });
    });
  };

  const confirm = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    await createCovenant(input.trim());
    // CovenantContext update causes RootNavigator to unmount this screen
    // and show the main Tabs navigator automatically.
  };

  const orbTransform = [
    { scale: approach.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
    { translateY: approach.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
  ];
  const utteranceTransform = [{ translateY: uShift.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }];
  const echoTransform = [{ translateY: echoShift.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }];

  return (
    <View style={styles.root}>
      <Atmosphere intensity={intensity} />

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.scene, { paddingTop: H * 0.08 }]}>

          {/* The presence */}
          <Animated.View style={[styles.orbWrap, { opacity: approach, transform: orbTransform }]}>
            <Suspense fallback={null}>
              <SkiaOrb size={220} pulseValue={pulse} />
            </Suspense>
          </Animated.View>

          {/* OATH speaks */}
          <Animated.Text
            style={[styles.utterance, { opacity: uOpacity, transform: utteranceTransform }]}
          >
            {currentText}
          </Animated.Text>

          {/* Input — the word given */}
          {(phase === 'listening') && (
            <Animated.View style={[styles.inputWrap, { opacity: inputOpacity }]}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="Your answer..."
                placeholderTextColor={colors.textSubtle}
                style={styles.input}
                multiline
                autoFocus
                textAlign="center"
                selectionColor="rgba(255,255,255,0.5)"
                returnKeyType="done"
                blurOnSubmit
                onSubmitEditing={release}
              />
              {input.trim().length > 2 && (
                <TouchableOpacity onPress={release} style={styles.releaseBtn} activeOpacity={0.7}>
                  <View style={styles.releaseRing}>
                    <View style={styles.releaseDot} />
                  </View>
                  <Text style={styles.releaseLabel}>Give OATH your word</Text>
                </TouchableOpacity>
              )}
            </Animated.View>
          )}

          {/* Echo — their words enshrined */}
          {(phase === 'receiving' || phase === 'sealing' || phase === 'sealed') && (
            <Animated.Text
              style={[styles.echo, { opacity: echoOpacity, transform: echoTransform }]}
            >
              "{input.trim()}"
            </Animated.Text>
          )}

          {/* Seal */}
          {(phase === 'sealing' || phase === 'sealed') && (
            <Animated.View style={[styles.seal, { opacity: sealOpacity }]}>
              <Text style={styles.sealGlyph}>◈</Text>
              <Text style={styles.sealLabel}>YOUR COVENANT</Text>
            </Animated.View>
          )}

          {/* The word. The button that begins. */}
          {phase === 'sealed' && (
            <Animated.View style={{ opacity: btnOpacity }}>
              <TouchableOpacity onPress={confirm} style={styles.btn} activeOpacity={0.8}>
                <Text style={styles.btnText}>This is my word.</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fill: { flex: 1 },
  scene: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  orbWrap: {
    alignItems: 'center',
  },
  utterance: {
    fontSize: 26,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.5,
    lineHeight: 36,
    textAlign: 'center',
    maxWidth: 320,
  },
  inputWrap: {
    alignItems: 'center',
    width: '100%',
    gap: spacing.lg,
  },
  input: {
    fontSize: 22,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 32,
    letterSpacing: -0.3,
    textAlign: 'center',
    maxWidth: 340,
    minHeight: 70,
    width: '100%',
    borderWidth: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as object) : null),
  },
  releaseBtn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  releaseRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  releaseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.text,
  },
  releaseLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  echo: {
    fontSize: 22,
    fontStyle: 'italic',
    fontWeight: '300',
    color: colors.text,
    letterSpacing: -0.3,
    lineHeight: 32,
    textAlign: 'center',
    maxWidth: 320,
  },
  seal: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  sealGlyph: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.5)',
  },
  sealLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2.4,
  },
  btn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  btnText: {
    fontSize: 17,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: 0.2,
  },
});
