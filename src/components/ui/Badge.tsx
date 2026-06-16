import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '@/design/tokens';

type BadgeVariant = 'default' | 'success' | 'warning' | 'info' | 'subtle' | 'accent';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  accentColor?: string;
  style?: object;
}

const variantStyle: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: { bg: 'rgba(255,255,255,0.07)', text: colors.text, border: colors.border },
  success: { bg: 'rgba(52,211,153,0.1)', text: '#34D399', border: 'rgba(52,211,153,0.25)' },
  warning: { bg: 'rgba(251,191,36,0.1)', text: '#FBBF24', border: 'rgba(251,191,36,0.25)' },
  info: { bg: 'rgba(77,140,255,0.1)', text: '#7CA8FF', border: 'rgba(77,140,255,0.25)' },
  subtle: { bg: 'rgba(255,255,255,0.03)', text: colors.textSubtle, border: 'rgba(255,255,255,0.05)' },
  accent: { bg: 'rgba(77,140,255,0.12)', text: '#4D8CFF', border: 'rgba(77,140,255,0.3)' },
};

export function Badge({ label, variant = 'default', accentColor, style }: BadgeProps) {
  const vs = variantStyle[variant];
  const bgColor = accentColor ? accentColor + '18' : vs.bg;
  const textColor = accentColor ?? vs.text;
  const borderColor = accentColor ? accentColor + '40' : vs.border;

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor }, style]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  text: {
    ...typography.labelMd,
  },
});
