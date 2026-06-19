import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRealm } from '@/context/RealmContext';
import { colors, radius, spacing, typography } from '@/design/tokens';

interface AIInsightProps {
  text: string;
  style?: object;
}

export function AIInsight({ text, style }: AIInsightProps) {
  const { realm } = useRealm();
  const borderOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderOpacity, {
          toValue: 0.9,
          duration: 2600,
          useNativeDriver: true,
        }),
        Animated.timing(borderOpacity, {
          toValue: 0.4,
          duration: 2600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
    return () => borderOpacity.stopAnimation();
  }, [borderOpacity]);

  return (
    <View style={[styles.wrapper, style]}>
      <Animated.View
        style={[
          styles.glowBorder,
          { borderColor: realm.accent, opacity: borderOpacity },
        ]}
      />
      <BlurView intensity={12} tint="dark" style={styles.blur}>
        <View style={[styles.inner, { backgroundColor: realm.accentMuted }]}>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: realm.accent }]} />
            <Text style={[styles.label, { color: realm.accent }]}>
              {realm.insightPrefix.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.text}>{text}</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  glowBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    zIndex: 1,
  },
  blur: {
    width: '100%',
  },
  inner: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.labelMd,
  },
  text: {
    ...typography.bodyMd,
    color: colors.text,
    lineHeight: 21,
  },
});
