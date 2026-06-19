import type { Covenant, MemoryRecord, MemoryType } from '@/data/memoryGraph';
import { computeSignificance } from './memoryEvolution';
import { detectResonance } from './resonanceEngine';
import type { ResonanceGroup } from './resonanceEngine';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UtteranceIntent =
  | 'vent'              // expressing pain / frustration / overwhelm with no question
  | 'decide'            // asking what to do; weighing two paths
  | 'seek_accountability'  // checking in on a commitment they made
  | 'celebrate'         // sharing a win
  | 'reflect';          // open observation; not distressed, not asking

export type EmotionalSignal =
  | 'distress'          // struggling, scared, exhausted, lost
  | 'hope'              // trying, motivated, excited, pushing
  | 'neutral';          // no strong valence

export interface ParsedUtterance {
  raw: string;
  intent: UtteranceIntent;
  emotional: EmotionalSignal;
  /** Tags extracted from the utterance — matched against the theme-tag vocabulary */
  themeTags: string[];
  /** Raw words from utterance that appear in the memory graph as tags */
  directTags: string[];
  /** Whether the utterance explicitly invokes the covenant / promise */
  invokesCovenant: boolean;
}

export interface RankedMemory {
  memory: MemoryRecord;
  score: number;
  /** How this memory connects to the utterance — used in compose */
  link: 'topic' | 'emotional_twin' | 'evidence' | 'resonance' | 'covenant' | 'pattern';
}

export interface GuidanceResponse {
  /** Top 1–3 memories retrieved; empty only on honest fallback */
  ranked: RankedMemory[];
  /** "You wrote…" / "When you…" — names the memory directly */
  recall: string;
  /** What this memory says about right now */
  connect: string;
  /** Question that opens them further */
  question: string;
  /** Time-aware continuous prose for display — RECALL + twin bridge + CONNECT + QUESTION */
  prose: string;
  intent: UtteranceIntent;
  emotional: EmotionalSignal;
  /** Resonance groups that illuminate this moment */
  resonance: ResonanceGroup[];
  /** false = honest fallback (no memory cleared the relevance floor) */
  hasMemory: boolean;
}

// ── Keyword tables ────────────────────────────────────────────────────────────

const DISTRESS_WORDS = [
  'struggling', 'struggle', 'hard', 'lost', 'tired', 'exhausted', 'failing', 'failed',
  'stuck', 'scared', 'anxious', 'worried', 'overwhelmed', 'can\'t', 'cannot', 'giving up',
  'hopeless', 'worthless', 'broken', 'afraid', 'fear', 'hurting', 'hurt', 'painful',
  'hate', 'dread', 'awful', 'terrible', 'worst', 'miserable', 'defeated', 'behind',
];

const HOPE_WORDS = [
  'trying', 'working on', 'pushing', 'excited', 'motivated', 'inspired', 'hopeful',
  'going to', 'will', 'ready', 'committed', 'determined', 'starting', 'building',
  'moving', 'progressing', 'better', 'improving', 'getting there',
];

const CELEBRATE_WORDS = [
  'did it', 'done', 'finished', 'made it', 'proud', 'accomplished', 'achieved',
  'won', 'succeeded', 'completed', 'hit', 'finally', 'breakthrough', 'crushed it',
];

const DECIDE_WORDS = [
  'should i', 'what should', 'which', 'deciding', 'decision', 'choose',
  'choice', 'not sure if', 'not sure whether',
  'torn between', 'either', 'or should', 'do i', 'worth it',
];

const ACCOUNTABILITY_WORDS = [
  'committed', 'promised', 'said i would', 'said i was going to', 'check in',
  'accountability', 'told myself', 'supposed to', 'meant to', 'was going to',
];

// Theme-tag vocabulary (mirrors memorySkyLayout.ts — single source of truth there;
// duplicated here so this module is pure and testable with no UI imports)
const THEME_TAGS: Record<string, string[]> = {
  becoming:   ['identity', 'becoming', 'transformation', 'commitment', 'proud', 'pride', 'self'],
  building:   ['builder', 'business', 'proof', 'milestone', 'systems', 'success', 'action', 'courage', 'work', 'career'],
  insight:    ['pattern', 'focus', 'energy', 'mindset', 'protection', 'night', 'clarity', 'truth'],
  health:     ['health', 'body', 'rest', 'sleep', 'fitness', 'run', 'training', 'food'],
  discipline: ['discipline', 'consistency', 'resistance', 'start', 'beginning', 'habit', 'routine'],
  resilience: ['resilience', 'return', 'setback', 'drift', 'self-compassion', 'comeback', 'recovery'],
  family:     ['family', 'love', 'connection', 'relationship', 'marriage', 'kids', 'friends'],
  faith:      ['faith', 'prayer', 'grace', 'surrender', 'trust', 'gratitude', 'meaning'],
};

