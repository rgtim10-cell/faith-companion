import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { OathOrb } from '@/components/ui/OathOrb';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { RealmKey } from '@/types';

const REALM_ORDER: RealmKey[] = ['presence', 'future_self', 'mission_control', 'alignment'];

const quickActions = [
  { id: 'talk', label: 'Talk to me' },
  { id: 'analyze', label: 'Analyze my day' },
  { id: 'advice', label: 'Give me advice' },
  { id: 'challenge', label: 'Challenge me' },
];

export function OathScreen() {
  const { realm, realmKey, setRealm } = useRealm();
  const insets = useSafeAreaInsets();
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    textOpacity.setValue(0);
    textTranslate.setValue(12);
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
      Animated.timing(textTranslate, { toValue: 0, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();
  }, [realmKey, textOpacity, textTranslate]);

  return (
    <View style={styles.container}>
      <RealmBackground />

      <View style={[styles.content, { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 110 }]}>

        {/* Realm indicator */}
        <View style={styles.header}>
          <Text style={[styles.appName, { color: realm.accentSoft }]}>OATH</Text>
          <TouchableOpacity style={[styles.realmPill, { borderColor: realm.accent + '44', backgroundColor: realm.accentMuted }]}>
            <View style={[styles.realmDotSmall, { backgroundColor: realm.accent }]} />
            <Text style={[styles.realmPillText, { color: realm.accentSoft }]}>
              {realm.name} Realm
            </Text>
            <Text style={[styles.realmChevron, { color: realm.accentSoft }]}>↓</Text>
          </TouchableOpacity>
        </View>

        {/* The Living Presence — orb dominates */}
        <View style={styles.orbSection}>
          <OathOrb size="xl" />

          <Animated.View style={[styles.orbTextBlock, { opacity: textOpacity, transform: [{ translateY: textTranslate }] }]}>
            <Text style={[styles.listeningText, { color: realm.accentSoft }]}>
              {realm.listeningVoice}
            </Text>
            <Text style={styles.presenceStatement}>
              {realm.presenceStatement}
            </Text>
          </Animated.View>
        </View>

        {/* OATH asks — the invitation */}
        <View style={styles.questionBlock}>
          <Text style={[styles.questionText, { color: colors.textSecondary }]}>
            How can I support you right now?
          </Text>
        </View>

        {/* Quick interactions — 2×2 grid */}
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => {
            const isActive = activeAction === action.id;
            return (
              <TouchableOpacity
                key={action.id}
                onPress={() => setActiveAction(isActive ? null : action.id)}
                activeOpacity={0.75}
                style={[
                  styles.actionCard,
                  isActive
                    ? { backgroundColor: realm.accentMuted, borderColor: realm.accent + '66' }
                    : { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
                ]}
              >
                <Text style={[styles.actionLabel, { color: isActive ? realm.accentSoft : colors.text }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Realm switcher */}
        <View style={styles.realmSwitcher}>
          <Text style={[styles.realmSwitchLabel, { color: colors.textSubtle }]}>SWITCH REALM</Text>
          <View style={styles.realmDots}>
            {REALM_ORDER.map((key) => {
              const isActive = key === realmKey;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setRealm(key)}
                  style={[
                    styles.realmDot,
                    {
                      backgroundColor: isActive ? realm.accent : colors.surface2,
                      borderColor: isActive ? realm.accent + '80' : colors.border,
                      width: isActive ? 24 : 8,
                    },
                  ]}
                />
              );
            })}
          </View>
          <Text style={[styles.realmContext, { color: colors.textSubtle }]}>
            {realm.contextStatement}
          </Text>
        </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  appName: {
    ...typography.labelLg,
    fontSize: 13,
    letterSpacing: 3,
  },
  realmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  realmDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  realmPillText: {
    ...typography.labelMd,
  },
  realmChevron: {
    fontSize: 11,
  },
  orbSection: {
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  orbTextBlock: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  listeningText: {
    ...typography.labelLg,
    letterSpacing: 3,
  },
  presenceStatement: {
    ...typography.headingMd,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '300',
  },
  questionBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  questionText: {
    ...typography.bodyLg,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: '47.5%',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  actionLabel: {
    ...typography.bodyMd,
    fontWeight: '500',
    textAlign: 'center',
  },
  realmSwitcher: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  realmSwitchLabel: {
    ...typography.labelSm,
    letterSpacing: 1.8,
  },
  realmDots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  realmDot: {
    height: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  realmContext: {
    ...typography.bodySm,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 19,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xs,
  },
});
