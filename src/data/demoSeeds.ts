import type { Covenant, MemoryRecord } from '@/data/memoryGraph';

export type DemoSeedKey = 'new_user' | 'week_1' | 'month_1' | 'month_3' | 'heavy';

export interface DemoSeed {
  key: DemoSeedKey;
  label: string;
  description: string;
  covenant: Covenant;
  memories: MemoryRecord[];
}

const now = Date.now();
const ago = (days: number) => now - days * 24 * 60 * 60 * 1000;

// ── Week 1 ────────────────────────────────────────────────────
const week1Covenant: Covenant = {
  id: 'demo_cov_w1',
  promise: 'I want to be someone who shows up, even when it is hard.',
  createdAt: ago(7),
};

const week1Memories: MemoryRecord[] = [
  {
    id: 'dw1_1',
    type: 'promise',
    title: 'Founding oath',
    content: 'I want to be someone who shows up, even when it is hard.',
    date: ago(7),
    emotionalWeight: 1,
    tags: ['identity', 'commitment'],
    linkedPromiseId: 'demo_cov_w1',
    source: 'covenant',
    realm: 'presence',
  },
  {
    id: 'dw1_2',
    type: 'struggle',
    title: 'First hard morning',
    content: "Didn't want to get out of bed. Did it anyway. Barely.",
    date: ago(6),
    emotionalWeight: 0.6,
    tags: ['resistance', 'discipline'],
    linkedPromiseId: 'demo_cov_w1',
    source: 'communion',
    realm: 'presence',
  },
  {
    id: 'dw1_3',
    type: 'truth',
    title: 'What I noticed',
    content: 'The first five minutes are the hardest. Once I start, it gets easier.',
    date: ago(5),
    emotionalWeight: 0.7,
    tags: ['pattern', 'start', 'beginning'],
    source: 'communion',
    realm: 'alignment',
  },
  {
    id: 'dw1_4',
    type: 'breakthrough',
    title: 'Something shifted',
    content: 'Made it through a full day without checking my phone first thing. Felt different.',
    date: ago(3),
    emotionalWeight: 0.8,
    tags: ['discipline', 'identity'],
    linkedPromiseId: 'demo_cov_w1',
    source: 'communion',
    realm: 'presence',
  },
  {
    id: 'dw1_5',
    type: 'evidence',
    title: 'First win',
    content: 'Finished the project section I had been avoiding for two weeks.',
    date: ago(2),
    emotionalWeight: 0.85,
    tags: ['proof', 'action'],
    linkedPromiseId: 'demo_cov_w1',
    source: 'evidence_upload',
    oathInterpretation: 'This proves you can start things you have been avoiding. The avoidance is not permanent.',
    realm: 'mission_control',
  },
  {
    id: 'dw1_6',
    type: 'reflection',
    title: 'Night reflection',
    content: 'Slower day. Showed up at 60%. Still counts.',
    date: ago(1),
    emotionalWeight: 0.55,
    tags: ['self-compassion', 'night'],
    source: 'night_reflection',
    realm: 'alignment',
  },
];

// ── Month 1 ───────────────────────────────────────────────────
const month1Covenant: Covenant = {
  id: 'demo_cov_m1',
  promise: 'I will become the kind of person who builds things that last.',
  createdAt: ago(30),
};

