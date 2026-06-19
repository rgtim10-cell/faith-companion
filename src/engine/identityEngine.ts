import type { Covenant, MemoryRecord, MemoryType } from '@/data/memoryGraph';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TraitKind = 'strength' | 'struggle';
export type Trajectory = 'emerging' | 'stable' | 'strengthening' | 'fading';

export interface IdentityTrait {
  id: string;
  label: string;
  kind: TraitKind;
  /** 0–1. Surface at ≥ 0.28; Level 3 Mirror at ≥ 0.50. */
  confidence: number;
  evidenceCount: number;
  /** Days between oldest and newest supporting memory. */
  spanDays: number;
  trajectory: Trajectory;
  /** IDs of memories that support this trait — every claim is traceable. */
  evidenceIds: string[];
  /** OATH's observational language — never declarative, always from the record. */
  oathObservation: string;
}

export interface CovenantAlignment {
  /** Memory IDs where behavior supports what was promised. */
  alignedIds: string[];
  /** Memory IDs where behavior diverges from the promise. */
  driftIds: string[];
  /** 0–1: proportion of meaningful actions that align with the covenant. */
  alignmentScore: number;
  recentTrend: 'aligning' | 'drifting' | 'stable';
  oathObservation: string;
}

export interface IdentityProfile {
  /** Strengths sorted confidence-descending, above surface threshold. */
  strengths: IdentityTrait[];
  /** Struggles sorted confidence-descending, above surface threshold. */
  struggles: IdentityTrait[];
  covenantAlignment: CovenantAlignment;
  dominantStrength: IdentityTrait | null;
  dominantStruggle: IdentityTrait | null;
  /**
   * 1 = surface a memory (< 14 days or < 5 memories — too early).
   * 2 = surface a pattern (resonance / repeat behavior).
   * 3 = surface an identity observation (confidence ≥ 0.50, span ≥ 30 days, evidence ≥ 5).
   */
  mirrorLevel: 1 | 2 | 3;
  /** Null if mirrorLevel < 3. The text the Mirror speaks at Level 3. */
  mirrorObservation: string | null;
}

/**
 * Options that let the calling context suppress or penalize specific traits
 * based on prior user feedback. The engine remains pure — no state mutation.
 *
 * suppressedTraitIds: omit these traits entirely (user said "don't say this again").
 * challengedTraitIds: apply 0.70× confidence penalty (user said "you're wrong").
 *   A challenged trait may still surface if evidence is strong, but at lower confidence.
 *   A very low-confidence trait may fall below SURFACE_THRESHOLD and disappear entirely.
 */
export interface IdentityOptions {
  suppressedTraitIds?: string[];
  challengedTraitIds?: string[];
}

// ── Trait signatures ──────────────────────────────────────────────────────────
// Each signature defines what evidence counts toward a trait.
// typeWeights: multiplier applied to base support. 0 = type doesn't contribute.
// Tags and contentKeywords are matched against memory.tags and memory.content.

interface TraitSignature {
  id: string;
  label: string;
  kind: TraitKind;
  tags: string[];
  typeWeights: Partial<Record<MemoryType, number>>;
  contentKeywords: string[];
}

