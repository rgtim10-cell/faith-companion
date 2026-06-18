import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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
import { useCovenant } from '@/context/CovenantContext';
import { useDaily } from '@/context/DailyContext';
import { computeOathState } from '@/engine/oathState';
import {
  generateReflectionQuestion,
  selectClosingLine,
} from '@/engine/ritualEngine';
import { computeSignificance } from '@/engine/memoryEvolution';
import { colors, radius, spacing, typography } from '@/design/tokens';

type Phase = 'question' | 'writing' | 'sealed';

export function NightReflectionScreen() {
  const { covenant, memories, feedback, addMemory, reinforceMemory } = useCovenant();
  const { isSealed, sealDay } = useDaily();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const oathState = useMemo(
    () => computeOathState(memories, covenant, feedback),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memories.length, covenant?.id, feedback.length],
  );

  const question = useMemo(
    () => generateReflectionQuestion(oathState, memories, covenant),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [oathState.key, memories.length, covenant?.id],
  );

  const [phase, setPhase] = useState<Phase>(isSealed ? 'sealed' : 'question');
  const [response, setResponse] = useState('');
  const [closingLine, setClosingLine] = useState('');

  // Carry-forward state — surfaces after sealing
  const [carryText, setCarryText] = useState('');
  const [carryConfirmed, setCarryConfirmed] = useState(false);
  const [showCarryInput, setShowCarryInput] = useState(false);

  // Carry-forward prompt: shown when OATH state suggests meaningful day
  const showCarryPrompt = !carryConfirmed && (
    oathState.key === 'proud' ||
    oathState.key === 'encouraged' ||
    oathState.key === 'concerned' ||
    oathState.key === 'challenging'
  );

  // Entrance fade
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Transition animation between phases
  const transitionPhase = (next: Phase) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setPhase(next);
      slideAnim.setValue(12);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    });
  };

  const handleBeginWriting = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    transitionPhase('writing');
  };

  const handleSeal = async () => {
    const trimmed = response.trim();
    if (!trimmed) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Create the reflection memory
    const reflection = addMemory({
      type: 'reflection',
      title: 'Night reflection',
      content: trimmed,
      emotionalWeight: 0.65,
      tags: ['night', 'ritual'],
      linkedPromiseId: covenant?.id,
      source: 'night_reflection',
    });

    // Select OATH's closing line
    const closing = selectClosingLine(oathState, trimmed);
    setClosingLine(closing);

    // Find strongest memory of the day (highest emotional weight added today)
    const todayCutoff = Date.now() - 24 * 60 * 60 * 1000;
    const todayMemories = memories.filter((m) => m.date > todayCutoff);
    const strongest = todayMemories.sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];

    // Seal the day
    await sealDay({
      oathStateKey: oathState.key,
      reflectionId: reflection.id,
      closingLine: closing,
      strongestMemoryId: strongest?.id,
      covenantId: covenant?.id,
    });

    transitionPhase('sealed');
  };

  const handleCarryForward = () => {
    const trimmed = carryText.trim();
    if (trimmed.length > 0) {
      // Create a carry-forward memory — high weight, protected from decay
      const cfMemory = addMemory({
        type: 'truth',
        title: 'Carried forward',
        content: trimmed,
        emotionalWeight: 0.82,
        tags: ['carry-forward', 'night'],
        linkedPromiseId: covenant?.id,
        source: 'night_reflection',
      });
      reinforceMemory(cfMemory.id, 'carry_forward');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setCarryConfirmed(true);
    setShowCarryInput(false);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const canSeal = response.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <RealmBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={10}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.wordmark}>OATH</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
      >
        <Animated.View
          style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* ── Phase: question ── */}
          {phase === 'question' && (
            <View style={styles.questionPhase}>
              <View style={styles.nightLabel}>
                <View style={styles.nightDot} />
                <Text style={styles.nightText}>TONIGHT</Text>
              </View>

              <Text style={styles.questionText}>{question}</Text>

              <Text style={styles.oathAttrib}>— OATH</Text>

              <TouchableOpacity
                onPress={handleBeginWriting}
                style={styles.beginBtn}
                activeOpacity={0.8}
              >
                <Text style={styles.beginBtnText}>I'm ready</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Phase: writing ── */}
          {phase === 'writing' && (
            <View style={styles.writingPhase}>
              <Text style={styles.questionTextSmall}>{question}</Text>
              <Text style={styles.oathAttribSmall}>— OATH</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  value={response}
                  onChangeText={setResponse}
                  placeholder="Tell OATH what happened..."
                  placeholderTextColor={colors.textSubtle}
                  multiline
                  autoFocus
                  style={styles.input}
                  textAlignVertical="top"
                />
                {response.trim().length > 0 && (
                  <Text style={styles.listeningLabel}>OATH is listening.</Text>
                )}
              </View>

              <TouchableOpacity
                onPress={handleSeal}
                style={[
                  styles.sealBtn,
                  { opacity: canSeal ? 1 : 0.35 },
                ]}
                disabled={!canSeal}
                activeOpacity={0.8}
              >
                <Text style={styles.sealBtnText}>Seal today  →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Phase: sealed ── */}
          {phase === 'sealed' && (
            <View style={styles.sealedPhase}>
              <View style={styles.sealedMark}>
                <Text style={styles.sealedGlyph}>◈</Text>
              </View>

              <Text style={styles.sealedLabel}>TODAY IS SEALED</Text>

              <Text style={styles.closingLineText}>
                {closingLine || (isSealed ? "OATH holds today. The record continues." : '')}
              </Text>

              <Text style={styles.oathAttrib}>— OATH</Text>

              <View style={styles.continuitySeal}>
                <Text style={styles.continuityText}>The record continues.</Text>
              </View>

              {/* Carry-forward — OATH asks what should survive */}
              {showCarryPrompt && (
                <View style={styles.carryBlock}>
                  <View style={styles.carryDivider} />
                  <Text style={styles.carryQuestion}>
                    What should survive today?
                  </Text>
                  <Text style={styles.carryAttrib}>— OATH</Text>

                  {!showCarryInput && (
                    <View style={styles.carryActions}>
                      <TouchableOpacity
                        onPress={() => setShowCarryInput(true)}
                        style={styles.carryOpenBtn}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.carryOpenBtnText}>Carry something forward</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setCarryConfirmed(true)}
                        hitSlop={8}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.carrySkipText}>Not tonight</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {showCarryInput && (
                    <View style={styles.carryInputBlock}>
                      <TextInput
                        value={carryText}
                        onChangeText={setCarryText}
                        placeholder="What OATH should hold..."
                        placeholderTextColor={colors.textSubtle}
                        multiline
                        autoFocus
                        style={styles.carryInput}
                        textAlignVertical="top"
                      />
                      <TouchableOpacity
                        onPress={handleCarryForward}
                        style={[styles.carryConfirmBtn, { opacity: carryText.trim().length > 0 ? 1 : 0.4 }]}
                        disabled={carryText.trim().length === 0}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.carryConfirmText}>
                          {carryText.trim().length > 0 ? 'Carry this forward →' : 'Nothing to carry →'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {carryConfirmed && carryText.trim().length > 0 && (
                <View style={styles.carryConfirmedRow}>
                  <Text style={styles.carryConfirmedText}>◈ Carried forward. OATH holds it.</Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeDay}
                activeOpacity={0.8}
              >
                <Text style={styles.closeDayText}>OATH will remember this.</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...typography.headingSm,
    color: colors.textSubtle,
  },
  wordmark: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3.5,
    color: 'rgba(255,255,255,0.22)',
  },
  headerSpacer: {
    width: 32,
  },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },

  // ── Question phase ─────────────────────────────────────────
  questionPhase: {
    flex: 1,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
  },
  nightLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  nightDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  nightText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.25)',
  },
  questionText: {
    fontSize: 32,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 44,
    letterSpacing: -1,
    maxWidth: 340,
  },
  oathAttrib: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.28)',
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  beginBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 13,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginTop: spacing.lg,
  },
  beginBtnText: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    letterSpacing: -0.1,
  },

  // ── Writing phase ──────────────────────────────────────────
  writingPhase: {
    flex: 1,
    gap: spacing.lg,
  },
  questionTextSmall: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 24,
    letterSpacing: -0.3,
    fontStyle: 'italic',
  },
  oathAttribSmall: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    fontStyle: 'italic',
    marginTop: -spacing.sm,
  },
  inputContainer: {
    flex: 1,
    minHeight: 200,
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    fontSize: 19,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 30,
    letterSpacing: -0.3,
    minHeight: 160,
  },
  listeningLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  sealBtn: {
    paddingVertical: 15,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  sealBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    letterSpacing: 0.1,
  },

  // ── Sealed phase ───────────────────────────────────────────
  sealedPhase: {
    flex: 1,
    paddingTop: spacing.xxl,
    gap: spacing.xl,
    alignItems: 'flex-start',
  },
  sealedMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  sealedGlyph: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
  },
  sealedLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    color: 'rgba(255,255,255,0.25)',
  },
  closingLineText: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 38,
    letterSpacing: -0.6,
    maxWidth: 320,
  },
  continuitySeal: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  continuityText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 0.3,
    fontStyle: 'italic',
  },
  closeDay: {
    marginTop: spacing.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  closeDayText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: -0.1,
  },

  // ── Carry-forward ──────────────────────────────────────────
  carryBlock: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },
  carryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  carryQuestion: {
    fontSize: 20,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 30,
    letterSpacing: -0.4,
    maxWidth: 300,
  },
  carryAttrib: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.2)',
    fontStyle: 'italic',
    marginTop: -spacing.sm,
  },
  carryActions: {
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  carryOpenBtn: {
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  carryOpenBtnText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.1,
  },
  carrySkipText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.22)',
    paddingVertical: 4,
    letterSpacing: 0.1,
  },
  carryInputBlock: {
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  carryInput: {
    fontSize: 16,
    fontWeight: '300',
    color: colors.text,
    lineHeight: 26,
    letterSpacing: -0.2,
    minHeight: 80,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: spacing.sm,
  },
  carryConfirmBtn: {
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignSelf: 'flex-start',
  },
  carryConfirmText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: -0.1,
  },
  carryConfirmedRow: {
    paddingVertical: spacing.xs,
  },
  carryConfirmedText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
});
