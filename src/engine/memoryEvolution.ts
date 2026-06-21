import type { MemoryRecord, ReinforcementReason } from '@/data/memoryGraph';

const DAY = 24 * 60 * 60 * 1000;

// ── Significance ───────────────────────────────────────────────

export type SignificanceLevel =
  | 'passing'
  | 'meaningful'
  | 'important'
  | 'foundational'
  | 'defining';

export const SIGNIFICANCE_LABEL: Record<SignificanceLevel, string> = {
  passing:     'Passing',
  meaningful:  'Meaningful',
  important:   'Important',
  foundational:'Foundational',
  defining:    'Defining',
};

export const SIGNIFICANCE_COLOR: Record<SignificanceLevel, string> = {
  passing:     'rgba(255,255,255,0.22)',
  meaningful:  '#93C5FD',
  important:   '#FBBF24',
  foundational:'#F97316',
  defining:    '#D4A853',
};

// ── Current weight (decay + reinforcement) ─────────────────────
//
// Base weight is stored on the record and boosted by reinforcement.
// Decay is applied at read-time via an exponential curve.
// Half-life: ~87 days (k = 0.008). Gentle — not punishing.
// Foundational / promise-type records never decay.

const DECAY_K = 0.008; // ln(2) / 87 days

export function computeCurrentWeight(memory: MemoryRecord, now = Date.now()): number {
  const base = memory.emotionalWeight ?? 0.5;

  if (memory.isFoundational || memory.type === 'promise') return base;

  const lastRef = memory.lastReferencedAt ?? memory.date;
  const daysSince = (now - lastRef) / DAY;

  // Exponential decay: weight * e^(-k * days)
  const decayed = base * Math.exp(-DECAY_K * daysSince);

  // Reinforcement lifts the floor — capped at 10 references
  const refCount = Math.min(memory.referenceCount ?? 0, 10);
  const reinforced = decayed * (1 + refCount * 0.04);

  return Math.min(1, Math.max(0.15, reinforced));
}

// ── Significance level ─────────────────────────────────────────

export function computeSignificance(
  memory: MemoryRecord,
  now = Date.now(),
): number {
  const w = computeCurrentWeight(memory, now);

  // Recency bonus: memories recently referenced feel more alive
  const lastRef = memory.lastReferencedAt;
  const recencyBonus = lastRef
    ? Math.max(0, 0.12 * Math.exp(-0.06 * ((now - lastRef) / DAY)))
    : 0;

  const foundationalBonus = memory.isFoundational ? 0.1 : 0;

  return Math.min(1, w + recencyBonus + foundationalBonus);
}

export function significanceLevel(score: number): SignificanceLevel {
  if (score >= 0.90) return 'defining';
  if (score >= 0.75) return 'foundational';
  if (score >= 0.58) return 'important';
  if (score >= 0.38) return 'meaningful';
  return 'passing';
}

// ── Foundational detection ────────────────────────────────────
//
// Auto-promoted when: high weight + covenant-anchored + seen multiple times.

export function shouldBeFoundational(memory: MemoryRecord): boolean {
  if (memory.type === 'promise') return true;
  if (memory.isFoundational) return true;
  const anchored = !!memory.linkedPromiseId || memory.type === 'breakthrough';
  return anchored && memory.emotionalWeight >= 0.85 && (memory.referenceCount ?? 0) >= 2;
}

// ── Reinforcement patch ────────────────────────────────────────
//
// Returns the fields to merge into the record when reinforced.
// Does not mutate the original — caller applies the patch.

export function reinforcementBoost(
  memory: MemoryRecord,
  reason: ReinforcementReason,
): Partial<MemoryRecord> {
  const count = (memory.referenceCount ?? 0) + 1;
  const now = Date.now();

  // Boost to base emotionalWeight — capped at 1.
  const boostMap: Record<ReinforcementReason, number> = {
    oath_shown:      0.04,
    mirror_selected: 0.06,
    carry_forward:   0.12,
    user_explicit:   0.08,
  };
  const boost = boostMap[reason] ?? 0.04;
  const newWeight = Math.min(1, memory.emotionalWeight + boost);

  const patch: Partial<MemoryRecord> = {
    emotionalWeight: newWeight,
    referenceCount: count,
    lastReferencedAt: now,
  };

  if (reason === 'carry_forward') {
    patch.isCarryForward = true;
  }

  // Update resonanceScore as a composite signal for the Mirror
  patch.resonanceScore = computeSignificance({ ...memory, ...patch }, now);

  return patch;
}

// ── Mirror selection ──────────────────────────────────────────
//
// Returns memories ranked by their evolved current weight.
// Used by the new Mirror builders to surface what has become most alive.

export function selectMirrorMemories(
  memories: MemoryRecord[],
  count = 5,
  now = Date.now(),
): MemoryRecord[] {
  return [...memories]
    .sort((a, b) => computeCurrentWeight(b, now) - computeCurrentWeight(a, now))
    .slice(0, count);
}
