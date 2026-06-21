import type { MemoryRecord } from '@/data/memoryGraph';

export type ExperienceType =
  | 'proof_you_needed'       // doubt → evidence arc: "You were wrong."
  | 'something_changed'      // drift detection: "What happened?"
  | 'pattern_i_cant_ignore'  // dominant type: "OATH cannot ignore this."
  | 'person_you_becoming'    // covenant → chain: "You are already that person."
  | 'surprise_me';           // OATH picks — the unexpected.

export type ExperienceTrigger =
  | 'show_me'    // "Show me what you see"
  | 'motivation' // "I need motivation"
  | 'drift'      // "I'm drifting"
  | 'challenge'  // "Challenge me"
  | 'surprise'   // "Surprise me"
  | 'auto';      // OATH opens normally

export interface ComposedExperience {
  id: string;
  type: ExperienceType;
  trigger: ExperienceTrigger;

  // Narrative layers — each is OATH's voice, rendered sequentially
  hook: string;    // Opening line: must stop the user cold
  body: string;    // Main content: specific, from real memories
  pivot: string;   // The turn: a revelation, question, or quiet statement

  records: MemoryRecord[];
  prompts: string[];
  composedAt: number;
}

export const EXPERIENCE_LABELS: Record<ExperienceType, string> = {
  proof_you_needed: 'PROOF',
  something_changed: 'SHIFT',
  pattern_i_cant_ignore: 'PATTERN',
  person_you_becoming: 'BECOMING',
  surprise_me: 'SURPRISE',
};

export const EXPERIENCE_GLYPHS: Record<ExperienceType, string> = {
  proof_you_needed: '◆',
  something_changed: '▽',
  pattern_i_cant_ignore: '◎',
  person_you_becoming: '◉',
  surprise_me: '◇',
};

// Trigger → ordered preferred experience types.
// Composer tries each in order, first non-null result wins.
// Variety: recently shown types get pushed to the end (deprioritized, not removed).
export const TRIGGER_PRIORITY: Record<ExperienceTrigger, ExperienceType[]> = {
  show_me:    ['pattern_i_cant_ignore', 'surprise_me', 'person_you_becoming', 'proof_you_needed'],
  motivation: ['proof_you_needed', 'person_you_becoming', 'pattern_i_cant_ignore'],
  drift:      ['something_changed', 'proof_you_needed', 'pattern_i_cant_ignore'],
  challenge:  ['pattern_i_cant_ignore', 'person_you_becoming', 'proof_you_needed'],
  surprise:   ['surprise_me', 'proof_you_needed', 'pattern_i_cant_ignore', 'person_you_becoming'],
  auto:       ['person_you_becoming', 'proof_you_needed', 'pattern_i_cant_ignore', 'something_changed', 'surprise_me'],
};
