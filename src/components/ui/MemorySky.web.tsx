import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import { buildSky, stateBoostFor } from './memorySkyLayout';
import type { SkyState } from './memorySkyLayout';

export type { SkyState } from './memorySkyLayout';

interface MemorySkyProps {
  memories: MemoryRecord[];
  covenant: Covenant | null;
  /** Memory IDs whose stars should brighten — OATH is referencing them. */
  highlightIds?: string[];
  skyState?: SkyState;
}

/**
 * Web fallback for the Living Memory Sky.
 *
 * Skia's CanvasKit (WASM) does not load reliably under the Metro web bundler,
 * so on web we never import @shopify/react-native-skia. This renders the exact
 * same constellation — shared positioning math from memorySkyLayout — with
 * react-native-svg instead: each star is a soft halo circle plus a bright core,
 * breathing on the same rAF clock. No blur shader, but the same living sky.
 */
export function MemorySky({
  memories,
  covenant,
  highlightIds,
  skyState = 'silent',
}: MemorySkyProps) {
  const { width: W, height: H } = useWindowDimensions();
  const [time, setTime] = useState(0);
  const startRef = useRef(Date.now());

  // Breathing clock — throttled to ~20fps; the sky moves slowly, so this is
  // plenty and keeps SVG re-renders light on web.
  useEffect(() => {
    let raf: number;
    let last = 0;
    const tick = () => {
      const now = Date.now();
      if (now - last > 50) {
        setTime((now - startRef.current) / 1000);
        last = now;
      }
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
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={W} height={H}>
        {/* Constellation lines — very faint, drawn behind stars */}
        {edges.map((e) => {
          const idA = e.key.split('→')[0];
          const isLit = highlightSet.has(idA) || (covenant && highlightSet.has(covenant.id));
          const opacity = hasHighlights ? (isLit ? 0.16 : 0.02) : 0.06;
          return (
            <Line
              key={e.key}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              strokeWidth={0.4}
              stroke="#FFFFFF"
              strokeOpacity={opacity}
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

          return (
            <React.Fragment key={star.id}>
              {/* Outer halo — soft, large, faint (approximates the native blur) */}
              <Circle
                cx={star.cx}
                cy={star.cy}
                r={r * 3}
                fill={star.color}
                opacity={finalOpacity * 0.10}
              />
              <Circle
                cx={star.cx}
                cy={star.cy}
                r={r * 1.8}
                fill={star.color}
                opacity={finalOpacity * 0.18}
              />
              {/* Core — sharp, bright */}
              <Circle
                cx={star.cx}
                cy={star.cy}
                r={r}
                fill={star.color}
                opacity={finalOpacity}
              />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

export default MemorySky;
