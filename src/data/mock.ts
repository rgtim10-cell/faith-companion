import type {
  AIInsightData,
  JournalEntry,
  Mission,
  MomentumStat,
  UserProfile,
  VaultMemory,
} from '@/types';

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
