import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { SurfaceCard } from '@/components/GradientCard';
import { generateDevotional } from '@/services/ai';
import { getDailyVerse } from '@/services/verses';

interface DevotionalContent {
  title: string;
  content: string;
  scripture_reference: string;
  scripture_text: string;
  reflection_prompt: string;
  prayer_suggestion: string;
}

export default function DevotionalsScreen() {
  const { colors } = useTheme();
  const { state, addDevotional } = useData();
  const [todayDevotional, setTodayDevotional] = useState<DevotionalContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const verse = getDailyVerse();

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const latestMood = state.moods[0]?.mood;
      const recentPrayerTopics = state.prayers.slice(0, 5).map((p) => p.title);
      const devotional = await generateDevotional(latestMood, recentPrayerTopics);
      setTodayDevotional(devotional);
      addDevotional({
        ...devotional,
        mood_tag: latestMood ?? null,
        is_read: false,
      });
    } catch {
      setTodayDevotional({
        title: 'Walking in Faith',
        content:
          "Each day presents an opportunity to deepen our relationship with God. As you go through today, remember that God walks beside you in every moment — in joy and in struggle.\n\nFaith isn't about having all the answers. It's about trusting the One who does. When uncertainty clouds your path, let His word be the lamp that guides your feet.",
        scripture_reference: 'Psalm 119:105',
        scripture_text:
          'Your word is a lamp for my feet, a light on my path.',
        reflection_prompt:
          'What is one area of your life where you need to trust God more fully today?',
        prayer_suggestion:
          'Lord, illuminate my path today. Help me to walk in faith even when I cannot see what lies ahead. I trust in Your guidance and Your perfect timing. Amen.',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [state.moods, state.prayers, addDevotional]);

  useEffect(() => {
    if (!todayDevotional && state.devotionals.length === 0) {
      handleGenerate();
    } else if (!todayDevotional && state.devotionals.length > 0) {
      const latest = state.devotionals[0];
      setTodayDevotional({
        title: latest.title,
        content: latest.content,
        scripture_reference: latest.scripture_reference,
        scripture_text: latest.scripture_text,
        reflection_prompt: latest.reflection_prompt,
        prayer_suggestion: latest.prayer_suggestion,
      });
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Daily Devotional</Text>
          <TouchableOpacity
            style={[styles.refreshButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={handleGenerate}
            disabled={isGenerating}
            activeOpacity={0.7}
          >
            <Ionicons
              name="refresh"
              size={20}
              color={isGenerating ? colors.textTertiary : colors.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Date Banner */}
        <View style={[styles.dateBanner, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="calendar-outline" size={16} color={colors.primary} />
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {isGenerating ? (
          <SurfaceCard style={styles.loadingCard}>
            <View style={styles.loadingContent}>
              <Ionicons name="sparkles" size={32} color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Preparing your devotional...
              </Text>
            </View>
          </SurfaceCard>
        ) : todayDevotional ? (
          <>
            {/* Scripture Card */}
            <LinearGradient
              colors={[colors.prayerGradientStart, colors.prayerGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.scriptureCard}
            >
              <View style={styles.scriptureIcon}>
                <Ionicons name="book" size={24} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.scriptureText}>"{todayDevotional.scripture_text}"</Text>
              <Text style={styles.scriptureRef}>— {todayDevotional.scripture_reference}</Text>
            </LinearGradient>

            {/* Devotional Content */}
            <SurfaceCard style={styles.devotionalCard}>
              <Text style={[styles.devotionalTitle, { color: colors.text }]}>
                {todayDevotional.title}
              </Text>
              <Text style={[styles.devotionalContent, { color: colors.textSecondary }]}>
                {todayDevotional.content}
              </Text>
            </SurfaceCard>

            {/* Reflection Prompt */}
            <SurfaceCard elevated style={styles.reflectionCard}>
              <View style={styles.reflectionHeader}>
                <View style={[styles.reflectionIcon, { backgroundColor: `${colors.accent}15` }]}>
                  <Ionicons name="bulb" size={20} color={colors.accent} />
                </View>
                <Text style={[styles.reflectionLabel, { color: colors.accent }]}>
                  Reflect
                </Text>
              </View>
              <Text style={[styles.reflectionText, { color: colors.text }]}>
                {todayDevotional.reflection_prompt}
              </Text>
            </SurfaceCard>

            {/* Suggested Prayer */}
            <SurfaceCard elevated style={styles.prayerSuggestionCard}>
              <View style={styles.reflectionHeader}>
                <View style={[styles.reflectionIcon, { backgroundColor: `${colors.secondary}15` }]}>
                  <Ionicons name="hand-left" size={20} color={colors.secondary} />
                </View>
                <Text style={[styles.reflectionLabel, { color: colors.secondary }]}>
                  Suggested Prayer
                </Text>
              </View>
              <Text style={[styles.prayerSuggestionText, { color: colors.textSecondary }]}>
                {todayDevotional.prayer_suggestion}
              </Text>
            </SurfaceCard>
          </>
        ) : null}

        {/* Daily Verse (separate from devotional) */}
        <SurfaceCard style={styles.verseCard}>
          <View style={styles.verseHeader}>
            <Ionicons name="bookmark" size={18} color={colors.primary} />
            <Text style={[styles.verseLabel, { color: colors.primary }]}>Verse of the Day</Text>
          </View>
          <Text style={[styles.verseText, { color: colors.text }]}>"{verse.text}"</Text>
          <Text style={[styles.verseRef, { color: colors.textSecondary }]}>
            — {verse.reference}
          </Text>
        </SurfaceCard>

        {/* Past Devotionals */}
        {state.devotionals.length > 1 && (
          <View style={styles.pastSection}>
            <Text style={[styles.pastTitle, { color: colors.text }]}>Past Devotionals</Text>
            {state.devotionals.slice(1, 5).map((dev) => (
              <TouchableOpacity
                key={dev.id}
                style={[
                  styles.pastItem,
                  { backgroundColor: colors.card, borderColor: colors.borderLight },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.pastItemContent}>
                  <Text style={[styles.pastItemTitle, { color: colors.text }]} numberOfLines={1}>
                    {dev.title}
                  </Text>
                  <Text style={[styles.pastItemDate, { color: colors.textTertiary }]}>
                    {new Date(dev.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.title,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  dateText: {
    ...Typography.caption,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: Spacing.huge,
  },
  loadingContent: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
  },
  scriptureCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  scriptureIcon: {
    marginBottom: Spacing.lg,
  },
  scriptureText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: Spacing.md,
  },
  scriptureRef: {
    ...Typography.captionMedium,
    color: 'rgba(255,255,255,0.8)',
  },
  devotionalCard: {
    marginBottom: Spacing.lg,
  },
  devotionalTitle: {
    ...Typography.heading,
    marginBottom: Spacing.md,
  },
  devotionalContent: {
    ...Typography.body,
    lineHeight: 24,
  },
  reflectionCard: {
    marginBottom: Spacing.lg,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reflectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reflectionLabel: {
    ...Typography.captionMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reflectionText: {
    ...Typography.body,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  prayerSuggestionCard: {
    marginBottom: Spacing.xl,
  },
  prayerSuggestionText: {
    ...Typography.body,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  verseCard: {
    marginBottom: Spacing.xl,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  verseLabel: {
    ...Typography.captionMedium,
  },
  verseText: {
    ...Typography.body,
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  verseRef: {
    ...Typography.caption,
  },
  pastSection: {
    marginBottom: Spacing.xl,
  },
  pastTitle: {
    ...Typography.subheading,
    marginBottom: Spacing.md,
  },
  pastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  pastItemContent: {
    flex: 1,
  },
  pastItemTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  pastItemDate: {
    ...Typography.small,
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
