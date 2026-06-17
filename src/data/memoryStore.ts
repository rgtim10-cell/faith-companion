import type { RealmKey } from '@/design/realms';

// ── Memory ────────────────────────────────────────────────────
// What OATH keeps. Created in Communion — the moments a user confides,
// the words they give, the things they ask to be remembered. This is the
// substance of the relationship: OATH does not track tasks, it keeps your
// word and witnesses what mattered.

export type MemoryKind =
  | 'struggle'
  | 'breakthrough'
  | 'promise'
  | 'realization'
  | 'turning_point';

export interface CommunionMemory {
  id: string;
  kind: MemoryKind;
  words: string; // the user's own words, kept verbatim
  realm: RealmKey;
  createdAt: number;
}

export const kindLabel: Record<MemoryKind, string> = {
  struggle: 'Struggle',
  breakthrough: 'Breakthrough',
  promise: 'Promise',
  realization: 'Realization',
  turning_point: 'Turning point',
};

// The five things a user can do in Communion. Not a toolbar — the registers
// of being present with OATH.
export type CommunionVerb = 'confide' | 'commit' | 'mark' | 'ask' | 'pushback';

// What each verb leaves behind. Asking and pushing back create nothing —
// OATH answers or learns, but does not enshrine every exchange.
export const verbMemory: Record<CommunionVerb, { creates: boolean; kind?: MemoryKind }> = {
  confide: { creates: true },
  commit: { creates: true, kind: 'promise' },
  mark: { creates: true },
  ask: { creates: false },
  pushback: { creates: false },
};

/**
 * OATH sensing the nature of what was said. A prototype's intuition — in the
 * real system this is the model's read of the words. It is what lets OATH say
 * "this feels important" rather than asking the user to file it.
 */
export function senseKind(text: string): MemoryKind {
  const t = text.toLowerCase();
  if (/(i will|i'm going to|i am going to|i promise|never again|from now on|i'll)/.test(t)) {
    return 'promise';
  }
  if (/(almost|quit|gave up|giving up|scared|afraid|behind|avoid|can't|cant|struggl|hard|fail|exhaust|lost)/.test(t)) {
    return 'struggle';
  }
  if (/(finally|kept|did it|proud|breakthrough|won|nailed|showed up|stronger)/.test(t)) {
    return 'breakthrough';
  }
  if (/(reali[sz]e|i see now|understand|the truth is|maybe i|i think i)/.test(t)) {
    return 'realization';
  }
  return 'turning_point';
}

// In-session store. Newest first. Created here so the architecture is real;
// future surfaces (The Threshold, the Vault) can read from the same source.
const created: CommunionMemory[] = [];

export function witnessMemory(input: { kind: MemoryKind; words: string; realm: RealmKey }): CommunionMemory {
  const memory: CommunionMemory = {
    id: `mem_${Date.now()}`,
    kind: input.kind,
    words: input.words,
    realm: input.realm,
    createdAt: Date.now(),
  };
  created.unshift(memory);
  return memory;
}

export function getCreatedMemories(): CommunionMemory[] {
  return created;
}