const month1Memories: MemoryRecord[] = [
  {
    id: 'dm1_1',
    type: 'promise',
    title: 'Founding oath',
    content: 'I will become the kind of person who builds things that last.',
    date: ago(30),
    emotionalWeight: 1,
    tags: ['identity', 'commitment', 'becoming'],
    linkedPromiseId: 'demo_cov_m1',
    source: 'covenant',
    realm: 'presence',
  },
  {
    id: 'dm1_2',
    type: 'struggle',
    title: 'Week one resistance',
    content: 'Almost quit on day three. The resistance was strong.',
    date: ago(27),
    emotionalWeight: 0.7,
    tags: ['resistance', 'beginning'],
    source: 'communion',
    realm: 'presence',
  },
  {
    id: 'dm1_3',
    type: 'breakthrough',
    title: 'First client signed',
    content: 'Signed the first client. Proof that the work is real.',
    date: ago(24),
    emotionalWeight: 0.95,
    tags: ['milestone', 'proof', 'identity'],
    linkedPromiseId: 'demo_cov_m1',
    source: 'evidence_upload',
    oathInterpretation: 'This proves the builder identity is not a plan — it is already who you are.',
    realm: 'mission_control',
  },
  {
    id: 'dm1_4',
    type: 'truth',
    title: 'The pattern I noticed',
    content: 'My best work happens in the first 90 minutes. After that I am managing energy, not creating.',
    date: ago(22),
    emotionalWeight: 0.75,
    tags: ['pattern', 'focus', 'energy'],
    source: 'communion',
    realm: 'alignment',
  },
  {
    id: 'dm1_5',
    type: 'evidence',
    title: 'Delivered the pitch',
    content: 'Presented to three potential clients. Two interested. One ready to sign.',
    date: ago(20),
    emotionalWeight: 0.88,
    tags: ['proof', 'action', 'courage'],
    linkedPromiseId: 'demo_cov_m1',
    source: 'evidence_upload',
    oathInterpretation: 'You walked into the room they were unsure about. That is the builder.',
    realm: 'mission_control',
  },
  {
    id: 'dm1_6',
    type: 'struggle',
    title: 'Three hard days',
    content: 'Three bad days in a row. Missed the morning block twice. Felt like it was unraveling.',
    date: ago(18),
    emotionalWeight: 0.65,
    tags: ['setback', 'resilience'],
    source: 'communion',
    realm: 'presence',
  },
  {
    id: 'dm1_7',
    type: 'truth',
    title: 'After the setback',
    content: "I won't let one miss define me. The return is what matters.",
    date: ago(17),
    emotionalWeight: 0.8,
    tags: ['resilience', 'return', 'identity'],
    linkedPromiseId: 'demo_cov_m1',
    source: 'communion',
    realm: 'presence',
  },
  {
    id: 'dm1_8',
    type: 'breakthrough',
    title: 'The comeback week',
    content: 'Six for six after the hard stretch. The strongest week yet.',
    date: ago(11),
    emotionalWeight: 0.9,
    tags: ['consistency', 'discipline', 'identity'],
    linkedPromiseId: 'demo_cov_m1',
    source: 'communion',
    realm: 'future_self',
  },
  {
    id: 'dm1_9',
    type: 'reflection',
    title: 'Night reflection',
    content: 'Something shifted. The work feels less like discipline and more like who I am.',
    date: ago(9),
    emotionalWeight: 0.7,
    tags: ['identity', 'night', 'becoming'],
    source: 'night_reflection',
    realm: 'alignment',
  },
  {
    id: 'dm1_10',
    type: 'evidence',
    title: 'Second client signed',
    content: 'Two clients. The business is real. I am building something.',
    date: ago(6),
    emotionalWeight: 0.92,
    tags: ['proof', 'milestone', 'builder'],
    linkedPromiseId: 'demo_cov_m1',
    source: 'evidence_upload',
    oathInterpretation: 'Two means the first was not luck. This is a pattern.',
    realm: 'mission_control',
    isFoundational: true,
  },
  {
    id: 'dm1_11',
    type: 'truth',
    title: 'Evening vulnerability',
    content: '9 PM is when my resolve weakens. I need to protect that hour.',
    date: ago(4),
    emotionalWeight: 0.72,
    tags: ['pattern', 'energy', 'protection'],
    source: 'communion',
    realm: 'alignment',
  },
  {
    id: 'dm1_12',
    type: 'breakthrough',
    title: 'Morning rhythm locked in',
    content: 'Ten days in a row. The discipline is becoming who I am.',
    date: ago(2),
    emotionalWeight: 0.85,
    tags: ['consistency', 'identity', 'discipline'],
    linkedPromiseId: 'demo_cov_m1',
    source: 'communion',
    realm: 'presence',
  },
];

// ── Month 3 ───────────────────────────────────────────────────
const month3Covenant: Covenant = {
  id: 'demo_cov_m3',
  promise: 'I am building a life I can be proud of — one day, one decision at a time.',
  createdAt: ago(90),
};