const SIGNATURES: TraitSignature[] = [
  // ── Strengths ──────────────────────────────────────────────────────────────
  {
    id: 'consistency',
    label: 'Consistency',
    kind: 'strength',
    tags: ['discipline', 'routine', 'habit', 'consistency', 'daily', 'streak', 'showing up'],
    typeWeights: { evidence: 1.3, breakthrough: 1.0, reflection: 0.5 },
    contentKeywords: ['again', 'every day', 'kept going', 'in a row', 'showed up', 'daily', 'continued', 'streak'],
  },
  {
    id: 'courage',
    label: 'Courage',
    kind: 'strength',
    tags: ['courage', 'action', 'bold', 'decisive', 'risk', 'brave'],
    typeWeights: { evidence: 1.2, breakthrough: 1.3 },
    contentKeywords: ['despite', 'anyway', 'fear', 'scared', 'did it', 'showed up', 'stepped', 'room', 'hard conversation'],
  },
  {
    id: 'resilience',
    label: 'Resilience',
    kind: 'strength',
    tags: ['resilience', 'recovery', 'comeback', 'return', 'self-compassion', 'setback'],
    typeWeights: { breakthrough: 1.4, truth: 0.9, reflection: 0.7, struggle: 0.6 },
    contentKeywords: ['came back', 'returned', 'after the', 'still showed', 'recovered', 'didn\'t stay', 'not the end', 'back anyway'],
  },
  {
    id: 'honesty',
    label: 'Honesty',
    kind: 'strength',
    tags: ['truth', 'honest', 'vulnerable', 'real', 'acknowledge', 'admit', 'clarity'],
    typeWeights: { truth: 1.5, reflection: 1.0, pattern: 0.8 },
    contentKeywords: ['honest', 'truth', 'admit', 'acknowledge', 'real', 'not pretending', 'say it', 'have to name'],
  },
  {
    id: 'building',
    label: 'The Builder',
    kind: 'strength',
    tags: ['builder', 'business', 'systems', 'milestone', 'proof', 'work', 'career', 'create', 'ship'],
    typeWeights: { evidence: 1.3, breakthrough: 1.1 },
    contentKeywords: ['built', 'created', 'shipped', 'launched', 'finished', 'completed', 'signed', 'delivered', 'released'],
  },
  {
    id: 'self_awareness',
    label: 'Self-Awareness',
    kind: 'strength',
    tags: ['pattern', 'clarity', 'mindset', 'insight', 'notice', 'realize'],
    typeWeights: { truth: 1.5, pattern: 1.3, reflection: 1.0 },
    contentKeywords: ['noticed', 'realize', 'see the pattern', 'understand now', 'i know', 'i see', 'i have learned'],
  },
  {
    id: 'persistence',
    label: 'Persistence',
    kind: 'strength',
    tags: ['persistence', 'kept going', 'not giving up', 'continue', 'through', 'endurance'],
    typeWeights: { breakthrough: 1.3, evidence: 1.0 },
    contentKeywords: ['kept going', 'did not quit', 'continued', 'despite', 'anyway', 'still here', 'did not stop'],
  },

  // ── Struggles ─────────────────────────────────────────────────────────────
  {
    id: 'avoidance',
    label: 'Avoidance',
    kind: 'struggle',
    tags: ['procrastination', 'avoidance', 'delay', 'resistance', 'fear'],
    typeWeights: { struggle: 1.4, pattern: 1.1 },
    contentKeywords: ['avoided', 'not ready', 'put off', 'procrastinated', 'waiting', 'not yet', 'almost started'],
  },
  {
    id: 'self_doubt',
    label: 'Self-Doubt',
    kind: 'struggle',
    tags: ['doubt', 'imposter', 'self-doubt', 'fear of failure', 'not enough'],
    typeWeights: { struggle: 1.3, truth: 0.8 },
    contentKeywords: ['doubt', 'not sure i can', 'who am i', 'don\'t deserve', 'imposter', 'not enough', 'what if i fail', 'fraud'],
  },
  {
    id: 'inconsistency',
    label: 'Inconsistency',
    kind: 'struggle',
    tags: ['drift', 'inconsistency', 'missed', 'off track', 'slipping', 'setback'],
    typeWeights: { struggle: 1.3, pattern: 1.0 },
    contentKeywords: ['missed', 'slipped', 'off track', 'inconsistent', 'not following through', 'fell off', 'lost it again'],
  },
  {
    id: 'isolation',
    label: 'Isolation',
    kind: 'struggle',
    tags: ['isolation', 'alone', 'disconnected', 'withdrawn'],
    typeWeights: { struggle: 1.3, reflection: 0.7 },
    contentKeywords: ['alone', 'isolated', 'pulling away', 'not reaching out', 'by myself', 'disconnected', 'withdrew'],
  },
  {
    id: 'perfectionism',
    label: 'Perfectionism',
    kind: 'struggle',
    tags: ['perfectionism', 'paralysis', 'not good enough', 'fear of failure'],
    typeWeights: { struggle: 1.2, pattern: 1.0 },
    contentKeywords: ['perfect', 'not ready', 'needs to be right', "can't start", 'paralyzed', 'waiting until', 'restart'],
  },
];

