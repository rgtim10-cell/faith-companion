import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRealm } from '@/context/RealmContext';

type OrbSize = 'sm' | 'md' | 'lg' | 'xl';

interface OathOrbProps {
  size?: OrbSize;
  animated?: boolean;
  style?: object;
  /** External 0→1 intensity. Drive this to make OATH brighten/swell as it "speaks". */
  pulse?: Animated.Value;
  /** When true, OATH emits a slow expanding halo — the feeling of waiting, attending. */
  listening?: boolean;
  /** Makes the orb respond to touch (ripple + brighten). */
  onPress?: () => void;
}

const sizePx: Record<OrbSize, number> = {
  sm: 36,
  md: 64,
  lg: 120,
  xl: 200,
};

export function OathOrb({
  size = 'md',
  animated: isAnimated = true,
  style,
  pulse,
  listening = false,
  onPress,
}: OathOrbProps) {
  const { realm } = useRealm();
  const px = sizePx[size];

  const breathScale = useRef(new Animated.Value(1)).current;
  const outerGlowOpacity = useRef(new Animated.Value(0.35)).current;
  const innerGlowOpacity = useRef(new Animated.Value(0.06)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const ring2Rotate = useRef(new Animated.Value(0)).current;
  const ring3Rotate = useRef(new Animated.Value(0)).current;
  const ring3Opacity = useRef(new Animated.Value(0.5)).current;

  // Awareness layers
  const halo = useRef(new Animated.Value(0)).current;   // listening
  const touch = useRef(new Animated.Value(0)).current;  // reaction to being touched
  const zero = useRef(new Animated.Value(0)).current;

  // Combined "awareness intensity": what OATH is feeling right now.
  // external pulse (speaking / remembering) + touch (being met).
  const intensityRef = useRef<Animated.Animated | null>(null);
  if (!intensityRef.current) {
    intensityRef.current = Animated.add(pulse ?? zero, touch);
  }
  const intensity = intensityRef.current as Animated.AnimatedAddition<number>;

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

    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 28000, useNativeDriver: true }),
    ).start();

    Animated.loop(
      Animated.timing(ring2Rotate, { toValue: 1, duration: 18000, useNativeDriver: true }),
    ).start();

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

  // Listening — a slow halo breathes outward while OATH attends.
  useEffect(() => {
    if (!listening || !isAnimated) {
      halo.stopAnimation();
      halo.setValue(0);
      return;
    }
    halo.setValue(0);
    const loop = Animated.loop(
      Animated.timing(halo, { toValue: 1, duration: 3000, useNativeDriver: true }),
    );
    loop.start();
    return () => {
      loop.stop();
      halo.setValue(0);
    };
  }, [listening, isAnimated, halo]);

  const handlePressIn = () => {
    Animated.spring(touch, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(touch, { toValue: 0, useNativeDriver: true, speed: 12, bounciness: 6 }).start();
  };

  const ringCWDeg = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const ringCCWDeg = ring2Rotate.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const ring3Deg = ring3Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const accent = realm.accent;

  const containerSize = px * 2.6;
  const outerRingSize = px * 1.9;
  const midRingSize = px * 1.48;
  const innerRingSize = px * 1.18;
  const rippleSize = px * 1.34;

  // Awareness-driven derived values
  const coreScale = Animated.add(breathScale, Animated.multiply(intensity, 0.05));
  const rimOpacity = Animated.add(innerGlowOpacity, Animated.multiply(intensity, 0.5));
  const brightRingOpacity = Animated.add(ring3Opacity, Animated.multiply(intensity, 0.4));
  const rippleOpacity = Animated.multiply(intensity, 0.55);
  const rippleScale = Animated.add(1, Animated.multiply(intensity, 0.26));
  const atmosphereOpacity = Animated.add(outerGlowOpacity, Animated.multiply(intensity, 0.35));

  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 0.12, 1], outputRange: [0, 0.42, 0] });

  const orbBody = (
    <View style={[{ width: containerSize, height: containerSize, alignItems: 'center', justifyContent: 'center' }, style]}>

      {/* Listening halo — OATH attending */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: outerRingSize,
            height: outerRingSize,
            borderRadius: outerRingSize / 2,
            borderColor: accent,
            borderWidth: 1,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />

      {/* Atmospheric outer glow — swells when OATH speaks */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: containerSize / 2,
            backgroundColor: realm.accentMuted,
            opacity: atmosphereOpacity,
          },
        ]}
      />

      {/* Speak ripple — a pulse of awareness pushing outward */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: rippleSize,
            height: rippleSize,
            borderRadius: rippleSize / 2,
            borderColor: accent,
            borderWidth: 1.5,
            opacity: rippleOpacity,
            transform: [{ scale: rippleScale }],
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

      {/* Inner bright ring — fast CW, brightens with awareness */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: innerRingSize,
            height: innerRingSize,
            borderRadius: innerRingSize / 2,
            borderColor: accent,
            borderWidth: 1.5,
            opacity: brightRingOpacity,
            transform: [{ rotate: ring3Deg }],
          },
        ]}
      />

      {/* Core orb — breathing, swelling slightly when OATH speaks or is touched */}
      <Animated.View
        style={[
          styles.core,
          {
            width: px,
            height: px,
            borderRadius: px / 2,
            transform: [{ scale: coreScale }],
            shadowColor: accent,
          },
        ]}
      >
        <LinearGradient
          colors={realm.orbColors as [string, string, string, string]}
          start={{ x: 0.5, y: 0.1 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.fill, { borderRadius: px / 2 }]}
        />

        {/* Rim glow — intensifies with awareness */}
        <Animated.View
          style={[
            styles.fill,
            {
              borderRadius: px / 2,
              backgroundColor: accent,
              opacity: rimOpacity,
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

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        {orbBody}
      </Pressable>
    );
  }

  return orbBody;
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