// All theme tags flattened — fast lookup
const ALL_THEME_TAGS = new Set(Object.values(THEME_TAGS).flat());

// ── Utterance parser ──────────────────────────────────────────────────────────

function containsAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

function extractThemeTags(text: string): string[] {
  const found: string[] = [];
  for (const [, tags] of Object.entries(THEME_TAGS)) {
    for (const tag of tags) {
      if (text.includes(tag) && !found.includes(tag)) found.push(tag);
    }
  }
  return found;
}

function extractDirectTags(text: string, memories: MemoryRecord[]): string[] {
  const tagUniverse = new Set<string>();
  memories.forEach((m) => m.tags.forEach((t) => tagUniverse.add(t.toLowerCase())));

  const words = text.split(/\s+/);
  const found: string[] = [];
  for (const tag of tagUniverse) {
    if (text.includes(tag) && !ALL_THEME_TAGS.has(tag) && !found.includes(tag)) {
      found.push(tag);
    }
    // also try individual words matching multi-word tags partially
    for (const w of words) {
      if (w.length > 3 && tag.includes(w) && !found.includes(tag)) {
        found.push(tag);
      }
    }
  }
  return found;
}

/**
 * Parse a free-form utterance into structured signals OATH can retrieve against.
 *
 * Pure function — no side effects. Takes the full memory set only to resolve
 * direct tag matches against the user's personal vocabulary.
 */
export function parseUtterance(
  utterance: string,
  memories: MemoryRecord[] = [],
): ParsedUtterance {
  const text = utterance.toLowerCase().trim();

  // Emotional signal
  const isDistress = containsAny(text, DISTRESS_WORDS);
  const isCelebrate = containsAny(text, CELEBRATE_WORDS);
  const isHope = !isDistress && containsAny(text, HOPE_WORDS);
  const emotional: EmotionalSignal = isDistress ? 'distress' : isCelebrate ? 'hope' : isHope ? 'hope' : 'neutral';

  // Intent
  let intent: UtteranceIntent;
  if (isCelebrate) {
    intent = 'celebrate';
  } else if (containsAny(text, ACCOUNTABILITY_WORDS)) {
    intent = 'seek_accountability';
  } else if (containsAny(text, DECIDE_WORDS)) {
    intent = 'decide';
  } else if (isDistress && !text.includes('?')) {
    intent = 'vent';
  } else {
    intent = 'reflect';
  }

  const invokesCovenant =
    text.includes('promise') ||
    text.includes('covenant') ||
    text.includes('word') ||
    text.includes('oath');

  return {
    raw: utterance,
    intent,
    emotional,
    themeTags: extractThemeTags(text),
    directTags: extractDirectTags(text, memories),
    invokesCovenant,
  };
}

// ── Memory scoring ────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;

// Which memory types pair naturally with each intent / emotional signal
const TYPE_AFFINITY: Record<string, MemoryType[]> = {
  vent:               ['struggle', 'breakthrough', 'truth'],
  decide:             ['truth', 'pattern', 'breakthrough', 'reflection'],
  seek_accountability:['evidence', 'promise', 'breakthrough'],
  celebrate:          ['evidence', 'breakthrough', 'truth'],
  reflect:            ['reflection', 'truth', 'pattern'],
  distress:           ['struggle', 'breakthrough', 'evidence'],  // show the arc
  hope:               ['evidence', 'breakthrough', 'truth'],
};

function typeAffinityScore(mem: MemoryRecord, parsed: ParsedUtterance): number {
  const intentTypes = TYPE_AFFINITY[parsed.intent] ?? [];
  const emotionTypes = TYPE_AFFINITY[parsed.emotional] ?? [];
  const combined = new Set([...intentTypes, ...emotionTypes]);

  if (combined.has(mem.type)) {
    // Higher score if it appears in BOTH lists (doubly relevant)
    const inBoth = intentTypes.includes(mem.type) && emotionTypes.includes(mem.type);
    return inBoth ? 1.0 : 0.65;
  }
  return 0;
}

