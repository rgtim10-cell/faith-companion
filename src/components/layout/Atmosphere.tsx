import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useRealm } from '@/context/RealmContext';

interface AtmosphereProps {
  /** 0→1 bloom — the light gathers as OATH speaks. */
  intensity?: Animated.Value;
  /** 0→1 — the room dims and stills as something sacred is recalled. */
  dim?: Animated.Value;
}

// Deterministic field of motes — dust suspended in the light, giving the
// space depth. Larger/brighter ones read as nearer (parallax).
const MOTES = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => (Math.sin(i * 12.9898 + n * 4.123) + 1) / 2;
  const near = r(8);
  return {
    x: r(1),
    y: r(2),
    size: 1.4 + near * 3,
    baseOpacity: 0.06 + near * 0.26,
    drift: 36 + r(5) * 64 * (0.5 + near),
    dur: 9000 + r(6) * 10000,
    delay: r(7) * 6000,
  };
});

/**
 * The atmosphere is the AI's body. It breathes, it warms when OATH gathers to
 * speak, and the whole room darkens and goes still when a memory is recalled.
 * Light and depth carry feeling before any word does.
 */
export function Atmosphere({ intensity, dim }: AtmosphereProps) {
  const { realm } = useRealm();
  const { width: W, height: H } = useWindowDimensions();

  const breathe = useRef(new Animated.Value(0)).current;
  const zero = useRef(new Animated.Value(0)).current;
  const ext = intensity ?? zero;
  const dimV = dim ?? zero;

  const motes = useRef(MOTES.map(() => ({ t: new Animated.Value(0), o: new Animated.Value(0) }))).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 5400, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 5400, useNativeDriver: true }),
      ]),
    ).start();

    motes.forEach((m, i) => {
      const cfg = MOTES[i];
      Animated.loop(
        Animated.timing(m.t, { toValue: 1, duration: cfg.dur, delay: cfg.delay, useNativeDriver: true }),
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(m.o, { toValue: 1, duration: cfg.dur * 0.5, delay: cfg.delay, useNativeDriver: true }),
          Animated.timing(m.o, { toValue: 0, duration: cfg.dur * 0.5, useNativeDriver: true }),
        ]),
      ).start();
    });

    return () => {
      breathe.stopAnimation();
      motes.forEach((m) => {
        m.t.stopAnimation();
        m.o.stopAnimation();
      });
    };
  }, [breathe, motes]);

  const glowOpacity = Animated.add(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.8] }),
    Animated.multiply(ext, 0.5),
  );
  const glowScale = Animated.add(
    breathe.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] }),
    Animated.multiply(ext, 0.12),
  );
  const darkenOpacity = Animated.multiply(dimV, 0.62);

  const accent = realm.accent;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: realm.bg }]} pointerEvents="none">
      {/* Volumetric light — the presence's glow filling the space */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}>
        <Svg width={W} height={H}>
          <Defs>
            <RadialGradient id="atmGlow" cx="50%" cy="36%" r="62%">
              <Stop offset="0" stopColor={accent} stopOpacity={0.5} />
              <Stop offset="0.35" stopColor={accent} stopOpacity={0.16} />
              <Stop offset="1" stopColor={accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={W} height={H} fill="url(#atmGlow)" />
        </Svg>
      </Animated.View>

      {/* Motes — dust in the light, the depth of the room */}
      {motes.map((m, i) => {
        const cfg = MOTES[i];
        const ty = m.t.interpolate({ inputRange: [0, 1], outputRange: [0, -cfg.drift] });
        const op = m.o.interpolate({ inputRange: [0, 1], outputRange: [0, cfg.baseOpacity] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: cfg.x * W,
              top: 0.1 * H + cfg.y * H * 0.72,
              width: cfg.size,
              height: cfg.size,
              borderRadius: cfg.size / 2,
              backgroundColor: '#FFFFFF',
              opacity: op,
              transform: [{ translateY: ty }],
            }}
          />
        );
      })}

      {/* Vignette — the edges of the space fall into dark */}
      <Svg width={W} height={H} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="atmVig" cx="50%" cy="40%" r="75%">
            <Stop offset="0.5" stopColor={realm.bg} stopOpacity={0} />
            <Stop offset="1" stopColor={realm.bg} stopOpacity={0.92} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width={W} height={H} fill="url(#atmVig)" />
      </Svg>

      {/* The room dims when OATH remembers */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: darkenOpacity }]} />
    </View>
  );
}
