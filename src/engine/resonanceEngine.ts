import type { MemoryRecord, MemoryType } from '@/data/memoryGraph';

const DAY = 24 * 60 * 60 * 1000;

export type ResonanceKind =
  | 'fear'        // repeated struggle/anxiety
  | 'breakthrough'// the same kind of winning
  | 'struggle'    // the same wall
  | 'truth'       // the same realization surfacing twice
  | 'identity'    // recurring self-image content
  | 'pattern';    // general tag/theme echo

export interface ResonanceGroup {
  id: string;
  theme: string;             // The echoing concept — a tag or memory type
  memories: MemoryRecord[];  // Sorted oldest → newest
  kind: ResonanceKind;
  strength: number;          // 0–1
  spanDays: number;          // Time between oldest and newest
}

function inferKind(memories: MemoryRecord[]): ResonanceKind {
  const types = memories.map((m) => m.type);
  const count = (t: MemoryType) => types.filter((x) => x === t).length;

  if (count('struggle') > types.length / 2) return 'fear';
  if (count('breakthrough') >= 2) return 'breakthrough';
  if (count('struggle') >= 2) return 'struggle';
  if (count('truth') >= 2) return 'truth';

  const identityTags = ['identity', 'self', 'who i am', 'becoming', 'pride', 'confidence'];
  const hasIdentity = memories.some((m) => m.tags.some((t) => identityTags.includes(t.toLowerCase())));
  if (hasIdentity) return 'identity';

  return 'pattern';
}

/**
 * Detect memories that echo one another across time.
 *
 * Two detection strategies:
 *   1. Tag resonance — same tag appearing across memories ≥7 days apart
 *   2. Type resonance — same high-weight memory type recurring ≥14 days apart
 *
 * Returns groups sorted strongest first. The Mirror uses these to surface
 * what OATH has noticed that the user hasn't yet named.
 */
export function detectResonance(memories: MemoryRecord[]): ResonanceGroup[] {
  const groups: ResonanceGroup[] = [];
  const usedPairs = new Set<string>();

  // ── Strategy 1: Tag resonance ────────────────────────────────
  const tagMap: Record<string, MemoryRecord[]> = {};
  memories.forEach((m) => {
    m.tags.forEach((tag) => {
      if (!tag.trim()) return;
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(m);
    });
  });

  Object.entries(tagMap).forEach(([tag, mems]) => {
    if (mems.length < 2 || mems.length > 8) return;

    const sorted = [...mems].sort((a, b) => a.date - b.date);
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    const spanDays = Math.round((newest.date - oldest.date) / DAY);

    if (spanDays < 7) return;

    const pairKey = `${oldest.id}:${newest.id}`;
    if (usedPairs.has(pairKey)) return;
    usedPairs.add(pairKey);

    const strength = Math.min(1, 0.35 + mems.length * 0.12 + Math.min(spanDays, 60) / 100);

    groups.push({
      id: `res_tag_${tag}_${Date.now()}`,
      theme: tag,
      memories: sorted,
      kind: inferKind(sorted),
      strength,
      spanDays,
    });
  });

  // ── Strategy 2: Type resonance ───────────────────────────────
  const typeMap: Record<string, MemoryRecord[]> = {};
  memories.forEach((m) => {
    if (m.type === 'promise') return;
    if (!typeMap[m.type]) typeMap[m.type] = [];
    typeMap[m.type].push(m);
  });

  Object.entries(typeMap).forEach(([type, mems]) => {
    if (mems.length < 3) return;

    const highWeight = [...mems]
      .filter((m) => m.emotionalWeight >= 0.7)
      .sort((a, b) => a.date - b.date);

    if (highWeight.length < 2) return;

    const oldest = highWeight[0];
    const newest = highWeight[highWeight.length - 1];
    const spanDays = Math.round((newest.date - oldest.date) / DAY);

    if (spanDays < 14) return;

    const pairKey = `${oldest.id}:${newest.id}`;
    if (usedPairs.has(pairKey)) return;
    usedPairs.add(pairKey);

    const strength = Math.min(1, 0.45 + highWeight.length * 0.1 + Math.min(spanDays, 60) / 120);
    const top4 = highWeight.slice(0, 4);

    groups.push({
      id: `res_type_${type}_${Date.now()}`,
      theme: type,
      memories: top4,
      kind: inferKind(top4),
      strength,
      spanDays,
    });
  });

  return groups.sort((a, b) => b.strength - a.strength);
}
