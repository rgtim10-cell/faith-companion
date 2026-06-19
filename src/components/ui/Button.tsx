import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, typography } from '@/design/tokens';
import { useRealm } from '@/context/RealmContext';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: object;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style,
}: ButtonProps) {
  const { realm } = useRealm();

  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const heights: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 54 };
  const textStyles = {
    sm: typography.labelLg,
    md: { ...typography.bodyMd, fontWeight: '600' as const },
    lg: { ...typography.bodyLg, fontWeight: '600' as const },
  };

  const bgColor = {
    primary: realm.accent,
    secondary: colors.surface2,
    ghost: colors.transparent,
  }[variant];

  const textColor = {
    primary: '#FFFFFF',
    secondary: colors.text,
    ghost: realm.accentSoft,
  }[variant];

  const borderColor = {
    primary: realm.accent,
    secondary: colors.border,
    ghost: colors.transparent,
  }[variant];

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.base,
        {
          height: heights[size],
          backgroundColor: bgColor,
          borderColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[textStyles[size], { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});
