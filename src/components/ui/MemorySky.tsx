import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurMask, Canvas, Circle, Group, Line } from '@shopify/react-native-skia';
import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import { buildSky, hexChannels, stateBoostFor } from './memorySkyLayout';
import type { SkyState } from './memorySkyLayout';
import { StarTouchLayer } from './StarTouchLayer';

export type { SkyState } from './memorySkyLayout';

interface MemorySkyProps {
  memories: MemoryRecord[];
  covenant: Covenant | null;
  /** Memory IDs whose stars should brighten — OATH is referencing them. */
  highlightIds?: string[];
  skyState?: SkyState;
  /** Tap a star to surface that memory. When set, the sky becomes interactive. */
  onSelectStar?: (id: string) => void;
}

export function MemorySky({
  memories,
  covenant,
  highlightIds,
  skyState = 'silent',
  onSelectStar,
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
    [memories, covenant?.id, W, H],
  );

  const highlightSet = useMemo(() => new Set(highlightIds ?? []), [highlightIds]);
  const hasHighlights = highlightSet.size > 0;
  const stateBoost = stateBoostFor(skyState);
  const heavy = stars.length > 90;
  // Mirror: when OATH is looking through the record, the connections illuminate.
  const mirroring = skyState === 'noticing';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={onSelectStar ? 'box-none' : 'none'}>
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Constellation lines — faint webs between covenant and kindred memories */}
        {edges.map((e) => {
          const lit =
            highlightSet.has(e.fromId) ||
            highlightSet.has(e.toId) ||
            (!!covenant && e.kind === 'covenant' && highlightSet.has(covenant.id));
          let base = e.kind === 'covenant' ? 0.06 : 0.045;
          if (mirroring) base = e.kind === 'covenant' ? 0.15 : 0.12;
          const opacity = hasHighlights ? (lit ? 0.22 : 0.02) : base;
          return (
            <Line
              key={e.key}
              p1={{ x: e.x1, y: e.y1 }}
              p2={{ x: e.x2, y: e.y2 }}
              strokeWidth={e.kind === 'resonance' ? 0.5 : 0.4}
              color={`rgba(255,255,255,${opacity})`}
            />
          );
        })}

        {/* Stars — every memory is a light in the sky */}
        {stars.map((star) => {
          const breath = Math.sin(time * (star.isNorthStar ? 0.22 : 0.48) + star.phase) * 0.08 + 0.92;
          const highlighted = highlightSet.has(star.id);
          const dimFactor = hasHighlights && !highlighted ? 0.22 : 1.0;
          const highlightBump = highlighted ? 2.1 : 1.0;

          const finalOpacity = Math.min(
            1,
            star.opacity * breath * dimFactor * highlightBump * stateBoost,
          );

          const r = star.r * (star.isNorthStar
            ? 1 + Math.sin(time * 0.18) * 0.05
            : breath);

          const [rr, gg, bb] = hexChannels(star.color);
          const glowColor = `rgba(${rr},${gg},${bb},0.18)`;

          if (star.isNorthStar) {
            // The covenant — brightest object in the sky, ringed so it can never
            // be mistaken for anything else. No label needed.
            return (
              <Group key={star.id} opacity={finalOpacity}>
                <Group>
                  <BlurMask blur={r * 5} style="normal" />
                  <Circle cx={star.cx} cy={star.cy} r={r * 4.2} color={`rgba(${rr},${gg},${bb},0.22)`} />
                </Group>
                <Circle
                  cx={star.cx}
                  cy={star.cy}
                  r={r * 2.4}
                  color="rgba(244,213,138,0.5)"
                  style="stroke"
                  strokeWidth={0.75}
                />
                <Circle cx={star.cx} cy={star.cy} r={r} color={star.color} />
                <Circle cx={star.cx} cy={star.cy} r={r * 0.45} color="#FFFFFF" />
              </Group>
            );
          }

          return (
            <Group key={star.id} opacity={finalOpacity}>
              {!heavy && (
                <Group>
                  <BlurMask blur={r * 3.5} style="normal" />
                  <Circle cx={star.cx} cy={star.cy} r={r * 3} color={glowColor} />
                </Group>
              )}
              <Circle cx={star.cx} cy={star.cy} r={r} color={star.color} />
            </Group>
          );
        })}
      </Canvas>

      {onSelectStar && <StarTouchLayer stars={stars} onSelect={onSelectStar} />}
    </View>
  );
}

export default MemorySky;
