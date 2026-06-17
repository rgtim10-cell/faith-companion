import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { AIInsight } from '@/components/ui/AIInsight';
import { GlassCard } from '@/components/ui/GlassCard';
import { MissionCard } from '@/components/ui/MissionCard';
import { OathOrb } from '@/components/ui/OathOrb';
import { SectionHeader } from '@/components/ui/SectionHeader';
import {
  aiInsights,
  alignmentScore,
  missions,
  momentumScore,
  userProfile,
  weeklyMomentum,
} from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, spacing, typography } from '@/design/tokens';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const todayMissions = missions.filter((m) => m.status !== 'locked').slice(0, 3);
const completedToday = missions.filter((m) => m.status === 'completed').length;
const totalActive = missions.filter((m) => m.status !== 'locked').length;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 60;
  const H = 20;
  const step = W / (values.length - 1);

  return (
    <View style={{ width: W, height: H }}>
      {values.map((v, i) => {
        if (i === 0) return null;
        const x1 = (i - 1) * step;
        const y1 = H - ((values[i - 1] - min) / range) * H;
        const x2 = i * step;
        const y2 = H - ((v - min) / range) * H;
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: x1,
              top: y1,
              width: len,
              height: 1.5,
              backgroundColor: color,
              opacity: i === values.length - 1 ? 1 : 0.5,
              transform: [{ rotate: `${angle}deg` }, { translateX: len / 2 - len / 2 }],
            }}
          />
        );
      })}
    </View>
  );
}

export function TodayScreen() {
  const { realm } = useRealm();
  const navigation = useNavigation<Nav>();
  const livePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    ).start();
    return () => livePulse.stopAnimation();
  }, [livePulse]);

  return (
    <ScreenWrapper>
      {/* Header — OATH identity + LIVE status */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: realm.accentSoft }]}>OATH</Text>
        <View style={styles.liveRow}>
          <Animated.View style={[styles.liveDot, { backgroundColor: realm.accent, opacity: livePulse }]} />
          <Text style={[styles.liveText, { color: realm.accentSoft }]}>LIVE</Text>
        </View>
      </View>

      {/* AI Greeting — OATH speaks first */}
      <View style={styles.greetingBlock}>
        <Text style={styles.greetingName}>{greeting()}, {userProfile.firstName}.</Text>
        <Text style={[styles.greetingSub, { color: colors.textSecondary }]}>
          I've reviewed your patterns, your progress, and your energy.
        </Text>
      </View>

      {/* Living Orb — centered, the AI presence */}
      <View style={styles.orbContainer}>
        <OathOrb size="lg" style={styles.orb} />
      </View>

      {/* OATH Insight */}
      <AIInsight text={aiInsights.Today.text} style={styles.insight} />

      {/* Stats Row — alignment + momentum */}
      <View style={styles.statsRow}>
        <GlassCard padding="md" style={styles.statCard}>
          <Text style={[styles.statLabel, { color: realm.accentSoft }]}>ALIGNMENT</Text>
          <Text style={[styles.statValue, { color: colors.text }]}>{alignmentScore}%</Text>
          <Text style={[styles.statSub, { color: colors.textSubtle }]}>Aligned with your future self</Text>
          <View style={[styles.statBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.statBarFill,
                { width: `${alignmentScore}%` as `${number}%`, backgroundColor: realm.accent },
              ]}
            />
          </View>
        </GlassCard>

        <GlassCard padding="md" style={styles.statCard}>
          <Text style={[styles.statLabel, { color: realm.accentSoft }]}>MOMENTUM</Text>
          <Text style={[styles.statValueLarge, { color: colors.text }]}>{momentumScore}</Text>
          <Text style={[styles.statSub, { color: colors.textSubtle }]}>High</Text>
          <MiniSparkline values={weeklyMomentum} color={realm.accent} />
        </GlassCard>
      </View>

      {/* Today's Oath — the identity anchor */}
      <GlassCard padding="lg" style={styles.oathCard}>
        <Text style={[styles.oathLabel, { color: realm.accentSoft }]}>TODAY'S OATH</Text>
        <Text style={styles.oathText}>"{userProfile.oath}"</Text>
        <View style={[styles.oathAccepted, { borderTopColor: colors.border }]}>
          <View style={styles.oathAcceptedLeft}>
            <View style={[styles.checkCircle, { backgroundColor: realm.accentMuted, borderColor: realm.accent + '55' }]}>
              <Text style={[styles.checkMark, { color: realm.accent }]}>✓</Text>
            </View>
            <Text style={[styles.oathAcceptedText, { color: realm.accentSoft }]}>OATH ACCEPTED</Text>
          </View>
          <Text style={[styles.oathTime, { color: colors.textSubtle }]}>
            {userProfile.streak} day streak
          </Text>
        </View>
      </GlassCard>

      {/* Mission Stack */}
      <View style={styles.section}>
        <SectionHeader
          eyebrow={`${completedToday} of ${totalActive} complete`}
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

      {/* Night Reflection CTA */}
      <TouchableOpacity
        style={[styles.nightCta, { borderColor: realm.accent + '33', backgroundColor: realm.accentMuted }]}
        onPress={() => navigation.navigate('NightReflection')}
      >
        <Text style={[styles.nightCtaIcon, { color: realm.accentSoft }]}>◑</Text>
        <View>
          <Text style={[styles.nightCtaTitle, { color: realm.accentSoft }]}>Begin night reflection</Text>
          <Text style={[styles.nightCtaSub, { color: colors.textSubtle }]}>OATH will review your day with you</Text>
        </View>
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
  appName: {
    ...typography.labelLg,
    fontSize: 13,
    letterSpacing: 3,
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    ...typography.labelSm,
    letterSpacing: 2,
  },
  greetingBlock: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  greetingName: {
    ...typography.displayLg,
    color: colors.text,
    letterSpacing: -1,
  },
  greetingSub: {
    ...typography.bodyMd,
    lineHeight: 22,
  },
  orbContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  orb: {
    // OathOrb manages its own size
  },
  insight: {
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    ...typography.labelSm,
    letterSpacing: 1.5,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 32,
  },
  statValueLarge: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 40,
  },
  statSub: {
    ...typography.bodySm,
    lineHeight: 15,
    marginBottom: 4,
  },
  statBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  oathCard: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  oathLabel: {
    ...typography.labelMd,
    letterSpacing: 1.5,
  },
  oathText: {
    ...typography.oath,
    color: colors.text,
  },
  oathAccepted: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  oathAcceptedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 10,
    fontWeight: '700',
  },
  oathAcceptedText: {
    ...typography.labelMd,
    letterSpacing: 1.2,
  },
  oathTime: {
    ...typography.labelSm,
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
  nightCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  nightCtaIcon: {
    fontSize: 24,
  },
  nightCtaTitle: {
    ...typography.bodySm,
    fontWeight: '600',
  },
  nightCtaSub: {
    ...typography.labelSm,
    marginTop: 2,
  },
});