// ── Evidence scoring ──────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;
const SURFACE_THRESHOLD = 0.28;
const LEVEL3_CONFIDENCE = 0.50;
const LEVEL3_SPAN_DAYS = 30;
const LEVEL3_MIN_EVIDENCE = 5;
const MIN_EVIDENCE = 3;
const MIN_SPAN_DAYS = 7;
const CHALLENGE_PENALTY = 0.70;

// Confidence tier thresholds — control the epistemic register of OATH's language.
// Low (< 0.42):  "The record may be suggesting..."
// Medium (< 0.60): "OATH has noticed..."
// High (≥ 0.60):  "This pattern has become difficult to ignore."
const CONFIDENCE_MEDIUM = 0.42;
const CONFIDENCE_HIGH = 0.60;

interface EvidencePoint {
  id: string;
  support: number; // 0–1 contribution
  date: number;
}

function scoreMemoryForTrait(mem: MemoryRecord, sig: TraitSignature): number {
  if (mem.type === 'promise') return 0;

  const typeMultiplier = sig.typeWeights[mem.type] ?? 0;
  if (typeMultiplier === 0) return 0;

  // Tag overlap: what fraction of signature tags appear in this memory's tags?
  const memTagsLower = mem.tags.map((t) => t.toLowerCase());
  const tagHits = sig.tags.filter((t) => memTagsLower.includes(t)).length;
  const tagScore = Math.min(1, tagHits / Math.max(1, sig.tags.length) * 3);

  // Content keywords: capped contribution from plain-text matching
  const contentLower = mem.content.toLowerCase();
  const contentHits = sig.contentKeywords.filter((k) => contentLower.includes(k)).length;
  const contentScore = Math.min(1, contentHits / 2);

  const rawSupport = (tagScore * 0.65 + contentScore * 0.35) * typeMultiplier * mem.emotionalWeight;
  return rawSupport;
}

function collectEvidence(memories: MemoryRecord[], sig: TraitSignature): EvidencePoint[] {
  return memories
    .map((m) => ({ id: m.id, support: scoreMemoryForTrait(m, sig), date: m.date }))
    .filter((e) => e.support > 0.05);
}

// ── Trajectory ────────────────────────────────────────────────────────────────

function computeTrajectory(evidence: EvidencePoint[], now: number): Trajectory {
  if (evidence.length === 0) return 'stable';

  const recent = evidence.filter((e) => now - e.date <= 30 * DAY);
  const older = evidence.filter((e) => now - e.date > 30 * DAY);

  if (older.length === 0) return 'emerging';

  // Normalize: recent count vs. expected count from same number of days
  const oldestDate = Math.min(...evidence.map((e) => e.date));
  const totalDays = (now - oldestDate) / DAY;
  const historicalDays = totalDays - 30;
  if (historicalDays <= 0) return 'emerging';

  const recentRate = recent.length / 30;
  const olderRate = older.length / historicalDays;

  if (olderRate === 0) return 'emerging';
  const ratio = recentRate / olderRate;

  if (ratio >= 1.3) return 'strengthening';
  if (ratio <= 0.4) return 'fading';
  return 'stable';
}

// ── Trait observation strings ─────────────────────────────────────────────────
// Never "you are X." Always "OATH has noticed / the record suggests / this appears."
// Opening phrase is keyed to confidence tier — sets the epistemic register before
// the trajectory-specific body lands.

