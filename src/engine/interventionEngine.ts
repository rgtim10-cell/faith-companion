import type { Covenant, MemoryRecord } from '@/data/memoryGraph';
import type { OathState } from '@/engine/oathState';
import { computeSignificance } from '@/engine/memoryEvolution';
import { detectResonance } from '@/engine/resonanceEngine';

const DAY = 24 * 60 * 60 * 1000;

export type InterventionType =
  | 'echo'           // Older struggle echoes a current one
  | 'witness'        // Proof accumulated without being noticed
  | 'drift'          // Covenant divergence — growing quietly
  | 'turning_point'  // High-significance breakthrough just recorded
  | 'anniversary';   // Covenant or linked memory milestone

export interface InterventionCandidate {
  id: string;
  type: InterventionType;
  score: number;         // 0–1 composite score, must exceed SCORE_THRESHOLD

  // Display
  headline: string;      // "OATH has been holding something." (always)
  subline: string;       // Type-specific first line OATH says
  body: string;          // OATH's observation — what it sees

  records: MemoryRecord[];
  composedAt: number;
}

// ── Scoring ───────────────────────────────────────────────────────
// Every eligible intervention is scored on five dimensions.
// Only scores above SCORE_THRESHOLD are surfaced.
// This is the gate between "OATH noticed" and "OATH speaks."

interface ScoreComponents {
  resonanceStrength: number; // How strongly memories echo across time
  covenantRelevance: number; // How directly this connects to the covenant
  significance: number;      // Memory evolution significance
  recency: number;           // 0–1 (1 = happened today, 0 = 14+ days ago)
  emotionalWeight: number;   // Raw emotional weight of the records involved
}

export function interventionScore(components: ScoreComponents): number {
  return (
    components.resonanceStrength * 0.25 +
    components.covenantRelevance * 0.20 +
    components.significance      * 0.25 +
    components.recency           * 0.15 +
    components.emotionalWeight   * 0.15
  );
}

const SCORE_THRESHOLD = 0.62;

