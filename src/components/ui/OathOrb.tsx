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

export function OathOrb({ size = 'md', animated: isAnimated = true, style }: OathOrbProps) {
  const { realm } = useRealm();
  const px = sizePx[size];

  const breathScale = useRef(new Animated.Value(1)).current;
  const outerGlowOpacity = useRef(new Animated.Value(0.35)).current;
  const innerGlowOpacity = useRef(new Animated.Value(0.06)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ring2Rotate = useRef(new Animated.Value(0)).current;
  const ring3Rotate = useRef(new Animated.Value(0)).current;
  const ring3Opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!isAnimated) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(breathScale, { toValue: 1.045, duration: 3200, useNativeDriver: true }),
        Animated.timing(breathScale, { toValue: 1, duration: 3200, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(outerGlowOpacity, { toValue: 0.75, duration: 3800, useNativeDriver: true }),
        Animated.timing(outerGlowOpacity, { toValue: 0.25, duration: 3800, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(innerGlowOpacity, { toValue: 0.18, duration: 2400, useNativeDriver: true }),
        Animated.timing(innerGlowOpacity, { toValue: 0.04, duration: 2400, useNativeDriver: true }),
      ]),
    ).start();

    // Outer ring — slow clockwise
    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 28000, useNativeDriver: true }),
    ).start();

    // Mid ring — counter-clockwise
    Animated.loop(
      Animated.timing(ring2Rotate, { toValue: 1, duration: 18000, useNativeDriver: true }),
    ).start();

    // Inner bright ring — fast clockwise
    Animated.loop(
      Animated.timing(ring3Rotate, { toValue: 1, duration: 9000, useNativeDriver: true }),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ring3Opacity, { toValue: 0.9, duration: 2000, useNativeDriver: true }),
        Animated.timing(ring3Opacity, { toValue: 0.45, duration: 2000, useNativeDriver: true }),
      ]),
    ).start();

    return () => {
      breathScale.stopAnimation();
      outerGlowOpacity.stopAnimation();
      innerGlowOpacity.stopAnimation();
      ringRotate.stopAnimation();
      ring2Rotate.stopAnimation();
      ring3Rotate.stopAnimation();
      ring3Opacity.stopAnimation();
    };
  }, [isAnimated, breathScale, outerGlowOpacity, innerGlowOpacity, ringRotate, ring2Rotate, ring3Rotate, ring3Opacity]);

  const ringCWDeg = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringCCWDeg = ring2Rotate.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const ring3Deg = ring3Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const accent = realm.accent;

  const containerSize = px * 2.6;
  const outerRingSize = px * 1.9;
  const midRingSize = px * 1.48;
  const innerRingSize = px * 1.18;

  return (
    <View style={[{ width: containerSize, height: containerSize, alignItems: 'center', justifyContent: 'center' }, style]}>

      {/* Atmospheric outer glow */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: containerSize / 2,
            backgroundColor: realm.accentMuted,
            opacity: outerGlowOpacity,
          },
        ]}
      />

      {/* Outer ring — slow CW dashed */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: outerRingSize,
            height: outerRingSize,
            borderRadius: outerRingSize / 2,
            borderColor: accent,
            opacity: 0.18,
            borderStyle: 'dashed',
            transform: [{ rotate: ringCWDeg }],
          },
        ]}
      />

      {/* Mid ring — CCW solid */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: midRingSize,
            height: midRingSize,
            borderRadius: midRingSize / 2,
            borderColor: accent,
            opacity: 0.32,
            transform: [{ rotate: ringCCWDeg }],
          },
        ]}
      />

      {/* Inner bright ring — fast CW, pulsing */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: innerRingSize,
            height: innerRingSize,
            borderRadius: innerRingSize / 2,
            borderColor: accent,
            borderWidth: 1.5,
            opacity: ring3Opacity,
            transform: [{ rotate: ring3Deg }],
          },
        ]}
      />

      {/* Core orb — breathing */}
      <Animated.View
        style={[
          styles.core,
          {
            width: px,
            height: px,
            borderRadius: px / 2,
            transform: [{ scale: breathScale }],
            shadowColor: accent,
          },
        ]}
      >
        {/* Gradient: very dark center → accent at edge */}
        <LinearGradient
          colors={realm.orbColors as [string, string, string, string]}
          start={{ x: 0.5, y: 0.1 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.fill, { borderRadius: px / 2 }]}
        />

        {/* Subtle rim glow */}
        <Animated.View
          style={[
            styles.fill,
            {
              borderRadius: px / 2,
              backgroundColor: accent,
              opacity: innerGlowOpacity,
            },
          ]}
        />

        {/* Center void — black hole effect */}
        <View
          style={{
            position: 'absolute',
            width: px * 0.54,
            height: px * 0.54,
            borderRadius: (px * 0.54) / 2,
            backgroundColor: realm.bg,
            opacity: 0.78,
            alignSelf: 'center',
            top: px * 0.12,
          }}
        />

        {/* Specular highlight */}
        <View
          style={{
            position: 'absolute',
            width: px * 0.2,
            height: px * 0.2,
            borderRadius: px * 0.1,
            backgroundColor: 'rgba(255,255,255,0.5)',
            top: px * 0.14,
            left: px * 0.22,
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  core: {
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 28,
    elevation: 20,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