function traitObservation(
  sig: TraitSignature,
  count: number,
  spanDays: number,
  trajectory: Trajectory,
  confidence: number,
): string {
  const c = count;
  const s = spanDays;

  // The opening phrase communicates how certain OATH is — not a verdict, a calibrated observation.
  let opening: string;
  if (confidence < CONFIDENCE_MEDIUM) {
    opening = 'The record may be suggesting something.';
  } else if (confidence < CONFIDENCE_HIGH) {
    opening = 'OATH has noticed something.';
  } else {
    opening = 'This pattern has become difficult to ignore.';
  }

  if (sig.kind === 'strength') {
    switch (trajectory) {
      case 'emerging':
        return `${opening} Not what you said — what you did. ${sig.label} is beginning to appear with a frequency that OATH cannot dismiss.`;
      case 'strengthening':
        return `${opening} ${sig.label} has appeared across ${c} separate moments, and OATH has watched it grow stronger over the last ${s} days. This is no longer a coincidence.`;
      case 'stable':
        return `${opening} ${sig.label} keeps appearing — not in what you claim, but in what you do when it is hard. The record now says this ${c} times.`;
      case 'fading':
        return `${opening} ${sig.label} appeared consistently across the record — and recently, less so. OATH is watching this.`;
    }
  } else {
    switch (trajectory) {
      case 'emerging':
        return `${opening} ${sig.label} is appearing — not once, but repeatedly. Worth paying attention to.`;
      case 'strengthening':
        return `${opening} ${sig.label} has appeared across ${c} moments, spanning ${s} days. OATH is not judging — but OATH cannot look away.`;
      case 'stable':
        return `${opening} ${sig.label} is a recurring presence in the record. OATH has found it ${c} times across ${s} days. Not a verdict. A pattern that wants to be seen.`;
      case 'fading':
        return `${opening} ${sig.label} was present earlier in the record — and recently, it has appeared less. The record suggests something is shifting.`;
    }
  }
}

// ── Build a single trait ──────────────────────────────────────────────────────

function buildTrait(
  sig: TraitSignature,
  memories: MemoryRecord[],
  now: number,
  isChallenged = false,
): IdentityTrait | null {
  const evidence = collectEvidence(memories, sig);
  if (evidence.length < MIN_EVIDENCE) return null;

  const oldest = Math.min(...evidence.map((e) => e.date));
  const newest = Math.max(...evidence.map((e) => e.date));
  const spanDays = Math.round((newest - oldest) / DAY);
  if (spanDays < MIN_SPAN_DAYS) return null;

  const avgSupport = evidence.reduce((sum, e) => sum + e.support, 0) / evidence.length;
  const evidenceFactor = Math.min(1, evidence.length / 8);
  const spanFactor = Math.min(1, spanDays / 45);

  // Apply challenge penalty BEFORE the surface-threshold check so that a user
  // correction can suppress a marginal trait while a genuinely strong one still
  // surfaces — at reduced confidence.
  const rawConfidence = avgSupport * 0.45 + evidenceFactor * 0.35 + spanFactor * 0.20;
  const confidence = rawConfidence * (isChallenged ? CHALLENGE_PENALTY : 1.0);
  if (confidence < SURFACE_THRESHOLD) return null;

  const trajectory = computeTrajectory(evidence, now);
  const evidenceIds = evidence
    .sort((a, b) => b.support - a.support)
    .slice(0, 6)
    .map((e) => e.id);

  return {
    id: sig.id,
    label: sig.label,
    kind: sig.kind,
    confidence,
    evidenceCount: evidence.length,
    spanDays,
    trajectory,
    evidenceIds,
    oathObservation: traitObservation(sig, evidence.length, spanDays, trajectory, confidence),
  };
}

// ── Covenant alignment ────────────────────────────────────────────────────────

function extractCovenantKeywords(promise: string): string[] {
  const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'is', 'am', 'are', 'was', 'i', 'my', 'me', 'who', 'that', 'this', 'with',
    'be', 'one', 'will', 'want', 'day', 'time', 'kind', 'someone',
  ]);
  return promise
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
    .map((w) => {
      // Reduce to a root form so inflected variants match via substring (build→building, becom→becoming)
      if (w.endsWith('ing') && w.length > 6) return w.slice(0, -3);
      if (w.endsWith('tion') && w.length > 7) return w.slice(0, -4);
      if (w.endsWith('ed') && w.length > 5) return w.slice(0, -2);
      if (w.endsWith('s') && w.length > 5) return w.slice(0, -1);
      if (w.endsWith('e') && w.length > 5) return w.slice(0, -1);
      return w;
    });
}

