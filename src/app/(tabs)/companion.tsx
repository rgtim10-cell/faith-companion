import React, { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { sendMessage } from '@/services/ai';
import type { AIMessage } from '@/types';

const SUGGESTIONS = [
  'I need peace today',
  'Help me pray for my family',
  'I feel anxious about the future',
  'I want to express gratitude',
  'Guide me through a tough decision',
  'I need encouragement right now',
];

export default function CompanionScreen() {
  const { colors } = useTheme();
  const { state, startConversation, addMessage } = useData();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const conversation = state.currentConversation;
  const messages = conversation?.messages ?? [];

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text ?? input.trim();
      if (!messageText || isLoading) return;

      let convoId = conversation?.id;
      if (!convoId) {
        const newConvo = startConversation();
        convoId = newConvo.id;
      }

      setInput('');

      addMessage(convoId, { role: 'user', content: messageText });

      setIsLoading(true);
      try {
        const allMessages: AIMessage[] = [
          ...messages,
          { id: 'temp', role: 'user' as const, content: messageText, created_at: new Date().toISOString() },
        ];
        const response = await sendMessage(allMessages);
        addMessage(convoId, { role: 'assistant', content: response });
      } catch {
        addMessage(convoId, {
          role: 'assistant',
          content:
            "I'm here for you. Sometimes words are hard to find, but know that God's love for you is constant and unwavering. Would you like to try sharing what's on your heart?",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, conversation, messages, startConversation, addMessage],
  );

  const renderMessage = useCallback(
    ({ item }: { item: AIMessage }) => {
      const isUser = item.role === 'user';

      return (
        <View style={[styles.messageBubbleContainer, isUser && styles.userBubbleContainer]}>
          {!isUser && (
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isUser
                ? { backgroundColor: colors.primary }
                : { backgroundColor: colors.card, borderColor: colors.borderLight, borderWidth: 1 },
              Shadows.sm,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                { color: isUser ? '#FFFFFF' : colors.text },
              ]}
            >
              {item.content}
            </Text>
          </View>
        </View>
      );
    },
    [colors],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="sparkles" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Faith Companion</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Your AI prayer partner
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.newChatButton, { backgroundColor: colors.surfaceElevated }]}
            onPress={() => {
              startConversation();
            }}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages or Welcome */}
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <View style={[styles.welcomeIcon, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="sparkles" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              Hello, friend
            </Text>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
              I'm here to walk alongside you in your faith journey. Share what's on your heart, and
              I'll offer prayers, scripture, and encouragement.
            </Text>

            <View style={styles.suggestions}>
              {SUGGESTIONS.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={[
                    styles.suggestionButton,
                    { borderColor: colors.borderLight, backgroundColor: colors.card },
                  ]}
                  onPress={() => handleSend(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Typing indicator */}
        {isLoading && (
          <View style={styles.typingContainer}>
            <View style={[styles.avatar, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="sparkles" size={16} color={colors.primary} />
            </View>
            <View
              style={[
                styles.typingBubble,
                { backgroundColor: colors.card, borderColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.typingText, { color: colors.textTertiary }]}>
                Reflecting...
              </Text>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderTopColor: colors.borderLight }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceElevated,
                color: colors.text,
                borderColor: colors.borderLight,
              },
            ]}
            value={input}
            onChangeText={setInput}
            placeholder="Share what's on your heart..."
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                input.trim() && !isLoading
                  ? [colors.gradientStart, colors.gradientEnd]
                  : [colors.borderLight, colors.borderLight]
              }
              style={styles.sendButton}
            >
              <Ionicons
                name="send"
                size={18}
                color={input.trim() && !isLoading ? '#FFFFFF' : colors.textTertiary}
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.subheading,
  },
  headerSubtitle: {
    ...Typography.small,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  welcomeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  welcomeTitle: {
    ...Typography.heading,
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  suggestionButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  suggestionText: {
    ...Typography.caption,
  },
  messagesList: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  userBubbleContainer: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  messageText: {
    ...Typography.body,
    lineHeight: 22,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  typingBubble: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  typingText: {
    ...Typography.caption,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    maxHeight: 120,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
