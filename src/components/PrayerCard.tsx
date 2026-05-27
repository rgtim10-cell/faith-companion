import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import type { Prayer } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface PrayerCardProps {
  prayer: Prayer;
  onPress?: () => void;
  onFavorite?: () => void;
  onMarkAnswered?: () => void;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  gratitude: 'heart',
  petition: 'hand-left',
  intercession: 'people',
  confession: 'shield-checkmark',
  praise: 'musical-notes',
  healing: 'medkit',
  guidance: 'compass',
  protection: 'shield',
  thanksgiving: 'gift',
  other: 'ellipsis-horizontal',
};

const CATEGORY_COLORS: Record<string, string> = {
  gratitude: '#E8A87C',
  petition: '#6B5CE7',
  intercession: '#41B3A3',
  confession: '#F2994A',
  praise: '#667eea',
  healing: '#10B981',
  guidance: '#764ba2',
  protection: '#3B82F6',
  thanksgiving: '#F59E0B',
  other: '#9CA3AF',
};

export function PrayerCard({ prayer, onPress, onFavorite, onMarkAnswered }: PrayerCardProps) {
  const { colors } = useTheme();

  const categoryColor = CATEGORY_COLORS[prayer.category] ?? colors.primary;
  const timeAgo = formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.borderLight },
        Shadows.sm,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
          <Ionicons
            name={CATEGORY_ICONS[prayer.category] ?? 'ellipsis-horizontal'}
            size={14}
            color={categoryColor}
          />
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {prayer.category}
          </Text>
        </View>
        <View style={styles.actions}>
          {prayer.status === 'active' && onMarkAnswered && (
            <TouchableOpacity onPress={onMarkAnswered} style={styles.actionButton}>
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.success} />
            </TouchableOpacity>
          )}
          {onFavorite && (
            <TouchableOpacity onPress={onFavorite} style={styles.actionButton}>
              <Ionicons
                name={prayer.is_favorite ? 'heart' : 'heart-outline'}
                size={22}
                color={prayer.is_favorite ? '#EF4444' : colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {prayer.title}
      </Text>
      <Text style={[styles.content, { color: colors.textSecondary }]} numberOfLines={2}>
        {prayer.content}
      </Text>

      <View style={styles.footer}>
        <Text style={[styles.time, { color: colors.textTertiary }]}>{timeAgo}</Text>
        {prayer.status === 'answered' && (
          <View style={[styles.answeredBadge, { backgroundColor: `${colors.success}15` }]}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={[styles.answeredText, { color: colors.success }]}>Answered</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  categoryText: {
    ...Typography.small,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.subheading,
    marginBottom: Spacing.xs,
  },
  content: {
    ...Typography.body,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    ...Typography.small,
  },
  answeredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  answeredText: {
    ...Typography.small,
    fontWeight: '600',
  },
});
