import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, typography } from '@/design/tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  eyebrowColor?: string;
  action?: React.ReactNode;
  style?: object;
}

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  eyebrowColor = colors.textSubtle,
  action,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        {eyebrow ? (
          <Text style={[styles.eyebrow, { color: eyebrowColor }]}>{eyebrow.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action ? <View>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  left: {
    flex: 1,
    gap: 3,
  },
  eyebrow: {
    ...typography.labelMd,
  },
  title: {
    ...typography.headingMd,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
});
