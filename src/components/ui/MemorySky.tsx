import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { BlurMask, Canvas, Circle, Group, Line } from '@shopify/react-native-skia';
import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import { memoryTypeColor } from '@/data/memoryGraph';
import { computeSignificance } from '@/engine/memoryEvolution';

export type SkyState = 'silent' | 'noticing' | 'speaking' | 'remembering';

interface MemorySkyProps {
  memories: MemoryRecord[];
  covenant: Covenant | null;
  /** Memory IDs whose stars should brighten — OATH is referencing them. */
  highlightIds?: string[];
  skyState?: SkyState;
}

// Memory types occupy different regions of the sky — forming a natural
// hierarchy from covenant at the crown to reflection in the depths.
const TYPE_REGIONS: Record<string, [number, number, number, number]> = {
  // [xMin, xMax, yMin, yMax] in 0–1 space
  promise:     [0.18, 0.82, 0.06, 0.22],
  breakthrough:[0.18, 0.82, 0.20, 0.44],
  evidence:    [0.50, 0.92, 0.26, 0.62],
  struggle:    [0.05, 0.50, 0.48, 0.80],
  truth:       [0.22, 0.78, 0.34, 0.66],
  reflection:  [0.32, 0.90, 0.62, 0.90],
  pattern:     [0.06, 0.55, 0.30, 0.68],
};

// Deterministic FNV-1a hash — same memory ID always maps to the same sky position.
function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function seededFloat(seed: number, salt: number): number {
  const x = Math.imul(seed ^ salt, 0x9e3779b9) >>> 0;
  return (x & 0xffff) / 0xffff;
}

// Parse a #rrggbb hex string into 0-255 channels.
function hexChannels(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

interface StarDatum {
  id: string;
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  color: string;
  phase: number;
  foundational: boolean;
  isNorthStar: boolean;
}

interface EdgeDatum {
  key: string;
  x1: number; y1: number;
  x2: number; y2: number;
}

function buildSky(
  memories: MemoryRecord[],
  covenant: Covenant | null,
  W: number,
  H: number,
): { stars: StarDatum[]; edges: EdgeDatum[] } {
  const now = Date.now();
  const stars: StarDatum[] = [];

  // North Star — the covenant. Fixed at the crown of the sky.
  if (covenant) {
    stars.push({
      id: covenant.id,
      cx: W * 0.50,
      cy: H * 0.10,
      r: 3.5,
      opacity: 0.90,
      color: '#D4A853',
      phase: 0,
      foundational: true,
      isNorthStar: true,
    });
  }

  for (const mem of memories) {
    const h = fnv1a(mem.id);
    const region = TYPE_REGIONS[mem.type] ?? TYPE_REGIONS.truth;
    const [xMin, xMax, yMin, yMax] = region;
    const cx = W * (xMin + seededFloat(h, 1) * (xMax - xMin));
    const cy = H * (yMin + seededFloat(h, 2) * (yMax - yMin));
    const sig = computeSignificance(mem, now);
    const phase = seededFloat(h, 3) * Math.PI * 2;
    const color = memoryTypeColor[mem.type] ?? '#FFFFFF';

    stars.push({
      id: mem.id,
      cx,
      cy,
      r: 1.2 + sig * 1.8,
      opacity: Math.max(0.08, sig * 0.80),
      color,
      phase,
      foundational: mem.isFoundational ?? false,
      isNorthStar: false,
    });
  }

  // Edges — link memories to their anchoring promise/covenant.
  const edges: EdgeDatum[] = [];
  const starById = new Map(stars.map((s) => [s.id, s]));

  for (const mem of memories) {
    if (!mem.linkedPromiseId) continue;
    const from = starById.get(mem.id);
    // Link to a promise-type star if it exists; otherwise the covenant North Star.
    const to = starById.get(mem.linkedPromiseId) ?? (covenant ? starById.get(covenant.id) : undefined);
    if (from && to && from.id !== to.id) {
      edges.push({
        key: `${from.id}→${to.id}`,
        x1: from.cx, y1: from.cy,
        x2: to.cx,   y2: to.cy,
      });
    }
  }

  return { stars, edges };
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

  // Atmospheric intensity multiplier per sky state.
  const stateBoost = skyState === 'speaking' ? 1.4
    : skyState === 'noticing'   ? 1.2
    : skyState === 'remembering'? 0.7
    : 1.0;

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
