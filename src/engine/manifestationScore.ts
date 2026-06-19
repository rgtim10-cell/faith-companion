import type { Covenant, ManifestationFeedback, ManifestationType, MemoryRecord } from '@/data/memoryGraph';

const DAY = 24 * 60 * 60 * 1000;

export type ManifestationScores = Partial<Record<ManifestationType, number>>;

/**
 * Score each manifestation type based on what OATH knows.
 *
 * Higher score = more relevant right now. The caller sorts manifestations
 * by these scores so the top result is always "Today's Most Important
 * Experience." Feedback from the user adjusts scores for subsequent sessions.
 */
export function scoreManifestations(
  memories: MemoryRecord[],
  covenant: Covenant | null,
  feedback: ManifestationFeedback[],
): ManifestationScores {
  const now = Date.now();

  const recent14 = memories.filter((m) => m.date > now - 14 * DAY);
  const recentStruggles = recent14.filter((m) => m.type === 'struggle');
  const recentEvidence = recent14.filter((m) => m.type === 'evidence');
  const recentBreakthroughs = recent14.filter((m) => m.type === 'breakthrough');

  const allEvidence = memories.filter((m) => m.type === 'evidence');
  const allBreakthroughs = memories.filter((m) => m.type === 'breakthrough');
  const allPromises = memories.filter((m) => m.type === 'promise');
  const allTruths = memories.filter((m) => m.type === 'truth');
  const allStruggles = memories.filter((m) => m.type === 'struggle');

  // Evidence Chain: how many records are linked to the founding covenant
  const chainLinked = covenant
    ? memories.filter((m) => m.linkedPromiseId === covenant.id)
    : [];
  const chainTypes = new Set(chainLinked.map((m) => m.type));
  const chainScore =
    chainLinked.length >= 2 && chainTypes.size >= 2
      ? 0.55 + chainLinked.length * 0.08
      : 0;

  const scores: ManifestationScores = {
    // Chain — transformation arc. Highest when diverse evidence exists.
    chain: chainScore,

    // Evidence — when there's recent proof in the last 14 days
    evidence:
      recentEvidence.length > 0
        ? 0.5 + recentEvidence.length * 0.15
        : allEvidence.length > 0
        ? 0.25
        : 0,

    // Confidence — promises backed by wins
    confidence:
      allPromises.length > 0 && allEvidence.length + allBreakthroughs.length > 0
        ? 0.4 + (allEvidence.length + allBreakthroughs.length) * 0.06
        : 0,

    // Drift — when recent struggles exceed wins
    drift:
      recentStruggles.length > recentBreakthroughs.length + recentEvidence.length &&
      recentStruggles.length >= 2
        ? 0.5 + recentStruggles.length * 0.12
        : 0,

    // Truth — when realizations exist and need surfacing
    truth: allTruths.length > 0 ? 0.3 + allTruths.length * 0.08 : 0,

    // Future Self — always has a baseline; boosted by covenant
    future_self: covenant ? 0.35 : 0.15,

    // Memory — when high-weight records haven't been surfaced recently
    memory: (() => {
      const significant = memories.filter(
        (m) => m.emotionalWeight >= 0.85 && m.date < now - 7 * DAY,
      );
      return significant.length > 0 ? 0.3 + significant.length * 0.08 : 0;
    })(),

    // Learning — when a clear pattern has accumulated
    learning: (() => {
      const counts: Partial<Record<string, number>> = {};
      memories.forEach((m) => {
        if (m.type !== 'promise') counts[m.type] = (counts[m.type] ?? 0) + 1;
      });
      const max = Math.max(0, ...Object.values(counts).filter(Boolean) as number[]);
      return max >= 3 ? 0.28 + max * 0.04 : 0;
    })(),
  };

  // Feedback adjustment — what helped vs. what didn't.
  // Recent feedback (7 days) carries full weight; older fades.
  feedback.forEach((f) => {
    if (scores[f.type] === undefined) return;
    const ageDays = (now - f.date) / DAY;
    const weight = Math.max(0, 1 - ageDays / 7);
    if (f.reaction === 'resonated') scores[f.type]! += 0.22 * weight;
    if (f.reaction === 'more') scores[f.type]! += 0.1 * weight;
    if (f.reaction === 'not_relevant') scores[f.type]! -= 0.28 * weight;
    if (f.reaction === 'disagree') scores[f.type]! -= 0.35 * weight;
  });

  // Clamp all scores to [0, 1]
  (Object.keys(scores) as ManifestationType[]).forEach((k) => {
    scores[k] = Math.max(0, Math.min(1, scores[k] ?? 0));
  });

  return scores;
}
