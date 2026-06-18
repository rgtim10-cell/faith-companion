import type { MemoryRecord } from './memoryGraph';

// ── Experience types ───────────────────────────────────────────
// Rare, earned. Each one is a distinct narrative form.

export type TheaterExperienceType =
  | 'first_promise'          // The covenant is new. Something has begun.
  | 'the_turning_point'      // Major breakthrough after real struggle.
  | 'the_echo'               // Strong resonance — OATH found a pattern.
  | 'the_record_so_far'      // Milestone: 30 or 90 days.
  | 'the_documentary'        // The full arc, narrated.
  | 'the_person_youre_becoming'; // Foundational memories accumulating.

// ── Beat types ─────────────────────────────────────────────────
// Each beat renders differently. Tap to advance through the sequence.

export type TheaterBeatType = 'oath_voice' | 'memory' | 'stats' | 'reflection';

export interface TheaterBeat {
  type: TheaterBeatType;
  content: string;      // Text to render
  record?: MemoryRecord; // For 'memory' beats — the source record
}

// ── The experience ─────────────────────────────────────────────

export interface TheaterExperience {
  id: string;
  type: TheaterExperienceType;
  accentColor: string;  // Subtle tint on the theater background

  opening: string;      // First line. Auto-advances after 3s. Cannot be skipped.
  beats: TheaterBeat[]; // Tap-to-advance narrative sequence.
  closing: string;      // The last word. Return button appears after.

  records: MemoryRecord[]; // All featured records (for context/reinforcement)
  composedAt: number;
}
