import type { Covenant, ManifestationType, MemoryRecord, MemoryType } from '@/data/memoryGraph';
import type { OathState } from '@/engine/oathState';
import type {
  CuratedContextFeedback,
  CuratedContextItem,
} from '@/data/curatedContext';
import { CURATED_LIBRARY } from '@/data/curatedContext';

const DAY = 24 * 60 * 60 * 1000;

// ── Selection Result ──────────────────────────────────────────────

export interface SelectedContext {
  item: CuratedContextItem;
  oathExplanation: string;  // Dynamic — references the user's actual data
  score: number;
}

// ── Scoring ───────────────────────────────────────────────────────
// Five dimensions, weighted. Threshold guards against weak matches.
// External context must earn its place — silence beats a poor fit.

const SCORE_THRESHOLD = 0.55;

interface SelectionComponents {
  oathStateMatch: number;        // 1.0 if state matches, 0 otherwise
  manifestationMatch: number;    // 1.0 if type matches, 0 otherwise
  memoryTypeMatch: number;       // 1.0 dominant match, 0.5 any match, 0 none
  tagMatch: number;              // intersection ratio 0–1
  baseRelevance: number;         // item's base relevance score
}

function scoreItem(
  item: CuratedContextItem,
  oathState: OathState,
  manifestationType: ManifestationType,
  dominantMemoryType: MemoryType | null,
  userTags: string[],
  feedback: CuratedContextFeedback[],
): number {
  // Items with 'not_relevant' feedback are excluded entirely
  const notRelevant = feedback.some((f) => f.itemId === item.id && f.reaction === 'not_relevant');
  if (notRelevant) return 0;

  // 'saved' feedback boosts the item for this user
  const saved = feedback.some((f) => f.itemId === item.id && f.reaction === 'saved');
  const feedbackMultiplier = saved ? 1.25 : 1.0;

  const components: SelectionComponents = {
    oathStateMatch: item.matchOathStates.includes(oathState.key) ? 1.0 : 0,
    manifestationMatch: item.matchManifestationTypes.includes(manifestationType) ? 1.0 : 0,
    memoryTypeMatch:
      dominantMemoryType && item.matchMemoryTypes.includes(dominantMemoryType) ? 1.0
      : userTags.some((t) => item.matchTags.includes(t)) ? 0.5
      : 0,
    tagMatch:
      item.matchTags.length === 0
        ? 0
        : Math.min(1, userTags.filter((t) => item.matchTags.includes(t)).length / item.matchTags.length),
    baseRelevance: item.relevanceScore,
  };

  const raw =
    components.oathStateMatch   * 0.30 +
    components.manifestationMatch * 0.25 +
    components.memoryTypeMatch   * 0.20 +
    components.tagMatch          * 0.15 +
    components.baseRelevance     * 0.10;

  return Math.min(1, raw * feedbackMultiplier);
}

// ── Dominant Memory Type ──────────────────────────────────────────