function tagOverlapScore(mem: MemoryRecord, parsed: ParsedUtterance): number {
  if (mem.type === 'promise') return 0; // covenant handled separately
  const memTags = new Set(mem.tags.map((t) => t.toLowerCase()));
  const queryTags = [...parsed.themeTags, ...parsed.directTags];
  if (queryTags.length === 0) return 0;

  let matches = 0;
  for (const qt of queryTags) if (memTags.has(qt)) matches++;
  return Math.min(1, matches / Math.max(1, queryTags.length) * 2);
}

function recencyBoost(mem: MemoryRecord, now: number): number {
  const days = (now - mem.date) / DAY;
  if (days <= 7)  return 0.15;
  if (days <= 30) return 0.08;
  if (days <= 90) return 0.03;
  return 0;
}

// "Emotional twin" — a struggle that was followed by a breakthrough/evidence
// on overlapping tags. When the user is in distress, this arc is the most
// powerful retrieval: here is the moment you've been here before, and here is
// what came next.
function emotionalTwinScore(
  mem: MemoryRecord,
  parsed: ParsedUtterance,
  allMemories: MemoryRecord[],
): number {
  if (parsed.emotional !== 'distress') return 0;
  if (mem.type !== 'struggle') return 0;

  const memTags = new Set(mem.tags.map((t) => t.toLowerCase()));
  const hasPair = allMemories.some((m) => {
    if (m.id === mem.id) return false;
    if (m.type !== 'breakthrough' && m.type !== 'evidence') return false;
    if (m.date <= mem.date) return false; // must come AFTER the struggle
    const sharedTag = m.tags.some((t) => memTags.has(t.toLowerCase()));
    return sharedTag;
  });

  return hasPair ? 0.5 : 0;
}

function covenantLinkScore(mem: MemoryRecord, covenant: Covenant | null): number {
  if (!covenant) return 0;
  if (mem.linkedPromiseId === covenant.id) return 0.2;
  if (mem.type === 'promise') return 0.1;
  return 0;
}

function linkKind(
  mem: MemoryRecord,
  tagScore: number,
  twinScore: number,
  covScore: number,
  typeScore: number,
  resonanceIds: Set<string>,
): RankedMemory['link'] {
  if (mem.type === 'promise') return 'covenant';
  if (twinScore > 0) return 'emotional_twin';
  if (resonanceIds.has(mem.id)) return 'resonance';
  if (mem.type === 'evidence' || mem.type === 'breakthrough') return 'evidence';
  if (tagScore > 0) return 'topic';
  if (typeScore > 0) return 'pattern';
  return 'topic';
}

// ── Main retrieval function ───────────────────────────────────────────────────

const RELEVANCE_FLOOR = 0.18; // below this score a memory is irrelevant

/**
 * Retrieve the memories most relevant to this utterance and compose a
 * memory-first guidance response.
 *
 * Pure function — no state mutations, no async, no side effects.
 * Takes the full memory graph; returns ranked top memories + composed text.
 *
 * @param utterance  — raw text the user typed or spoke
 * @param covenant   — the user's founding promise
 * @param memories   — full MemoryRecord array from CovenantContext
 */
