import type {
  AIInsightData,
  JournalEntry,
  Mission,
  MomentumStat,
  UserProfile,
  VaultMemory,
} from '@/types';
import type { RealmKey } from '@/design/realms';
import type { CommunionVerb } from '@/data/memoryStore';

export const userProfile: UserProfile = {
  name: 'Marcus Bell',
  firstName: 'Marcus',
  archetype: 'The Builder',
  streak: 47,
  level: 12,
  oath: 'I show up for the version of myself I am becoming, not the one I have been.',
  tagline: 'Disciplined. Deliberate. Becoming.',
};

export const alignmentScore = 87;
export const momentumScore = 82;

export const oathSuggestion = {
  missionId: 'm1',
  title: 'Start with Morning deep work.',
  reasoning: "Your focus peaks in the first 90 minutes. Completing this first raises your probability of a full mission day.",
  completionProbability: 83,
};

export const missions: Mission[] = [
  {
    id: 'm1',
    title: 'Morning deep work',
    description: '90 minutes of focused execution before the world wakes up.',
    category: 'Focus',
    status: 'active',
    progress: 65,
    estimatedMinutes: 90,
  },
  {
    id: 'm2',
    title: 'Strength training',
    description: 'Push day — chest, shoulders, triceps. No compromise.',
    category: 'Body',
    status: 'active',
    progress: 0,
    estimatedMinutes: 60,
  },
  {
    id: 'm3',
    title: 'Cold exposure',
    description: '3 minutes. Controlled breath. The discomfort is the point.',
    category: 'Discipline',
    status: 'completed',
    progress: 100,
    estimatedMinutes: 5,
  },
  {
    id: 'm4',
    title: 'Evening reflection',
    description: 'What moved. What stalled. What tomorrow needs.',
    category: 'Mind',
    status: 'locked',
    progress: 0,
    estimatedMinutes: 20,
  },
  {
    id: 'm5',
    title: 'Read 30 pages',
    description: 'Input that compounds. Choose what earns your attention.',
    category: 'Mind',
    status: 'active',
    progress: 40,
    estimatedMinutes: 40,
  },
];

export const momentumStats: MomentumStat[] = [
  { id: 's1', label: 'Consistency', value: 88, trend: 4 },
  { id: 's2', label: 'Discipline', value: 76, trend: 2 },
  { id: 's3', label: 'Growth', value: 92, trend: 6 },
  { id: 's4', label: 'Recovery', value: 64, trend: -3 },
];

export const weeklyMomentum = [62, 71, 58, 80, 74, 88, 91];
export const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const overallMomentum = Math.round(
  momentumStats.reduce((sum, s) => sum + s.value, 0) / momentumStats.length,
);

export const vaultMemories: VaultMemory[] = [
  {
    id: 'v1',
    daysAgo: 67,
    quote: 'I want to become someone I could be proud of.',
    reflection: "You're keeping that promise. 47 consecutive days of evidence.",
    emotionalWeight: 'high',
  },
  {
    id: 'v2',
    daysAgo: 31,
    quote: "I won't let one miss define me.",
    reflection: "After the Denver setback. You've had 31 wins since. The miss didn't define you.",
    emotionalWeight: 'high',
  },
  {
    id: 'v3',
    daysAgo: 19,
    quote: '9 PM is when my resolve weakens. I need to protect that hour.',
    reflection: "You've been protecting it. OATH noticed you've shifted your evenings consistently.",
    emotionalWeight: 'medium',
  },
  {
    id: 'v4',
    daysAgo: 8,
    quote: 'Discipline is just delayed gratification. I can delay.',
    reflection: 'Written after the hardest week. You came back stronger.',
    emotionalWeight: 'medium',
  },
];

export const journalEntries: JournalEntry[] = [
  {
    id: 'j1',
    date: 'Jun 15',
    title: 'Found the edge again',
    preview:
      "Today felt like the first day in a while where the discipline wasn't a fight. It was just what I do now.",
    mood: 'strong',
  },
  {
    id: 'j2',
    date: 'Jun 14',
    title: 'Slower start, finished anyway',
    preview:
      'Almost skipped the morning block. Showed up at 70%. Reminder that showing up imperfect still counts.',
    mood: 'steady',
  },
  {
    id: 'j3',
    date: 'Jun 12',
    title: 'Best week in months',
    preview:
      "Six for six on missions. The version of me from three months ago wouldn't recognize this rhythm.",
    mood: 'unstoppable',
  },
  {
    id: 'j4',
    date: 'Jun 10',
    title: 'Rough morning',
    preview: 'Low sleep, low motivation. Did the minimum. Protected the streak.',
    mood: 'low',
  },
];

// ── The Threshold ─────────────────────────────────────────────
// What OATH composes when you arrive. Three movements, never more:
//   SEE      — one thing OATH has observed ("I've noticed...")
//   REMEMBER — a moment from your past, surfaced only when it's earned
//   INVITE   — an open question. Never a command.
// OATH reveals. OATH invites. OATH keeps your word. OATH earns the right
// to speak — when nothing is earned, `memory` is simply absent and OATH
// stays quiet rather than performing intimacy it hasn't earned.
export interface ThresholdComposition {
  greetingName: string;
  lead: string;          // SEE — the soft opening ("I've noticed something.")
  observation: string;   // SEE — what OATH has come to see in you
  memory?: {             // REMEMBER — optional. Present only when earned.
    timeAgo: string;
    words: string;       // your own words, kept
    kept: string;        // OATH's quiet reflection on them
  };
  reflect: string;       // INVITE — an open question, for reflection, never instruction
  listening: string;     // what OATH says as it waits, attending
}