function buildCovenantAlignment(
  covenant: Covenant,
  memories: MemoryRecord[],
  now: number,
): CovenantAlignment {
  const baseKeywords = extractCovenantKeywords(covenant.promise);
  // Also draw on the promise memory's tags — they capture themes the text may not spell out.
  const promiseMem = memories.find((m) => m.type === 'promise');
  const tagKeywords = promiseMem ? promiseMem.tags.map((t) => t.toLowerCase()) : [];
  const keywords = [...new Set([...baseKeywords, ...tagKeywords])];

  const score = (mem: MemoryRecord): number => {
    const textLower = (mem.content + ' ' + mem.tags.join(' ')).toLowerCase();
    const hits = keywords.filter((kw) => textLower.includes(kw)).length;
    return Math.min(1, hits / Math.max(1, keywords.length) * 3) * mem.emotionalWeight;
  };

  const alignedIds: string[] = [];
  const driftIds: string[] = [];

  memories
    .filter((m) => m.type !== 'promise')
    .forEach((m) => {
      const s = score(m);
      if ((m.type === 'evidence' || m.type === 'breakthrough') && s >= 0.15) {
        alignedIds.push(m.id);
      } else if (m.type === 'struggle' && s < 0.1) {
        driftIds.push(m.id);
      }
    });

  const actionable = memories.filter(
    (m) => m.type === 'evidence' || m.type === 'breakthrough' || m.type === 'struggle',
  );
  const alignmentScore =
    actionable.length === 0
      ? 0.5
      : Math.min(1, alignedIds.length / Math.max(1, actionable.length));

  // Recent trend: compare aligned/drift ratios in last 30 days vs. overall
  const recent30 = memories.filter((m) => now - m.date <= 30 * DAY);
  const recentAligned = recent30.filter((m) => alignedIds.includes(m.id)).length;
  const recentDrift = recent30.filter((m) => driftIds.includes(m.id)).length;
  const recentActionable = recent30.filter(
    (m) => m.type === 'evidence' || m.type === 'breakthrough' || m.type === 'struggle',
  ).length;

  let recentTrend: 'aligning' | 'drifting' | 'stable' = 'stable';
  if (recentActionable > 0) {
    const recentRatio = recentAligned / recentActionable;
    if (recentRatio > alignmentScore + 0.15) recentTrend = 'aligning';
    else if (recentRatio < alignmentScore - 0.15) recentTrend = 'drifting';
  }

  let oathObservation: string;
  if (recentTrend === 'drifting') {
    oathObservation = `You made a promise. The recent record is showing distance from it — not failure, but drift. OATH has been watching the gap widen.`;
  } else if (recentTrend === 'aligning') {
    oathObservation = `What you promised and what you have done are beginning to tell the same story. The record is aligning. OATH has counted ${alignedIds.length} moments of evidence.`;
  } else if (alignmentScore >= 0.55) {
    oathObservation = `Your word and your record are pointing in the same direction. OATH has found ${alignedIds.length} moments where you showed up exactly as you said you would.`;
  } else {
    oathObservation = `The covenant exists in the record. OATH can see it in ${alignedIds.length} separate moments where you moved toward it.`;
  }

  return { alignedIds, driftIds, alignmentScore, recentTrend, oathObservation };
}

// ── Mirror observation ────────────────────────────────────────────────────────
// Called only when mirrorLevel === 3. Selects the most significant observation
// and composes it as a hook/body/pivot structure for ManifestationField.

function composeMirrorObservation(
  dominant: IdentityTrait,
  alignment: CovenantAlignment,
  covenant: Covenant | null,
): string {
  // For the mirror, we compose a multi-paragraph observation.
  // This feeds into ManifestationField's `hook` field (the body is empty, pivot is the question).
  const { label, kind, trajectory, evidenceCount, spanDays, oathObservation } = dominant;

  // Opening: from the record
  const hook = oathObservation;

  // Bridge: what this means relative to the covenant
  let bridge = '';
  if (kind === 'strength' && alignment.recentTrend === 'aligning' && covenant) {
    bridge = `This is not separate from what you promised. It is the evidence of it.`;
  } else if (kind === 'struggle' && trajectory === 'fading') {
    bridge = `The record also shows something else: recently, this has appeared less. Something is shifting.`;
  } else if (kind === 'struggle' && (trajectory === 'stable' || trajectory === 'strengthening')) {
    bridge = `OATH is not naming this as who you are. OATH is naming it as something the record keeps returning to — and that pattern deserves to be seen.`;
  } else if (kind === 'strength' && trajectory === 'strengthening') {
    bridge = `The record counts it ${evidenceCount} times. Across ${spanDays} days. That is not personality. That is practice.`;
  }

  return [hook, bridge].filter(Boolean).join('\n\n');
}