export function retrieveForGuidance(
  utterance: string,
  covenant: Covenant | null,
  memories: MemoryRecord[],
): GuidanceResponse {
  const now = Date.now();
  const parsed = parseUtterance(utterance, memories);

  // Resonance groups illuminate cross-time echoes — collect IDs in resonance
  const resonanceGroups = detectResonance(memories);
  const resonanceIds = new Set<string>(
    resonanceGroups.flatMap((g) => g.memories.map((m) => m.id)),
  );

  // Score every non-promise memory
  const scored: RankedMemory[] = memories
    .filter((m) => m.type !== 'promise')
    .map((mem) => {
      const tagScore   = tagOverlapScore(mem, parsed)        * 0.38;
      const typeScore  = typeAffinityScore(mem, parsed)      * 0.24;
      const sigScore   = computeSignificance(mem, now)       * 0.18;
      const recScore   = recencyBoost(mem, now)              * 0.10;
      const twinScore  = emotionalTwinScore(mem, parsed, memories);
      const covScore   = covenantLinkScore(mem, covenant)    * 0.10;
      const resBonus   = resonanceIds.has(mem.id) ? 0.08 : 0;

      const score = tagScore + typeScore + sigScore + recScore + twinScore + covScore + resBonus;

      return {
        memory: mem,
        score,
        link: linkKind(mem, tagScore, twinScore, covScore, typeScore, resonanceIds),
      };
    })
    .filter((r) => r.score >= RELEVANCE_FLOOR)
    .sort((a, b) => b.score - a.score);

  // If the utterance invokes the covenant and we have it, surface it first
  if (parsed.invokesCovenant && covenant) {
    const covRecord: MemoryRecord = {
      id: `cov_record_${covenant.id}`,
      type: 'promise',
      title: 'Founding covenant',
      content: covenant.promise,
      date: covenant.createdAt,
      emotionalWeight: 1,
      tags: ['covenant'],
      source: 'covenant',
    };
    scored.unshift({ memory: covRecord, score: 1, link: 'covenant' });
  }

  const top = scored.slice(0, 3);
  const hasMemory = top.length > 0;

  if (!hasMemory) {
    const fallbackConnect = "OATH doesn't have anything from your past that speaks to this yet.";
    const fallbackQuestion = 'What would you want to remember about this moment?';
    return {
      ranked: [],
      recall: '',
      connect: fallbackConnect,
      question: fallbackQuestion,
      prose: `${fallbackConnect}\n\n${fallbackQuestion}`,
      intent: parsed.intent,
      emotional: parsed.emotional,
      resonance: resonanceGroups.slice(0, 2),
      hasMemory: false,
    };
  }

  const primary = top[0];
  const { recall, connect, question } = compose(primary, parsed, top, covenant, now);
  const prose = composeProse(primary, recall, connect, question, memories, now);

  return {
    ranked: top,
    recall,
    connect,
    question,
    prose,
    intent: parsed.intent,
    emotional: parsed.emotional,
    resonance: resonanceGroups.slice(0, 2),
    hasMemory: true,
  };
}

// ── Composer ──────────────────────────────────────────────────────────────────

function excerpt(text: string, max = 100): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

function timeLabel(mem: MemoryRecord, now: number): string {
  const days = Math.round((now - mem.date) / DAY);
  if (days === 0)   return 'Today';
  if (days === 1)   return 'Yesterday';
  if (days < 7)     return `${days} days ago`;
  if (days < 14)    return 'Last week';
  if (days < 30)    return `${Math.round(days / 7)} weeks ago`;
  if (days < 60)    return 'A month ago';
  return `${Math.round(days / 30)} months ago`;
}

function recallLine(mem: MemoryRecord, now = Date.now()): string {
  const when = timeLabel(mem, now);
  const q = excerpt(mem.content);
  switch (mem.type) {
    case 'evidence':     return `${when}, you showed up. You wrote:\n\n"${q}"`;
    case 'struggle':     return `${when}, you were honest. You wrote:\n\n"${q}"`;
    case 'breakthrough': return `${when}, you broke through. You wrote:\n\n"${q}"`;
    case 'truth':        return `${when}, you named this. You said:\n\n"${q}"`;
    case 'reflection':   return `${when}, you said into the dark:\n\n"${q}"`;
    case 'pattern':      return `${when}, you saw this forming. You wrote:\n\n"${q}"`;
    case 'promise':      return `Your word:\n\n"${q}"`;
    default:             return `${when}, you recorded:\n\n"${q}"`;
  }
}

function connectLine(
  primary: RankedMemory,
  parsed: ParsedUtterance,
  all: RankedMemory[],
  covenant: Covenant | null,
): string {
  const { memory: mem, link } = primary;

  if (link === 'emotional_twin') {
    // The most powerful case: you were here before, and you came through it
    return "OATH has seen this version of you before. You moved through it. That is not a small thing.";
  }

  if (link === 'covenant' && covenant) {
    return `This is still the promise. Everything you've built since then answers it.`;
  }

  if (link === 'resonance') {
    return "OATH keeps finding you here. The pattern isn't a failure — it's a signal.";
  }

  // Intent-based connect
  switch (parsed.intent) {
    case 'vent':
      if (mem.type === 'breakthrough') {
        return "The last time this weight showed up, something shifted. OATH is watching for it again.";
      }
      return "OATH is holding this with you. Not as a problem to solve — as a record that matters.";

    case 'decide': {
      const evidencePiece = all.find((r) => r.memory.type === 'evidence' || r.memory.type === 'breakthrough');
      if (evidencePiece) {
        return `Your record already knows what you're capable of. The question is whether you'll trust it.`;
      }
      return `You've faced forks before. Your covenant is the compass — it doesn't answer every question, but it cuts the wrong paths.`;
    }

    case 'seek_accountability':
      return "OATH has been counting. Every instance in this record is a data point, not a verdict.";

    case 'celebrate':
      return "OATH was watching when this happened. This is what the covenant looks like when it's working.";

    case 'reflect':
    default:
      return "OATH keeps this alive. It doesn't expire — it waits for the moment you need it most.";
  }
}

