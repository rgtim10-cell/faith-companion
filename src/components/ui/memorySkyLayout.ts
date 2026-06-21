import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import { memoryTypeColor } from '@/data/memoryGraph';
import { computeSignificance } from '@/engine/memoryEvolution';

// Shared, Skia-free layout math for the Living Memory Sky.
// Both the native (Skia) and web (SVG) renderers consume this so the
// constellation is positioned identically on every platform.
//
// Phase 3 — the sky IS the interface.
// The covenant is the brightest object, anchored near the center. Every memory
// is a real star, positioned by MEANING (its theme cluster) rather than by type
// alone, and pulled toward or away from the covenant by its living significance:
// reinforced memories move inward, decayed memories drift outward, foundational
// memories grow larger. Memories that share meaning form visible constellations.

export type SkyState = 'silent' | 'noticing' | 'speaking' | 'remembering';

// ── Themes ─────────────────────────────────────────────────────
// Memories cluster by meaning, not type. A theme is a region of the self —
// the parts of a life that begin to recognize themselves in the sky.

export type Theme =
  | 'becoming'
  | 'building'
  | 'insight'
  | 'health'
  | 'discipline'
  | 'resilience'
  | 'family'
  | 'faith';

// Tag → theme. The first theme to claim a tag owns it.
const THEME_TAGS: Record<Theme, string[]> = {
  becoming:   ['identity', 'becoming', 'transformation', 'commitment', 'proud', 'pride', 'self'],
  building:   ['builder', 'business', 'proof', 'milestone', 'systems', 'success', 'action', 'courage', 'work', 'career'],
  insight:    ['pattern', 'focus', 'energy', 'mindset', 'protection', 'night', 'clarity', 'truth'],
  health:     ['health', 'body', 'rest', 'sleep', 'fitness', 'run', 'training', 'food'],
  discipline: ['discipline', 'consistency', 'resistance', 'start', 'beginning', 'habit', 'routine'],
  resilience: ['resilience', 'return', 'setback', 'drift', 'self-compassion', 'comeback', 'recovery'],
  family:     ['family', 'love', 'connection', 'relationship', 'marriage', 'kids', 'friends'],
  faith:      ['faith', 'prayer', 'grace', 'surrender', 'trust', 'gratitude', 'meaning'],
};

// Each theme holds a fixed direction from the covenant, so the same part of a
// life always appears in the same region — the sky becomes recognizable.
const DEG = Math.PI / 180;
export const THEME_ANGLE: Record<Theme, number> = {
  becoming:   -90 * DEG, // crown — directly above the covenant
  building:   -40 * DEG, // upper right
  insight:      5 * DEG, // right
  health:      50 * DEG, // lower right
  discipline:  95 * DEG, // below
  resilience: 140 * DEG, // lower left
  family:     185 * DEG, // left
  faith:     -135 * DEG, // upper left
};

// Fallback theme when a memory has no theme-bearing tags — by record type.
const TYPE_THEME: Record<string, Theme> = {
  promise:      'becoming',
  evidence:     'building',
  breakthrough: 'building',
  struggle:     'resilience',
  truth:        'insight',
  pattern:      'insight',
  reflection:   'becoming',
};

const THEME_ORDER: Theme[] = [
  'becoming', 'building', 'insight', 'health', 'discipline', 'resilience', 'family', 'faith',
];

export function assignTheme(mem: MemoryRecord): Theme {
  const tags = mem.tags ?? [];
  let best: Theme | null = null;
  let bestScore = 0;
  for (const theme of THEME_ORDER) {
    const tagset = THEME_TAGS[theme];
    let score = 0;
    for (const t of tags) if (tagset.includes(t.toLowerCase())) score += 1;
    if (score > bestScore) { bestScore = score; best = theme; }
  }
  return best ?? TYPE_THEME[mem.type] ?? 'becoming';
}

