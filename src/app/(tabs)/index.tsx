import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { GradientCard, SurfaceCard } from '@/components/GradientCard';
import { MoodSelector } from '@/components/MoodSelector';
import { getDailyVerse } from '@/services/verses';
import type { MoodType } from '@/types';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { state, addMood, getStreak } = useData();
  const router = useRouter();
  const verse = getDailyVerse();
  const streak = getStreak();
  const [showMoodSelector, setShowMoodSelector] = useState(false);

  const recentPrayers = state.prayers.slice(0, 3);
  const answeredCount = state.prayers.filter((p) => p.status === 'answered').length;

  const handleMoodSelect = (mood: MoodType) => {
    addMood(mood, 3);
    setShowMoodSelector(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Faith Companion
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: colors.surfaceElevated }]}
          >
            <Ionicons name="person" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Daily Verse Card */}
        <GradientCard style={styles.verseCard}>
          <View style={styles.verseHeader}>
            <Ionicons name="book-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.verseLabel}>Daily Verse</Text>
          </View>
          <Text style={styles.verseText}>"{verse.text}"</Text>
          <Text style={styles.verseReference}>— {verse.reference}</Text>
        </GradientCard>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <SurfaceCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="flame" size={22} color={colors.primary} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Day Streak</Text>
          </SurfaceCard>
          <SurfaceCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.accent}15` }]}>
              <Ionicons name="heart" size={22} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{state.prayers.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Prayers</Text>
          </SurfaceCard>
          <SurfaceCard style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: `${colors.success}15` }]}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{answeredCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Answered</Text>
          </SurfaceCard>
        </View>

        {/* Quick Prayer Button */}
        <TouchableOpacity
          style={styles.quickPrayerButton}
          onPress={() => router.push('/prayer/new')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.prayerGradientStart, colors.prayerGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quickPrayerGradient}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.quickPrayerText}>Write a Prayer</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* How are you feeling */}
        <SurfaceCard style={styles.moodCard}>
          <TouchableOpacity
            style={styles.moodHeader}
            onPress={() => setShowMoodSelector(!showMoodSelector)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                How are you feeling?
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Track your emotional journey
              </Text>
            </View>
            <Ionicons
              name={showMoodSelector ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          {showMoodSelector && (
            <View style={styles.moodContent}>
              <MoodSelector onSelect={handleMoodSelect} compact />
            </View>
          )}
        </SurfaceCard>

        {/* Encouragement */}
        <SurfaceCard elevated style={styles.encouragementCard}>
          <View style={styles.encouragementIcon}>
            <Text style={{ fontSize: 32 }}>✨</Text>
          </View>
          <Text style={[styles.encouragementTitle, { color: colors.text }]}>
            Daily Encouragement
          </Text>
          <Text style={[styles.encouragementText, { color: colors.textSecondary }]}>
            {getEncouragement()}
          </Text>
        </SurfaceCard>

        {/* Recent Prayers */}
        {recentPrayers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Prayers</Text>
              <TouchableOpacity onPress={() => router.push('/journal')}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
              </TouchableOpacity>
            </View>
            {recentPrayers.map((prayer) => (
              <TouchableOpacity
                key={prayer.id}
                style={[
                  styles.recentPrayer,
                  { backgroundColor: colors.card, borderColor: colors.borderLight },
                ]}
                onPress={() => router.push(`/prayer/${prayer.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.recentPrayerContent}>
                  <Text style={[styles.recentPrayerTitle, { color: colors.text }]} numberOfLines={1}>
                    {prayer.title}
                  </Text>
                  <Text
                    style={[styles.recentPrayerBody, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {prayer.content}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* AI Companion CTA */}
        <TouchableOpacity
          style={styles.aiCtaButton}
          onPress={() => router.push('/companion')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiCtaGradient}
          >
            <View style={styles.aiCtaContent}>
              <Ionicons name="sparkles" size={28} color="#FFFFFF" />
              <View style={styles.aiCtaText}>
                <Text style={styles.aiCtaTitle}>Talk to Your Faith Companion</Text>
                <Text style={styles.aiCtaDescription}>
                  Share your thoughts and receive encouragement
                </Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getEncouragement(): string {
  const encouragements = [
    'Remember, God is working in ways you cannot see. Trust His timing.',
    'You are deeply loved and valued. Nothing can separate you from His love.',
    'Every prayer matters. God hears each one and holds them close to His heart.',
    'Today is a new day filled with grace and mercy. Embrace it with hope.',
    'Your faith is a journey, not a destination. Be gentle with yourself along the way.',
    "In your weakness, His strength is made perfect. You don't have to have it all together.",
    'The same God who painted the sunrise is painting your story. Trust the Artist.',
  ];
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return encouragements[dayOfYear % encouragements.length];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  greeting: {
    ...Typography.caption,
    marginBottom: 2,
  },
  title: {
    ...Typography.title,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.xxl,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  verseLabel: {
    ...Typography.captionMedium,
    color: 'rgba(255,255,255,0.9)',
  },
  verseText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  verseReference: {
    ...Typography.captionMedium,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statNumber: {
    ...Typography.heading,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.small,
  },
  quickPrayerButton: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  quickPrayerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  quickPrayerText: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
  },
  moodCard: {
    marginBottom: Spacing.xl,
  },
  moodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodContent: {
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.subheading,
  },
  sectionSubtitle: {
    ...Typography.small,
    marginTop: 2,
  },
  encouragementCard: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  encouragementIcon: {
    marginBottom: Spacing.md,
  },
  encouragementTitle: {
    ...Typography.subheading,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  encouragementText: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  seeAll: {
    ...Typography.captionMedium,
  },
  recentPrayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
  },
  recentPrayerContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  recentPrayerTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  recentPrayerBody: {
    ...Typography.caption,
  },
  aiCtaButton: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  aiCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  aiCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.lg,
  },
  aiCtaText: {
    flex: 1,
  },
  aiCtaTitle: {
    ...Typography.bodyMedium,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  aiCtaDescription: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.8)',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