function questionLine(primary: RankedMemory, parsed: ParsedUtterance): string {
  const { memory: mem, link } = primary;

  if (link === 'emotional_twin') {
    return "What's different this time — and what do you already know that you're not saying yet?";
  }

  switch (parsed.intent) {
    case 'vent':
      if (mem.type === 'truth' || mem.type === 'reflection') {
        return "What do you already know is true about this, that you haven't said out loud?";
      }
      return "What does this moment need from you right now — not eventually, right now?";

    case 'decide':
      return "Which choice does the person in your covenant recognize?";

    case 'seek_accountability':
      return "What would it mean to be someone who kept this one?";

    case 'celebrate':
      return "What did this prove about you that you want to remember?";

    case 'reflect':
    default:
      if (mem.type === 'pattern') {
        return "What does seeing this pattern ask of you?";
      }
      return "What does this open up, now that it's out?";
  }
}

function composeProse(
  primary: RankedMemory,
  recall: string,
  connect: string,
  question: string,
  allMemories: MemoryRecord[],
  now: number,
): string {
  const parts: string[] = [recall];

  if (primary.link === 'emotional_twin') {
    const struggle = primary.memory;
    const breakthrough = allMemories.find(
      (m) =>
        m.type === 'breakthrough' &&
        m.date > struggle.date &&
        m.tags.some((t) => struggle.tags.map((s) => s.toLowerCase()).includes(t.toLowerCase())),
    );
    if (breakthrough) {
      const btDays = Math.round((breakthrough.date - struggle.date) / DAY);
      const bridge =
        btDays <= 1 ? 'The next day'
        : btDays < 7 ? `${btDays} days later`
        : `${Math.round(btDays / 7)} weeks later`;
      parts.push(`${bridge}, you recorded a breakthrough:\n\n"${excerpt(breakthrough.content)}"`);
    }
  }

  parts.push(connect);
  parts.push(question);
  return parts.join('\n\n');
}

function compose(
  primary: RankedMemory,
  parsed: ParsedUtterance,
  all: RankedMemory[],
  covenant: Covenant | null,
  now: number,
): { recall: string; connect: string; question: string } {
  return {
    recall: recallLine(primary.memory, now),
    connect: connectLine(primary, parsed, all, covenant),
    question: questionLine(primary, parsed),
  };
}

// ── UI helpers ────────────────────────────────────────────────────────────────

/**
 * True when the utterance should route to the Guidance experience rather than
 * saving as a memory record. Guidance = OATH searches first, then speaks.
 */
export function isGuidanceUtterance(parsed: ParsedUtterance): boolean {
  if (parsed.intent === 'vent') return true;
  if (parsed.intent === 'decide') return true;
  if (parsed.intent === 'seek_accountability') return true;
  if (parsed.intent === 'celebrate') return false;

  const text = parsed.raw.toLowerCase();
  const REQUEST_PHRASES = [
    'help', 'show me', 'what do you see', 'what do you have', 'motivat',
    'remind me', 'guide me', 'need to decide', 'not sure', 'lost',
  ];
  return REQUEST_PHRASES.some((p) => text.includes(p));
}

/**
 * Return the [struggle.id, breakthrough.id] pair for the emotional-twin arc,
 * or null if no twin was found. Used by the canvas to draw the illuminated
 * path between the two stars before OATH speaks.
 */
export function findTwinPair(
  ranked: RankedMemory[],
  allMemories: MemoryRecord[],
): [string, string] | null {
  const twin = ranked.find((r) => r.link === 'emotional_twin');
  if (!twin) return null;

  const struggle = twin.memory;
  const breakthrough = allMemories.find(
    (m) =>
      m.type === 'breakthrough' &&
      m.date > struggle.date &&
      m.tags.some((t) => struggle.tags.map((s) => s.toLowerCase()).includes(t.toLowerCase())),
  );
  return breakthrough ? [struggle.id, breakthrough.id] : null;
}
