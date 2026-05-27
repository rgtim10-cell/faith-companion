import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

interface GradientCardProps {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  padded?: boolean;
}

export function GradientCard({ children, colors, style, padded = true }: GradientCardProps) {
  const { colors: themeColors } = useTheme();

  const gradientColors: readonly [string, string, ...string[]] =
    colors ?? [themeColors.gradientStart, themeColors.gradientEnd];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, padded && styles.padded, style]}
    >
      {children}
    </LinearGradient>
  );
}

interface SurfaceCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
}

export function SurfaceCard({ children, style, elevated }: SurfaceCardProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        styles.padded,
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.card,
          borderColor: colors.borderLight,
          borderWidth: 1,
        },
        elevated ? Shadows.md : Shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  padded: {
    padding: Spacing.xl,
  },
});
