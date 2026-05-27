import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { MoodType } from '@/types';

const MOODS: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'peaceful', emoji: '😌', label: 'Peaceful' },
  { type: 'grateful', emoji: '🙏', label: 'Grateful' },
  { type: 'joyful', emoji: '😊', label: 'Joyful' },
  { type: 'hopeful', emoji: '🌟', label: 'Hopeful' },
  { type: 'content', emoji: '☺️', label: 'Content' },
  { type: 'encouraged', emoji: '💪', label: 'Encouraged' },
  { type: 'anxious', emoji: '😰', label: 'Anxious' },
  { type: 'stressed', emoji: '😓', label: 'Stressed' },
  { type: 'sorrowful', emoji: '😢', label: 'Sorrowful' },
  { type: 'lonely', emoji: '🥺', label: 'Lonely' },
];

interface MoodSelectorProps {
  selected?: MoodType;
  onSelect: (mood: MoodType) => void;
  compact?: boolean;
}

export function MoodSelector({ selected, onSelect, compact }: MoodSelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {MOODS.map((mood) => {
        const isSelected = selected === mood.type;
        return (
          <TouchableOpacity
            key={mood.type}
            style={[
              styles.moodItem,
              compact && styles.moodItemCompact,
              isSelected && { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
              !isSelected && { borderColor: colors.borderLight },
            ]}
            onPress={() => onSelect(mood.type)}
            activeOpacity={0.7}
          >
            <Text style={[styles.emoji, compact && styles.emojiCompact]}>{mood.emoji}</Text>
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                { color: isSelected ? colors.primary : colors.textSecondary },
              ]}
            >
              {mood.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  compact: {
    gap: Spacing.xs,
  },
  moodItem: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    minWidth: 80,
  },
  moodItemCompact: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minWidth: 64,
    borderRadius: BorderRadius.md,
  },
  emoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  emojiCompact: {
    fontSize: 22,
  },
  label: {
    ...Typography.small,
    fontWeight: '500',
  },
  labelCompact: {
    fontSize: 10,
  },
});