function getDominantMemoryType(memories: MemoryRecord[]): MemoryType | null {
  const counts: Partial<Record<MemoryType, number>> = {};
  memories.forEach((m) => {
    if (m.type === 'promise') return;
    counts[m.type] = (counts[m.type] ?? 0) + 1;
  });
  const entries = Object.entries(counts) as [MemoryType, number][];
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ── Explanation Generator ─────────────────────────────────────────
// OATH's voice: specific, observational, referencing real data.
// Never generic. Never motivational. Just what OATH actually sees.

function generateExplanation(
  item: CuratedContextItem,
  oathState: OathState,
  manifestationType: ManifestationType,
  memories: MemoryRecord[],
  dominantMemoryType: MemoryType | null,
  covenant: Covenant | null,
): string {
  const now = Date.now();
  const recentStruggles = memories.filter((m) => m.type === 'struggle' && m.date > now - 21 * DAY).length;
  const recentBreakthroughs = memories.filter((m) => m.type === 'breakthrough' && m.date > now - 21 * DAY).length;
  const totalEvidence = memories.filter((m) => m.type === 'evidence').length;
  const dominantCount = dominantMemoryType
    ? memories.filter((m) => m.type === dominantMemoryType).length
    : 0;

  // Recovery content during drift/concerned
  if (item.emotionalPurpose === 'recovery' && oathState.key === 'concerned') {
    return recentStruggles >= 3
      ? `${recentStruggles} struggles in the last three weeks. This is about returning, not restarting.`
      : 'The record shows difficulty. This reframes what that difficulty means.';
  }

  // Burnout-specific
  if (item.id === 'ctx_burnout' && recentStruggles >= 2) {
    return `OATH chose this because the record shows strain. This distinguishes productive strain from depletion.`;
  }

  // Identity/becoming content
  if (item.emotionalPurpose === 'learning' && item.id === 'ctx_identity_change') {
    return totalEvidence >= 2
      ? `${totalEvidence} pieces of evidence in the record. This is about what that evidence means for who you are becoming.`
      : covenant
      ? `The record is still forming. This is about what happens before certainty arrives.`
      : 'This is about the gap between identity and proof — and why the identity comes first.';
  }

  // Confidence content with evidence
  if (item.emotionalPurpose === 'confidence' && totalEvidence >= 2) {
    return `${totalEvidence} evidence records exist. OATH chose this because the practice it describes is what you're already doing.`;
  }

  // Focus content with reflection dominant
  if (item.emotionalPurpose === 'focus' && dominantMemoryType === 'reflection') {
    return `${dominantCount} reflections in the record. OATH chose this because the pattern of observation you have is rare — this is about protecting what makes it possible.`;
  }

  // Discipline/freedom for breakthrough-heavy users
  if (item.id === 'ctx_discipline_freedom' && dominantMemoryType === 'breakthrough') {
    return `${dominantCount} breakthroughs on record. OATH chose this because the discipline behind those breakthroughs deserves to be named.`;
  }

  // Return rate for struggle-heavy periods
  if (item.id === 'ctx_return_rate' && recentStruggles > recentBreakthroughs) {
    return `${recentStruggles} struggles, ${recentBreakthroughs} breakthroughs. The return rate is what the record is actually measuring.`;
  }

  // Motivation myth for drift state
  if (item.id === 'ctx_motivation_myth' && manifestationType === 'drift') {
    return 'The record shows a pause. This is about what causes the start — not what sustains it.';
  }

  // Before ready for early-stage users
  if (item.id === 'ctx_before_ready') {
    const covenantAgeDays = covenant ? Math.floor((now - covenant.createdAt) / DAY) : null;
    return covenantAgeDays !== null && covenantAgeDays < 30
      ? `The record is ${covenantAgeDays} days old. OATH chose this because the early record is where this lesson matters most.`
      : 'OATH chose this because the evidence shows movement before certainty — which is exactly what this describes.';
  }

  // Sleep/recovery data
  if (item.id === 'ctx_sleep_recovery') {
    return 'OATH chose this because the record shows decision-making under strain. This is the data behind what that costs.';
  }

  // Hard conversations
  if (item.id === 'ctx_hard_conversations') {
    return 'The record contains avoidance. This gives a specific practice — not a principle, a step.';
  }

  // Fallback — still specific to the pattern
  if (dominantMemoryType && dominantCount >= 3) {
    return `${dominantCount} ${dominantMemoryType} records in the archive. OATH chose this because it speaks directly to that pattern.`;
  }

  return `OATH chose this because it fits what the record shows — not because it is generally relevant.`;
}

// ── Main Selection ────────────────────────────────────────────────
// Rules:
// 1. max 1 item per experience (single return)
// 2. external context supports the user's story; it never replaces it
// 3. if no strong match, return null — silence is preferable

export function selectContext(
  oathState: OathState,
  manifestationType: ManifestationType,
  memories: MemoryRecord[],
  covenant: Covenant | null,
  feedback: CuratedContextFeedback[],
): SelectedContext | null {
  if (memories.length < 2) return null;

  const dominantMemoryType = getDominantMemoryType(memories);
  const userTags = [...new Set(memories.flatMap((m) => m.tags))];

  const scored = CURATED_LIBRARY.map((item) => ({
    item,
    score: scoreItem(item, oathState, manifestationType, dominantMemoryType, userTags, feedback),
  }))
    .filter(({ score }) => score >= SCORE_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  const top = scored[0];
  if (!top) return null;

  const explanation = generateExplanation(
    top.item,
    oathState,
    manifestationType,
    memories,
    dominantMemoryType,
    covenant,
  );

  return {
    item: top.item,
    oathExplanation: explanation,
    score: top.score,
  };
}
