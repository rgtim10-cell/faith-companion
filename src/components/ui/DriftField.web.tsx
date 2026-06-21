import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import {
  buildOrbitalParticles,
  orbitalAt,
  ORBIT_SPEED,
} from '@/engine/driftEcosystem';
import type { OrbitMode } from '@/engine/driftEcosystem';
import { covenantAnchor } from './memorySkyLayout';

// Web SVG fallback for The Drift. Throttled to ~20 fps; fewer particles than
// native since SVG elements are heavier than Skia draw calls. The covenant
// glow uses a radial SVG gradient (no BlurMask available).

const COUNT = 55;

interface DriftFieldProps {
  mode?: OrbitMode;
}

export function DriftField({ mode = 'idle' }: DriftFieldProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [time, setTime] = useState(0);
  const startRef = useRef(Date.now());

  const anchor = useMemo(() => covenantAnchor(W, H), [W, H]);
  const particles = useMemo(() => buildOrbitalParticles(COUNT), []);
  const speedRef = useRef(ORBIT_SPEED.idle);

  useEffect(() => {
    let raf: number;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      if (now - last > 50) {
        const dt = Math.min(0.08, (now - last) / 1000);
        speedRef.current += (ORBIT_SPEED[mode] - speedRef.current) * Math.min(1, dt * 1.8);
        setTime((now - startRef.current) / 1000);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const { x: cx, y: cy } = anchor;
  const speedMult = speedRef.current;
  const covenantBreath = Math.sin(time * 1.57) * 0.12 + 0.88;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={W} height={H}>
        <Defs>
          <RadialGradient id="covenantGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgb(255,245,200)" stopOpacity={0.65} />
            <Stop offset="35%" stopColor="rgb(255,215,120)" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="rgb(255,200,80)" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Covenant heart */}
        <Circle cx={cx} cy={cy} r={72} fill="url(#covenantGlow)" opacity={covenantBreath * 0.30} />
        <Circle cx={cx} cy={cy} r={5} fill="rgb(255,245,200)" opacity={covenantBreath * 0.78} />

        {/* Orbital particles */}
        {particles.map((p) => {
          const f = orbitalAt(p, time, cx, cy, H, speedMult);
          if (f.opacity < 0.01) return null;
          return (
            <Circle
              key={p.id}
              cx={f.x}
              cy={f.y}
              r={f.r * (p.near > 0.65 ? 1.55 : 1)}
              fill="rgb(214,224,255)"
              opacity={f.opacity}
            />
          );
        })}
      </Svg>
    </View>
  );
}

export default DriftField;
