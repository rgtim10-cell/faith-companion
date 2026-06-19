import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, radius, shadows } from '@/design/tokens';

type Padding = 'none' | 'sm' | 'md' | 'lg';

interface GlassCardProps {
  children: React.ReactNode;
  padding?: Padding;
  glow?: boolean;
  glowColor?: string;
  style?: object;
}

const paddingValues: Record<Padding, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
};

export function GlassCard({
  children,
  padding = 'md',
  glow = false,
  glowColor = '#4D8CFF',
  style,
}: GlassCardProps) {
  const pad = paddingValues[padding];

  return (
    <View
      style={[
        styles.outer,
        glow && shadows.glow(glowColor, 20),
        style,
      ]}
    >
      <BlurView intensity={14} tint="dark" style={styles.blur}>
        <View style={[styles.inner, { padding: pad }]}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  blur: {
    width: '100%',
  },
  inner: {
    backgroundColor: colors.glass,
    width: '100%',
  },
});
