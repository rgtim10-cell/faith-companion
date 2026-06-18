import type { ManifestationType, MemoryType } from '@/data/memoryGraph';
import type { OathStateKey } from '@/engine/oathState';

export type ContentType =
  | 'video'
  | 'article'
  | 'quote'
  | 'lesson'
  | 'research'
  | 'exercise'
  | 'data';

export type EmotionalPurpose =
  | 'confidence'
  | 'clarity'
  | 'challenge'
  | 'learning'
  | 'recovery'
  | 'focus';

export type ContextFeedbackReaction = 'saved' | 'not_relevant';

export interface CuratedContextFeedback {
  itemId: string;
  reaction: ContextFeedbackReaction;
  date: number;
}

export interface CuratedContextItem {
  id: string;
  type: ContentType;
  title: string;
  sourceName: string;
  summary: string;
  whyThisWorks: string;         // Static rationale — why this content exists in the library
  emotionalPurpose: EmotionalPurpose;
  relevanceScore: number;        // Base 0–1, modified by user feedback
  createdAt: number;
  isMock: boolean;
  url?: string;                  // Placeholder — not a real URL

  // Selection signals — used by contextSelectionEngine to match
  matchOathStates: OathStateKey[];
  matchManifestationTypes: ManifestationType[];
  matchMemoryTypes: MemoryType[];
  matchTags: string[];
}

// ── Mock Library ──────────────────────────────────────────────────
// 10 curated items — each one earns its place.
// No filler. No generic inspiration. Each one is specific.

