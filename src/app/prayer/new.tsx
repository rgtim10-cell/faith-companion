import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { generatePrayer } from '@/services/ai';
import type { PrayerCategory } from '@/types';

const CATEGORIES: { key: PrayerCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'gratitude', label: 'Gratitude', icon: 'heart' },
  { key: 'petition', label: 'Petition', icon: 'hand-left' },
  { key: 'intercession', label: 'Intercession', icon: 'people' },
  { key: 'confession', label: 'Confession', icon: 'shield-checkmark' },
  { key: 'praise', label: 'Praise', icon: 'musical-notes' },
  { key: 'healing', label: 'Healing', icon: 'medkit' },
  { key: 'guidance', label: 'Guidance', icon: 'compass' },
  { key: 'protection', label: 'Protection', icon: 'shield' },
  { key: 'thanksgiving', label: 'Thanksgiving', icon: 'gift' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function NewPrayerScreen() {
  const { colors } = useTheme();
  const { addPrayer } = useData();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('gratitude');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    addPrayer({
      title: title.trim(),
      content: content.trim(),
      category,
      status: 'active',
      is_favorite: false,
      answered_at: null,
      answered_note: null,
      voice_url: null,
    });

    router.back();
  };

  const handleAIAssist = async () => {
    if (!title.trim() && !content.trim()) return;
    setIsGenerating(true);
    try {
      const situation = content.trim() || title.trim();
      const generated = await generatePrayer(situation, category);
      setContent(generated);
    } finally {
      setIsGenerating(false);
    }
  };

  const canSave = title.trim().length > 0 && content.trim().length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>New Prayer</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            style={styles.saveButton}
          >
            <Text
              style={[
                styles.saveText,
                { color: canSave ? colors.primary : colors.textTertiary },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Input */}
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Prayer title..."
            placeholderTextColor={colors.textTertiary}
            maxLength={100}
          />

          {/* Category Selector */}
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categories}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryButton,
                    isSelected
                      ? { backgroundColor: colors.primary }
                      : {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: colors.borderLight,
                          borderWidth: 1,
                        },
                  ]}
                  onPress={() => setCategory(cat.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={isSelected ? '#FFFFFF' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Content Input */}
          <TextInput
            style={[
              styles.contentInput,
              {
                color: colors.text,
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.borderLight,
              },
            ]}
            value={content}
            onChangeText={setContent}
            placeholder="Pour out your heart here... What would you like to pray about?"
            placeholderTextColor={colors.textTertiary}
            multiline
            textAlignVertical="top"
            maxLength={2000}
          />

          {/* AI Assist Button */}
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleAIAssist}
            disabled={isGenerating || (!title.trim() && !content.trim())}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                !isGenerating && (title.trim() || content.trim())
                  ? [colors.gradientStart, colors.gradientEnd]
                  : [colors.borderLight, colors.borderLight]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiButtonGradient}
            >
              <Ionicons
                name="sparkles"
                size={18}
                color={
                  !isGenerating && (title.trim() || content.trim())
                    ? '#FFFFFF'
                    : colors.textTertiary
                }
              />
              <Text
                style={[
                  styles.aiButtonText,
                  {
                    color:
                      !isGenerating && (title.trim() || content.trim())
                        ? '#FFFFFF'
                        : colors.textTertiary,
                  },
                ]}
              >
                {isGenerating ? 'Crafting prayer...' : 'AI Prayer Assistant'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.textTertiary }]}>
            Write a title and some thoughts, then use the AI assistant to help craft your prayer.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
  headerTitle: {
    ...Typography.subheading,
  },
  saveButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  saveText: {
    ...Typography.bodyMedium,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  titleInput: {
    ...Typography.heading,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.captionMedium,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  categoriesScroll: {
    marginBottom: Spacing.xl,
    marginHorizontal: -Spacing.xl,
  },
  categories: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  categoryLabel: {
    ...Typography.caption,
    fontWeight: '500',
  },
  contentInput: {
    ...Typography.body,
    minHeight: 200,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  aiButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  aiButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  aiButtonText: {
    ...Typography.bodyMedium,
  },
  hint: {
    ...Typography.small,
    textAlign: 'center',
    lineHeight: 18,
  },
});