export const threshold: Record<RealmKey, ThresholdComposition> = {
  presence: {
    greetingName: userProfile.firstName,
    lead: "I've noticed something.",
    observation: 'Your strongest days have always begun with movement.',
    memory: {
      timeAgo: '67 days ago, you told me',
      words: 'I want to become someone I could be proud of.',
      kept: "You've kept that promise more often than you've broken it.",
    },
    reflect: 'What are you noticing?',
    listening: "I'm here when you're ready.",
  },
  future_self: {
    greetingName: userProfile.firstName,
    lead: 'I can see something forming in you.',
    observation: 'The person you wanted to become is already showing up in the small things.',
    memory: {
      timeAgo: '31 days ago, after the setback, you said',
      words: "I won't let one miss define me.",
      kept: "It didn't. You've shown up thirty-one times since.",
    },
    reflect: 'Does that feel true?',
    listening: "Take your time. I'm with you.",
  },
  mission_control: {
    greetingName: userProfile.firstName,
    lead: "I've been watching the patterns.",
    observation: 'You move with the most clarity when you protect your first hour.',
    memory: {
      timeAgo: '19 days ago, you noticed',
      words: '9 PM is when my resolve weakens. I need to protect that hour.',
      kept: "You've been guarding it ever since. I saw that.",
    },
    reflect: "What's getting in the way?",
    listening: "I'm listening.",
  },
  alignment: {
    greetingName: userProfile.firstName,
    lead: "Let's slow down for a moment.",
    observation: 'Not everything asking for your attention today actually deserves it.',
    memory: {
      timeAgo: '8 days ago, after the hardest week, you wrote',
      words: 'Discipline is just delayed gratification. I can delay.',
      kept: 'You meant it. I’ve watched you live it since.',
    },
    reflect: 'Tell me what you see.',
    listening: 'No rush. I’m right here.',
  },
};

// ── Communion ─────────────────────────────────────────────────
// OATH listening. The registers a user can speak in, and the single weighted
// thing OATH says as it receives — never a paragraph, never an "answer".
export const communionVerbs: { id: CommunionVerb; label: string; sub: string }[] = [
  { id: 'confide', label: 'Confide', sub: "Tell me what's true." },
  { id: 'commit', label: 'Commit', sub: 'Give me your word.' },
  { id: 'mark', label: 'Mark', sub: 'Remember this moment.' },
  { id: 'ask', label: 'Ask', sub: 'Ask what I see.' },
  { id: 'pushback', label: 'Push back', sub: "Tell me where I'm wrong." },
];

export interface CommunionVoice {
  invite: string;                       // the opening, as the world quiets
  receive: Record<CommunionVerb, string>; // OATH's one line, on receiving
  witness: string;                      // closing, once a memory is kept
}

export const communion: Record<RealmKey, CommunionVoice> = {
  presence: {
    invite: "I'm here. Tell me.",
    receive: {
      confide: 'This feels important. I have it now.',
      commit: "Then I'll hold you to it. Gently.",
      mark: "I'll keep this where I won't lose it.",
      ask: 'I see someone who keeps showing up — even quietly.',
      pushback: 'You might be right. Tell me more, and I’ll adjust.',
    },
    witness: "I'll carry this with you.",
  },
  future_self: {
    invite: "Speak. I'm listening for who you're becoming.",
    receive: {
      confide: "This is part of who you're becoming. I'll remember it.",
      commit: "A promise to your future self. I'll hold the line.",
      mark: 'A marker on the path. Noted.',
      ask: 'I see someone further along than they feel.',
      pushback: "Maybe I'm seeing it wrong. Show me, and I'll grow.",
    },
    witness: 'Your future self will remember this.',
  },
  mission_control: {
    invite: "Go ahead. I'm receiving.",
    receive: {
      confide: 'Logged. This matters more than it looks.',
      commit: "Commitment recorded. I'll hold you to it.",
      mark: "Marked. This won't slip.",
      ask: 'I see your sharpest hours are the first ones. That’s the signal.',
      pushback: "Noted. I'll recalibrate — tell me what I missed.",
    },
    witness: "Recorded. I won't forget.",
  },
  alignment: {
    invite: 'Breathe. Then tell me.',
    receive: {
      confide: 'I’ll hold this. Let it be lighter now.',
      commit: "Your word. I'll keep it steady.",
      mark: 'Held. Still, and safe.',
      ask: 'I see noise pulling at you. The signal is quieter than it.',
      pushback: "Perhaps. I'd rather be corrected than certain. Go on.",
    },
    witness: 'Set it down. I have it now.',
  },
};

export const aiInsights: Record<string, AIInsightData> = {
  Today: {
    screen: 'Today',
    text: 'Your highest momentum occurs when you complete your first mission before 9 AM. That window is open right now.',
  },
  Missions: {
    screen: 'Missions',
    text: 'Front-load your day. Your completion rate drops 34% after 2 PM. Start with what requires the most from you.',
  },
  Oath: {
    screen: 'Oath',
    text: "You've reaffirmed this oath 47 days in a row. It's no longer a goal — it's who you are.",
  },
  Momentum: {
    screen: 'Momentum',
    text: 'Your momentum peaks on Tuesdays and Wednesdays. Protect those days — they set the tone for the rest of the week.',
  },
  Vault: {
    screen: 'Vault',
    text: 'Your most emotionally resonant entries align with your highest momentum weeks. What you feel, you perform.',
  },
};
