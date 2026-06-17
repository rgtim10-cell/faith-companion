import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { alignmentScore, userProfile } from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';

const reflectionPrompts = [
  { id: 'q1', question: 'What went well today?' },
  { id: 'q2', question: 'What got in your way?' },
  { id: 'q3', question: 'What will you improve tomorrow?' },
];

export function NightReflectionScreen() {
  const { realm } = useRealm();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const handleClose = () => navigation.goBack();

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCompleted(true);
    setTimeout(() => handleClose(), 1200);
  };

  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;
  const allAnswered = answeredCount === reflectionPrompts.length;

  return (
    <View style={styles.container}>
      <RealmBackground />

      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: realm.accentSoft }]}>Night Reflection</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* OATH opens — direct, personal */}
        <View style={styles.openingBlock}>
          <Text style={styles.openingTitle}>Let's review{'\n'}your day.</Text>
          <Text style={[styles.openingSubtitle, { color: realm.accentSoft }]}>
            Honesty builds mastery.
          </Text>
        </View>

        {/* Reflection prompts */}
        <View style={styles.promptsList}>
          {reflectionPrompts.map((prompt, i) => {
            const answered = answers[prompt.id]?.trim().length > 0;
            return (
              <GlassCard key={prompt.id} padding="lg" style={styles.promptCard}>
                <View style={styles.promptHeader}>
                  <Text style={[styles.promptQuestion, { color: colors.text }]}>{prompt.question}</Text>
                  {answered && (
                    <View style={[styles.checkMark, { borderColor: realm.accent + '55', backgroundColor: realm.accentMuted }]}>
                      <Text style={[styles.checkText, { color: realm.accent }]}>✓</Text>
                    </View>
                  )}
                </View>
                <TextInput
                  value={answers[prompt.id] ?? ''}
                  onChangeText={(text) => setAnswers((prev) => ({ ...prev, [prompt.id]: text }))}
                  placeholder={i === 0 ? 'What moved today...' : i === 1 ? 'What got in the way...' : 'What tomorrow needs...'}
                  placeholderTextColor={colors.textSubtle}
                  multiline
                  style={styles.answerInput}
                  textAlignVertical="top"
                />
              </GlassCard>
            );
          })}
        </View>

        {/* OATH summary — appears when all answered */}
        {allAnswered && (
          <GlassCard padding="lg" style={[styles.summaryCard, { borderColor: realm.accent + '44' }]}>
            <View style={styles.summaryHeader}>
              <View style={[styles.summaryDot, { backgroundColor: realm.accent }]} />
              <Text style={[styles.summaryLabel, { color: realm.accent }]}>OATH SUMMARY</Text>
            </View>
            <Text style={styles.summaryText}>
              You stayed aligned with your identity {alignmentScore}% of the day.{'\n'}
              That's a win, {userProfile.firstName}.
            </Text>
          </GlassCard>
        )}

        {/* OATH's closing — first person, emotionally resonant */}
        <View style={styles.closingBlock}>
          <Text style={styles.closingText}>
            "{realm.aiTone.split('.')[0]}. You showed up. That is enough."
          </Text>
          <Text style={[styles.closingAttrib, { color: realm.accentSoft }]}>— OATH</Text>
        </View>

        {/* Complete */}
        <TouchableOpacity
          style={[
            styles.completeBtn,
            { backgroundColor: completed ? realm.accentMuted : realm.accent, borderColor: realm.accent + '55' },
          ]}
          onPress={handleComplete}
          activeOpacity={0.85}
        >
          <Text style={[styles.completeBtnText, { color: completed ? realm.accentSoft : '#000' }]}>
            {completed ? '✓ Reflection saved' : 'Complete Reflection  →'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    color: colors.textSecondary,
  },
  headerTitle: {
    ...typography.labelLg,
    letterSpacing: 1.5,
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  openingBlock: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  openingTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1.5,
    lineHeight: 42,
  },
  openingSubtitle: {
    ...typography.bodyLg,
    fontStyle: 'italic',
  },
  promptsList: {
    gap: spacing.md,
  },
  promptCard: {
    gap: spacing.sm,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promptQuestion: {
    ...typography.headingSm,
    flex: 1,
  },
  checkMark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  answerInput: {
    ...typography.bodyMd,
    color: colors.text,
    minHeight: 52,
    lineHeight: 22,
  },
  summaryCard: {
    gap: spacing.sm,
    borderWidth: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryLabel: {
    ...typography.labelLg,
    letterSpacing: 1.5,
  },
  summaryText: {
    ...typography.bodyLg,
    color: colors.text,
    lineHeight: 26,
  },
  closingBlock: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
  },
  closingText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  closingAttrib: {
    ...typography.labelMd,
  },
  completeBtn: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  completeBtnText: {
    ...typography.bodyMd,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
