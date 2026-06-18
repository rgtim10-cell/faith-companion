// OATH Voice Principles:
// — Restrained: never says more than it needs to
// — Observant: describes what it sees, not what to feel
// — Specific: references real data, never generic
// — Calm: no urgency, no hype, no coaching language
// — Earned: silence is preferable to a hollow line

// First week markers — quiet acknowledgment of the new record.
// Not encouraging. Not motivating. Just witnessing.
const FIRST_WEEK_LINES: Record<number, string> = {
  0: 'The record has started.',
  1: 'OATH is still listening.',
  2: 'Two days in. The shape of something is forming.',
  3: 'Three days. OATH is paying attention.',
  4: 'Four days. The record is taking shape.',
  5: 'Five days. OATH has enough to begin noticing.',
  6: 'Six days in.',
  7: 'One week. The foundation is set.',
};

/**
 * Returns a quiet contextual line for the first 7 days of a covenant.
 * Returns null after day 7 — the first-week window closes.
 */
export function getFirstWeekLine(covenantAgeDays: number): string | null {
  if (covenantAgeDays < 0 || covenantAgeDays > 7) return null;
  return FIRST_WEEK_LINES[Math.min(covenantAgeDays, 7)] ?? null;
}
