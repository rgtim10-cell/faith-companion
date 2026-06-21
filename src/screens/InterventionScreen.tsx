import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useIntervention } from '@/context/InterventionContext';
import type { InterventionType } from '@/engine/interventionEngine';
import { memoryTypeColor, memoryTypeGlyph, memoryTypeLabel } from '@/data/memoryGraph';
import { colors, radius, spacing } from '@/design/tokens';

// ── Type identity ─────────────────────────────────────────────────

const TYPE_ACCENT: Record<InterventionType, string> = {
  echo:          '#93C5FD',  // blue — recognition
  witness:       '#34D399',  // green — accumulated proof
  drift:         '#F97316',  // orange — honest warning
  turning_point: '#D4A853',  // gold — earned moment
  anniversary:   '#A78BFA',  // violet — time
};

const TYPE_GLYPH: Record<InterventionType, string> = {
  echo:          '◇',
  witness:       '◆',
  drift:         '▽',
  turning_point: '◈',
  anniversary:   '○',
};

/**
 * Intervention Screen — OATH surfaces something it has been holding.
 *
 * Not Theater. Less ceremony.
 * OATH says one thing, quietly, then returns the user to their record.
 */
export function InterventionScreen() {
  const { pendingIntervention, dismissIntervention } = useIntervention();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [returnVisible, setReturnVisible] = useState(false);

  const wordmarkAnim = useRef(new Animated.Value(0)).current;
  const contentAnim  = useRef(new Animated.Value(0)).current;
  const contentY     = useRef(new Animated.Value(12)).current;
  const returnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const exp = pendingIntervention;

  useEffect(() => {
    if (!exp) { navigation.goBack(); return; }

    Animated.sequence([
      Animated.timing(wordmarkAnim, {
        toValue: 1, duration: 900,
        easing: Easing.out(Easing.quad), useNativeDriver: true,
      }),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(contentAnim, {
          toValue: 1, duration: 800,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
        Animated.timing(contentY, {
          toValue: 0, duration: 800,
          easing: Easing.out(Easing.quad), useNativeDriver: true,
        }),
      ]),
    ]).start();

    returnTimer.current = setTimeout(() => setReturnVisible(true), 3200);
    return () => {
      if (returnTimer.current) clearTimeout(returnTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReturn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    dismissIntervention();
    navigation.goBack();
  }, [dismissIntervention, navigation]);

  if (!exp) return null;

  const accent = TYPE_ACCENT[exp.type];
  const glyph  = TYPE_GLYPH[exp.type];
  const tint   = { backgroundColor: accent + '08' };

  return (
    <View style={styles.root}>
      {/* Near-black background with type-specific tint */}
      <View style={[StyleSheet.absoluteFill, styles.bg]} />
      <View style={[StyleSheet.absoluteFill, tint]} pointerEvents="none" />

      {/* Dim wordmark */}
      <Animated.View
        style={[styles.header, { paddingTop: insets.top + spacing.md, opacity: wordmarkAnim }]}
        pointerEvents="none"
      >
        <Text style={styles.wordmark}>OATH</Text>
        <View style={[styles.typeBadge, { borderColor: accent + '30' }]}>
          <Text style={[styles.typeGlyph, { color: accent }]}>{glyph}</Text>
          <Text style={[styles.typeLabel, { color: accent + '80' }]}>
            {exp.type.replace(/_/g, ' ').toUpperCase()}
          </Text>
        </View>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 80, paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: contentAnim, transform: [{ translateY: contentY }] }}>
          {/* Subline — the first thing OATH says */}
          <Text style={[styles.subline, { color: accent }]}>{exp.subline}</Text>

          {/* Body — OATH's observation */}
          <View style={styles.bodyBlock}>
            {exp.body.split('\n').map((line, i) => {
              const isQuote = line.startsWith('"') && line.endsWith('"');
              if (!line.trim()) return <View key={i} style={styles.bodyGap} />;
              return (
                <Text
                  key={i}
                  style={[styles.bodyLine, isQuote && styles.bodyQuote]}
                >
                  {line}
                </Text>
              );
            })}
          </View>

          {/* Supporting records — simplified, no expand */}
          {exp.records.length > 0 && (
            <View style={styles.records}>
              <View style={[styles.recordsDivider, { backgroundColor: accent + '20' }]} />
              {exp.records.map((record) => {
                const typeColor = memoryTypeColor[record.type];
                const typeGlyph = memoryTypeGlyph[record.type];
                const typeLabel = memoryTypeLabel[record.type];
                const daysAgo   = Math.round((Date.now() - record.date) / (24 * 60 * 60 * 1000));
                const when      = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

                return (
                  <View key={record.id} style={[styles.record, { borderColor: typeColor + '1A', backgroundColor: typeColor + '06' }]}>
                    <View style={styles.recordHeader}>
                      <Text style={[styles.recordGlyph, { color: typeColor }]}>{typeGlyph}</Text>
                      <Text style={[styles.recordType, { color: typeColor }]}>{typeLabel.toUpperCase()}</Text>
                      <Text style={styles.recordWhen}>{when}</Text>
                    </View>
                    <Text style={styles.recordContent} numberOfLines={3}>{record.content}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* OATH attribution */}
          <Text style={[styles.attrib, { color: accent + '40' }]}>— OATH</Text>

          {/* Return — appears after a pause */}
          {returnVisible && (
            <TouchableOpacity
              onPress={handleReturn}
              style={[styles.returnBtn, { borderColor: 'rgba(255,255,255,0.10)' }]}
              activeOpacity={0.7}
            >
              <Text style={styles.returnText}>Return  →</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080808' },
  bg:   { backgroundColor: '#080808' },

  header: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  wordmark: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.12)',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  typeGlyph: { fontSize: 11 },
  typeLabel: { fontSize: 8, fontWeight: '600', letterSpacing: 2 },

  scroll: { paddingHorizontal: spacing.lg },

  subline: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 38,
    letterSpacing: -0.8,
    marginBottom: spacing.xl,
    maxWidth: 300,
  },

  bodyBlock: { gap: 4, marginBottom: spacing.xl },
  bodyGap:  { height: spacing.sm },
  bodyLine: {
    fontSize: 16,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  bodyQuote: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.82)',
    fontStyle: 'italic',
    lineHeight: 30,
    letterSpacing: -0.3,
  },

  records: { gap: spacing.sm, marginBottom: spacing.xl },
  recordsDivider: { height: 1, marginBottom: spacing.xs },
  record: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: 6,
  },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  recordGlyph: { fontSize: 13 },
  recordType:  { fontSize: 10, fontWeight: '600', letterSpacing: 1.4 },
  recordWhen:  { fontSize: 11, color: 'rgba(255,255,255,0.22)', marginLeft: 4 },
  recordContent: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.62)',
    lineHeight: 21,
    letterSpacing: -0.1,
  },

  attrib: {
    fontSize: 12,
    fontStyle: 'italic',
    letterSpacing: 0.2,
    marginBottom: spacing.xxl,
  },

  returnBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  returnText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.2,
  },
});
