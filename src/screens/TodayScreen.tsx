import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AIInsight } from '@/components/ui/AIInsight';
import { GlassCard } from '@/components/ui/GlassCard';
import { MissionCard } from '@/components/ui/MissionCard';
import { OathOrb } from '@/components/ui/OathOrb';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { aiInsights, missions, userProfile } from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, spacing, typography } from '@/design/tokens';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const todayMissions = missions.filter((m) => m.status !== 'locked').slice(0, 3);

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function TodayScreen() {
  const { realm } = useRealm();
  const navigation = useNavigation<Nav>();

  return (
    <ScreenWrapper>
      {/* Header — OATH presence woven into greeting */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: realm.accentSoft }]}>{greeting()},</Text>
          <Text style={styles.name}>{userProfile.firstName}.</Text>
        </View>
        <View style={styles.headerRight}>
          <OathOrb size="sm" />
          <View style={[styles.streakPill, { borderColor: realm.accent + '44', backgroundColor: realm.accentMuted }]}>
            <Text style={[styles.streakText, { color: realm.accentSoft }]}>
              {userProfile.streak} days
            </Text>
          </View>
        </View>
      </View>

      {/* OATH AI Presence — alive on every screen */}
      <AIInsight text={aiInsights.Today.text} style={styles.insight} />

      {/* Daily Oath — the identity anchor */}
      <GlassCard padding="lg" style={styles.oathCard}>
        <Text style={[styles.oathLabel, { color: realm.accentSoft }]}>TODAY'S OATH</Text>
        <Text style={styles.oathText}>"{userProfile.oath}"</Text>
        <View style={styles.oathMeta}>
          <Text style={styles.oathMetaText}>Written 47 days ago · reaffirmed daily</Text>
          <TouchableOpacity>
            <Text style={[styles.reaffirm, { color: realm.accent }]}>Reaffirm →</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* Mission Stack */}
      <View style={styles.section}>
        <SectionHeader
          eyebrow="In motion today"
          eyebrowColor={realm.accentSoft}
          title="Mission Stack"
          action={
            <Text style={[styles.seeAll, { color: realm.accent }]}>See all</Text>
          }
        />
        <View style={styles.missionList}>
          {todayMissions.map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </View>
      </View>

      {/* Identity card */}
      <GlassCard padding="md" style={styles.identityCard}>
        <View style={styles.identityRow}>
          <View>
            <Text style={[styles.archetype, { color: realm.accentSoft }]}>
              {userProfile.archetype.toUpperCase()}
            </Text>
            <Text style={styles.tagline}>"{userProfile.tagline}"</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: realm.accentMuted, borderColor: realm.accent + '44' }]}>
            <Text style={[styles.levelNum, { color: realm.accent }]}>{userProfile.level}</Text>
          </View>
        </View>
      </GlassCard>

      {/* Night Reflection CTA */}
      <TouchableOpacity
        style={styles.nightCta}
        onPress={() => navigation.navigate('NightReflection')}
      >
        <Text style={[styles.nightCtaText, { color: realm.accentSoft }]}>
          ◑  Begin night reflection
        </Text>
      </TouchableOpacity>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    gap: 1,
  },
  greeting: {
    ...typography.bodyMd,
    fontWeight: '500',
  },
  name: {
    ...typography.displayLg,
    color: colors.text,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  streakPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  streakText: {
    ...typography.labelMd,
  },
  insight: {
    marginBottom: spacing.lg,
  },
  oathCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  oathLabel: {
    ...typography.labelMd,
  },
  oathText: {
    ...typography.oath,
    color: colors.text,
  },
  oathMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  oathMetaText: {
    ...typography.labelSm,
    color: colors.textSubtle,
  },
  reaffirm: {
    ...typography.labelMd,
    fontWeight: '600',
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  seeAll: {
    ...typography.labelMd,
  },
  missionList: {
    gap: spacing.sm,
  },
  identityCard: {
    marginBottom: spacing.md,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  archetype: {
    ...typography.labelLg,
    marginBottom: 4,
  },
  tagline: {
    ...typography.bodySm,
    fontStyle: 'italic',
    color: colors.textSecondary,
  },
  levelBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNum: {
    ...typography.headingMd,
    fontWeight: '700',
  },
  nightCta: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  nightCtaText: {
    ...typography.bodyMd,
    fontWeight: '500',
  },
});
