import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, typography } from '@/design/tokens';
import { useRealm } from '@/context/RealmContext';

interface ProgressArcProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showPercent?: boolean;
}

export function ProgressArc({
  value,
  size = 140,
  strokeWidth = 11,
  label,
  showPercent = true,
}: ProgressArcProps) {
  const { realm } = useRealm();
  const clamped = Math.min(100, Math.max(0, value));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  return (
    <View style={styles.container}>
      <View style={{ transform: [{ rotate: '-90deg' }] }}>
        <Svg width={size} height={size}>
          <Defs>
            <SvgGradient id="arcGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={realm.accentSoft} />
              <Stop offset="100%" stopColor={realm.accent} />
            </SvgGradient>
          </Defs>
          {/* Track */}
          <Circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <Circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="url(#arcGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
      </View>

      <View style={[styles.centerLabel, { width: size, height: size, marginTop: -size }]}>
        {showPercent && (
          <Text style={styles.value}>
            {Math.round(clamped)}
            <Text style={styles.unit}>%</Text>
          </Text>
        )}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    ...typography.displayMd,
    color: colors.text,
  },
  unit: {
    ...typography.headingSm,
    color: colors.textSecondary,
  },
  label: {
    ...typography.labelMd,
    color: colors.textSubtle,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
