import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  buildParticles,
  particleAt,
  lerpControls,
  MODE_CONTROLS,
} from '@/engine/particleField';
import type { FieldMode, FieldControls } from '@/engine/particleField';
import { covenantAnchor } from './memorySkyLayout';

// Fewer particles on web — SVG nodes are heavier than Skia draws, and web is a
// dev/fallback surface (the app is mobile-first).
const COUNT = 40;

interface ParticleFieldProps {
  mode?: FieldMode;
}

/**
 * Web fallback for OATH's resting particle field. Same simulation math as the
 * native renderer (particleField.ts), drawn with react-native-svg on a
 * throttled clock so the field moves identically, just lighter.
 */
export function ParticleField({ mode = 'rest' }: ParticleFieldProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [time, setTime] = useState(0);
  const startRef = useRef(Date.now());

  const particles = useMemo(() => buildParticles(COUNT), []);
  const anchor = useMemo(() => covenantAnchor(W, H), [W, H]);
  const controlsRef = useRef<FieldControls>({ ...MODE_CONTROLS.rest });

  useEffect(() => {
    let raf: number;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      if (now - last > 50) {
        const dt = Math.min(0.08, (now - last) / 1000);
        controlsRef.current = lerpControls(controlsRef.current, MODE_CONTROLS[mode], dt * 2.4);
        setTime((now - startRef.current) / 1000);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const params = { W, H, anchorX: anchor.x, anchorY: anchor.y, time, controls: controlsRef.current };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={W} height={H}>
        {particles.map((p) => {
          const f = particleAt(p, params);
          if (f.opacity < 0.012) return null;
          return (
            <Circle
              key={p.id}
              cx={f.x}
              cy={f.y}
              r={f.r * (p.near > 0.7 ? 1.4 : 1)}
              fill="rgb(224,232,255)"
              opacity={f.opacity}
            />
          );
        })}
      </Svg>
    </View>
  );
}

export default ParticleField;
