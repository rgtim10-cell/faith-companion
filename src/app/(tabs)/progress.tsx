import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { SurfaceCard } from '@/components/GradientCard';
import type { PrayerCategory } from '@/types';

const CATEGORY_LABELS: Record<PrayerCategory, string> = {
  gratitude: 'Gratitude',
  petition: 'Petition',
  intercession: 'Intercession',
  confession: 'Confession',
  praise: 'Praise',
  healing: 'Healing',
  guidance: 'Guidance',
  protection: 'Protection',
  thanksgiving: 'Thanksgiving',
  other: 'Other',
};

const CATEGORY_COLORS: Record<PrayerCategory, string> = {
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

const MOOD_EMOJI: Record<string, string> = {
  peaceful: '😌',
  grateful: '🙏',
  joyful: '😊',
  hopeful: '🌟',
  content: '☺️',
  encouraged: '💪',
  anxious: '😰',
  stressed: '😓',
  sorrowful: '😢',
  lonely: '🥺',
};

export default function ProgressScreen() {
  const { colors } = useTheme();
  const { state, getStreak } = useData();

  const streak = getStreak();
  const totalPrayers = state.prayers.length;
  const answeredPrayers = state.prayers.filter((p) => p.status === 'answered').length;
  const answeredPercentage = totalPrayers > 0 ? Math.round((answeredPrayers / totalPrayers) * 100) : 0;

  const categoryBreakdown = useMemo(() => {
    const counts: Partial<Record<PrayerCategory, number>> = {};
    for (const prayer of state.prayers) {
      counts[prayer.category] = (counts[prayer.category] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [state.prayers]);

  const weeklyActivity = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const result: { day: string; count: number; isToday: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = state.prayers.filter((p) => p.created_at.split('T')[0] === dateStr).length;
      result.push({
        day: days[date.getDay()],
        count,
        isToday: i === 0,
      });
    }
    return result;
  }, [state.prayers]);

  const recentMoods = state.moods.slice(0, 7);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Your Progress</Text>

        {/* Streak Card */}
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.streakCard}
        >
          <View style={styles.streakIcon}>
            <Ionicons name="flame" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.streakNumber}>{streak}</Text>
          <Text style={styles.streakLabel}>Day Prayer Streak</Text>
          <Text style={styles.streakEncouragement}>
            {streak === 0
              ? 'Start your streak today!'
              : streak < 7
                ? 'Great start! Keep going!'
                : streak < 30
                  ? "Amazing consistency! You're growing!"
                  : 'Incredible dedication! Your faith shines!'}
          </Text>
        </LinearGradient>

        {/* Overview Stats */}
        <View style={styles.overviewRow}>
          <SurfaceCard style={styles.overviewCard}>
            <Ionicons name="book" size={24} color={colors.primary} />
            <Text style={[styles.overviewNumber, { color: colors.text }]}>{totalPrayers}</Text>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Total Prayers
            </Text>
          </SurfaceCard>
          <SurfaceCard style={styles.overviewCard}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Text style={[styles.overviewNumber, { color: colors.text }]}>
              {answeredPercentage}%
            </Text>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Answered
            </Text>
          </SurfaceCard>
          <SurfaceCard style={styles.overviewCard}>
            <Ionicons name="sunny" size={24} color={colors.secondary} />
            <Text style={[styles.overviewNumber, { color: colors.text }]}>
              {state.devotionals.length}
            </Text>
            <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
              Devotionals
            </Text>
          </SurfaceCard>
        </View>

        {/* Weekly Activity */}
        <SurfaceCard style={styles.weeklyCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>This Week</Text>
          <View style={styles.weeklyChart}>
            {weeklyActivity.map((day, i) => {
              const maxCount = Math.max(...weeklyActivity.map((d) => d.count), 1);
              const height = Math.max((day.count / maxCount) * 80, 4);
              return (
                <View key={i} style={styles.weeklyBar}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height,
                        backgroundColor: day.isToday
                          ? colors.primary
                          : day.count > 0
                            ? `${colors.primary}40`
                            : colors.borderLight,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.weeklyDay,
                      {
                        color: day.isToday ? colors.primary : colors.textTertiary,
                        fontWeight: day.isToday ? '600' : '400',
                      },
                    ]}
                  >
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </SurfaceCard>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <SurfaceCard style={styles.categoryCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Prayer Categories</Text>
            {categoryBreakdown.map(([category, count]) => {
              const percentage = Math.round((count / totalPrayers) * 100);
              const color = CATEGORY_COLORS[category as PrayerCategory] ?? colors.primary;
              return (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: color }]} />
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {CATEGORY_LABELS[category as PrayerCategory] ?? category}
                    </Text>
                  </View>
                  <View style={styles.categoryBarContainer}>
                    <View
                      style={[
                        styles.categoryBar,
                        { width: `${percentage}%`, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.categoryCount, { color: colors.textSecondary }]}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </SurfaceCard>
        )}

        {/* Mood History */}
        {recentMoods.length > 0 && (
          <SurfaceCard style={styles.moodCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Moods</Text>
            <View style={styles.moodHistory}>
              {recentMoods.map((entry) => (
                <View key={entry.id} style={styles.moodItem}>
                  <Text style={styles.moodEmoji}>
                    {MOOD_EMOJI[entry.mood] ?? '😊'}
                  </Text>
                  <Text style={[styles.moodDate, { color: colors.textTertiary }]}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              ))}
            </View>
          </SurfaceCard>
        )}

        {/* Empty State */}
        {totalPrayers === 0 && (
          <SurfaceCard elevated style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="stats-chart" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Start Your Journey
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Write your first prayer to see your progress and spiritual growth tracked here.
            </Text>
          </SurfaceCard>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.title,
    marginBottom: Spacing.xl,
  },
  streakCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  streakIcon: {
    marginBottom: Spacing.md,
  },
  streakNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 64,
  },
  streakLabel: {
    ...Typography.bodyMedium,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.sm,
  },
  streakEncouragement: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  overviewRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  overviewNumber: {
    ...Typography.heading,
  },
  overviewLabel: {
    ...Typography.small,
    textAlign: 'center',
  },
  weeklyCard: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.subheading,
    marginBottom: Spacing.lg,
  },
  weeklyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  weeklyBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 24,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  weeklyDay: {
    ...Typography.small,
  },
  categoryCard: {
    marginBottom: Spacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    gap: Spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    ...Typography.caption,
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryCount: {
    ...Typography.captionMedium,
    width: 30,
    textAlign: 'right',
  },
  moodCard: {
    marginBottom: Spacing.xl,
  },
  moodHistory: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  moodItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  moodEmoji: {
    fontSize: 28,
  },
  moodDate: {
    ...Typography.small,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
