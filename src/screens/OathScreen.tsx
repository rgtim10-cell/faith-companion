import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RealmBackground } from '@/components/layout/RealmBackground';
import { AIInsight } from '@/components/ui/AIInsight';
import { GlassCard } from '@/components/ui/GlassCard';
import { MemoryCard } from '@/components/ui/MemoryCard';
import { OathOrb } from '@/components/ui/OathOrb';
import { aiInsights, userProfile, vaultMemories } from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { RealmKey } from '@/types';

const REALM_ORDER: RealmKey[] = ['presence', 'future_self', 'mission_control', 'alignment'];

export function OathScreen() {
  const { realm, realmKey, setRealm } = useRealm();
  const insets = useSafeAreaInsets();
  const topMemory = vaultMemories[0];

  return (
    <View style={styles.container}>
      <RealmBackground />

      <View
        style={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 110 },
        ]}
      >
        {/* Realm indicator + switcher */}
        <View style={styles.realmRow}>
          <View style={[styles.realmIndicator, { borderColor: realm.accent + '44', backgroundColor: realm.accentMuted }]}>
            <Text style={[styles.realmName, { color: realm.accentSoft }]}>
              {realm.name.toUpperCase()} REALM
            </Text>
          </View>
        </View>

        {/* Orb — the living center */}
        <View style={styles.orbSection}>
          <OathOrb size="xl" />
          <View style={styles.orbText}>
            <Text style={[styles.presenceLabel, { color: realm.accentSoft }]}>
              {realm.insightPrefix.toUpperCase()}
            </Text>
            <Text style={styles.feelingText}>{realm.feeling}</Text>
          </View>
        </View>

        {/* OATH Insight */}
        <AIInsight text={aiInsights.Oath.text} style={styles.insight} />

        {/* Today's Oath */}
        <GlassCard padding="lg" style={styles.oathCard}>
          <Text style={[styles.oathLabel, { color: realm.accentSoft }]}>YOUR OATH</Text>
          <Text style={styles.oathText}>"{userProfile.oath}"</Text>
          <View style={[styles.divider, { backgroundColor: realm.accent + '22' }]} />
          <Text style={styles.archetype}>{userProfile.archetype}</Text>
          <Text style={styles.tagline}>"{userProfile.tagline}"</Text>
        </GlassCard>

        {/* Memory — emotional core */}
        <MemoryCard memory={topMemory} style={styles.memory} />

        {/* Realm switcher */}
        <View style={styles.realmSwitcher}>
          <Text style={styles.realmSwitchLabel}>SWITCH REALM</Text>
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
        </View>

        {/* Speak to OATH — placeholder for future AI */}
        <TouchableOpacity style={[styles.speakButton, { borderColor: realm.accent + '55', backgroundColor: realm.accentMuted }]}>
          <View style={[styles.speakDot, { backgroundColor: realm.accent }]} />
          <Text style={[styles.speakText, { color: realm.accentSoft }]}>Speak to OATH</Text>
          <Text style={styles.speakSub}>Coming soon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  realmRow: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  realmIndicator: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  realmName: {
    ...typography.labelSm,
    letterSpacing: 2,
  },
  orbSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  orbText: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  presenceLabel: {
    ...typography.labelLg,
    letterSpacing: 2,
  },
  feelingText: {
    ...typography.bodyMd,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  insight: {
    marginBottom: spacing.lg,
  },
  oathCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  oathLabel: {
    ...typography.labelMd,
  },
  oathText: {
    ...typography.oath,
    color: colors.text,
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  archetype: {
    ...typography.labelLg,
    color: colors.textSubtle,
  },
  tagline: {
    ...typography.bodySm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  memory: {
    marginBottom: spacing.xl,
  },
  realmSwitcher: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  realmSwitchLabel: {
    ...typography.labelSm,
    color: colors.textSubtle,
    letterSpacing: 1.5,
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
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  speakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  speakText: {
    ...typography.bodyMd,
    fontWeight: '500',
    flex: 1,
  },
  speakSub: {
    ...typography.labelMd,
    color: colors.textSubtle,
  },
});
