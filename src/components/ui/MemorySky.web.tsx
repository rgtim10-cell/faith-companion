import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import { buildSky, stateBoostFor } from './memorySkyLayout';
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

/**
 * Web fallback for the Living Memory Sky.
 *
 * Skia's CanvasKit (WASM) does not load reliably under the Metro web bundler,
 * so on web we never import @shopify/react-native-skia. This renders the exact
 * same constellation — shared positioning math from memorySkyLayout — with
 * react-native-svg instead: each star is a soft halo plus a bright core,
 * breathing on the same rAF clock. The covenant is ringed; the connections
 * illuminate when OATH looks through the record.
 */
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
    [memories, covenant?.id, W, H],
  );

  const highlightSet = useMemo(() => new Set(highlightIds ?? []), [highlightIds]);
  const hasHighlights = highlightSet.size > 0;
  const stateBoost = stateBoostFor(skyState);
  const heavy = stars.length > 90;
  const mirroring = skyState === 'noticing';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={onSelectStar ? 'box-none' : 'none'}>
      <Svg width={W} height={H} pointerEvents="none">
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
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              strokeWidth={e.kind === 'resonance' ? 0.5 : 0.4}
              stroke="#FFFFFF"
              strokeOpacity={opacity}
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

          if (star.isNorthStar) {
            // The covenant — brightest object in the sky, ringed so it can never
            // be mistaken for anything else.
            return (
              <React.Fragment key={star.id}>
                <Circle cx={star.cx} cy={star.cy} r={r * 4.2} fill={star.color} opacity={finalOpacity * 0.14} />
                <Circle cx={star.cx} cy={star.cy} r={r * 2.6} fill={star.color} opacity={finalOpacity * 0.20} />
                <Circle
                  cx={star.cx}
                  cy={star.cy}
                  r={r * 2.4}
                  fill="none"
                  stroke="#F4D58A"
                  strokeWidth={0.75}
                  strokeOpacity={finalOpacity * 0.5}
                />
                <Circle cx={star.cx} cy={star.cy} r={r} fill={star.color} opacity={finalOpacity} />
                <Circle cx={star.cx} cy={star.cy} r={r * 0.45} fill="#FFFFFF" opacity={finalOpacity} />
              </React.Fragment>
            );
          }

          return (
            <React.Fragment key={star.id}>
              {!heavy && (
                <Circle
                  cx={star.cx}
                  cy={star.cy}
                  r={r * 3}
                  fill={star.color}
                  opacity={finalOpacity * 0.10}
                />
              )}
              <Circle
                cx={star.cx}
                cy={star.cy}
                r={r * 1.8}
                fill={star.color}
                opacity={finalOpacity * 0.18}
              />
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

      {onSelectStar && <StarTouchLayer stars={stars} onSelect={onSelectStar} />}
    </View>
  );
}

export default MemorySky;
