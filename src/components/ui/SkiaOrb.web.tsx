import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useRealm } from '@/context/RealmContext';

interface SkiaOrbProps {
  size?: number;
  /** External 0→1 intensity — brightens and swells the core. */
  pulseValue?: Animated.Value;
  /** Adds a steady glow — OATH attending. */
  listening?: boolean;
  onPress?: () => void;
}

const AnimatedView = Animated.View;

/**
 * Web fallback for the GPU orb.
 *
 * Skia's CanvasKit (WASM) does not load reliably under the Metro web bundler,
 * so on web we never import @shopify/react-native-skia. Instead this rebuilds
 * the orb's feeling with layered SVG radial gradients and an Animated breathing
 * pulse: a hot accent rim, a soft outer bloom, and a dark void at the centre —
 * the same black-hole signature, no shader required.
 *
 * Visual parity is approximate by design: atmospheric, alive, premium, subtle.
 */
export function SkiaOrb({ size = 300, pulseValue, listening = false, onPress }: SkiaOrbProps) {
  const { realm } = useRealm();

  // Self-driven breathing — a slow swell, independent of any external pulse.
  const breathe = useRef(new Animated.Value(0)).current;
  // External pulse (scene beat) folds in on top of the breath.
  const zero = useRef(new Animated.Value(0)).current;
  const ext = pulseValue ?? zero;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 4200, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 4200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      breathe.stopAnimation();
    };
  }, [breathe]);

  const listenBoost = listening ? 0.18 : 0;

  // Core swells gently; bloom brightens with breath + external pulse.
  const coreScale = Animated.add(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1.03] }),
    Animated.multiply(ext, 0.08),
  );
  const bloomOpacity = Animated.add(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [0.55 + listenBoost, 0.8 + listenBoost] }),
    Animated.multiply(ext, 0.4),
  );

  const accent = realm.accent;
  const deep = realm.orbColors[1];
  const mid = realm.orbColors[2];

  const half = size / 2;

  const orb = (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer bloom — breathes with the presence */}
      <AnimatedView
        style={{
          position: 'absolute',
          width: size,
          height: size,
          opacity: bloomOpacity,
          transform: [{ scale: coreScale }],
        }}
      >
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="orbBloom" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={accent} stopOpacity={0.0} />
              <Stop offset="0.45" stopColor={accent} stopOpacity={0.22} />
              <Stop offset="0.7" stopColor={accent} stopOpacity={0.1} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={half} cy={half} r={half} fill="url(#orbBloom)" />
        </Svg>
      </AnimatedView>

      {/* Core body — plasma gradient with a dark void centre and a hot rim */}
      <AnimatedView style={{ transform: [{ scale: coreScale }] }}>
        <Svg width={size * 0.78} height={size * 0.78}>
          <Defs>
            <RadialGradient id="orbBody" cx="50%" cy="50%" r="50%">
              {/* dark void centre — the black-hole signature */}
              <Stop offset="0" stopColor="#000000" stopOpacity={0.96} />
              <Stop offset="0.18" stopColor="#000000" stopOpacity={0.7} />
              <Stop offset="0.4" stopColor={deep} stopOpacity={0.95} />
              <Stop offset="0.62" stopColor={mid} stopOpacity={0.95} />
              {/* hot accretion rim */}
              <Stop offset="0.82" stopColor={accent} stopOpacity={1} />
              <Stop offset="0.93" stopColor={accent} stopOpacity={0.5} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size * 0.39} cy={size * 0.39} r={size * 0.39} fill="url(#orbBody)" />
        </Svg>
      </AnimatedView>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={20}>
        {orb}
      </Pressable>
    );
  }
  return orb;
}

export default SkiaOrb;
