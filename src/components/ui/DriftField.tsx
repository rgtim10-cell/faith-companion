import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurMask, Canvas, Circle, Group } from '@shopify/react-native-skia';
import {
  buildOrbitalParticles,
  orbitalAt,
  ORBIT_SPEED,
} from '@/engine/driftEcosystem';
import type { OrbitMode } from '@/engine/driftEcosystem';
import { covenantAnchor } from './memorySkyLayout';

// Native Skia renderer for The Drift — OATH's orbital ecosystem (directive §8.2).
// Near particles get a soft bloom halo; mid-range are clean points.
// The covenant glow at center marks the gravitational heart.

const COUNT = 90;

interface DriftFieldProps {
  mode?: OrbitMode;
}

export function DriftField({ mode = 'idle' }: DriftFieldProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [time, setTime] = useState(0);
  const startRef = useRef(Date.now());

  const anchor = useMemo(() => covenantAnchor(W, H), [W, H]);
  const particles = useMemo(() => buildOrbitalParticles(COUNT), []);

  // Lerp speedMult toward the mode target so mode transitions are smooth.
  const speedRef = useRef(ORBIT_SPEED.idle);

  useEffect(() => {
    let raf: number;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      speedRef.current += (ORBIT_SPEED[mode] - speedRef.current) * Math.min(1, dt * 1.8);
      setTime((now - startRef.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const { x: cx, y: cy } = anchor;
  const speedMult = speedRef.current;

  // Covenant heart pulses on a slow 4-second breath so it reads as alive.
  const covenantBreath = Math.sin(time * 1.57) * 0.12 + 0.88; // ~4s period
  const covenantOpacity = covenantBreath;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Covenant heart — warm gold gravitational center */}
        <Group opacity={covenantOpacity}>
          <Group>
            <BlurMask blur={52} style="normal" />
            <Circle cx={cx} cy={cy} r={68} color="rgba(255,200,80,0.055)" />
          </Group>
          <Group>
            <BlurMask blur={16} style="normal" />
            <Circle cx={cx} cy={cy} r={22} color="rgba(255,215,120,0.20)" />
          </Group>
          <Group>
            <BlurMask blur={5} style="normal" />
            <Circle cx={cx} cy={cy} r={7} color="rgba(255,238,170,0.52)" />
          </Group>
          <Circle cx={cx} cy={cy} r={2.5} color="rgba(255,250,230,0.82)" />
        </Group>

        {/* Orbital particles */}
        {particles.map((p) => {
          const f = orbitalAt(p, time, cx, cy, H, speedMult);
          if (f.opacity < 0.012) return null;

          if (p.near > 0.65) {
            // Near-depth: soft bloom halo + crisp core
            return (
              <Group key={p.id} opacity={f.opacity}>
                <Group>
                  <BlurMask blur={f.r * 2.8} style="normal" />
                  <Circle cx={f.x} cy={f.y} r={f.r * 2.4} color="rgba(210,226,255,0.40)" />
                </Group>
                <Circle cx={f.x} cy={f.y} r={f.r} color="rgba(242,248,255,0.92)" />
              </Group>
            );
          }

          // Far-depth: bare point — cheap, still readable
          return (
            <Circle
              key={p.id}
              cx={f.x}
              cy={f.y}
              r={f.r}
              color={`rgba(210,222,255,${f.opacity.toFixed(3)})`}
            />
          );
        })}
      </Canvas>
    </View>
  );
}

export default DriftField;