function clip(s: string, max = 120): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max).trimEnd()}…`;
}

// ── Type 1: The Echo ──────────────────────────────────────────────
// "I've heard this before."
// A current memory strongly resonates with an older one.
// The user didn't make the connection. OATH did.

function detectEcho(
  memories: MemoryRecord[],
  covenant: Covenant | null,
): InterventionCandidate | null {
  const groups = detectResonance(memories);
  const now = Date.now();

  for (const group of groups) {
    if (group.strength < 0.65) continue;

    const oldest = group.memories[0];
    const newest = group.memories[group.memories.length - 1];
    const oldestAgeDays = (now - oldest.date) / DAY;
    const newestAgeDays = (now - newest.date) / DAY;

    // Oldest must predate by 14+ days; newest must be within last 10
    if (oldestAgeDays < 14 || newestAgeDays > 10) continue;

    const covenantRelevance = group.memories.some(
      (m) => m.linkedPromiseId === covenant?.id,
    ) ? 0.8 : 0.3;

    const maxSig = Math.max(...group.memories.map((m) => computeSignificance(m)));
    const recency = Math.max(0, 1 - newestAgeDays / 10);
    const avgWeight = group.memories.reduce((s, m) => s + m.emotionalWeight, 0) / group.memories.length;

    const score = interventionScore({
      resonanceStrength: group.strength,
      covenantRelevance,
      significance: maxSig,
      recency,
      emotionalWeight: avgWeight,
    });
    if (score < SCORE_THRESHOLD) continue;

    const oldDays = Math.round(oldestAgeDays);
    const newDays = Math.round(newestAgeDays);
    const oldStr = oldDays === 1 ? '1 day ago' : `${oldDays} days ago`;
    const newStr = newDays === 0 ? 'Today' : newDays === 1 ? 'Yesterday' : `${newDays} days ago`;

    return {
      id: `int_echo_${Date.now()}`,
      type: 'echo',
      score,
      headline: 'OATH has been holding something.',
      subline: 'I\'ve heard this before.',
      body: `${oldStr}:\n\n"${clip(oldest.content)}"\n\n${newStr}:\n\n"${clip(newest.content)}"`,
      records: [oldest, newest],
      composedAt: Date.now(),
    };
  }

  return null;
}

// ── Type 2: The Witness ───────────────────────────────────────────
// "You haven't noticed this yet."
// Evidence has accumulated around the covenant while the user wasn't watching.

function detectWitness(
  memories: MemoryRecord[],
  covenant: Covenant | null,
): InterventionCandidate | null {
  if (!covenant) return null;

  const now = Date.now();
  const linked = memories.filter(
    (m) =>
      m.linkedPromiseId === covenant.id &&
      (m.type === 'evidence' || m.type === 'breakthrough'),
  );

  if (linked.length < 3) return null;

  const sorted = [...linked].sort((a, b) => a.date - b.date);
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];
  const spanDays = (newest.date - oldest.date) / DAY;

  if (spanDays < 7) return null;

  const newestAgeDays = (now - newest.date) / DAY;
  const avgSig = linked.reduce((s, m) => s + computeSignificance(m), 0) / linked.length;
  const avgWeight = linked.reduce((s, m) => s + m.emotionalWeight, 0) / linked.length;
  const recency = Math.max(0, 1 - newestAgeDays / 21);

  const score = interventionScore({
    resonanceStrength: 0.4,
    covenantRelevance: 1.0,
    significance: avgSig,
    recency,
    emotionalWeight: avgWeight,
  });
  if (score < SCORE_THRESHOLD) return null;

  const spanStr = Math.round(spanDays) === 1 ? '1 day' : `${Math.round(spanDays)} days`;

  return {
    id: `int_witness_${Date.now()}`,
    type: 'witness',
    score,
    headline: 'OATH has been holding something.',
    subline: 'You haven\'t noticed this yet.',
    body: `${linked.length} pieces of proof have appeared over ${spanStr}.\n\nYou kept going. OATH kept watching.\n\n"${clip(oldest.content, 100)}"\n\n"${clip(newest.content, 100)}"`,
    records: sorted.slice(0, 4),
    composedAt: Date.now(),
  };
}

// ── Type 3: The Drift ─────────────────────────────────────────────
// "Something changed."
// No shame. No guilt. Only observation.
// Fires when concerned state deepens and no proof has appeared in 7 days.

function detectDrift(
  oathState: OathState,
  memories: MemoryRecord[],
  covenant: Covenant | null,
): InterventionCandidate | null {
  if (!covenant || oathState.key !== 'concerned') return null;

  const now = Date.now();
  const recentStruggles = memories.filter(
    (m) => m.type === 'struggle' && m.date > now - 21 * DAY,
  );

  if (recentStruggles.length < 3) return null;

  const recentProof = memories.filter(
    (m) =>
      (m.type === 'evidence' || m.type === 'breakthrough') &&
      m.date > now - 7 * DAY,
  );

  // If proof exists recently, it's not a drift — user is still moving
  if (recentProof.length > 0) return null;

  const topStruggle = [...recentStruggles].sort(
    (a, b) => b.emotionalWeight - a.emotionalWeight,
  )[0];
  const avgWeight = recentStruggles.reduce((s, m) => s + m.emotionalWeight, 0) / recentStruggles.length;

  const score = interventionScore({
    resonanceStrength: 0.3,
    covenantRelevance: 0.9,
    significance: oathState.intensity,
    recency: 1.0,
    emotionalWeight: avgWeight,
  });
  if (score < SCORE_THRESHOLD) return null;

  return {
    id: `int_drift_${Date.now()}`,
    type: 'drift',
    score,
    headline: 'OATH has been holding something.',
    subline: 'Something changed.',
    body: `${recentStruggles.length} struggles in the last 21 days. No proof in 7.\n\nThis is not a judgment. It is what OATH sees.\n\n"${clip(topStruggle.content)}"`,
    records: recentStruggles.slice(0, 3),
    composedAt: Date.now(),
  };
}

// ── Type 4: The Turning Point ─────────────────────────────────────
// "I think this moment matters."
// A high-significance memory was just recorded and OATH has been sitting with it.

function detectTurningPoint(
  memories: MemoryRecord[],
  covenant: Covenant | null,
): InterventionCandidate | null {
  const now = Date.now();

  const candidates = memories
    .filter(
      (m) =>
        (m.type === 'breakthrough' || m.type === 'evidence' || m.type === 'truth') &&
        m.date > now - 5 * DAY &&
        computeSignificance(m) >= 0.88,
    )
    .sort((a, b) => computeSignificance(b) - computeSignificance(a));

  const top = candidates[0];
  if (!top) return null;

  const sig = computeSignificance(top);
  const ageDays = (now - top.date) / DAY;
  const covenantRelevance = top.linkedPromiseId === covenant?.id ? 0.9 : 0.45;
  const recency = Math.max(0, 1 - ageDays / 5);

  const score = interventionScore({
    resonanceStrength: 0.35,
    covenantRelevance,
    significance: sig,
    recency,
    emotionalWeight: top.emotionalWeight,
  });
  if (score < SCORE_THRESHOLD) return null;

  const roundedDays = Math.round(ageDays);
  const whenStr =
    roundedDays === 0 ? 'Today'
    : roundedDays === 1 ? 'Yesterday'
    : `${roundedDays} days ago`;

  return {
    id: `int_turning_${Date.now()}`,
    type: 'turning_point',
    score,
    headline: 'OATH has been holding something.',
    subline: 'I think this moment matters.',
    body: `${whenStr}, you recorded something.\n\nOATH has been sitting with it.\n\n"${clip(top.content, 140)}"`,
    records: [top],
    composedAt: Date.now(),
  };
}

// ── Type 5: The Anniversary ───────────────────────────────────────
// "One year ago today." / "Thirty days ago."
// Time itself made this relevant. OATH noticed.

const MILESTONES = [365, 180, 90, 60, 30] as const;

const MILESTONE_LABEL: Record<(typeof MILESTONES)[number], string> = {
  365: 'One year ago',
  180: 'Six months ago',
  90:  'Ninety days ago',
  60:  'Sixty days ago',
  30:  'Thirty days ago',
};

function detectAnniversary(
  memories: MemoryRecord[],
  covenant: Covenant | null,
): InterventionCandidate | null {
  if (!covenant) return null;

  const now = Date.now();
  const covenantAgeDays = (now - covenant.createdAt) / DAY;

  // Covenant milestone window
  for (const ms of MILESTONES) {
    if (Math.abs(covenantAgeDays - ms) <= 1.5) {
      const label = MILESTONE_LABEL[ms];
      const score = interventionScore({
        resonanceStrength: 0.5,
        covenantRelevance: 1.0,
        significance: 0.85,
        recency: 1.0,
        emotionalWeight: 0.9,
      });
      if (score < SCORE_THRESHOLD) break;

      return {
        id: `int_anniv_cov_${ms}_${Date.now()}`,
        type: 'anniversary',
        score,
        headline: 'OATH has been holding something.',
        subline: `${label} today.`,
        body: `${label}, you made a promise.\n\n"${clip(covenant.promise, 140)}"\n\nThe record since then is yours.`,
        records: [],
        composedAt: Date.now(),
      };
    }
  }

  // 1-year linked memory anniversary
  const yearLinked = memories
    .filter((m) => {
      if (!m.linkedPromiseId || m.linkedPromiseId !== covenant.id) return false;
      const ageDays = (now - m.date) / DAY;
      return Math.abs(ageDays - 365) <= 2;
    })
    .sort((a, b) => b.emotionalWeight - a.emotionalWeight);

  const top = yearLinked[0];
  if (!top) return null;

  const score = interventionScore({
    resonanceStrength: 0.55,
    covenantRelevance: 1.0,
    significance: computeSignificance(top),
    recency: 1.0,
    emotionalWeight: top.emotionalWeight,
  });
  if (score < SCORE_THRESHOLD) return null;

  return {
    id: `int_anniv_mem_${top.id}_${Date.now()}`,
    type: 'anniversary',
    score,
    headline: 'OATH has been holding something.',
    subline: 'One year ago today.',
    body: `One year ago, you wrote this.\n\n"${clip(top.content, 140)}"\n\nOATH has kept it.`,
    records: [top],
    composedAt: Date.now(),
  };
}

// ── Detection Orchestrator ────────────────────────────────────────
// Runs all detectors in priority order, skipping types already shown.
// Returns the highest-scoring candidate above threshold, or null if
// nothing is important enough to break silence.

const DETECTION_ORDER: InterventionType[] = [
  'anniversary',
  'turning_point',
  'echo',
  'witness',
  'drift',
];

export function detectIntervention(
  oathState: OathState,
  memories: MemoryRecord[],
  covenant: Covenant | null,
  shownTypes: InterventionType[],
): InterventionCandidate | null {
  if (memories.length < 2) return null;

  const candidates: InterventionCandidate[] = [];

  for (const type of DETECTION_ORDER) {
    if (shownTypes.includes(type)) continue;

    let candidate: InterventionCandidate | null = null;

    switch (type) {
      case 'anniversary':    candidate = detectAnniversary(memories, covenant);                break;
      case 'turning_point':  candidate = detectTurningPoint(memories, covenant);              break;
      case 'echo':           candidate = detectEcho(memories, covenant);                      break;
      case 'witness':        candidate = detectWitness(memories, covenant);                   break;
      case 'drift':          candidate = detectDrift(oathState, memories, covenant);          break;
    }

    if (candidate) candidates.push(candidate);
  }

  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => b.score - a.score)[0];
}
