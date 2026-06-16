import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRealm } from '@/context/RealmContext';

type OrbSize = 'sm' | 'md' | 'lg' | 'xl';

interface OathOrbProps {
  size?: OrbSize;
  animated?: boolean;
  style?: object;
}

const sizePx: Record<OrbSize, number> = {
  sm: 36,
  md: 64,
  lg: 120,
  xl: 200,
};

const glowPx: Record<OrbSize, number> = {
  sm: 18,
  md: 36,
  lg: 72,
  xl: 120,
};

export function OathOrb({ size = 'md', animated: isAnimated = true, style }: OathOrbProps) {
  const { realm } = useRealm();
  const px = sizePx[size];
  const glow = glowPx[size];

  const breathScale = useRef(new Animated.Value(1)).current;
  const outerGlowOpacity = useRef(new Animated.Value(0.45)).current;
  const innerGlowOpacity = useRef(new Animated.Value(0.6)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isAnimated) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathScale, {
          toValue: 1.055,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(breathScale, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(outerGlowOpacity, {
          toValue: 0.85,
          duration: 3400,
          useNativeDriver: true,
        }),
        Animated.timing(outerGlowOpacity, {
          toValue: 0.3,
          duration: 3400,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(innerGlowOpacity, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(innerGlowOpacity, {
          toValue: 0.5,
          duration: 2200,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 16000,
        useNativeDriver: true,
      }),
    ).start();

    return () => {
      breathScale.stopAnimation();
      outerGlowOpacity.stopAnimation();
      innerGlowOpacity.stopAnimation();
      ringRotate.stopAnimation();
    };
  }, [isAnimated, breathScale, outerGlowOpacity, innerGlowOpacity, ringRotate]);

  const ringRotateDeg = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const accentColor = realm.accent;
  const glowColor = realm.accentMuted.replace(')', ', 0.7)').replace('rgba(', 'rgba(');

  return (
    <View style={[styles.container, { width: px + glow, height: px + glow }, style]}>
      {/* Outer atmospheric glow */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            width: px + glow,
            height: px + glow,
            borderRadius: (px + glow) / 2,
            backgroundColor: realm.accentMuted,
            opacity: outerGlowOpacity,
          },
        ]}
      />

      {/* Decorative rotating ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: px + glow * 0.4,
            height: px + glow * 0.4,
            borderRadius: (px + glow * 0.4) / 2,
            borderColor: accentColor,
            transform: [{ rotate: ringRotateDeg }],
          },
        ]}
      />

      {/* Core orb with breathing */}
      <Animated.View
        style={[
          styles.coreWrapper,
          {
            width: px,
            height: px,
            borderRadius: px / 2,
            transform: [{ scale: breathScale }],
          },
        ]}
      >
        <LinearGradient
          colors={realm.orbColors as [string, string, string, string]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
          style={[styles.gradient, { borderRadius: px / 2 }]}
        />

        {/* Inner glow layer */}
        <Animated.View
          style={[
            styles.innerGlow,
            {
              borderRadius: px / 2,
              backgroundColor: accentColor,
              opacity: innerGlowOpacity,
            },
          ]}
        />

        {/* Specular highlight */}
        <View
          style={[
            styles.highlight,
            {
              width: px * 0.28,
              height: px * 0.28,
              borderRadius: px * 0.14,
              top: px * 0.15,
              left: px * 0.22,
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.35,
    borderStyle: 'dashed',
  },
  coreWrapper: {
    overflow: 'hidden',
    shadowColor: '#4D8CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    elevation: 16,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    opacity: 0.12,
  },
  highlight: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
});