// Deterministic FNV-1a hash — same memory ID always maps to the same sky position.
export function fnv1a(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function seededFloat(seed: number, salt: number): number {
  const x = Math.imul(seed ^ salt, 0x9e3779b9) >>> 0;
  return (x & 0xffff) / 0xffff;
}

// Parse a #rrggbb hex string into 0-255 channels.
export function hexChannels(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export interface StarDatum {
  id: string;
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  color: string;
  phase: number;
  foundational: boolean;
  isNorthStar: boolean;
  theme: Theme | null;
  significance: number;
}

export interface EdgeDatum {
  key: string;
  x1: number; y1: number;
  x2: number; y2: number;
  kind: 'covenant' | 'resonance';
  fromId: string;
  toId: string;
}

// The covenant's anchor point — the heart of the sky. Everything organizes
// around it. Slightly above center so clusters can fan out below and around.
export function covenantAnchor(W: number, H: number): { x: number; y: number } {
  return { x: W * 0.5, y: H * 0.40 };
}

export function buildSky(
  memories: MemoryRecord[],
  covenant: Covenant | null,
  W: number,
  H: number,
): { stars: StarDatum[]; edges: EdgeDatum[] } {
  const now = Date.now();
  const stars: StarDatum[] = [];
  const anchor = covenantAnchor(W, H);
  const R = Math.min(W, H);

  // Radial band: significant memories sit close to the covenant, faded ones
  // drift to the rim. Foundational memories are pulled in hard.
  const rNear = R * 0.11;
  const rSpread = R * 0.34;
  const marginX = W * 0.07;
  const marginY = H * 0.07;

  // North Star — the covenant. The brightest, largest object in the sky.
  // No label. Users should simply know: that is my word.
  if (covenant) {
    stars.push({
      id: covenant.id,
      cx: anchor.x,
      cy: anchor.y,
      r: 4.8,
      opacity: 0.98,
      color: '#F4D58A',
      phase: 0,
      foundational: true,
      isNorthStar: true,
      theme: null,
      significance: 1,
    });
  }

  for (const mem of memories) {
    // The covenant memory itself is represented by the North Star — skip it.
    if (mem.type === 'promise' && mem.linkedPromiseId === covenant?.id) continue;

    const h = fnv1a(mem.id);
    const theme = assignTheme(mem);
    const sig = computeSignificance(mem, now);

    // Direction: the theme's fixed bearing, with a hash-jittered spread so the
    // cluster has organic width (a wedge, not a spoke).
    const spread = 26 * DEG;
    const angle = THEME_ANGLE[theme] + (seededFloat(h, 1) - 0.5) * 2 * spread;

    // Distance: closer when significant, farther when faded. Foundational hugs
    // the covenant. A little hash jitter breaks up perfect rings.
    const pull = mem.isFoundational ? 0.0 : (1 - sig);
    const jitter = (seededFloat(h, 4) - 0.5) * R * 0.05;
    let radius = rNear + pull * rSpread + jitter;
    radius = Math.max(R * 0.07, radius);

    let cx = anchor.x + Math.cos(angle) * radius;
    let cy = anchor.y + Math.sin(angle) * radius;
    cx = Math.min(W - marginX, Math.max(marginX, cx));
    cy = Math.min(H - marginY, Math.max(marginY, cy));

    const color = memoryTypeColor[mem.type] ?? '#FFFFFF';
    const foundational = mem.isFoundational ?? false;

    const r = foundational
      ? 2.6 + sig * 1.7
      : 1.1 + sig * 1.7;

    stars.push({
      id: mem.id,
      cx,
      cy,
      r,
      opacity: Math.max(0.10, sig * 0.82),
      color,
      phase: seededFloat(h, 3) * Math.PI * 2,
      foundational,
      isNorthStar: false,
      theme,
      significance: sig,
    });
  }

  const starById = new Map(stars.map((s) => [s.id, s]));
  const edges: EdgeDatum[] = [];

  // Covenant edges — each anchored memory reaches back toward the word.
  for (const mem of memories) {
    if (!mem.linkedPromiseId) continue;
    const from = starById.get(mem.id);
    const to = starById.get(mem.linkedPromiseId)
      ?? (covenant ? starById.get(covenant.id) : undefined);
    if (from && to && from.id !== to.id) {
      edges.push({
        key: `cov:${from.id}->${to.id}`,
        x1: from.cx, y1: from.cy, x2: to.cx, y2: to.cy,
        kind: 'covenant', fromId: from.id, toId: to.id,
      });
    }
  }

  // Resonance edges — memories that share meaning gain subtle connections.
  // Two memories echo when they share ≥2 tags. Each memory keeps its single
  // strongest echo, so the web stays legible even as the sky fills.
  const withTags = memories.filter((m) => (m.tags?.length ?? 0) > 0);
  const seen = new Set<string>();
  for (let i = 0; i < withTags.length; i++) {
    const a = withTags[i];
    const aTags = new Set(a.tags.map((t) => t.toLowerCase()));
    let bestId: string | null = null;
    let bestShared = 0;
    for (let j = 0; j < withTags.length; j++) {
      if (i === j) continue;
      const b = withTags[j];
      let shared = 0;
      for (const t of b.tags) if (aTags.has(t.toLowerCase())) shared += 1;
      if (shared > bestShared) { bestShared = shared; bestId = b.id; }
    }
    if (bestId && bestShared >= 2) {
      const pairKey = [a.id, bestId].sort().join('::');
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      const from = starById.get(a.id);
      const to = starById.get(bestId);
      if (from && to) {
        edges.push({
          key: `res:${pairKey}`,
          x1: from.cx, y1: from.cy, x2: to.cx, y2: to.cy,
          kind: 'resonance', fromId: from.id, toId: to.id,
        });
      }
    }
  }

  return { stars, edges };
}

// Atmospheric intensity multiplier per sky state.
export function stateBoostFor(skyState: SkyState): number {
  return skyState === 'speaking' ? 1.4
    : skyState === 'noticing'   ? 1.25
    : skyState === 'remembering'? 0.65
    : 1.0;
}
