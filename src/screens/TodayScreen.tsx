import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { GlassCard } from '@/components/ui/GlassCard';
import { MissionCard } from '@/components/ui/MissionCard';
import { OathOrb } from '@/components/ui/OathOrb';
import {
  aiInsights,
  alignmentScore,
  missions,
  momentumScore,
  oathSuggestion,
  userProfile,
  weeklyMomentum,
} from '@/data/mock';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const recommendedMission = missions.find((m) => m.id === oathSuggestion.missionId)!;
const otherMissions = missions.filter((m) => m.status !== 'locked' && m.id !== oathSuggestion.missionId).slice(0, 2);

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const W = 56, H = 18;
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
          <View key={i} style={{ position: 'absolute', left: x1, top: y1, width: len, height: 1.5,
            backgroundColor: color, opacity: i === values.length - 1 ? 1 : 0.45,
            transform: [{ rotate: `${angle}deg` }] }} />
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
        Animated.timing(livePulse, { toValue: 0.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(livePulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ]),
    ).start();
    return () => livePulse.stopAnimation();
  }, [livePulse]);

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.appName, { color: realm.accentSoft }]}>OATH</Text>
        <View style={styles.liveRow}>
          <Animated.View style={[styles.liveDot, { backgroundColor: realm.accent, opacity: livePulse }]} />
          <Text style={[styles.liveLabel, { color: realm.accentSoft }]}>LIVE</Text>
        </View>
      </View>

      {/* OATH speaks first */}
      <View style={styles.greetingBlock}>
        <Text style={[styles.greetingLine, { color: colors.textSecondary }]}>{greeting()}</Text>
        <Text style={styles.greetingName}>{userProfile.firstName}.</Text>
        <Text style={[styles.oathVoice, { color: colors.textSecondary }]}>
          {realm.morningStatement}
        </Text>
      </View>

      {/* The presence — orb centered */}
      <View style={styles.orbContainer}>
        <OathOrb size="lg" />
      </View>

      {/* OATH's observation — not a card title, OATH speaking */}
      <GlassCard padding="lg" style={[styles.presenceCard, { borderColor: realm.accent + '33' }]}>
        <View style={styles.presenceHeader}>
          <Animated.View style={[styles.presenceDot, { backgroundColor: realm.accent, opacity: livePulse }]} />
          <Text style={[styles.presenceLabel, { color: realm.accent }]}>OATH PRESENCE</Text>
        </View>
        <Text style={styles.presenceText}>{aiInsights.Today.text}</Text>
        <TouchableOpacity style={styles.viewMore}>
          <Text style={[styles.viewMoreText, { color: realm.accentSoft }]}>See full insight  →</Text>
        </TouchableOpacity>
      </GlassCard>

      {/* OATH's observations — alignment + momentum as what OATH sees, not stats */}
      <View style={styles.observationsRow}>
        <GlassCard padding="md" style={styles.observationCard}>
          <Text style={[styles.obsLabel, { color: realm.accentSoft }]}>ALIGNMENT</Text>
          <Text style={[styles.obsValue, { color: colors.text }]}>{alignmentScore}%</Text>
          <Text style={[styles.obsSub, { color: colors.textSubtle }]}>Aligned with{'\n'}your future self</Text>
          <View style={[styles.obsBar, { backgroundColor: colors.border }]}>
            <View style={[styles.obsBarFill, { width: `${alignmentScore}%` as `${number}%`, backgroundColor: realm.accent }]} />
          </View>
        </GlassCard>

        <GlassCard padding="md" style={styles.observationCard}>
          <Text style={[styles.obsLabel, { color: realm.accentSoft }]}>MOMENTUM</Text>
          <Text style={[styles.obsValueLg, { color: colors.text }]}>{momentumScore}</Text>
          <Text style={[styles.obsSub, { color: colors.textSubtle }]}>High</Text>
          <MiniSparkline values={weeklyMomentum} color={realm.accent} />
        </GlassCard>
      </View>

      {/* Today's Oath — OATH retrieved this for you */}
      <GlassCard padding="lg" style={styles.oathCard}>
        <Text style={[styles.oathLabel, { color: realm.accentSoft }]}>TODAY'S OATH</Text>
        <Text style={styles.oathText}>"{userProfile.oath}"</Text>
        <View style={[styles.oathFooter, { borderTopColor: colors.border }]}>
          <View style={styles.acceptedRow}>
            <View style={[styles.checkCircle, { backgroundColor: realm.accentMuted, borderColor: realm.accent + '55' }]}>
              <Text style={[styles.checkMark, { color: realm.accent }]}>✓</Text>
            </View>
            <Text style={[styles.acceptedLabel, { color: realm.accentSoft }]}>OATH ACCEPTED</Text>
          </View>
          <Text style={[styles.streakLabel, { color: colors.textSubtle }]}>{userProfile.streak} day streak</Text>
        </View>
      </GlassCard>

      {/* OATH recommends — curated, not listed */}
      <View style={styles.missionsBlock}>
        <View style={styles.missionsHeader}>
          <Text style={[styles.missionsEyebrow, { color: realm.accentSoft }]}>OATH RECOMMENDS</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, { color: realm.accent }]}>See all</Text>
          </TouchableOpacity>
        </View>

        {/* Lead mission — OATH's top pick */}
        <MissionCard mission={recommendedMission} />

        {/* Supporting missions */}
        {otherMissions.map((m) => (
          <MissionCard key={m.id} mission={m} />
        ))}
      </View>

      {/* Night reflection — OATH invites */}
      <TouchableOpacity
        style={[styles.nightCta, { borderColor: realm.accent + '33', backgroundColor: realm.accentMuted }]}
        onPress={() => navigation.navigate('NightReflection')}
      >
        <Text style={[styles.nightIcon, { color: realm.accent }]}>◑</Text>
        <View style={styles.nightTextBlock}>
          <Text style={[styles.nightTitle, { color: realm.accentSoft }]}>Let's review your day</Text>
          <Text style={[styles.nightSub, { color: colors.textSubtle }]}>
            I'll help you make sense of what happened.
          </Text>
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
  liveLabel: {
    ...typography.labelSm,
    letterSpacing: 2,
  },
  greetingBlock: {
    marginBottom: spacing.lg,
  },
  greetingLine: {
    ...typography.headingMd,
    fontWeight: '300',
  },
  greetingName: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -2,
    lineHeight: 48,
    marginBottom: spacing.xs,
  },
  oathVoice: {
    ...typography.bodyLg,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  orbContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  presenceCard: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
  },
  presenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  presenceLabel: {
    ...typography.labelMd,
    letterSpacing: 1.5,
  },
  presenceText: {
    ...typography.bodyMd,
    color: colors.text,
    lineHeight: 22,
  },
  viewMore: {
    marginTop: 2,
  },
  viewMoreText: {
    ...typography.labelMd,
    fontWeight: '600',
  },
  observationsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  observationCard: {
    flex: 1,
    gap: 4,
  },
  obsLabel: {
    ...typography.labelSm,
    letterSpacing: 1.5,
  },
  obsValue: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 34,
  },
  obsValueLg: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 42,
  },
  obsSub: {
    ...typography.bodySm,
    lineHeight: 16,
    marginBottom: 4,
  },
  obsBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
  obsBarFill: {
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
  oathFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  acceptedRow: {
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
  acceptedLabel: {
    ...typography.labelMd,
    letterSpacing: 1.2,
  },
  streakLabel: {
    ...typography.labelSm,
  },
  missionsBlock: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  missionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionsEyebrow: {
    ...typography.labelLg,
    letterSpacing: 1.5,
  },
  seeAll: {
    ...typography.labelMd,
  },
  nightCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  nightIcon: {
    fontSize: 22,
  },
  nightTextBlock: {
    gap: 2,
  },
  nightTitle: {
    ...typography.bodySm,
    fontWeight: '600',
  },
  nightSub: {
    ...typography.labelSm,
    lineHeight: 16,
  },
});