export const CURATED_LIBRARY: CuratedContextItem[] = [
  {
    id: 'ctx_discipline_freedom',
    type: 'article',
    title: 'Discipline Is Freedom',
    sourceName: 'On Discipline',
    summary:
      'The counterintuitive truth: discipline does not restrict — it liberates. Structure is the scaffolding of real freedom. Without it, you are always deciding. With it, you are always moving.',
    whyThisWorks:
      'When someone builds consistent proof, they are living this principle. The article names what the behavior already demonstrates.',
    emotionalPurpose: 'focus',
    relevanceScore: 0.82,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['encouraged', 'proud', 'challenging'],
    matchManifestationTypes: ['learning', 'evidence', 'confidence'],
    matchMemoryTypes: ['breakthrough', 'evidence'],
    matchTags: ['discipline', 'mindset', 'consistency', 'identity', 'structure'],
  },

  {
    id: 'ctx_motivation_myth',
    type: 'lesson',
    title: 'Why Action Precedes Motivation',
    sourceName: 'The Motivation Myth',
    summary:
      'Motivation is not the cause of action. It is the result. Waiting to feel ready is the trap that keeps the record empty. The act of beginning is what creates the readiness.',
    whyThisWorks:
      'Surfaces when struggle accumulates without forward movement. Reframes the absence of feeling as normal, not a sign of failure.',
    emotionalPurpose: 'recovery',
    relevanceScore: 0.78,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['concerned', 'watching', 'curious'],
    matchManifestationTypes: ['drift', 'learning', 'truth'],
    matchMemoryTypes: ['struggle', 'truth'],
    matchTags: ['avoidance', 'resistance', 'beginning', 'start', 'readiness'],
  },

  {
    id: 'ctx_deep_work',
    type: 'lesson',
    title: 'Deep Work: Protecting Your Attention',
    sourceName: 'Deep Work',
    summary:
      'The ability to focus without distraction is becoming rare and increasingly valuable. What you protect in an hour of deep work cannot be recovered from three hours of shallow work.',
    whyThisWorks:
      'Matches reflection-heavy records and users who observe their own patterns. Connects self-observation to the practice of protecting time.',
    emotionalPurpose: 'focus',
    relevanceScore: 0.76,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['curious', 'watching', 'encouraged'],
    matchManifestationTypes: ['learning', 'future_self'],
    matchMemoryTypes: ['reflection', 'truth'],
    matchTags: ['focus', 'attention', 'distraction', 'work', 'energy', 'time'],
  },

  {
    id: 'ctx_return_rate',
    type: 'article',
    title: 'The Return Rate',
    sourceName: 'On Resilience',
    summary:
      'It is not how often you fall. It is how reliably you return. The return rate — measured across months, not moments — is what separates trajectories. OATH has been watching yours.',
    whyThisWorks:
      'Reframes repeated struggle as data about character, not failure. Most powerful when the record shows drift followed by return.',
    emotionalPurpose: 'recovery',
    relevanceScore: 0.79,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['concerned', 'watching'],
    matchManifestationTypes: ['drift', 'learning'],
    matchMemoryTypes: ['struggle'],
    matchTags: ['resilience', 'setback', 'failure', 'return', 'bounce back'],
  },

  {
    id: 'ctx_identity_change',
    type: 'lesson',
    title: 'Identity-Based Change',
    sourceName: 'Atomic Habits',
    summary:
      'Every action is a vote for the type of person you want to become. The identity shift happens before the proof arrives — and the proof arrives because the identity shifted first.',
    whyThisWorks:
      'Bridges the gap between early evidence and full belief. Most valuable when the user has started accumulating proof but hasn\'t yet internalized what it means.',
    emotionalPurpose: 'learning',
    relevanceScore: 0.84,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['curious', 'encouraged', 'proud'],
    matchManifestationTypes: ['future_self', 'learning', 'confidence'],
    matchMemoryTypes: ['breakthrough', 'truth', 'reflection'],
    matchTags: ['identity', 'becoming', 'self', 'who i am', 'habits', 'character'],
  },

  {
    id: 'ctx_hard_conversations',
    type: 'exercise',
    title: 'Hard Conversations: Name It First',
    sourceName: 'Difficult Conversations',
    summary:
      'Before any hard conversation, name what you are avoiding. Write it down. The act of naming it changes what the conversation becomes — and often reveals that the avoidance was the actual problem.',
    whyThisWorks:
      'Surfaces when drift or struggle records show interpersonal or avoidance patterns. Gives a specific practice, not a principle.',
    emotionalPurpose: 'clarity',
    relevanceScore: 0.71,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['concerned', 'curious'],
    matchManifestationTypes: ['drift', 'truth', 'learning'],
    matchMemoryTypes: ['truth', 'struggle', 'reflection'],
    matchTags: ['communication', 'avoidance', 'relationships', 'honesty', 'hard'],
  },

  {
    id: 'ctx_sleep_recovery',
    type: 'data',
    title: 'Sleep and Decision Quality',
    sourceName: 'Sleep Research Institute',
    summary:
      'Decision quality degrades measurably with underrecovery. This is not metaphor — it is documented neurological decline. The decisions that felt clear at 2am were not clear. The record corrects for this.',
    whyThisWorks:
      'Surfaces when struggle accumulates and the record shows late-night patterns. Reframes bad decisions as a recovery problem, not a character problem.',
    emotionalPurpose: 'recovery',
    relevanceScore: 0.68,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['concerned', 'watching'],
    matchManifestationTypes: ['drift', 'learning'],
    matchMemoryTypes: ['struggle', 'truth'],
    matchTags: ['recovery', 'sleep', 'energy', 'performance', 'exhaustion', 'decision'],
  },

  {
    id: 'ctx_burnout',
    type: 'lesson',
    title: 'Burnout Is Not a Badge',
    sourceName: 'On Sustainable Performance',
    summary:
      'Chronic overextension is not discipline — it is depletion masquerading as commitment. Recovery is not the opposite of performance. It is the condition for it.',
    whyThisWorks:
      'Surfaces specifically in the drift state with heavy struggle records. Distinguishes between productive strain and damaging depletion.',
    emotionalPurpose: 'recovery',
    relevanceScore: 0.73,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['concerned'],
    matchManifestationTypes: ['drift', 'learning'],
    matchMemoryTypes: ['struggle'],
    matchTags: ['burnout', 'overwork', 'exhaustion', 'recovery', 'rest', 'sustainable'],
  },

  {
    id: 'ctx_confidence_loop',
    type: 'exercise',
    title: 'The Confidence Loop',
    sourceName: 'Evidence-Based Confidence',
    summary:
      'Confidence is not a feeling you wait for. It is a pattern of proof you choose to reference. The exercise: start a file. Write only what you have done. Nothing you plan to do. Revisit it when doubt arrives.',
    whyThisWorks:
      'Surfaces when evidence and breakthroughs are accumulating. Turns what OATH is already tracking into a conscious practice the user can own.',
    emotionalPurpose: 'confidence',
    relevanceScore: 0.80,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['encouraged', 'proud', 'watching'],
    matchManifestationTypes: ['evidence', 'confidence', 'learning'],
    matchMemoryTypes: ['evidence', 'breakthrough'],
    matchTags: ['confidence', 'proof', 'evidence', 'self-belief', 'doubt'],
  },

  {
    id: 'ctx_before_ready',
    type: 'lesson',
    title: 'Building Before You\'re Ready',
    sourceName: 'On Starting Before Certainty',
    summary:
      'The work you do before you feel ready is the work that earns the readiness. Certainty follows action. It does not precede it. The record is proof of this.',
    whyThisWorks:
      'Surfaces early in the record when breakthroughs and evidence are appearing but the covenant is still new. Reinforces early movement.',
    emotionalPurpose: 'challenge',
    relevanceScore: 0.75,
    createdAt: Date.now(),
    isMock: true,
    url: '[PLACEHOLDER — not a real URL]',
    matchOathStates: ['watching', 'curious', 'encouraged'],
    matchManifestationTypes: ['future_self', 'learning', 'confidence'],
    matchMemoryTypes: ['breakthrough', 'evidence', 'truth'],
    matchTags: ['readiness', 'courage', 'beginning', 'uncertainty', 'start', 'action'],
  },
];

export const CONTENT_TYPE_GLYPH: Record<ContentType, string> = {
  video:    '▷',
  article:  '○',
  quote:    '◇',
  lesson:   '◆',
  research: '◎',
  exercise: '◈',
  data:     '▽',
};

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  video:    'Video',
  article:  'Article',
  quote:    'Quote',
  lesson:   'Lesson',
  research: 'Research',
  exercise: 'Exercise',
  data:     'Data',
};