// ── Mirror level ──────────────────────────────────────────────────────────────

function computeMirrorLevel(
  memories: MemoryRecord[],
  strengths: IdentityTrait[],
  struggles: IdentityTrait[],
  now: number,
): 1 | 2 | 3 {
  const nonPromise = memories.filter((m) => m.type !== 'promise');
  if (nonPromise.length < 5) return 1;

  const oldest = Math.min(...nonPromise.map((m) => m.date));
  const spanDays = (now - oldest) / DAY;
  if (spanDays < 14) return 1;

  const allTraits = [...strengths, ...struggles];
  const level3Candidate = allTraits.find(
    (t) =>
      t.confidence >= LEVEL3_CONFIDENCE &&
      t.spanDays >= LEVEL3_SPAN_DAYS &&
      t.evidenceCount >= LEVEL3_MIN_EVIDENCE,
  );

  return level3Candidate ? 3 : 2;
}

// ── Top-level function ────────────────────────────────────────────────────────

/**
 * Derive an observed identity profile from the user's memory record.
 *
 * Pure function — no mutations, no async, no side effects.
 * Every trait is traceable to specific memory IDs via evidenceIds.
 * OATH language is observational throughout: "the record suggests" — never "you are."
 *
 * Safeguards:
 * - Minimum 3 supporting memories before any trait is surfaced
 * - Minimum 7-day span (no identity claim from a single week)
 * - Confidence ≥ 0.28 to appear; ≥ 0.50 for Level 3 Mirror
 * - Suppressed traits are omitted entirely — OATH can still use the memories,
 *   but will not phrase that identity observation to the user again
 * - Challenged traits have 0.70× confidence — may still surface if evidence is
 *   strong enough, but at a lower register; user correction is respected
 * - Struggles presented with fading/stable/strengthening nuance — never as verdict
 */
export function buildIdentityProfile(
  covenant: Covenant | null,
  memories: MemoryRecord[],
  options: IdentityOptions = {},
): IdentityProfile {
  const { suppressedTraitIds = [], challengedTraitIds = [] } = options;
  const now = Date.now();

  const traits: IdentityTrait[] = SIGNATURES
    .filter((sig) => !suppressedTraitIds.includes(sig.id))
    .map((sig) => buildTrait(sig, memories, now, challengedTraitIds.includes(sig.id)))
    .filter((t): t is IdentityTrait => t !== null)
    .sort((a, b) => b.confidence - a.confidence);

  const strengths = traits.filter((t) => t.kind === 'strength');
  const struggles = traits.filter((t) => t.kind === 'struggle');

  const covenantAlignment = covenant
    ? buildCovenantAlignment(covenant, memories, now)
    : { alignedIds: [], driftIds: [], alignmentScore: 0.5, recentTrend: 'stable' as const, oathObservation: '' };

  const dominantStrength = strengths[0] ?? null;
  const dominantStruggle = struggles[0] ?? null;

  const mirrorLevel = computeMirrorLevel(memories, strengths, struggles, now);

  let mirrorObservation: string | null = null;
  if (mirrorLevel === 3) {
    // Choose what the Mirror speaks: prefer a strengthening strength, then drift observation,
    // then fading struggle (positive momentum), then the dominant trait.
    const primary =
      strengths.find((t) => t.trajectory === 'strengthening' && t.confidence >= LEVEL3_CONFIDENCE) ??
      struggles.find((t) => t.trajectory === 'fading' && t.confidence >= LEVEL3_CONFIDENCE) ??
      ((dominantStrength?.confidence ?? 0) >= LEVEL3_CONFIDENCE ? dominantStrength : null) ??
      ((dominantStruggle?.confidence ?? 0) >= LEVEL3_CONFIDENCE ? dominantStruggle : null);

    if (primary) {
      mirrorObservation = composeMirrorObservation(primary, covenantAlignment, covenant);
    }
  }

  return {
    strengths,
    struggles,
    covenantAlignment,
    dominantStrength,
    dominantStruggle,
    mirrorLevel,
    mirrorObservation,
  };
}
