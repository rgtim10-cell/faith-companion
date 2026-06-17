import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { OathOrb } from '@/components/ui/OathOrb';
import { communion, communionVerbs } from '@/data/mock';
import {
  type CommunionMemory,
  type CommunionVerb,
  kindLabel,
  senseKind,
  verbMemory,
  witnessMemory,
} from '@/data/memoryStore';
import { useRealm } from '@/context/RealmContext';
import { colors, spacing, typography } from '@/design/tokens';

type Phase = 'open' | 'receiving' | 'witnessed' | 'answered';

/**
 * Communion — the sacred opposite of The Threshold.
 *
 * The Threshold is OATH speaking. This is OATH listening. There is no chat,
 * no transcript, no bubbles. The world quiets, the orb expands, and the user
 * confides one true thing — their words rendered large on the dark, as if
 * spoken into a presence. OATH receives it, says one weighted thing, and —
 * if it matters — keeps it. The user leaves witnessed, not answered.
 */
export function CommunionScreen() {
  const { realm, realmKey } = useRealm();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const voice = communion[realmKey];

  const [phase, setPhase] = useState<Phase>('open');
  const [verb, setVerb] = useState<CommunionVerb>('confide');
  const [text, setText] = useState('');
  const [memory, setMemory] = useState<CommunionMemory | null>(null);

  const activeVerb = communionVerbs.find((v) => v.id === verb)!;
  const oathLine = voice.receive[verb];

  // The felt layers of the moment.
  const enter = useRef(new Animated.Value(0)).current; // arrival
  const pulse = useRef(new Animated.Value(0)).current; // orb taking it in
  const depth = useRef(new Animated.Value(0)).current; // how quiet the world is (0→1→2)
  const oathReveal = useRef(new Animated.Value(0)).current;
  const seal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    Animated.parallel([
      Animated.timing(enter, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(depth, { toValue: 1, duration: 1400, useNativeDriver: true }),
    ]).start();
  }, [enter, depth]);

  const leave = () => navigation.goBack();

  const beginAgain = () => {
    Animated.parallel([
      Animated.timing(oathReveal, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(seal, { toValue: 0, duration: 350, useNativeDriver: true }),
      Animated.timing(depth, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      setText('');
      setMemory(null);
      setVerb('confide');
      setPhase('open');
    });
  };

  const release = () => {
    if (!text.trim() || phase !== 'open') return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setPhase('receiving');

    // The orb takes it in — one deep, slow breath.
    Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.12, duration: 1600, useNativeDriver: true }),
    ]).start();

    // OATH's single line surfaces, unhurried.
    Animated.timing(oathReveal, { toValue: 1, duration: 1200, delay: 800, useNativeDriver: true }).start();

    const spec = verbMemory[verb];
    if (spec.creates) {
      const kind = spec.kind ?? senseKind(text);
      const m = witnessMemory({ kind, words: text.trim(), realm: realmKey });
      // The world deepens, and the moment is sealed.
      setTimeout(() => {
        setMemory(m);
        setPhase('witnessed');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Animated.parallel([
          Animated.timing(depth, { toValue: 2, duration: 1400, useNativeDriver: true }),
          Animated.timing(seal, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ]).start();
      }, 2700);
    } else {
      // OATH answers or learns — but keeps nothing.
      setTimeout(() => setPhase('answered'), 2700);
    }
  };

  const overlayOpacity = depth.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0.32, 0.62] });
  const bloomOpacity = depth.interpolate({ inputRange: [0, 1, 2], outputRange: [0, 0.06, 0.2] });
  const orbScale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  const isOpen = phase === 'open';
  const listening = phase === 'open' || phase === 'receiving';

  return (
    <View style={styles.container}>
      <RealmBackground />
      {/* The world quiets */}
      <Animated.View style={[styles.quiet, { opacity: overlayOpacity }]} pointerEvents="none" />
      {/* A deepening of the realm, behind the presence */}
      <Animated.View
        style={[styles.bloom, { backgroundColor: realm.accent, opacity: bloomOpacity }]}
        pointerEvents="none"
      />

      {/* a quiet way out */}
      <TouchableOpacity onPress={leave} style={[styles.close, { top: insets.top + spacing.md }]} hitSlop={12}>
        <Text style={[styles.closeText, { color: colors.textSubtle }]}>✕</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
          {/* The presence, attending */}
          <Animated.View style={[styles.orb, { transform: [{ scale: orbScale }], opacity: enter }]}>
            <OathOrb size="lg" pulse={pulse} listening={listening} />
          </Animated.View>

          {isOpen ? (
            <Animated.View style={[styles.openArea, { opacity: enter }]}>
              <Text style={[styles.invite, { color: realm.accentSoft }]}>{voice.invite}</Text>

              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={activeVerb.sub}
                placeholderTextColor={colors.textSubtle}
                style={styles.confideInput}
                multiline
                autoFocus
                textAlign="center"
                selectionColor={realm.accent}
              />

              {text.trim().length > 0 && (
                <TouchableOpacity onPress={release} style={styles.release} activeOpacity={0.7}>
                  <View style={[styles.releaseRing, { borderColor: realm.accent + '66' }]}>
                    <View style={[styles.releaseDot, { backgroundColor: realm.accent }]} />
                  </View>
                  <Text style={[styles.releaseText, { color: realm.accentSoft }]}>Let OATH hold this</Text>
                </TouchableOpacity>
              )}

              {/* the registers of being present — not a toolbar */}
              <View style={styles.verbs}>
                {communionVerbs.map((v) => {
                  const on = v.id === verb;
                  return (
                    <Pressable key={v.id} onPress={() => setVerb(v.id)} hitSlop={8}>
                      <Text style={[styles.verb, { color: on ? realm.accent : colors.textSubtle, opacity: on ? 1 : 0.55 }]}>
                        {v.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : (
            <View style={styles.receivedArea}>
              {/* the user's words — enshrined, never in a bubble */}
              <Text style={styles.words}>“{text.trim()}”</Text>

              {/* OATH receives — one weighted line */}
              <Animated.Text
                style={[
                  styles.oathLine,
                  { color: colors.text, opacity: oathReveal, transform: [{ translateY: oathReveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
                ]}
              >
                {oathLine}
              </Animated.Text>

              {/* a memory crystallizes */}
              {phase === 'witnessed' && memory && (
                <Animated.View
                  style={[
                    styles.sealBlock,
                    { opacity: seal, transform: [{ scale: seal.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] },
                  ]}
                >
                  <View style={[styles.sealRule, { backgroundColor: realm.accent + '4D' }]} />
                  <View style={styles.sealHeader}>
                    <View style={[styles.sealGlyph, { borderColor: realm.accent + '66' }]}>
                      <Text style={[styles.sealGlyphText, { color: realm.accent }]}>◈</Text>
                    </View>
                    <Text style={[styles.sealLabel, { color: realm.accentSoft }]}>
                      {kindLabel[memory.kind].toUpperCase()} · WITNESSED TODAY
                    </Text>
                  </View>
                  <Text style={[styles.sealMicro, { color: colors.textSubtle }]}>Stored. Witnessed. Remembered.</Text>
                </Animated.View>
              )}

              {phase === 'answered' && verb === 'pushback' && (
                <Animated.Text style={[styles.learning, { color: colors.textSubtle, opacity: oathReveal }]}>
                  OATH is listening differently now.
                </Animated.Text>
              )}

              {/* closing — leave, or confide again. never a running thread. */}
              {(phase === 'witnessed' || phase === 'answered') && (
                <Animated.View style={[styles.closing, { opacity: seal.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] }) }]}>
                  {phase === 'witnessed' && (
                    <Text style={[styles.witness, { color: realm.accentSoft }]}>{voice.witness}</Text>
                  )}
                  <View style={styles.closingActions}>
                    <TouchableOpacity onPress={beginAgain} activeOpacity={0.7}>
                      <Text style={[styles.closingText, { color: realm.accent }]}>Tell me something else</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={leave} activeOpacity={0.7}>
                      <Text style={[styles.closingRest, { color: colors.textSubtle }]}>Rest</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  quiet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  bloom: {
    position: 'absolute',
    top: '6%',
    alignSelf: 'center',
    width: 460,
    height: 460,
    borderRadius: 230,
  },
  close: {
    position: 'absolute',
    right: spacing.lg,
    zIndex: 10,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 18 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  orb: {
    marginBottom: spacing.md,
  },
  // ── open: the act of confiding ──
  openArea: {
    alignItems: 'center',
    width: '100%',
  },
  invite: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  confideInput: {
    fontSize: 24,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 34,
    letterSpacing: -0.4,
    textAlign: 'center',
    maxWidth: 340,
    minHeight: 80,
    width: '100%',
    borderWidth: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    // web: remove the textarea outline/border so the words sit on the void
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none', outlineWidth: 0 } as object) : null),
  },
  release: {
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  releaseRing: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  releaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  releaseText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  verbs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  verb: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  // ── received: being witnessed ──
  receivedArea: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
  },
  words: {
    fontSize: 25,
    fontStyle: 'italic',
    fontWeight: '400',
    color: colors.text,
    lineHeight: 36,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  oathLine: {
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 25,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  sealBlock: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  sealRule: {
    width: 28,
    height: 1,
    marginBottom: spacing.lg,
  },
  sealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sealGlyph: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealGlyphText: { fontSize: 13 },
  sealLabel: {
    ...typography.labelSm,
    letterSpacing: 1.6,
  },
  sealMicro: {
    ...typography.labelSm,
    letterSpacing: 1.4,
    marginTop: spacing.sm,
  },
  learning: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  closing: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  witness: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  closingActions: {
    alignItems: 'center',
    gap: spacing.md,
  },
  closingText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  closingRest: {
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