const month3Memories: MemoryRecord[] = [
  {
    id: 'dm3_1',
    type: 'promise',
    title: 'Founding oath',
    content: 'I am building a life I can be proud of — one day, one decision at a time.',
    date: ago(90),
    emotionalWeight: 1,
    tags: ['identity', 'commitment', 'becoming'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'covenant',
    realm: 'presence',
    isFoundational: true,
  },
  {
    id: 'dm3_2',
    type: 'struggle',
    title: 'Week one: the hardest part',
    content: "Three days in and already wanted to quit. The discipline wasn't there yet.",
    date: ago(87),
    emotionalWeight: 0.6,
    tags: ['beginning', 'resistance'],
    source: 'communion',
    realm: 'presence',
  },
  {
    id: 'dm3_3',
    type: 'breakthrough',
    title: 'First week completed',
    content: 'Seven days. Showed up every single one.',
    date: ago(83),
    emotionalWeight: 0.78,
    tags: ['consistency', 'milestone'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'communion',
    realm: 'future_self',
  },
  {
    id: 'dm3_4',
    type: 'truth',
    title: 'What I know about myself now',
    content: 'I am better in the morning. Not just more productive — more myself.',
    date: ago(79),
    emotionalWeight: 0.72,
    tags: ['pattern', 'identity', 'energy'],
    source: 'communion',
    realm: 'alignment',
  },
  {
    id: 'dm3_5',
    type: 'evidence',
    title: 'First real client',
    content: 'Signed a six-month contract. Real money. Real accountability. Real proof.',
    date: ago(72),
    emotionalWeight: 0.94,
    tags: ['proof', 'milestone', 'builder'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'evidence_upload',
    oathInterpretation: 'This is not ambition. This is transformation already in motion.',
    realm: 'mission_control',
    isFoundational: true,
  },
  {
    id: 'dm3_6',
    type: 'struggle',
    title: 'The hard month',
    content: 'Week five and six were brutal. Lost focus. The world came in.',
    date: ago(63),
    emotionalWeight: 0.68,
    tags: ['setback', 'drift'],
    source: 'communion',
    realm: 'presence',
  },
  {
    id: 'dm3_7',
    type: 'truth',
    title: 'The return',
    content: "I don't need to restart. I need to return. There's a difference.",
    date: ago(60),
    emotionalWeight: 0.82,
    tags: ['resilience', 'return', 'identity'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'communion',
    realm: 'presence',
  },
  {
    id: 'dm3_8',
    type: 'breakthrough',
    title: 'After the hard month',
    content: 'Three weeks back on. The arc did not break — it bent.',
    date: ago(52),
    emotionalWeight: 0.88,
    tags: ['resilience', 'consistency', 'identity'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'communion',
    realm: 'future_self',
    referenceCount: 3,
  },
  {
    id: 'dm3_9',
    type: 'evidence',
    title: 'Three active clients',
    content: 'Managing three clients simultaneously. The systems are holding. I am holding.',
    date: ago(45),
    emotionalWeight: 0.91,
    tags: ['proof', 'builder', 'systems'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'evidence_upload',
    oathInterpretation: 'Scalability is the next proof. You are already demonstrating it.',
    realm: 'mission_control',
  },
  {
    id: 'dm3_10',
    type: 'reflection',
    title: 'Mid-point reflection',
    content: '45 days in. I look different from the outside. I feel different from the inside. Both are real.',
    date: ago(45),
    emotionalWeight: 0.76,
    tags: ['identity', 'transformation', 'becoming'],
    source: 'night_reflection',
    realm: 'alignment',
  },
  {
    id: 'dm3_11',
    type: 'truth',
    title: 'What fear actually is',
    content: "Fear doesn't mean stop. It means this matters. I've been confusing the signal.",
    date: ago(38),
    emotionalWeight: 0.79,
    tags: ['courage', 'mindset', 'identity'],
    source: 'communion',
    realm: 'alignment',
  },
  {
    id: 'dm3_12',
    type: 'breakthrough',
    title: 'The best month yet',
    content: 'Most productive, most grounded, most connected to why I started.',
    date: ago(22),
    emotionalWeight: 0.93,
    tags: ['milestone', 'consistency', 'identity', 'proud'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'communion',
    realm: 'future_self',
    isFoundational: true,
    referenceCount: 5,
  },
  {
    id: 'dm3_13',
    type: 'evidence',
    title: 'Revenue milestone',
    content: 'Hit the first real revenue target. The number I thought would take a year.',
    date: ago(15),
    emotionalWeight: 0.96,
    tags: ['proof', 'milestone', 'builder', 'success'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'evidence_upload',
    oathInterpretation: 'The person who set this target did not believe it was possible. The person who hit it is someone else.',
    realm: 'mission_control',
    isFoundational: true,
  },
  {
    id: 'dm3_14',
    type: 'reflection',
    title: 'Night reflection',
    content: 'Discipline is just delayed gratification. After 90 days, the gratification is arriving.',
    date: ago(8),
    emotionalWeight: 0.72,
    tags: ['discipline', 'mindset', 'identity'],
    source: 'night_reflection',
    realm: 'alignment',
  },
  {
    id: 'dm3_15',
    type: 'breakthrough',
    title: 'The clearest week',
    content: 'Six days of mission completion. The friction is almost gone. This is who I am now.',
    date: ago(4),
    emotionalWeight: 0.87,
    tags: ['consistency', 'identity', 'discipline'],
    linkedPromiseId: 'demo_cov_m3',
    source: 'communion',
    realm: 'presence',
    referenceCount: 2,
  },
];

// ── Heavy user ────────────────────────────────────────────────
// Eighteen months of a life. Hundreds of memories across every theme — the
// sky a person could get lost in. Generated deterministically so the
// constellation is identical every run.

const heavyCovenant: Covenant = {
  id: 'demo_cov_heavy',
  promise: 'I am becoming the person my word always pointed to.',
  createdAt: ago(540),
};

interface ThemeSpec {
  tags: string[];
  lines: { type: MemoryRecord['type']; content: string }[];
}

const HEAVY_THEMES: ThemeSpec[] = [
  {
    tags: ['identity', 'becoming'],
    lines: [
      { type: 'truth', content: 'I am not who I was. The change is no longer a hope — it is a fact.' },
      { type: 'reflection', content: 'I caught myself acting like the person I said I wanted to be. No effort. Just me.' },
      { type: 'breakthrough', content: 'Someone described me using a word I once only aspired to. It landed as true.' },
      { type: 'truth', content: 'The old self still visits. It no longer runs the house.' },
    ],
  },
  {
    tags: ['builder', 'proof', 'milestone'],
    lines: [
      { type: 'evidence', content: 'Shipped the thing I said I would ship. On time. It is real now.' },
      { type: 'breakthrough', content: 'Closed the largest deal yet. The number used to be a fantasy.' },
      { type: 'evidence', content: 'Hired the first person. I am building something bigger than me.' },
      { type: 'evidence', content: 'A stranger paid for the work. Proof that lives outside my own belief.' },
    ],
  },
  {
    tags: ['discipline', 'consistency'],
    lines: [
      { type: 'breakthrough', content: 'Thirty mornings in a row. The streak stopped being a streak and became a floor.' },
      { type: 'struggle', content: 'Wanted to skip it. Did it anyway, badly. Badly still counts.' },
      { type: 'truth', content: 'Discipline is not motivation. It is the decision made once, kept daily.' },
      { type: 'breakthrough', content: 'The hard thing got quiet. It is just what I do now.' },
    ],
  },
  {
    tags: ['resilience', 'return'],
    lines: [
      { type: 'struggle', content: 'Fell off for a week. The shame was louder than the absence.' },
      { type: 'truth', content: 'I do not restart. I return. The arc bends, it does not break.' },
      { type: 'breakthrough', content: 'Came back faster this time. The gap between fall and return keeps shrinking.' },
      { type: 'struggle', content: 'A hard season. I kept the smallest promise to stay in the game.' },
    ],
  },
  {
    tags: ['pattern', 'energy'],
    lines: [
      { type: 'truth', content: 'My best work is the first ninety minutes. After that I am managing, not making.' },
      { type: 'pattern', content: '9 PM is where my resolve thins. I built a wall around that hour.' },
      { type: 'truth', content: 'I confuse fear with a stop sign. It is actually a marker that this matters.' },
      { type: 'pattern', content: 'When I am quiet for three days, something is wrong before I can name it.' },
    ],
  },
  {
    tags: ['health', 'body'],
    lines: [
      { type: 'evidence', content: 'Ran the distance I once called impossible. The body kept the promise too.' },
      { type: 'breakthrough', content: 'Slept enough for a full week. Everything downstream got easier.' },
      { type: 'struggle', content: 'Old habits with food crept back under stress. Noticed. Adjusted.' },
      { type: 'reflection', content: 'Strength is not vanity. It is the container that holds the rest.' },
    ],
  },
  {
    tags: ['family', 'connection'],
    lines: [
      { type: 'reflection', content: 'Was fully present at dinner. No phone, no exit. They noticed.' },
      { type: 'breakthrough', content: 'Repaired something old with a hard, honest conversation.' },
      { type: 'truth', content: 'The work means nothing if I win it alone. I keep relearning this.' },
      { type: 'evidence', content: 'Showed up for someone when it cost me. That is the kind of man I am.' },
    ],
  },
  {
    tags: ['faith', 'gratitude'],
    lines: [
      { type: 'reflection', content: 'Gave thanks before I asked for anything. The day reorganized around it.' },
      { type: 'truth', content: 'Surrender is not giving up. It is giving the outcome a wider home.' },
      { type: 'reflection', content: 'Sat in silence long enough to hear what I have been outrunning.' },
      { type: 'breakthrough', content: 'Trusted before I had proof. The proof followed.' },
    ],
  },
];

function generateHeavyMemories(covId: string): MemoryRecord[] {
  const out: MemoryRecord[] = [];
  out.push({
    id: 'dh_promise',
    type: 'promise',
    title: 'Founding oath',
    content: heavyCovenant.promise,
    date: ago(540),
    emotionalWeight: 1,
    tags: ['identity', 'commitment', 'becoming'],
    linkedPromiseId: covId,
    source: 'covenant',
    realm: 'presence',
    isFoundational: true,
  });

  const sources: MemoryRecord['source'][] = [
    'communion', 'evidence_upload', 'night_reflection', 'oath_observed',
  ];
  // Deterministic LCG for stable variety.
  let s = 0x2545f491;
  const rnd = () => {
    s = (Math.imul(s, 0x9e3779b1) + 0x6d2b79f5) >>> 0;
    return s / 0xffffffff;
  };

  let idn = 0;
  // Walk backward through ~17 months in roughly 3-day steps.
  for (let day = 535; day >= 1; day -= 3) {
    const theme = HEAVY_THEMES[Math.floor(rnd() * HEAVY_THEMES.length)];
    const line = theme.lines[Math.floor(rnd() * theme.lines.length)];
    const weight = 0.45 + rnd() * 0.5;
    const anchored = line.type === 'evidence' || line.type === 'breakthrough' || rnd() > 0.6;
    const refd = rnd() > 0.82 ? Math.floor(rnd() * 5) + 1 : 0;
    const foundational = weight > 0.9 && anchored && rnd() > 0.7;

    out.push({
      id: `dh_${idn++}`,
      type: line.type,
      title: theme.tags[0],
      content: line.content,
      date: ago(day),
      emotionalWeight: Math.min(1, weight),
      tags: theme.tags,
      linkedPromiseId: anchored ? covId : undefined,
      source: sources[Math.floor(rnd() * sources.length)],
      realm: 'presence',
      ...(refd > 0 ? { referenceCount: refd, lastReferencedAt: ago(Math.max(0, day - 5)) } : {}),
      ...(foundational ? { isFoundational: true } : {}),
    });
  }
  return out;
}

const heavyMemories = generateHeavyMemories(heavyCovenant.id);

export const DEMO_SEEDS: DemoSeed[] = [
  {
    key: 'new_user',
    label: 'New User',
    description: 'Just arrived. Covenant set. No memories.',
    covenant: {
      id: 'demo_cov_new',
      promise: 'I want to be someone who shows up, even when it is hard.',
      createdAt: ago(0),
    },
    memories: [],
  },
  {
    key: 'week_1',
    label: 'Week 1',
    description: '7 days in. First struggles and breakthroughs.',
    covenant: week1Covenant,
    memories: week1Memories,
  },
  {
    key: 'month_1',
    label: 'Month 1',
    description: '30 days in. Evidence building. One setback.',
    covenant: month1Covenant,
    memories: month1Memories,
  },
  {
    key: 'month_3',
    label: 'Month 3',
    description: '90 days in. Full arc. Intervention and context eligible.',
    covenant: month3Covenant,
    memories: month3Memories,
  },
  {
    key: 'heavy',
    label: 'Heavy User',
    description: '18 months in. Hundreds of memories across every theme.',
    covenant: heavyCovenant,
    memories: heavyMemories,
  },
];
