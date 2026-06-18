import type { Covenant, ManifestationFeedback, MemoryRecord } from '@/data/memoryGraph';

const DAY = 24 * 60 * 60 * 1000;

export type OathStateKey =
  | 'watching'
  | 'curious'
  | 'concerned'
  | 'encouraged'
  | 'proud'
  | 'challenging';

export interface OathState {
  key: OathStateKey;
  statement: string;  // One sentence. What OATH sees right now.
  intensity: number;  // 0–1
}

export const OATH_STATE_COLOR: Record<OathStateKey, string> = {
  watching:    'rgba(255,255,255,0.28)',
  curious:     '#93C5FD',
  concerned:   '#F97316',
  encouraged:  '#34D399',
  proud:       '#D4A853',
  challenging: '#F472B6',
};

export const OATH_STATE_GLYPH: Record<OathStateKey, string> = {
  watching:    '○',
  curious:     '◇',
  concerned:   '▽',
  encouraged:  '◆',
  proud:       '◈',
  challenging: '◎',
};

/**
 * Derive OATH's current observational state from the Memory Graph.
 * This is not stored — it is computed fresh each render cycle.
 * The state describes what OATH sees, not what the user should feel.
 */
export function computeOathState(
  memories: MemoryRecord[],
  covenant: Covenant | null,
  feedback: ManifestationFeedback[],
): OathState {
  const now = Date.now();
  const recent14 = memories.filter((m) => m.date > now - 14 * DAY);
  const recent7  = memories.filter((m) => m.date > now - 7 * DAY);

  const recentStruggles = recent14.filter((m) => m.type === 'struggle').length;
  const recentWins      = recent14.filter((m) => m.type === 'breakthrough' || m.type === 'evidence').length;

  const allEvidence     = memories.filter((m) => m.type === 'evidence').length;
  const allBreakthroughs = memories.filter((m) => m.type === 'breakthrough').length;
  const totalWins       = allEvidence + allBreakthroughs;

  const chainLinked = covenant
    ? memories.filter((m) => m.linkedPromiseId === covenant.id)
    : [];

  // Proud: strong chain, consistent wins, recent proof.
  if (chainLinked.length >= 4 && totalWins >= 4 && recentWins >= 1) {
    return {
      key: 'proud',
      statement: `${totalWins} pieces of proof. The covenant is being kept.`,
      intensity: Math.min(1, 0.7 + chainLinked.length * 0.04),
    };
  }

  // Concerned: drift — struggles outweigh wins.
  if (recentStruggles >= 2 && recentStruggles > recentWins + 1) {
    return {
      key: 'concerned',
      statement: `${recentStruggles} struggles in 14 days. OATH is watching this.`,
      intensity: Math.min(1, 0.5 + recentStruggles * 0.08),
    };
  }

  // Encouraged: momentum building.
  if (recentWins >= 2) {
    return {
      key: 'encouraged',
      statement: `Something is building. OATH can see it.`,
      intensity: Math.min(1, 0.5 + recentWins * 0.1),
    };
  }

  // Challenging: record is strong, but quiet lately — ready to be pushed.
  if (totalWins >= 6 && recent7.length < 2) {
    return {
      key: 'challenging',
      statement: `The record is strong. OATH wants to know what comes next.`,
      intensity: 0.6,
    };
  }

  // Curious: diverse memory types forming — a pattern is emerging.
  if (memories.length >= 4) {
    const types = new Set(memories.map((m) => m.type));
    if (types.size >= 4) {
      return {
        key: 'curious',
        statement: `A pattern is taking shape. OATH is paying attention.`,
        intensity: Math.min(0.8, 0.4 + types.size * 0.06),
      };
    }
  }

  // Watching: baseline. Not enough signal yet, or neutral activity.
  return {
    key: 'watching',
    statement: memories.length > 0
      ? `OATH holds ${memories.length} memories. Still listening.`
      : `OATH is listening.`,
    intensity: 0.3,
  };
}
