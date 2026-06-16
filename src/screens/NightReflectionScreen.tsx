import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { GlassCard } from '@/components/ui/GlassCard';
import { OathOrb } from '@/components/ui/OathOrb';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { MoodLevel } from '@/types';

const moods: { level: MoodLevel; label: string; emoji: string }[] = [
  { level: 'unstoppable', label: 'Unstoppable', emoji: '⚡' },
  { level: 'strong', label: 'Strong', emoji: '🔥' },
  { level: 'steady', label: 'Steady', emoji: '◎' },
  { level: 'low', label: 'Low', emoji: '◑' },
];

const prompts = [
  "What moved today?",
  "What did you protect?",
  "What does tomorrow need from you?",
];

export function NightReflectionScreen() {
  const { realm } = useRealm();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [reflection, setReflection] = useState('');
  const [currentPrompt] = useState(prompts[Math.floor(Math.random() * prompts.length)]);

  const handleMoodSelect = (level: MoodLevel) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMood(level);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <RealmBackground />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.time, { color: realm.accentSoft }]}>NIGHT REFLECTION</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Orb */}
        <View style={styles.orbSection}>
          <OathOrb size="md" />
          <Text style={[styles.oathLine, { color: realm.accentSoft }]}>
            OATH is listening.
          </Text>
        </View>

        {/* Mood check */}
        <GlassCard padding="lg" style={styles.moodCard}>
          <Text style={styles.moodQuestion}>How did today feel?</Text>
          <View style={styles.moodRow}>
            {moods.map(({ level, label, emoji }) => {
              const active = selectedMood === level;
              return (
                <TouchableOpacity
                  key={level}
                  onPress={() => handleMoodSelect(level)}
                  style={[
                    styles.moodChip,
                    active
                      ? { backgroundColor: realm.accentMuted, borderColor: realm.accent + '66' }
                      : { backgroundColor: colors.glass, borderColor: colors.border },
                  ]}
                >
                  <Text style={styles.moodEmoji}>{emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      { color: active ? realm.accentSoft : colors.textSubtle },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {/* Reflection prompt */}
        <GlassCard padding="lg" style={styles.reflectionCard}>
          <Text style={[styles.prompt, { color: realm.accentSoft }]}>{currentPrompt}</Text>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            placeholder="Write freely. OATH remembers."
            placeholderTextColor={colors.textSubtle}
            multiline
            style={styles.input}
            textAlignVertical="top"
          />
        </GlassCard>

        {/* OATH closing note */}
        <View style={styles.oathNote}>
          <Text style={styles.noteText}>
            "{realm.aiTone} You showed up. That is enough."
          </Text>
          <Text style={[styles.noteSource, { color: realm.accentSoft }]}>— OATH</Text>
        </View>

        {/* Done */}
        <TouchableOpacity
          style={[styles.doneButton, { backgroundColor: realm.accent }]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            handleClose();
          }}
        >
          <Text style={styles.doneText}>Save reflection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    ...typography.labelLg,
    letterSpacing: 2,
  },
  close: {
    ...typography.headingSm,
    color: colors.textSecondary,
  },
  orbSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  oathLine: {
    ...typography.labelLg,
    letterSpacing: 1.5,
  },
  moodCard: {
    gap: spacing.md,
  },
  moodQuestion: {
    ...typography.headingSm,
    color: colors.text,
  },
  moodRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  moodEmoji: {
    fontSize: 15,
  },
  moodLabel: {
    ...typography.labelLg,
  },
  reflectionCard: {
    gap: spacing.md,
    flex: 1,
  },
  prompt: {
    ...typography.headingSm,
  },
  input: {
    ...typography.bodyMd,
    color: colors.text,
    flex: 1,
    minHeight: 80,
  },
  oathNote: {
    alignItems: 'center',
    gap: 2,
  },
  noteText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noteSource: {
    ...typography.labelMd,
  },
  doneButton: {
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneText: {
    ...typography.bodyMd,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
