import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format } from 'date-fns';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';

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

export default function PrayerDetailScreen() {
  const { colors } = useTheme();
  const { state, updatePrayer, markPrayerAnswered, deletePrayer } = useData();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const prayer = state.prayers.find((p) => p.id === id);
  const [answeredNote, setAnsweredNote] = useState('');
  const [showAnswered, setShowAnswered] = useState(false);

  if (!prayer) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>
            Prayer not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = CATEGORY_COLORS[prayer.category] ?? colors.primary;

  const handleDelete = () => {
    Alert.alert('Delete Prayer', 'Are you sure you want to delete this prayer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePrayer(prayer.id);
          router.back();
        },
      },
    ]);
  };

  const handleMarkAnswered = () => {
    markPrayerAnswered(prayer.id, answeredNote.trim() || undefined);
    setShowAnswered(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() =>
              updatePrayer(prayer.id, { is_favorite: !prayer.is_favorite })
            }
            style={styles.headerActionButton}
          >
            <Ionicons
              name={prayer.is_favorite ? 'heart' : 'heart-outline'}
              size={22}
              color={prayer.is_favorite ? '#EF4444' : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerActionButton}>
            <Ionicons name="trash-outline" size={22} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}15` }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>
            {prayer.category}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>{prayer.title}</Text>

        {/* Date */}
        <Text style={[styles.date, { color: colors.textTertiary }]}>
          {format(new Date(prayer.created_at), 'EEEE, MMMM d, yyyy • h:mm a')}
        </Text>

        {/* Status */}
        {prayer.status === 'answered' && (
          <View style={[styles.answeredBanner, { backgroundColor: `${colors.success}10` }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <View style={styles.answeredContent}>
              <Text style={[styles.answeredTitle, { color: colors.success }]}>
                Prayer Answered
              </Text>
              {prayer.answered_at && (
                <Text style={[styles.answeredDate, { color: colors.textSecondary }]}>
                  {format(new Date(prayer.answered_at), 'MMMM d, yyyy')}
                </Text>
              )}
              {prayer.answered_note && (
                <Text style={[styles.answeredNote, { color: colors.textSecondary }]}>
                  {prayer.answered_note}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Content */}
        <View
          style={[
            styles.contentCard,
            { backgroundColor: colors.card, borderColor: colors.borderLight },
          ]}
        >
          <Text style={[styles.contentText, { color: colors.text }]}>{prayer.content}</Text>
        </View>

        {/* Mark as Answered */}
        {prayer.status === 'active' && (
          <>
            {!showAnswered ? (
              <TouchableOpacity
                style={[styles.answeredButton, { borderColor: colors.success }]}
                onPress={() => setShowAnswered(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                <Text style={[styles.answeredButtonText, { color: colors.success }]}>
                  Mark as Answered
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.answeredForm,
                  { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight },
                ]}
              >
                <Text style={[styles.answeredFormTitle, { color: colors.text }]}>
                  How was this prayer answered?
                </Text>
                <TextInput
                  style={[
                    styles.answeredInput,
                    { color: colors.text, borderColor: colors.borderLight },
                  ]}
                  value={answeredNote}
                  onChangeText={setAnsweredNote}
                  placeholder="Share how God answered this prayer... (optional)"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.answeredFormButtons}>
                  <TouchableOpacity
                    style={[styles.formButton, { borderColor: colors.borderLight }]}
                    onPress={() => setShowAnswered(false)}
                  >
                    <Text style={[styles.formButtonText, { color: colors.textSecondary }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.formButton, { backgroundColor: colors.success }]}
                    onPress={handleMarkAnswered}
                  >
                    <Text style={[styles.formButtonText, { color: '#FFFFFF' }]}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}

        {/* Archive/Restore */}
        {prayer.status !== 'archived' ? (
          <TouchableOpacity
            style={[styles.archiveButton, { borderColor: colors.borderLight }]}
            onPress={() => updatePrayer(prayer.id, { status: 'archived' })}
            activeOpacity={0.7}
          >
            <Ionicons name="archive-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.archiveText, { color: colors.textSecondary }]}>Archive</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.archiveButton, { borderColor: colors.borderLight }]}
            onPress={() => updatePrayer(prayer.id, { status: 'active' })}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={18} color={colors.primary} />
            <Text style={[styles.archiveText, { color: colors.primary }]}>Restore</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  categoryText: {
    ...Typography.captionMedium,
    textTransform: 'capitalize',
  },
  title: {
    ...Typography.title,
    marginBottom: Spacing.sm,
  },
  date: {
    ...Typography.caption,
    marginBottom: Spacing.xl,
  },
  answeredBanner: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  answeredContent: {
    flex: 1,
  },
  answeredTitle: {
    ...Typography.bodyMedium,
    marginBottom: 2,
  },
  answeredDate: {
    ...Typography.small,
    marginBottom: Spacing.xs,
  },
  answeredNote: {
    ...Typography.caption,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  contentCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  contentText: {
    ...Typography.body,
    lineHeight: 26,
  },
  answeredButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  answeredButtonText: {
    ...Typography.bodyMedium,
  },
  answeredForm: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  answeredFormTitle: {
    ...Typography.subheading,
    marginBottom: Spacing.md,
  },
  answeredInput: {
    ...Typography.body,
    minHeight: 80,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  answeredFormButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  formButtonText: {
    ...Typography.bodyMedium,
  },
  archiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  archiveText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    ...Typography.body,
  },
});
