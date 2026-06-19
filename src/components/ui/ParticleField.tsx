import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurMask, Canvas, Circle, Group } from '@shopify/react-native-skia';
import {
  buildParticles,
  particleAt,
  lerpControls,
  MODE_CONTROLS,
} from '@/engine/particleField';
import type { FieldMode, FieldControls } from '@/engine/particleField';
import { covenantAnchor } from './memorySkyLayout';

const COUNT = 84;

interface ParticleFieldProps {
  /** What OATH is doing — the whole field moves to express it. */
  mode?: FieldMode;
}

/**
 * OATH's resting body (directive §1). A living field of particles inside the
 * dark — alive even before a single memory exists. It drifts and breathes at
 * rest, draws inward toward the covenant when OATH looks through the record,
 * and opens outward when OATH speaks. It sits *beneath* the memory stars: the
 * stars are the record, the field is the presence holding them.
 */
export function ParticleField({ mode = 'rest' }: ParticleFieldProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [time, setTime] = useState(0);
  const startRef = useRef(Date.now());

  const particles = useMemo(() => buildParticles(COUNT), []);
  const anchor = useMemo(() => covenantAnchor(W, H), [W, H]);

  // Controls ease toward the active mode's target every frame, so a mode change
  // looks like the field reorganizing rather than snapping.
  const controlsRef = useRef<FieldControls>({ ...MODE_CONTROLS.rest });

  useEffect(() => {
    let raf: number;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // Critically-damped-ish approach toward the mode target.
      const target = MODE_CONTROLS[mode];
      controlsRef.current = lerpControls(controlsRef.current, target, dt * 2.4);
      setTime((now - startRef.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  const controls = controlsRef.current;
  const params = { W, H, anchorX: anchor.x, anchorY: anchor.y, time, controls };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map((p) => {
          const f = particleAt(p, params);
          if (f.opacity < 0.012) return null;
          // Near particles carry a soft bloom; far ones are bare points (cheap).
          if (p.near > 0.7) {
            return (
              <Group key={p.id} opacity={f.opacity}>
                <Group>
                  <BlurMask blur={f.r * 3} style="normal" />
                  <Circle cx={f.x} cy={f.y} r={f.r * 2.6} color="rgba(214,224,255,0.5)" />
                </Group>
                <Circle cx={f.x} cy={f.y} r={f.r} color="rgba(236,242,255,0.9)" />
              </Group>
            );
          }
          return (
            <Circle
              key={p.id}
              cx={f.x}
              cy={f.y}
              r={f.r}
              color={`rgba(214,224,255,${f.opacity.toFixed(3)})`}
            />
          );
        })}
      </Canvas>
    </View>
  );
}

export default ParticleField;
