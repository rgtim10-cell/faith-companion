import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { BlurMask, Canvas, Circle, Group, Line } from '@shopify/react-native-skia';
import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import { buildSky, hexChannels, stateBoostFor } from './memorySkyLayout';
import type { SkyState } from './memorySkyLayout';

export type { SkyState } from './memorySkyLayout';

interface MemorySkyProps {
  memories: MemoryRecord[];
  covenant: Covenant | null;
  /** Memory IDs whose stars should brighten — OATH is referencing them. */
  highlightIds?: string[];
  skyState?: SkyState;
}

export function MemorySky({
  memories,
  covenant,
  highlightIds,
  skyState = 'silent',
}: MemorySkyProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [time, setTime] = useState(0);
  const startRef = useRef(Date.now());

  // Drive breathing animation — same rAF pattern as SkiaOrb.
  useEffect(() => {
    let raf: number;
    const tick = () => {
      setTime((Date.now() - startRef.current) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const { stars, edges } = useMemo(
    () => buildSky(memories, covenant, W, H),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memories.length, covenant?.id, W, H],
  );

  const highlightSet = useMemo(() => new Set(highlightIds ?? []), [highlightIds]);
  const hasHighlights = highlightSet.size > 0;

  const stateBoost = stateBoostFor(skyState);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Constellation lines — very faint, drawn behind stars */}
      {edges.map((e) => {
        const idA = e.key.split('→')[0];
        const isLit = highlightSet.has(idA) || (covenant && highlightSet.has(covenant.id));
        const opacity = hasHighlights ? (isLit ? 0.16 : 0.02) : 0.06;
        return (
          <Line
            key={e.key}
            p1={{ x: e.x1, y: e.y1 }}
            p2={{ x: e.x2, y: e.y2 }}
            strokeWidth={0.4}
            color={`rgba(255,255,255,${opacity})`}
          />
        );
      })}

      {/* Stars — every memory is a light in the sky */}
      {stars.map((star) => {
        const breath = Math.sin(time * (star.isNorthStar ? 0.22 : 0.48) + star.phase) * 0.08 + 0.92;
        const highlighted = highlightSet.has(star.id);
        const dimFactor = hasHighlights && !highlighted ? 0.25 : 1.0;
        const highlightBump = highlighted ? 2.0 : 1.0;

        const finalOpacity = Math.min(
          1,
          star.opacity * breath * dimFactor * highlightBump * stateBoost,
        );

        const r = star.r * (star.isNorthStar
          ? 1 + Math.sin(time * 0.18) * 0.04
          : breath);

        const [rr, gg, bb] = hexChannels(star.color);
        const glowColor = `rgba(${rr},${gg},${bb},0.18)`;
        const coreColor = star.color;

        return (
          <Group key={star.id} opacity={finalOpacity}>
            {/* Outer glow — blurred, large, faint */}
            <Group>
              <BlurMask blur={r * 3.5} style="normal" />
              <Circle
                cx={star.cx}
                cy={star.cy}
                r={r * 3}
                color={glowColor}
              />
            </Group>
            {/* Core — sharp, bright */}
            <Circle cx={star.cx} cy={star.cy} r={r} color={coreColor} />
          </Group>
        );
      })}
    </Canvas>
  );
}

export default MemorySky;
